import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/stats", async (req: Request, res: Response) => {
  try {
    const totalCandidates = await prisma.candidate.count();

    // Candidates by Job
    const candidatesByJobRaw = await prisma.candidate.groupBy({
      by: ["cargoId"],
      _count: {
        id: true,
      },
    });

    const jobs = await prisma.cargo.findMany();
    const candidatesByJob = jobs.map((job) => {
      const match = candidatesByJobRaw.find((c) => c.cargoId === job.id);
      return {
        cargo: job.nome,
        quantidade: match ? match._count.id : 0,
      };
    }).filter(item => item.quantidade > 0);

    // Distribution of grades and status
    const candidates = await prisma.candidate.findMany({
      select: { nota: true, tags: true },
    });

    const candidatesComTeste = candidates.filter(c => c.nota !== null && c.nota > 0);
    const mediaNota = candidatesComTeste.length > 0 
      ? Math.round(candidatesComTeste.reduce((sum, c) => sum + (c.nota ?? 0), 0) / candidatesComTeste.length)
      : 0;

    const aprovadosTeste = candidates.filter(c => (c.nota ?? 0) >= 60).length;
    const aprovadosPercent = totalCandidates > 0 ? Math.round((aprovadosTeste / totalCandidates) * 100) : 0;
    
    const contratados = candidates.filter(c => c.tags.includes("Contratado")).length;
    const taxaContratacao = totalCandidates > 0 ? Math.round((contratados / totalCandidates) * 100) : 0;

    const distribution = {
      excelente: 0, // >= 80
      bom: 0,       // 60-79
      regular: 0,   // < 60
      semNota: 0,
    };

    candidates.forEach((c) => {
      if (c.nota === null || c.nota === 0) {
        distribution.semNota++;
      } else if (c.nota >= 80) {
        distribution.excelente++;
      } else if (c.nota >= 60) {
        distribution.bom++;
      } else {
        distribution.regular++;
      }
    });

    const distributionArray = [
      { name: "Excelente (≥80%)", value: distribution.excelente },
      { name: "Bom (60-79%)", value: distribution.bom },
      { name: "Regular (<60%)", value: distribution.regular },
      { name: "Sem nota / Não realizou", value: distribution.semNota },
    ].filter(item => item.value > 0);

    // Candidates in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newCandidatesLast7Days = await prisma.candidate.count({
      where: {
        dataCriacao: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Also get daily stats for the last 7 days for chart
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await prisma.candidate.count({
        where: {
          dataCriacao: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      dailyStats.push({
        data: startOfDay.toLocaleDateString("pt-BR", { weekday: "short" }),
        quantidade: count,
      });
    }

    // Seniority distribution
    const seniorityRaw = await prisma.candidate.groupBy({
      by: ["nivel"],
      _count: { id: true },
    });
    const seniorityDistribution = seniorityRaw.map((s) => ({
      name: s.nivel,
      value: s._count.id,
    }));

    // Area distribution
    const areas = await prisma.area.findMany({
      include: {
        cargos: {
          select: { id: true },
        },
      },
    });

    const areaDistribution = [];
    for (const area of areas) {
      const cargoIds = area.cargos.map((c) => c.id);
      const count = await prisma.candidate.count({
        where: {
          cargoId: { in: cargoIds },
        },
      });
      if (count > 0) {
        areaDistribution.push({
          name: area.nome,
          value: count,
        });
      }
    }

    // Top Talents (Technical Test score >= 60, sorted by score descending, limit 5)
    const topTalents = await prisma.candidate.findMany({
      where: {
        nota: {
          gte: 60,
        },
      },
      orderBy: {
        nota: "desc",
      },
      take: 5,
      include: {
        cargo: {
          include: {
            area: true,
          },
        },
      },
    });

    // Pipeline stage counts (for funnel)
    const dbStages = await prisma.pipelineStage.findMany({
      orderBy: { ordem: "asc" },
    });
    const pipelineCounts = [];
    for (const stage of dbStages) {
      const count = await prisma.candidate.count({
        where: {
          tags: {
            has: stage.nome,
          },
        },
      });
      pipelineCounts.push({
        name: stage.nome,
        value: count,
      });
    }

    // Advanced Metric 1: Tempo Médio no Pipeline (in days)
    const processedCandidates = await prisma.candidate.findMany({
      where: {
        tags: {
          hasSome: ["Contratado", "Arquivo"],
        },
      },
      include: {
        timelineEvents: true,
      },
    });

    let totalDays = 0;
    let countProcessed = 0;

    processedCandidates.forEach((c) => {
      const timeline = c.timelineEvents;
      if (timeline.length >= 2) {
        const start = timeline.find((e) => e.statusAnterior === null);
        const end = timeline
          .filter((e) => e.statusNovo === "Contratado" || e.statusNovo === "Arquivo")
          .sort((a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime())[0];

        if (start && end) {
          const diff = end.dataCriacao.getTime() - start.dataCriacao.getTime();
          totalDays += diff / (1000 * 60 * 60 * 24);
          countProcessed++;
        }
      }
    });

    const tempoMedioPipeline = countProcessed > 0 ? parseFloat((totalDays / countProcessed).toFixed(1)) : 0;

    // Advanced Metric 2: Taxa de Conversão por Área
    const conversionRateByArea = [];
    for (const area of areas) {
      const cargoIds = area.cargos.map((c) => c.id);
      const candidatesInArea = await prisma.candidate.findMany({
        where: { cargoId: { in: cargoIds } },
        select: { nota: true },
      });

      const tested = candidatesInArea.filter((c) => c.nota !== null && c.nota > 0);
      const passed = tested.filter((c) => (c.nota ?? 0) >= 60);

      const rate = tested.length > 0 ? Math.round((passed.length / tested.length) * 100) : 0;
      conversionRateByArea.push({
        area: area.nome,
        taxa: rate,
      });
    }

    res.json({
      totalCandidates,
      candidatesByJob,
      distribution: distributionArray,
      newCandidatesLast7Days,
      dailyStats,
      seniorityDistribution,
      areaDistribution,
      topTalents,
      mediaNota,
      aprovadosTeste,
      aprovadosPercent,
      contratados,
      taxaContratacao,
      pipelineCounts,
      tempoMedioPipeline,
      conversionRateByArea,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
