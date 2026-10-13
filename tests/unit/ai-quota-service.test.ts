import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GLOBAL_DAILY_AI_LIMIT,
  GLOBAL_DAILY_PRO_AI_LIMIT,
  AI_QUOTA_LIMITS,
  PRO_FAIR_USE_LIMITS,
  MAX_REWARDED_BONUS_PER_FEATURE,
  MAX_DAILY_REWARDED_ADS,
  getTodayKey,
  getUsagePeriodKey,
  checkRateLimitPerMinute,
  checkAiQuota,
  isUserPro,
} from "@/lib/ai-quota-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    aiDailyUsage: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("AI Quota Service & Product Tier Calibration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Constantes e Matriz de Produto", () => {
    it("deve calibrar a cota global do plano Básico em 10 Sinapses diárias", () => {
      expect(GLOBAL_DAILY_AI_LIMIT).toBe(10);
    });

    it("deve calibrar a cota global do plano Pro em 60 Sinapses diárias de alta capacidade", () => {
      expect(GLOBAL_DAILY_PRO_AI_LIMIT).toBe(60);
    });

    it("deve limitar o plano gratuito a 1 simulado diário base", () => {
      expect(AI_QUOTA_LIMITS.SIMULADO.dailyLimit).toBe(1);
    });

    it("deve limitar o plano gratuito a 1 correção de redação semanal", () => {
      expect(AI_QUOTA_LIMITS.ESSAY.dailyLimit).toBe(1);
      expect(AI_QUOTA_LIMITS.ESSAY.isWeekly).toBe(true);
    });

    it("deve limitar o plano gratuito a 2 remediações e mnemônicos diários", () => {
      expect(AI_QUOTA_LIMITS.REMEDIATION.dailyLimit).toBe(2);
    });

    it("deve restringir o bônus de anúncio recompensado a no máximo +1 por funcionalidade", () => {
      expect(MAX_REWARDED_BONUS_PER_FEATURE).toBe(1);
    });

    it("deve restringir o total global de anúncios recompensados a no máximo 2 por dia", () => {
      expect(MAX_DAILY_REWARDED_ADS).toBe(2);
    });

    it("deve conceder limites generosos de Fair Use para o plano Pro", () => {
      expect(PRO_FAIR_USE_LIMITS.SIMULADO.dailyLimit).toBe(5);
      expect(PRO_FAIR_USE_LIMITS.ESSAY.dailyLimit).toBe(3);
      expect(PRO_FAIR_USE_LIMITS.REMEDIATION.dailyLimit).toBe(30);
    });
  });

  describe("Cálculo de Chaves Temporais (Ciclos Diário e Semanal)", () => {
    it("deve formatar a chave de hoje no formato YYYY-MM-DD", () => {
      const todayKey = getTodayKey();
      expect(todayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("deve retornar chave da segunda-feira para features semanais (ESSAY e MINDMAP)", () => {
      const essayKey = getUsagePeriodKey("ESSAY");
      const mindmapKey = getUsagePeriodKey("MINDMAP");
      expect(essayKey).toMatch(/^\d{4}-W\d+$/);
      expect(mindmapKey).toMatch(/^\d{4}-W\d+$/);
    });

    it("deve retornar chave diária para features com ciclo diário", () => {
      const simuladoKey = getUsagePeriodKey("SIMULADO");
      expect(simuladoKey).toBe(getTodayKey());
    });
  });

  describe("Rate Limiter em Memória", () => {
    it("deve permitir requisições até o limite por minuto e bloquear excedentes", () => {
      const testUserId = `test-user-rate-${Date.now()}`;

      for (let i = 0; i < 10; i++) {
        expect(checkRateLimitPerMinute(testUserId)).toBe(true);
      }

      // 11ª requisição no mesmo minuto deve ser bloqueada
      expect(checkRateLimitPerMinute(testUserId)).toBe(false);
    });
  });

  describe("Identificação de Status Pro (isUserPro)", () => {
    it("deve reconhecer ADMIN como Pro", async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        role: "ADMIN",
        planTier: "FREE",
        email: "admin@synapse.ai",
      });

      const pro = await isUserPro("admin-id");
      expect(pro).toBe(true);
    });

    it("deve reconhecer planTier PREMIUM como Pro", async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        role: "USER",
        planTier: "PREMIUM",
        email: "aluno@synapse.ai",
      });

      const pro = await isUserPro("premium-id");
      expect(pro).toBe(true);
    });

    it("deve identificar usuário FREE como não-Pro", async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        role: "USER",
        planTier: "FREE",
        email: "free@synapse.ai",
      });

      const pro = await isUserPro("free-id");
      expect(pro).toBe(false);
    });
  });

  describe("Verificação de Cota Diária (checkAiQuota)", () => {
    it("deve permitir requisição para usuário Pro com alta capacidade (60/dia)", async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        role: "USER",
        planTier: "PREMIUM",
        email: "pro@synapse.ai",
      });

      (prisma.aiDailyUsage.findUnique as any)
        .mockResolvedValueOnce({ count: 2 }) // feature usage (simulado)
        .mockResolvedValueOnce({ count: 10 }); // global usage

      const quota = await checkAiQuota("pro-user", "SIMULADO");
      expect(quota.allowed).toBe(true);
      expect(quota.isUnlimited).toBe(true);
      expect(quota.remaining).toBe(3); // 5 - 2 = 3 restantes
      expect(quota.canWatchRewardedAd).toBe(false);
    });

    it("deve bloquear usuário Free quando o teto global de 10 Sinapses for atingido", async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        role: "USER",
        planTier: "FREE",
        email: "free@synapse.ai",
      });

      (prisma.aiDailyUsage.findUnique as any)
        .mockResolvedValueOnce({ count: 0 }) // feature usage
        .mockResolvedValueOnce({ count: 10 }) // global usage atingiu 10
        .mockResolvedValueOnce({ count: 0 }) // bonus feature
        .mockResolvedValueOnce({ count: 0 }); // bonus global

      const quota = await checkAiQuota("free-user", "SIMULADO");
      expect(quota.allowed).toBe(false);
      expect(quota.used).toBe(10);
      expect(quota.limit).toBe(10);
      expect(quota.message).toContain("limite diário gratuito");
    });

    it("deve bloquear usuário Free quando a cota específica da funcionalidade for atingida", async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        role: "USER",
        planTier: "FREE",
        email: "free@synapse.ai",
      });

      (prisma.aiDailyUsage.findUnique as any)
        .mockResolvedValueOnce({ count: 1 }) // feature usage (SIMULADO atingiu 1)
        .mockResolvedValueOnce({ count: 4 }) // global usage ainda dentro do limite (4 < 10)
        .mockResolvedValueOnce({ count: 0 }) // bonus feature (nenhum resgatado)
        .mockResolvedValueOnce({ count: 0 }); // bonus global (nenhum resgatado)

      const quota = await checkAiQuota("free-user", "SIMULADO");
      expect(quota.allowed).toBe(false);
      expect(quota.canWatchRewardedAd).toBe(true); // Pode assistir anúncio para ganhar +1
      expect(quota.message).toContain("Simulados com IA");
    });

    it("deve não permitir anúncio recompensado se o usuário já resgatou o bônus máximo (+1)", async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        role: "USER",
        planTier: "FREE",
        email: "free@synapse.ai",
      });

      (prisma.aiDailyUsage.findUnique as any)
        .mockResolvedValueOnce({ count: 2 }) // feature usage (usou 2)
        .mockResolvedValueOnce({ count: 6 }) // global usage (6 < 10)
        .mockResolvedValueOnce({ count: 1 }) // bonus feature (já resgatou 1 bônus)
        .mockResolvedValueOnce({ count: 1 }); // bonus global (1 < 2)

      const quota = await checkAiQuota("free-user", "SIMULADO");
      expect(quota.allowed).toBe(false);
      expect(quota.canWatchRewardedAd).toBe(false); // Já resgatou o bônus máximo de simulados hoje
    });
  });

  describe("Recarga por Mérito de Estudo (addStudyMeritBonus)", () => {
    it("deve conceder +1⚡ de energia por mérito de foco Pomodoro quando abaixo do teto", async () => {
      const { addStudyMeritBonus, MAX_DAILY_MERIT_BONUS } = await import("@/lib/ai-quota-service");
      expect(MAX_DAILY_MERIT_BONUS).toBe(2);

      (prisma.aiDailyUsage.findUnique as any).mockResolvedValueOnce({ count: 0 }); // 0 méritos resgatados hoje
      (prisma.$transaction as any).mockResolvedValueOnce([{}, {}]);

      const result = await addStudyMeritBonus("test-user", "POMODORO_FOCUS");
      expect(result.success).toBe(true);
      expect(result.earnedEnergy).toBe(1);
      expect(result.message).toContain("Pomodoro");
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("deve bloquear recarga por mérito quando atingido o teto diário de 2 bônus", async () => {
      const { addStudyMeritBonus } = await import("@/lib/ai-quota-service");

      (prisma.aiDailyUsage.findUnique as any).mockResolvedValueOnce({ count: 2 }); // Já atingiu 2 méritos

      const result = await addStudyMeritBonus("test-user", "FSRS_STREAK");
      expect(result.success).toBe(false);
      expect(result.message).toContain("2 recargas por mérito");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("Cálculo de ROI & Valor Gerado pela IA (getAiValueMetrics)", () => {
    it("deve calcular horas economizadas e pontos cegos superados com base no uso semanal", async () => {
      const { getAiValueMetrics } = await import("@/lib/ai-quota-service");

      (prisma.user.findUnique as any).mockResolvedValueOnce({
        role: "USER",
        planTier: "FREE",
      });

      (prisma.aiDailyUsage.findMany as any).mockResolvedValueOnce([
        { feature: "SIMULADO", count: 2 }, // 2 * 45 = 90 min
        { feature: "ESSAY", count: 1 }, // 1 * 120 = 120 min
        { feature: "REMEDIATION", count: 4 }, // 4 * 15 = 60 min
        { feature: "MINDMAP", count: 2 }, // 2 * 30 = 60 min
      ]);

      const metrics = await getAiValueMetrics("test-user");
      // Total minutos = 90 + 120 + 60 + 60 = 330 min (5h 30min)
      expect(metrics.totalMinutesSaved).toBe(330);
      expect(metrics.hoursSavedFormatted).toBe("5h 30min");
      expect(metrics.blindspotsResolved).toBe(4);
      expect(metrics.isPro).toBe(false);
      expect(metrics.speedupFactor).toBe("4.4x");
    });
  });
});
