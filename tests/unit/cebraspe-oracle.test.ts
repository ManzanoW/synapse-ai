// tests/unit/cebraspe-oracle.test.ts
import { describe, it, expect, vi } from "vitest";
import { runCebraspeOracleSimulationAction } from "@/actions/cebraspe-oracle-actions";

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", email: "test@example.com" },
  }),
}));

vi.mock("@/lib/subscription", () => ({
  isUserPro: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    questionError: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe("Cebraspe Risk Oracle (Calculadora de Chute e Ponto de Equilíbrio)", () => {
  it("deve simular com sucesso as 3 estratégias de prova (conservadora, agressiva, ótima)", async () => {
    const result = await runCebraspeOracleSimulationAction({
      totalQuestions: 120,
      targetCutoffScore: 76,
      sureCount: 75,
      sureAccuracy: 0.92,
      doubtCount: 25,
      doubtAccuracy: 0.55,
      blankCount: 20,
    });

    expect(result.success).toBe(true);
    expect(result.strategies).toHaveProperty("conservative");
    expect(result.strategies).toHaveProperty("aggressive");
    expect(result.strategies).toHaveProperty("optimal");

    // Conservadora não deve arriscar chutes nas dúvidas
    expect(result.strategies.conservative.blanksRecommended).toBe(120 - 75);

    // Estratégia ótima deve indicar probabilidade e recomendação
    expect(result.strategies.optimal.probabilityOfPassing).toBeGreaterThanOrEqual(0);
    expect(result.strategies.optimal.probabilityOfPassing).toBeLessThanOrEqual(100);
    expect(result.examinerRecommendation).toBeTruthy();
    expect(result.tacticalTip).toBeTruthy();
  });

  it("deve computar probabilidade próxima de 100% se as certezas já superam folgadamente o corte", async () => {
    const result = await runCebraspeOracleSimulationAction({
      totalQuestions: 120,
      targetCutoffScore: 60,
      sureCount: 95,
      sureAccuracy: 0.95,
      doubtCount: 15,
      doubtAccuracy: 0.50,
      blankCount: 10,
    });

    expect(result.success).toBe(true);
    // 95 certezas com 95% de precisão dá ~90 certas e ~5 erradas = ~85 líquidas >> 60 corte
    expect(result.strategies.conservative.expectedNetScore).toBeGreaterThan(75);
    expect(result.strategies.conservative.probabilityOfPassing).toBeGreaterThan(95);
    expect(result.examinerRecommendation).toContain("CONSERVADORA");
  });
});
