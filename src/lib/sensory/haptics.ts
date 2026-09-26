// src/lib/sensory/haptics.ts

export type HapticPattern = "light" | "medium" | "heavy" | "success" | "warning" | "error";

/**
 * Utilitário de feedback tátil para dispositivos móveis via navigator.vibrate.
 * Seguro para SSR e navegadores que não suportam a Vibration API.
 */
export function triggerHaptic(pattern: HapticPattern = "light"): void {
  if (typeof window === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  try {
    switch (pattern) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(25);
        break;
      case "heavy":
        navigator.vibrate(50);
        break;
      case "success":
        // Padrão agradável de sucesso duplo
        navigator.vibrate([15, 40, 25]);
        break;
      case "warning":
        navigator.vibrate([30, 60, 30]);
        break;
      case "error":
        // Padrão indicativo de erro
        navigator.vibrate([40, 50, 40, 50, 40]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Silencia qualquer exceção de segurança de permissão de vibração
  }
}
