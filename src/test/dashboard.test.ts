import { describe, it, expect } from "vitest";

// Function under test (mimics the backend pipeline calculation logic)
export function calculateTempoMedioPipeline(candidates: any[]): number {
  let totalDays = 0;
  let countProcessed = 0;

  candidates.forEach((c) => {
    const timeline = c.timelineEvents || [];
    if (timeline.length >= 2) {
      const start = timeline.find((e: any) => e.statusAnterior === null);
      const end = timeline
        .filter((e: any) => e.statusNovo === "Contratado" || e.statusNovo === "Arquivo")
        .sort((a: any, b: any) => b.dataCriacao.getTime() - a.dataCriacao.getTime())[0];

      if (start && end) {
        const diff = end.dataCriacao.getTime() - start.dataCriacao.getTime();
        totalDays += diff / (1000 * 60 * 60 * 24);
        countProcessed++;
      }
    }
  });

  return countProcessed > 0 ? parseFloat((totalDays / countProcessed).toFixed(1)) : 0;
}

// Function under test (mimics the backend conversion rate calculation logic)
export function calculateConversionRateByArea(areas: any[], candidatesByArea: Record<string, any[]>): any[] {
  const conversionRateByArea: any[] = [];
  
  for (const area of areas) {
    const candidatesInArea = candidatesByArea[area.id] || [];
    const tested = candidatesInArea.filter((c) => c.nota !== null && c.nota > 0);
    const passed = tested.filter((c) => (c.nota ?? 0) >= 60);

    const rate = tested.length > 0 ? Math.round((passed.length / tested.length) * 100) : 0;
    conversionRateByArea.push({
      area: area.nome,
      taxa: rate,
    });
  }

  return conversionRateByArea;
}

describe("Dashboard Advanced Metrics Logic", () => {
  describe("calculateTempoMedioPipeline", () => {
    it("should return 0 when there are no candidates", () => {
      expect(calculateTempoMedioPipeline([])).toBe(0);
    });

    it("should return 0 when candidates don't have timeline events", () => {
      const candidates = [
        { id: "1", timelineEvents: [] },
        { id: "2", timelineEvents: null },
      ];
      expect(calculateTempoMedioPipeline(candidates)).toBe(0);
    });

    it("should correctly compute the average pipeline time in days", () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const candidates = [
        // Candidate 1: Hired. Spent 5 days in pipeline.
        {
          id: "1",
          timelineEvents: [
            { statusAnterior: null, statusNovo: "Separação", dataCriacao: tenDaysAgo },
            { statusAnterior: "Separação", statusNovo: "Contratado", dataCriacao: fiveDaysAgo },
          ],
        },
        // Candidate 2: Archived. Spent 8 days in pipeline.
        {
          id: "2",
          timelineEvents: [
            { statusAnterior: null, statusNovo: "Separação", dataCriacao: tenDaysAgo },
            { statusAnterior: "Separação", statusNovo: "Entrevista", dataCriacao: fiveDaysAgo },
            { statusAnterior: "Entrevista", statusNovo: "Arquivo", dataCriacao: twoDaysAgo },
          ],
        },
        // Candidate 3: Still in pipeline (no Hired/Archived status end event)
        {
          id: "3",
          timelineEvents: [
            { statusAnterior: null, statusNovo: "Separação", dataCriacao: tenDaysAgo },
            { statusAnterior: "Separação", statusNovo: "Entrevista", dataCriacao: fiveDaysAgo },
          ],
        },
      ];

      // Average should be: (5 days + 8 days) / 2 = 6.5 days
      expect(calculateTempoMedioPipeline(candidates)).toBe(6.5);
    });

    it("should handle multiple final status events by taking the latest", () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

      const candidates = [
        {
          id: "1",
          timelineEvents: [
            { statusAnterior: null, statusNovo: "Separação", dataCriacao: tenDaysAgo },
            { statusAnterior: "Separação", statusNovo: "Arquivo", dataCriacao: fiveDaysAgo },
            { statusAnterior: "Arquivo", statusNovo: "Contratado", dataCriacao: oneDayAgo },
          ],
        },
      ];

      // Latest end is Contratado at oneDayAgo (9 days diff from start)
      expect(calculateTempoMedioPipeline(candidates)).toBe(9);
    });
  });

  describe("calculateConversionRateByArea", () => {
    const areas = [
      { id: "area-1", nome: "Tecnologia" },
      { id: "area-2", nome: "Design" },
      { id: "area-3", nome: "Vendas" },
    ];

    it("should return 0% for all areas when there are no candidates", () => {
      const result = calculateConversionRateByArea(areas, {});
      expect(result).toEqual([
        { area: "Tecnologia", taxa: 0 },
        { area: "Design", taxa: 0 },
        { area: "Vendas", taxa: 0 },
      ]);
    });

    it("should correctly compute conversion rate based on scores >= 60%", () => {
      const candidatesByArea = {
        "area-1": [
          { nota: 80 }, // Passed
          { nota: 60 }, // Passed (boundary)
          { nota: 40 }, // Failed
          { nota: 0 },  // Not tested (excluded from tested list)
          { nota: null }, // Not tested (excluded from tested list)
        ],
        "area-2": [
          { nota: 90 }, // Passed
          { nota: 95 }, // Passed
        ],
        "area-3": [
          { nota: 30 }, // Failed
          { nota: null }, // Not tested
        ],
      };

      const result = calculateConversionRateByArea(areas, candidatesByArea);

      expect(result).toEqual([
        { area: "Tecnologia", taxa: 67 }, // 2 passed out of 3 tested (67%)
        { area: "Design", taxa: 100 },   // 2 passed out of 2 tested (100%)
        { area: "Vendas", taxa: 0 },       // 0 passed out of 1 tested (0%)
      ]);
    });
  });
});
