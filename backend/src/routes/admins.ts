import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authMiddleware, AuthRequest } from "../middlewares/auth.js";

const router = Router();

const createAdminSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  nome: z.string().min(1, "Nome é obrigatório"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const updateAdminSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  nome: z.string().min(1, "Nome é obrigatório"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").optional().nullable(),
});

// GET all admins (Protected: Admin only)
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const admins = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
      },
      orderBy: {
        nome: "asc",
      },
    });
    res.json(admins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create admin user (Protected: Admin only)
router.post("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const parsed = createAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { email, nome, password } = parsed.data;

    // Check if email already registered
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Este e-mail já está cadastrado em outra conta" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.adminUser.create({
      data: {
        email,
        nome,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        nome: true,
      },
    });

    res.status(201).json(admin);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update admin user (Protected: Admin only)
router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const parsed = updateAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { email, nome, password } = parsed.data;

    const existingAdmin = await prisma.adminUser.findUnique({ where: { id } });
    if (!existingAdmin) {
      return res.status(404).json({ error: "Administrador não encontrado" });
    }

    // Check email collision
    const collision = await prisma.adminUser.findFirst({
      where: { email, NOT: { id } },
    });
    if (collision) {
      return res.status(400).json({ error: "Este e-mail já está sendo usado por outro administrador" });
    }

    const dataToUpdate: any = { email, nome };

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const admin = await prisma.adminUser.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        nome: true,
      },
    });

    res.json(admin);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE admin user (Protected: Admin only)
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const currentUserId = req.user?.id;

  if (currentUserId === id) {
    return res.status(400).json({ error: "Você não pode excluir a sua própria conta de administrador." });
  }

  try {
    const adminToDelete = await prisma.adminUser.findUnique({ where: { id } });
    if (!adminToDelete) {
      return res.status(404).json({ error: "Administrador não encontrado" });
    }

    await prisma.adminUser.delete({ where: { id } });

    res.json({ message: `Administrador "${adminToDelete.nome}" excluído com sucesso.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
