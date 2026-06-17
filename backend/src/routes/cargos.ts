import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

const cargoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  areaId: z.string().uuid("ID de Área inválido"),
});

// GET all cargos (Public: used by candidates during signup)
router.get("/", async (req: Request, res: Response) => {
  const { areaId } = req.query;
  try {
    const filter = areaId ? { areaId: String(areaId) } : {};
    const cargos = await prisma.cargo.findMany({
      where: filter,
      include: {
        area: true,
      },
      orderBy: {
        nome: "asc",
      },
    });
    res.json(cargos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create cargo (Protected: Admin only)
router.post("/", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = cargoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { nome, areaId } = parsed.data;

    // Check unique for area
    const existing = await prisma.cargo.findFirst({
      where: { nome, areaId },
    });
    if (existing) {
      return res.status(400).json({ error: "Este cargo já existe nesta área" });
    }

    const cargo = await prisma.cargo.create({
      data: { nome, areaId },
      include: { area: true },
    });

    res.status(201).json(cargo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update cargo (Protected: Admin only)
router.put("/:id", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const parsed = cargoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { nome, areaId } = parsed.data;

    const existing = await prisma.cargo.findFirst({
      where: { nome, areaId, NOT: { id } },
    });
    if (existing) {
      return res.status(400).json({ error: "Este cargo já existe nesta área" });
    }

    const cargo = await prisma.cargo.update({
      where: { id },
      data: { nome, areaId },
      include: { area: true },
    });

    res.json(cargo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE cargo (Protected: Admin only)
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.cargo.delete({ where: { id } });
    res.json({ message: "Cargo deletado com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
