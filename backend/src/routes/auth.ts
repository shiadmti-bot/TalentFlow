import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { loginRateLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não está definida nas variáveis de ambiente!");
}

const loginSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// POST /api/auth/login
router.post("/login", loginRateLimiter, async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;

    // Find admin user
    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({ error: "E-mail ou senha incorretos" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "E-mail ou senha incorretos" });
    }

    // Sign Token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, nome: admin.nome },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      email: admin.email,
      nome: admin.nome,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/candidate/login
router.post("/candidate/login", loginRateLimiter, async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;

    // Find candidate by email
    const candidate = await prisma.candidate.findFirst({
      where: { email },
    });

    if (!candidate || !candidate.password) {
      return res.status(401).json({ error: "E-mail ou senha incorretos" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, candidate.password);
    if (!isMatch) {
      return res.status(401).json({ error: "E-mail ou senha incorretos" });
    }

    // Sign Token with role: "candidate"
    const token = jwt.sign(
      { id: candidate.id, email: candidate.email, nome: candidate.nome, role: "candidate" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      email: candidate.email,
      nome: candidate.nome,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
