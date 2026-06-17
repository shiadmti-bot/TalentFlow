import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middlewares/auth.js";
import { candidateRateLimiter } from "../middlewares/rateLimiter.js";
import { emailService } from "../lib/email.js";
import { candidateAuthMiddleware, CandidateAuthRequest } from "../middlewares/candidateAuth.js";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";

const router = Router();

const candidateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  cpf: z.string().min(11, "CPF é obrigatório"),
  dataNascimento: z.string().min(10, "Data de nascimento é obrigatória"),
  telefone: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  nivel: z.string().min(1, "Nível é obrigatório"),
  areaId: z.string().uuid("Área inválida"),
  cargoId: z.string().uuid("Cargo inválido"),
  cargoIds: z.array(z.string().uuid()).optional().default([]),
  descricao: z.string().optional().nullable(),
  motivacao: z.string().optional().nullable(),
});

// GET all candidates with filters (Protected: Admin only)
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const { search, cargoId, areaId, tag } = req.query;
  try {
    const filters: any = {};

    if (search) {
      filters.nome = {
        contains: String(search),
        mode: "insensitive",
      };
    }

    if (cargoId && cargoId !== "all") {
      filters.cargoId = String(cargoId);
    }

    if (areaId && areaId !== "all") {
      filters.areaId = String(areaId);
    }

    if (tag && tag !== "all") {
      filters.tags = {
        has: String(tag),
      };
    }

    const page = parseInt(req.query.page as string);
    const limit = parseInt(req.query.limit as string) || 20;

    if (!isNaN(page)) {
      const skip = (page - 1) * limit;
      const [candidates, total] = await Promise.all([
        prisma.candidate.findMany({
          where: filters,
          include: {
            cargo: {
              include: {
                area: true,
              },
            },
            resumes: true,
          },
          orderBy: {
            dataCriacao: "desc",
          },
          skip,
          take: limit,
        }),
        prisma.candidate.count({
          where: filters,
        }),
      ]);

      res.json({
        candidates,
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      });
    } else {
      const candidates = await prisma.candidate.findMany({
        where: filters,
        include: {
          cargo: {
            include: {
              area: true,
            },
          },
          resumes: true,
        },
        orderBy: {
          dataCriacao: "desc",
        },
      });
      res.json(candidates);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET candidate profile (Protected: Candidate only)
router.get("/me", candidateAuthMiddleware, async (req: CandidateAuthRequest, res: Response): Promise<any> => {
  const candidateId = req.candidate.id;
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        cargo: {
          include: {
            area: true,
          },
        },
        resumes: true,
        testAnswers: true,
        timelineEvents: {
          orderBy: { dataCriacao: "asc" },
        },
      },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }

    res.json(candidate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET candidate details (Protected: Admin can view all, candidates can view their own sanitized data)
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  
  // Check if request is authenticated as admin
  let isAdmin = false;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const JWT_SECRET = process.env.JWT_SECRET;
    if (JWT_SECRET) {
      try {
        jwt.verify(token, JWT_SECRET);
        isAdmin = true;
      } catch (err) {
        // Invalid token, treat as non-admin
      }
    }
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        cargo: {
          include: {
            area: true,
          },
        },
        resumes: true,
        testAnswers: true,
        timelineEvents: {
          orderBy: { dataCriacao: "asc" },
        },
        emailLogs: {
          orderBy: { dataEnvio: "desc" },
        },
      },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }

    if (isAdmin) {
      // Full details for admin
      res.json(candidate);
    } else {
      // Sanitized minimal details for candidates doing their test
      res.json({
        id: candidate.id,
        nome: candidate.nome,
        nivel: candidate.nivel,
        cargo: {
          nome: candidate.cargo.nome,
          area: {
            nome: candidate.cargo.area.nome,
          },
        },
        testAnswers: candidate.testAnswers,
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// POST create candidate (Public: used by candidates during signup)
router.post("/", candidateRateLimiter, async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = candidateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const data = parsed.data;

    // Verify cargo and area match
    const cargo = await prisma.cargo.findUnique({
      where: { id: data.cargoId },
    });
    if (!cargo || cargo.areaId !== data.areaId) {
      return res.status(400).json({ error: "O cargo escolhido não pertence à área selecionada" });
    }

    // Check for duplicate email
    const existingCandidate = await prisma.candidate.findFirst({
      where: { email: data.email },
    });
    if (existingCandidate) {
      return res.status(409).json({ error: "Este email já foi cadastrado anteriormente. Utilize outro email ou entre em contato conosco." });
    }

    const defaultTag = "Cadastro Incompleto";

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const candidate = await prisma.candidate.create({
      data: {
        nome: data.nome,
        email: data.email,
        password: hashedPassword,
        cpf: data.cpf,
        dataNascimento: data.dataNascimento,
        telefone: data.telefone,
        endereco: data.endereco,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        nivel: data.nivel,
        areaId: data.areaId,
        cargoId: data.cargoId,
        cargoIds: data.cargoIds,
        descricao: data.descricao,
        motivacao: data.motivacao,
        tags: [defaultTag],
      },
    });

    // Create initial timeline event
    await prisma.timelineEvent.create({
      data: {
        candidatoId: candidate.id,
        statusAnterior: null,
        statusNovo: "Inscrição",
      },
    });

    // Send confirmation email
    await emailService.send({
      candidatoId: candidate.id,
      to: candidate.email,
      subject: "Inscrição Realizada com Sucesso! - TalentFlow Suite",
      content: `Olá ${candidate.nome},\n\nSua inscrição para a vaga de ${cargo.nome} (${candidate.nivel}) foi realizada com sucesso!\n\nAgora você pode acessar o Portal do Candidato para acompanhar o status da sua candidatura.\n\nPara fazer o login:\nLink: http://localhost:5173/candidato/login\nE-mail: ${candidate.email}\n\nBoa sorte no processo seletivo!\n\nAtenciosamente,\nEquipe de Recrutamento TalentFlow`,
    });

    res.status(201).json(candidate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update candidate pipeline/tag (Protected: Admin only)
router.patch("/:id/pipeline", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { tag } = req.body; // ex: "Separação", "Entrevistando", "Aprovado", "Arquivo", "Contratado"
  
  if (!tag) {
    return res.status(400).json({ error: "Tag é obrigatória" });
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }

    const currentStatus = candidate.tags[0] || "Inscrição";

    // Update candidate
    const updated = await prisma.candidate.update({
      where: { id },
      data: {
        tags: [tag], // replacement array
      },
    });

    // Create timeline event representing state transition
    await prisma.timelineEvent.create({
      data: {
        candidatoId: id,
        statusAnterior: currentStatus,
        statusNovo: tag,
      },
    });

    // Send status update email
    await emailService.send({
      candidatoId: id,
      to: candidate.email,
      subject: `Atualização do seu Processo Seletivo: etapa "${tag}"`,
      content: `Olá ${candidate.nome},\n\nGostaríamos de informar que a sua candidatura foi movimentada para a etapa de "${tag}" no nosso processo seletivo.\n\nVocê pode acompanhar todas as atualizações no Portal do Candidato:\nLink: http://localhost:5173/candidato/login\n\nAtenciosamente,\nEquipe de Recrutamento TalentFlow`,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST add/update internal note (Protected: Admin only)
router.post("/:id/notes", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { note } = req.body;
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }

    const updated = await prisma.candidate.update({
      where: { id },
      data: {
        observacaoInterna: note || null,
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE candidate (Protected: Admin only)
router.delete("/:id", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: { resumes: true },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }

    // Physical deletion of resume files from disk
    const uploadDir = path.join(process.cwd(), "uploads");
    for (const resume of candidate.resumes) {
      const filePath = path.join(uploadDir, path.basename(resume.arquivoUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Database deletion of candidate (cascade onDelete will handle Resume, TestAnswer, and TimelineEvent tables)
    await prisma.candidate.delete({
      where: { id },
    });

    res.json({ message: "Candidato e seus currículos associados foram excluídos com sucesso." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST finalize registration (Public: used by candidate at the end of the flow)
router.post("/:id/finalize", async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }

    // Apenas finaliza se estiver em Cadastro Incompleto
    if (!candidate.tags.includes("Cadastro Incompleto")) {
      return res.json({ message: "Candidato já finalizou o cadastro ou já está em outro estágio.", candidate });
    }

    // Busca a primeira etapa real do pipeline, ou fallback
    const firstStage = await prisma.pipelineStage.findFirst({
      where: { nome: { not: "Cadastro Incompleto" } },
      orderBy: { ordem: "asc" },
    });
    const defaultTag = firstStage ? firstStage.nome : "Separação";

    const updated = await prisma.candidate.update({
      where: { id },
      data: {
        tags: [defaultTag],
      },
    });

    await prisma.timelineEvent.create({
      data: {
        candidatoId: id,
        statusAnterior: "Cadastro Incompleto",
        statusNovo: defaultTag,
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
