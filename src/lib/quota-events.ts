// src/lib/quota-events.ts

export const AI_QUOTA_UPDATED_EVENT = "ai-quota-updated";
export const AI_QUOTA_CONSUMED_EVENT = "ai-quota-consumed";
export const AI_EXHAUSTION_TRIGGERED_EVENT = "ai-exhaustion-triggered";

export interface QuotaConsumedDetail {
  cost: number;
  feature?: string;
  label?: string;
}

export interface ExhaustionDetail {
  feature?: string;
  reason?: string;
  suggestedAction?: "flashcards" | "edital" | "general";
}

/**
 * Dispara um evento global no navegador informando que uma cota de IA
 * foi consumida ou creditada, permitindo sincronização em tempo real.
 */
export function triggerAiQuotaRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AI_QUOTA_UPDATED_EVENT));
  }
}

/**
 * Dispara animação e dedução otimista imediata na interface (-1⚡, -2⚡, etc.)
 * proporcionando feedback tátil ao usuário antes mesmo do término da requisição.
 */
export function triggerOptimisticEnergyConsumption(
  detail: QuotaConsumedDetail = { cost: 1 },
) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<QuotaConsumedDetail>(AI_QUOTA_CONSUMED_EVENT, { detail }),
    );
  }
}

/**
 * Dispara a modal global de exaustão cognitiva quando a energia do usuário
 * chega a zero ou uma requisição de IA é interceptada por limite de cota.
 */
export function triggerSynapticExhaustion(detail: ExhaustionDetail = {}) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<ExhaustionDetail>(AI_EXHAUSTION_TRIGGERED_EVENT, { detail }),
    );
  }
}

