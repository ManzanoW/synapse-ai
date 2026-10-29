import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

export const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
export const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";

// Configuração central do cliente Mercado Pago
export const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN || "TEST-0000000000000000-000000-00000000000000000000000000000000-000000000",
  options: {
    timeout: 10000,
  },
});

export const paymentClient = new Payment(mpClient);
export const preferenceClient = new Preference(mpClient);

export interface PlanPricing {
  title: string;
  description: string;
  price: number;
  durationDays: number;
}

export const PLAN_PRICING: Record<string, Record<"MONTHLY" | "ANNUAL", PlanPricing>> = {
  PREMIUM: {
    MONTHLY: {
      title: "Synapse Concurseiro Pro • Mensal",
      description: "Acesso total à IA, simulados ilimitados, caderno de erros e repetição espaçada FSRS por 30 dias.",
      price: 29.9,
      durationDays: 30,
    },
    ANNUAL: {
      title: "Synapse Concurseiro Pro • Anual (Até Passar)",
      description: "Acesso total ao Synapse Pro por 1 ano completo (equivalente a R$ 16,40/mês).",
      price: 197.0,
      durationDays: 365,
    },
  },
  ELITE: {
    MONTHLY: {
      title: "Synapse Concurseiro Elite • Mensal",
      description: "Plano Pro + Simulados Extremos de 60q, OCR de Redação Manuscrita Ilimitado e Copilot PhD por 30 dias.",
      price: 49.9,
      durationDays: 30,
    },
    ANNUAL: {
      title: "Synapse Concurseiro Elite • Anual",
      description: "Plano Elite completo por 1 ano com mentoria socrática avançada e prioridade total de processamento.",
      price: 347.0,
      durationDays: 365,
    },
  },
};
