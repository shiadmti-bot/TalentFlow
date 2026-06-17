import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

const areaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
});

// GET all areas (Public: used by candidates during signup)
router.get("/", async (req: Request, res: Response) => {
  try {
    const areas = await prisma.area.findMany({
      include: {
        cargos: true,
      },
      orderBy: {
        nome: "asc",
      },
    });
    res.json(areas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create area (Protected: Admin only)
router.post("/", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = areaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { nome } = parsed.data;

    // Check if exists
    const existing = await prisma.area.findUnique({ where: { nome } });
    if (existing) {
      return res.status(400).json({ error: "Área com este nome já existe" });
    }

    const area = await prisma.area.create({
      data: { nome },
    });

    res.status(201).json(area);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update area (Protected: Admin only)
router.put("/:id", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const parsed = areaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { nome } = parsed.data;

    const existing = await prisma.area.findFirst({
      where: { nome, NOT: { id } },
    });
    if (existing) {
      return res.status(400).json({ error: "Área com este nome já existe" });
    }

    const area = await prisma.area.update({
      where: { id },
      data: { nome },
    });

    res.json(area);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE area (Protected: Admin only)
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.area.delete({ where: { id } });
    res.json({ message: "Área deletada com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
