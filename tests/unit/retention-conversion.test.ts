// tests/unit/retention-conversion.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTimeUntilMidnightBRT } from "@/lib/countdown-service";
import {
  generateDirectRevengeExamAction,
  generateRedemptionExamAction,
} from "@/actions/error-notebook-actions";

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-test-retention" },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockFindMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    questionError: {
      findMany: (...args: any[]) => mockFindMany(...args),
      count: vi.fn().mockResolvedValue(5),
      update: vi.fn().mockResolvedValue({ id: "err-1", status: "MASTERED" }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: "user-test-retention", planTier: "FREE" }),
    },
    studyActivity: {
      create: vi.fn().mockResolvedValue({ id: "act-1" }),
    },
    userQuest: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

const mockCheckAiQuota = vi.fn();
const mockConsumeAiQuota = vi.fn();
vi.mock("@/lib/ai-quota-service", () => ({
  checkAiQuota: (...args: any[]) => mockCheckAiQuota(...args),
  consumeAiQuota: (...args: any[]) => mockConsumeAiQuota(...args),
  TAXONOMY_METADATA: {},
  normalizeTaxonomy: (v: string) => v,
}));

vi.mock("@/lib/gemini-fallback", () => ({
  generateContentWithFallback: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      questoes: [
        {
          errorId: "err-1",
          conceptTested: "Interpretação Restritiva",
          questionText: "Questão Gêmea gerada pela IA sobre o tema?",
          options: [
            { id: "A", texto: "Opção A" },
            { id: "B", texto: "Opção B" },
          ],
          correctAnswer: "A",
          explanation: "Explicação da questão gêmea",
          mnemonic: "Mnemônico IA",
        },
      ],
    }),
  }),
}));

describe("Retenção & Conversão - Contagem Regressiva e Revanche de Erros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTimeUntilMidnightBRT (Contagem Regressiva 00:00 BRT)", () => {
    it("deve calcular horas, minutos e segundos até a meia-noite em Brasília", () => {
      const countdown = getTimeUntilMidnightBRT();

      expect(countdown.hours).toBeGreaterThanOrEqual(0);
      expect(countdown.hours).toBeLessThan(24);

      expect(countdown.minutes).toBeGreaterThanOrEqual(0);
      expect(countdown.minutes).toBeLessThan(60);

      expect(countdown.seconds).toBeGreaterThanOrEqual(0);
      expect(countdown.seconds).toBeLessThan(60);

      expect(countdown.totalSeconds).toBe(
        countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds
      );

      expect(countdown.formatted).toMatch(/^\d{2}h \d{2}m \d{2}s$/);
      expect(countdown.formattedDigital).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it("deve calcular corretamente a partir de uma data de referência fixa", () => {
      // 2026-10-13T20:00:00Z -> Em BRT (UTC-3), são 17:00:00. Faltam 7 horas (25200s).
      const fixedDate = new Date("2026-10-13T20:00:00Z");
      const countdown = getTimeUntilMidnightBRT(fixedDate);

      expect(countdown.hours).toBe(7);
      expect(countdown.minutes).toBe(0);
      expect(countdown.seconds).toBe(0);
      expect(countdown.totalSeconds).toBe(25200);
      expect(countdown.formatted).toBe("07h 00m 00s");
      expect(countdown.formattedDigital).toBe("07:00:00");
    });
  });

  describe("generateDirectRevengeExamAction (Revanche Direta Zero Cota)", () => {
    it("deve extrair questões originais pendentes sem chamar IA nem consumir cota", async () => {
      mockFindMany.mockResolvedValueOnce([
        {
          id: "err-1",
          questionText: "Qual o prazo para o recurso ordinário?",
          options: [
            { id: "A", texto: "5 dias" },
            { id: "B", texto: "8 dias" },
          ],
          userAnswer: "A",
          correctAnswer: "B",
          explanation: "O prazo é de 8 dias conforme CLT art. 895.",
          mnemonic: "RO = 8 letras/dias",
          status: "PENDING",
          subject: { id: "sub-1", name: "Direito do Trabalho" },
          topic: { id: "top-1", title: "Recursos" },
        },
      ]);

      const res = await generateDirectRevengeExamAction({ count: 5 });

      expect(res.success).toBe(true);
      expect(res.isDirectRevenge).toBe(true);
      expect(res.questions).toHaveLength(1);
      expect(res.questions![0].questionText).toBe("Qual o prazo para o recurso ordinário?");
      expect(res.questions![0].correctAnswer).toBe("B");
      expect(res.questions![0].options).toHaveLength(2);
      expect(mockCheckAiQuota).not.toHaveBeenCalled();
      expect(mockConsumeAiQuota).not.toHaveBeenCalled();
    });

    it("deve retornar aviso amigável quando o aluno não possui erros pendentes", async () => {
      mockFindMany.mockResolvedValueOnce([]);

      const res = await generateDirectRevengeExamAction();

      expect(res.success).toBe(false);
      expect(res.isDirectRevenge).toBe(true);
      expect(res.error).toContain("não possui erros pendentes");
    });
  });

  describe("generateRedemptionExamAction (Simulado de Redenção IA com Trava de Cota)", () => {
    it("deve bloquear execução e avisar sobre cota excedida quando checkAiQuota retornar false", async () => {
      mockCheckAiQuota.mockResolvedValueOnce({
        allowed: false,
        message: "Limite de simulados atingido hoje.",
        canWatchRewardedAd: true,
      });

      const res = await generateRedemptionExamAction();

      expect(res.success).toBe(false);
      expect(res.isQuotaExceeded).toBe(true);
      expect(res.canWatchRewardedAd).toBe(true);
      expect(res.error).toContain("Limite de simulados atingido hoje");
      expect(mockFindMany).not.toHaveBeenCalled();
    });

    it("deve consumir a cota de SIMULADO após gerar com sucesso as questões gêmeas", async () => {
      mockCheckAiQuota.mockResolvedValueOnce({
        allowed: true,
      });
      mockFindMany.mockResolvedValueOnce([
        {
          id: "err-1",
          questionText: "Original...",
          userAnswer: "B",
          correctAnswer: "A",
          errorReason: "PEGUINHA",
          status: "PENDING",
          subject: { id: "sub-1", name: "Direito Constitucional" },
          topic: { id: "top-1", title: "Poder Executivo" },
        },
      ]);

      const res = await generateRedemptionExamAction({ count: 1 });

      expect(res.success).toBe(true);
      expect(res.isDirectRevenge).toBe(false);
      expect(mockCheckAiQuota).toHaveBeenCalledWith("user-test-retention", "SIMULADO");
      expect(mockConsumeAiQuota).toHaveBeenCalledWith("user-test-retention", "SIMULADO");
    });
  });
});
