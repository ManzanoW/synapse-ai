// src/lib/sm2.ts

export interface SM2Input {
  interval: number;
  easiness: number;
  repetitions: number;
  grade: number; // Nota de 0 a 5
}

export interface SM2Output {
  nextInterval: number;
  nextEasiness: number;
  nextRepetitions: number;
  nextReviewDate: Date;
}

export type PerformanceLabel =
  "bom" | "dificil" | "errei" | "Fácil" | "Bom" | "Difícil" | "Errei";

/**
 * Converte rótulos legíveis de desempenho para a nota numérica padrão do SM-2 (0 a 5)
 */
export function convertLabelToGrade(label: PerformanceLabel): number {
  const normalized = label.toLowerCase();
  switch (normalized) {
    case "fácil":
    case "facil":
      return 5;
    case "bom":
      return 4;
    case "dificil":
    case "difícil":
      return 3;
    case "errei":
    default:
      return 0;
  }
}

/**
 * Algoritmo SM-2 Oficial (SuperMemo 2)
 * Calcula os novos valores de intervalo, fator de facilidade e repetições.
 */
export function calculateSM2(params: SM2Input): SM2Output {
  const { interval, easiness, repetitions, grade } = params;

  // Garante que a nota esteja dentro da escala válida de 0 a 5
  const q = Math.max(0, Math.min(5, grade));

  // 1. Cálculo do novo Fator de Facilidade (Easiness Factor)
  let nextEasiness = easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (nextEasiness < 1.3) nextEasiness = 1.3;

  let nextInterval: number;
  let nextRepetitions: number;

  // 2. Se errou ou teve desempenho ruim (nota < 3), reseta o ciclo
  if (q < 3) {
    nextRepetitions = 0;
    nextInterval = 1;
  } else {
    nextRepetitions = repetitions + 1;
    if (nextRepetitions === 1) {
      nextInterval = 1;
    } else if (nextRepetitions === 2) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(interval * nextEasiness);
    }
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  return {
    nextInterval,
    nextEasiness: Number(nextEasiness.toFixed(2)),
    nextRepetitions,
    nextReviewDate,
  };
}

/**
 * Utilitário legador/adaptador para simplificar atualizações por texto ("bom", "dificil", "errei")
 */
export function calculateSM2FromLabel(
  interval: number,
  easiness: number,
  repetitions: number,
  label: PerformanceLabel,
): SM2Output {
  const grade = convertLabelToGrade(label);
  return calculateSM2({ interval, easiness, repetitions, grade });
}
