import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

const stageSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  ordem: z.number().int().nonnegative().default(0),
});

// GET all pipeline stages (Public: used by candidates during signup/navigation)
router.get("/", async (req: Request, res: Response) => {
  try {
    const stages = await prisma.pipelineStage.findMany({
      orderBy: { ordem: "asc" },
    });
    res.json(stages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create pipeline stage (Protected: Admin only)
router.post("/", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = stageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { nome, ordem } = parsed.data;

    // Check if stage name exists
    const existing = await prisma.pipelineStage.findUnique({ where: { nome } });
    if (existing) {
      return res.status(400).json({ error: "Já existe uma etapa com este nome" });
    }

    const stage = await prisma.pipelineStage.create({
      data: { nome, ordem },
    });

    res.status(201).json(stage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update pipeline stage (Protected: Admin only)
router.put("/:id", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const parsed = stageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { nome, ordem } = parsed.data;

    const currentStage = await prisma.pipelineStage.findUnique({ where: { id } });
    if (!currentStage) {
      return res.status(404).json({ error: "Etapa não encontrada" });
    }

    // Check name collision
    const existing = await prisma.pipelineStage.findFirst({
      where: { nome, NOT: { id } },
    });
    if (existing) {
      return res.status(400).json({ error: "Já existe outra etapa com este nome" });
    }

    const oldName = currentStage.nome;
    const newName = nome;

    // Update the stage in DB
    const stage = await prisma.pipelineStage.update({
      where: { id },
      data: { nome, ordem },
    });

    // If the stage was renamed, migrate candidates having the old stage name in their tags
    if (oldName !== newName) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Candidate" SET tags = ARRAY[$1]::text[] WHERE $2 = ANY(tags)`,
        newName,
        oldName
      );
    }

    res.json(stage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE pipeline stage (Protected: Admin only)
router.delete("/:id", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const stageToDelete = await prisma.pipelineStage.findUnique({ where: { id } });
    if (!stageToDelete) {
      return res.status(404).json({ error: "Etapa não encontrada" });
    }

    // Count how many stages are left. We don't want to allow deleting the last stage.
    const stagesCount = await prisma.pipelineStage.count();
    if (stagesCount <= 1) {
      return res.status(400).json({ error: "Não é permitido excluir a única etapa restante do pipeline." });
    }

    // Delete the stage
    await prisma.pipelineStage.delete({ where: { id } });

    // Move candidates currently in this stage to the first active stage
    const firstActiveStage = await prisma.pipelineStage.findFirst({
      orderBy: { ordem: "asc" },
    });

    if (firstActiveStage) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Candidate" SET tags = ARRAY[$1]::text[] WHERE $2 = ANY(tags)`,
        firstActiveStage.nome,
        stageToDelete.nome
      );
    }

    res.json({ message: `Etapa "${stageToDelete.nome}" excluída e candidatos movidos para "${firstActiveStage?.nome || "início"}".` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
