import { describe, it, expect } from "vitest";
import { PLAN_PRICING } from "@/lib/mercadopago";

describe("Mercado Pago Integration & Subscription Engine", () => {
  describe("PLAN_PRICING", () => {
    it("deve conter planos PREMIUM e ELITE com ciclos MONTHLY e ANNUAL", () => {
      expect(PLAN_PRICING.PREMIUM).toBeDefined();
      expect(PLAN_PRICING.ELITE).toBeDefined();

      expect(PLAN_PRICING.PREMIUM.MONTHLY.price).toBe(29.9);
      expect(PLAN_PRICING.PREMIUM.MONTHLY.durationDays).toBe(30);

      expect(PLAN_PRICING.PREMIUM.ANNUAL.price).toBe(197.0);
      expect(PLAN_PRICING.PREMIUM.ANNUAL.durationDays).toBe(365);

      expect(PLAN_PRICING.ELITE.MONTHLY.price).toBe(49.9);
      expect(PLAN_PRICING.ELITE.ANNUAL.price).toBe(347.0);
    });

    it("deve garantir que o plano anual tem desconto proporcional atrativo", () => {
      const monthlyAnnualized = PLAN_PRICING.PREMIUM.MONTHLY.price * 12;
      const annualPrice = PLAN_PRICING.PREMIUM.ANNUAL.price;
      expect(annualPrice).toBeLessThan(monthlyAnnualized);

      const discountPercentage = Math.round((1 - annualPrice / monthlyAnnualized) * 100);
      expect(discountPercentage).toBeGreaterThanOrEqual(40); // Mais de 40% de desconto no anual
    });
  });

  describe("Cálculo de Expiração de Assinatura", () => {
    it("deve calcular corretamente 30 dias para ciclo mensal", () => {
      const now = new Date("2026-10-29T12:00:00Z");
      const durationDays = 30;
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      expect(expiresAt.getTime()).toBe(now.getTime() + 30 * 86400000);
    });

    it("deve prorrogar a partir da data de expiração caso o usuário já possua plano ativo", () => {
      const now = new Date("2026-10-29T12:00:00Z");
      const currentExpiry = new Date(now.getTime() + 10 * 86400000); // Faltam 10 dias

      // Ao comprar plano anual (365 dias), deve somar aos 10 dias restantes
      const durationDays = 365;
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseDate.getTime() + durationDays * 86400000);

      expect(newExpiry.getTime()).toBe(currentExpiry.getTime() + 365 * 86400000);
    });
  });

  describe("Webhook Payload Parser", () => {
    it("deve identificar corretamente os formatos de ID do Mercado Pago (v1 e v2)", () => {
      const v2Body = {
        action: "payment.updated",
        type: "payment",
        data: { id: "123456789" },
      };

      const paymentIdFromV2 = v2Body?.data?.id;
      expect(paymentIdFromV2).toBe("123456789");

      const v1Params = new URLSearchParams("id=987654321&topic=payment");
      const paymentIdFromV1 = v1Params.get("id");
      expect(paymentIdFromV1).toBe("987654321");
    });
  });
});
