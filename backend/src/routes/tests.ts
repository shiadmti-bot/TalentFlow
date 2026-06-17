import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";

const router = Router();

const submissionSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedIndex: z.number().int(),
    })
  ).min(1, "Respostas são obrigatórias"),
});

// GET questions for a candidate based on their cargo
router.get("/questions/:candidatoId", async (req: Request, res: Response): Promise<any> => {
  const { candidatoId } = req.params;
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidatoId },
      include: {
        cargo: true,
      },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }

    // Determine target cargo IDs (using cast to any to handle non-regenerated client compile safety)
    const candidateAny = candidate as any;
    const targetCargoIds: string[] = candidateAny.cargoIds && candidateAny.cargoIds.length > 0
      ? candidateAny.cargoIds
      : [candidate.cargoId];

    const maxQuestions = 10;
    const questionsPerCargo = Math.max(1, Math.floor(maxQuestions / targetCargoIds.length));
    let allQuestions: any[] = [];

    const apiKey = process.env.GROQ_API_KEY;
    const { default: OpenAI } = await import("openai");
    const groq = apiKey ? new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    }) : null;

    for (const cargoId of targetCargoIds) {
      let cargoQuestions = await prisma.question.findMany({
        where: { cargoId: cargoId },
        select: {
          id: true,
          pergunta: true,
          opcoes: true,
        },
      });

      // On-the-fly AI generation if not enough questions exist for this specific cargo
      if (cargoQuestions.length < questionsPerCargo && groq) {
        try {
          const cargo = await prisma.cargo.findUnique({
            where: { id: cargoId },
            include: { area: true },
          });

          if (cargo) {
            const prompt = `Você é um assistente especializado em criar questões de múltipla escolha para processos seletivos.
Gere ${questionsPerCargo} perguntas para o cargo de "${cargo.nome}" nível ${candidate.nivel} na área de "${cargo.area.nome}".
Importante: O nível técnico das perguntas deve ser mais brando e acessível. Evite um nível de dificuldade muito alto, focando nos conhecimentos práticos, essenciais e no dia a dia da profissão.
Cada pergunta deve ter 4 opções de resposta e indicar o índice da opção correta (0-3).
As perguntas devem ser adequadas e justas para um profissional nível ${candidate.nivel} na área.

Formato obrigatório (responda APENAS com o JSON, sem texto adicional):
{"questions": [{"pergunta": "texto da pergunta", "opcoes": ["opção A", "opção B", "opção C", "opção D"], "correta": 0}]}`;

            const completion = await groq.chat.completions.create({
              model: process.env.GROQ_MODEL || "mixtral-8x7b-32768",
              messages: [
                { role: "system", content: "Você é um assistente que gera questões de múltipla escolha no formato JSON." },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
              temperature: 0.7,
              max_tokens: 2000,
            });

            const content = completion.choices[0]?.message?.content;
            if (content) {
              const parsedResponse = JSON.parse(content);
              const generated = parsedResponse.questions || [];
              
              for (const q of generated) {
                if (!q.pergunta || !Array.isArray(q.opcoes) || q.opcoes.length < 2 || typeof q.correta !== "number") {
                  continue;
                }
                
                const saved = await prisma.question.create({
                  data: {
                    cargoId: cargo.id,
                    pergunta: q.pergunta,
                    opcoes: q.opcoes,
                    correta: q.correta,
                  },
                });
                
                cargoQuestions.push({
                  id: saved.id,
                  pergunta: saved.pergunta,
                  opcoes: saved.opcoes,
                });
              }
            }
          }
        } catch (aiError: any) {
          console.error("Failed to generate questions on-the-fly: ", aiError.message);
        }
      }

      // Shuffle and take proportional questions for this cargo
      const shuffled = cargoQuestions.sort(() => 0.5 - Math.random());
      allQuestions.push(...shuffled.slice(0, questionsPerCargo));
    }

    // Fallback: If still no questions, fallback to area questions
    if (allQuestions.length === 0) {
      allQuestions = await prisma.question.findMany({
        where: {
          cargo: {
            areaId: candidate.areaId,
          },
        },
        select: {
          id: true,
          pergunta: true,
          opcoes: true,
        },
        take: maxQuestions,
      });
    }

    // Ensure we don't exceed maxQuestions in total
    if (allQuestions.length > maxQuestions) {
      allQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, maxQuestions);
    }

    res.json(allQuestions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST submit test answers
router.post("/submit/:candidatoId", async (req: Request, res: Response): Promise<any> => {
  const { candidatoId } = req.params;
  try {
    const parsed = submissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { answers } = parsed.data;

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidatoId },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }

    let correctCount = 0;
    const testRowsToInsert = [];

    for (const ans of answers) {
      const q = await prisma.question.findUnique({
        where: { id: ans.questionId },
      });

      if (!q) {
        return res.status(400).json({ error: `Pergunta com ID ${ans.questionId} não existe` });
      }

      const correta = ans.selectedIndex === q.correta;
      if (correta) {
        correctCount++;
      }

      testRowsToInsert.push({
        candidatoId,
        pergunta: q.pergunta,
        resposta: q.opcoes[ans.selectedIndex] || "Sem resposta",
        correta,
      });
    }

    // Fetch expected questions count for candidate's cargo to avoid score tampering
    const candidateAny = candidate as any;
    const targetCargoIds: string[] = candidateAny.cargoIds && candidateAny.cargoIds.length > 0
      ? candidateAny.cargoIds
      : [candidate.cargoId];

    let expectedCount = 0;
    const maxQuestions = 10;
    const questionsPerCargo = Math.max(1, Math.floor(maxQuestions / targetCargoIds.length));

    for (const cargoId of targetCargoIds) {
      const count = await prisma.question.count({ where: { cargoId } });
      expectedCount += Math.min(count, questionsPerCargo);
    }

    if (expectedCount === 0) {
      const fallbackCount = await prisma.question.count({
        where: {
          cargo: {
            areaId: candidate.areaId,
          },
        },
      });
      expectedCount = fallbackCount > 0 ? Math.min(fallbackCount, maxQuestions) : maxQuestions;
    }

    if (expectedCount > maxQuestions) {
      expectedCount = maxQuestions;
    }

    const totalQuestions = Math.max(answers.length, expectedCount);
    const nota = Math.round((correctCount / totalQuestions) * 100);

    // Save test results and update candidate nota in a transaction
    await prisma.$transaction([
      prisma.testAnswer.deleteMany({
        where: { candidatoId },
      }),
      prisma.testAnswer.createMany({
        data: testRowsToInsert,
      }),
      prisma.candidate.update({
        where: { id: candidatoId },
        data: { nota },
      }),
      prisma.timelineEvent.create({
        data: {
          candidatoId,
          statusAnterior: "Inscrição",
          statusNovo: "Teste realizado",
        },
      }),
    ]);

    res.json({
      message: "Teste processado com sucesso",
      nota,
      correctCount,
      totalQuestions,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
