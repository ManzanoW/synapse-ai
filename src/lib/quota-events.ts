// src/lib/quota-events.ts

export const AI_QUOTA_UPDATED_EVENT = "ai-quota-updated";

/**
 * Dispara um evento global no navegador informando que uma cota de IA
 * foi consumida, permitindo que a Sidebar e badges sincronizem em tempo real.
 */
export function triggerAiQuotaRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AI_QUOTA_UPDATED_EVENT));
  }
}
