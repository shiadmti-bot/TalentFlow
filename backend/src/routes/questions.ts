import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";

const router = Router();

const questionSchema = z.object({
  cargoId: z.string().uuid("ID de Cargo inválido"),
  pergunta: z.string().min(1, "Pergunta é obrigatória"),
  opcoes: z.array(z.string()).min(2, "Forneça pelo menos 2 opções"),
  correta: z.number().nonnegative("O índice da resposta correta deve ser fornecido"),
});

const generateSchema = z.object({
  cargoId: z.string().uuid("ID de Cargo inválido"),
  nivel: z.enum(["Júnior", "Pleno", "Sênior"]),
  quantidade: z.number().int().min(1).max(15).default(5),
});

// POST generate questions via AI
router.post("/generate", async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { cargoId, nivel, quantidade } = parsed.data;

    const cargo = await prisma.cargo.findUnique({
      where: { id: cargoId },
      include: { area: true },
    });

    if (!cargo) {
      return res.status(404).json({ error: "Cargo não encontrado" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "GROQ_API_KEY não configurada no servidor. Obtenha uma chave gratuita em https://console.groq.com/keys" });
    }

    const prompt = `Você é um assistente especializado em criar questões de múltipla escolha para processos seletivos.
Gere ${quantidade} perguntas para o cargo de "${cargo.nome}" nível ${nivel} na área de "${cargo.area.nome}".
Importante: O nível técnico das perguntas deve ser mais brando e acessível. Evite um nível de dificuldade muito alto, focando nos conhecimentos práticos, essenciais e no dia a dia da profissão.
Cada pergunta deve ter 4 opções de resposta e indicar o índice da opção correta (0-3).
As perguntas devem ser adequadas e justas para um profissional nível ${nivel} na área.

Formato obrigatório (responda APENAS com o JSON, sem texto adicional):
{"questions": [{"pergunta": "texto da pergunta", "opcoes": ["opção A", "opção B", "opção C", "opção D"], "correta": 0}]}`;

    const { default: OpenAI } = await import("openai");
    const groq = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "mixtral-8x7b-32768",
      messages: [
        { role: "system", content: "Você é um assistente que gera questões de múltipla escolha no formato JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: "IA não retornou conteúdo válido." });
    }

    const parsedResponse = JSON.parse(content);
    const questions = parsedResponse.questions || [];

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ error: "Formato de resposta da IA inválido." });
    }

    const savedQuestions = [];
    for (const q of questions) {
      if (!q.pergunta || !Array.isArray(q.opcoes) || q.opcoes.length < 2 || typeof q.correta !== "number") {
        continue;
      }

      const saved = await prisma.question.create({
        data: {
          cargoId,
          pergunta: q.pergunta,
          opcoes: q.opcoes,
          correta: q.correta,
        },
      });
      savedQuestions.push(saved);
    }

    if (savedQuestions.length === 0) {
      return res.status(500).json({ error: "Nenhuma pergunta válida foi gerada pela IA." });
    }

    res.status(201).json({
      message: `${savedQuestions.length} perguntas geradas com sucesso via IA (Groq)!`,
      questions: savedQuestions,
    });
  } catch (error: any) {
    if (error.message?.includes("401") || error.message?.includes("Incorrect API key")) {
      return res.status(400).json({ error: "Chave de API do Groq inválida. Verifique a configuração." });
    }
    res.status(500).json({ error: "Erro ao gerar perguntas com IA: " + error.message });
  }
});

// GET all questions
router.get("/", async (req: Request, res: Response) => {
  const { cargoId } = req.query;
  try {
    const filter = cargoId ? { cargoId: String(cargoId) } : {};
    const questions = await prisma.question.findMany({
      where: filter,
      include: {
        cargo: {
          include: {
            area: true,
          },
        },
      },
    });
    res.json(questions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create question
router.post("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = questionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { cargoId, pergunta, opcoes, correta } = parsed.data;

    const question = await prisma.question.create({
      data: { cargoId, pergunta, opcoes, correta },
      include: { cargo: true },
    });

    res.status(201).json(question);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update question
router.put("/:id", async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const parsed = questionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { cargoId, pergunta, opcoes, correta } = parsed.data;

    const question = await prisma.question.update({
      where: { id },
      data: { cargoId, pergunta, opcoes, correta },
      include: { cargo: true },
    });

    res.json(question);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE question
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.question.delete({ where: { id } });
    res.json({ message: "Pergunta deletada com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
