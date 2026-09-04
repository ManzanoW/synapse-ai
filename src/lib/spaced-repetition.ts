/**
 * Motor Moderno de Repetição Espaçada inspirado no FSRS (Free Spaced Repetition Scheduler)
 * calibrado com fatores do SM-2 e a taxa de retenção real do aluno nas matérias do edital.
 *
 * 4 Níveis de Avaliação:
 * 1 = AGAIN (Errei)
 * 2 = HARD (Difícil)
 * 3 = GOOD (Bom)
 * 4 = EASY (Fácil)
 */

export enum EvaluationRating {
  AGAIN = 1, // Erro / Esquecimento completo
  HARD = 2,  // Acertou com muito esforço / Dificuldade
  GOOD = 3,  // Acerto normal / Bom domínio
  EASY = 4,  // Resposta imediata / Muito fácil
}

export type ReviewGrade = 1 | 2 | 3 | 4;

export const SRS_CONFIG = {
  DEFAULT_EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  MAX_EASE_FACTOR: 3.5,
  DEFAULT_DIFFICULTY: 5.0,
  MIN_DIFFICULTY: 1.0,
  MAX_DIFFICULTY: 10.0,
  DEFAULT_STABILITY: 1.0,
  MIN_STABILITY: 0.5,
  CRITICAL_SUBJECT_ACCURACY_THRESHOLD: 65.0, // 65% de taxa de acertos
  CRITICAL_RETENTION_PENALTY: 0.8, // Multiplicador de proteção de retenção de 0.8x
} as const;

export interface SpacedRepetitionCardState {
  interval?: number | null;
  easeFactor?: number | null;
  stability?: number | null;
  difficulty?: number | null;
  repetitions?: number | null;
  lapses?: number | null;
  lastReviewed?: Date | null;
}

export interface CardStateDefaults {
  stability: number;
  difficulty: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lapses: number;
}

export interface CalculateNextReviewInput {
  grade: ReviewGrade | EvaluationRating | number | string;
  repetitions: number;
  previousInterval: number;
  stability: number;
  difficulty: number;
  subjectAccuracy?: number | null; // % (0 a 100)
  responseTimeMs?: number | null;
  currentDate?: Date;
}

export interface NextReviewResult {
  interval: number; // Próximo intervalo em dias
  stability: number; // Nova estabilidade de memória em dias
  difficulty: number; // Nova dificuldade (1.0 a 10.0)
  repetitions: number; // Número de repetições bem-sucedidas consecutivas
  lapses: number; // Contador de falhas
  easeFactor: number; // Proxy de facilidade SM-2
  nextReviewDate: Date; // Data/hora prevista para a próxima revisão
  gradeUsed: ReviewGrade; // Nota normalizada (1..4)
  subjectRetentionFactor: number; // Multiplicador de matéria aplicado (1.0 ou 0.8)
  isSubjectCriticalDeficit: boolean; // Flag indicando se a matéria está com déficit < 65%
}

// Mantido para compatibilidade com chamadas legadas
export interface SpacedRepetitionOptions {
  rating: EvaluationRating | ReviewGrade | number | string;
  responseTimeMs?: number | null;
  subjectAccuracy?: number | null;
  currentDate?: Date;
}

export interface SpacedRepetitionResult {
  nextInterval: number;
  nextEaseFactor: number;
  nextStability: number;
  nextDifficulty: number;
  nextRepetitions: number;
  nextLapses: number;
  nextReviewDate: Date;
  ratingUsed: EvaluationRating;
  subjectRetentionFactor: number;
  isSubjectCriticalDeficit: boolean;
}

/**
 * Retorna valores padrão seguros para cards novos ou sem histórico registrado.
 */
export function getDefaultCardState(): CardStateDefaults {
  return {
    stability: SRS_CONFIG.DEFAULT_STABILITY,
    difficulty: SRS_CONFIG.DEFAULT_DIFFICULTY,
    easeFactor: SRS_CONFIG.DEFAULT_EASE_FACTOR,
    interval: 1,
    repetitions: 0,
    lapses: 0,
  };
}

/**
 * Normaliza qualquer formato de entrada (números de 0 a 5, strings ou enums)
 * para a escala de 4 níveis do FSRS (1 = Again, 2 = Hard, 3 = Good, 4 = Easy).
 */
export function normalizeGrade(input: ReviewGrade | EvaluationRating | number | string): ReviewGrade {
  if (typeof input === "number") {
    if (input <= 1) return 1; // Again / Errei
    if (input === 2) return 2; // Hard / Difícil
    if (input === 3) return 3; // Good / Bom
    return 4; // Easy / Fácil (4 ou 5)
  }

  const normalized = String(input).trim().toLowerCase();
  switch (normalized) {
    case "1":
    case "again":
    case "errei":
    case "erro":
    case "errado":
    case "0":
      return 1;

    case "2":
    case "hard":
    case "dificil":
    case "difícil":
      return 2;

    case "3":
    case "good":
    case "bom":
    case "regular":
    case "correto":
      return 3;

    case "4":
    case "5":
    case "easy":
    case "facil":
    case "fácil":
    case "ótimo":
    case "otimo":
      return 4;

    default:
      return 3;
  }
}

export const normalizeRating = (
  input: EvaluationRating | ReviewGrade | number | string
): EvaluationRating => {
  return normalizeGrade(input) as EvaluationRating;
};

/**
 * Função central do motor de repetição espaçada FSRS / SM-2 calibrado.
 *
 * Implementa as regras estritas da especificação:
 * - Grade 1 (Again):
 *     stability = max(0.5, stability * 0.3)
 *     interval = 1 dia
 *     difficulty = min(10, difficulty + 1.2)
 *     repetitions = 0
 * - Grade 2 (Hard):
 *     interval cresce com freio multiplicador (~1.2x a 1.3x do anterior)
 *     difficulty = min(10, difficulty + 0.5)
 *     repetitions = repetitions + 1
 * - Grade 3 (Good):
 *     novoIntervalo = stability * (1 + fatorDeCrescimento)
 *     difficulty se estabiliza
 *     repetitions = repetitions + 1
 * - Grade 4 (Easy):
 *     bônus de facilidade (stability * 1.5), intervalo expandido
 *     difficulty = max(1, difficulty - 0.8)
 *     repetitions = repetitions + 1
 * - Proteção por Déficit de Disciplina:
 *     Se subjectAccuracy < 65%, aplica multiplicador de proteção de 0.8x no intervalo resultante.
 */
export function calculateNextReview(input: CalculateNextReviewInput): NextReviewResult {
  const grade = normalizeGrade(input.grade);
  const now = input.currentDate ? new Date(input.currentDate) : new Date();

  // 1. Fallback com valores padrão seguros para cards novos ou legados
  const safeDefaults = getDefaultCardState();
  const repetitions: number =
    typeof input.repetitions === "number" && !isNaN(input.repetitions) && input.repetitions >= 0
      ? input.repetitions
      : safeDefaults.repetitions;

  const previousInterval: number =
    typeof input.previousInterval === "number" && !isNaN(input.previousInterval) && input.previousInterval > 0
      ? input.previousInterval
      : safeDefaults.interval;

  const stability: number =
    typeof input.stability === "number" && !isNaN(input.stability) && input.stability > 0
      ? input.stability
      : safeDefaults.stability;

  const difficulty: number =
    typeof input.difficulty === "number" && !isNaN(input.difficulty) && input.difficulty >= SRS_CONFIG.MIN_DIFFICULTY
      ? Math.min(SRS_CONFIG.MAX_DIFFICULTY, input.difficulty)
      : safeDefaults.difficulty;

  // 2. Avaliação de proteção por déficit de disciplina (< 65%)
  const hasSubjectAccuracy =
    input.subjectAccuracy !== null &&
    input.subjectAccuracy !== undefined &&
    !isNaN(input.subjectAccuracy);

  const isSubjectCriticalDeficit =
    hasSubjectAccuracy && input.subjectAccuracy! < SRS_CONFIG.CRITICAL_SUBJECT_ACCURACY_THRESHOLD;

  const subjectRetentionFactor = isSubjectCriticalDeficit
    ? SRS_CONFIG.CRITICAL_RETENTION_PENALTY
    : 1.0;

  // Ajuste sutil por tempo de resposta cognitivo (> 20s indica atrito)
  let latencyPenalty = 0;
  if (input.responseTimeMs && input.responseTimeMs > 20000 && grade !== 1) {
    latencyPenalty = 0.2;
  }

  let nextInterval: number;
  let nextStability: number;
  let nextDifficulty: number;
  let nextRepetitions: number;
  let nextLapses = 0;
  let nextEaseFactor = safeDefaults.easeFactor;

  switch (grade) {
    case 1: {
      // Grade 1 (Again / Errei):
      // Reset parcial ou total de estabilidade (max(0.5, stability * 0.3))
      // Intervalo recua para 1 dia
      // Dificuldade sobe (+1.2)
      nextStability = Math.max(SRS_CONFIG.MIN_STABILITY, Number((stability * 0.3).toFixed(2)));
      nextDifficulty = Math.min(SRS_CONFIG.MAX_DIFFICULTY, Number((difficulty + 1.2).toFixed(2)));
      nextInterval = 1;
      nextRepetitions = 0;
      nextLapses = 1;
      nextEaseFactor = Math.max(SRS_CONFIG.MIN_EASE_FACTOR, Number((safeDefaults.easeFactor - 0.2).toFixed(2)));
      break;
    }

    case 2: {
      // Grade 2 (Hard / Difícil):
      // Intervalo cresce com freio multiplicador (~1.2x a 1.3x do anterior)
      // Dificuldade sobe (+0.5)
      nextDifficulty = Math.min(
        SRS_CONFIG.MAX_DIFFICULTY,
        Number((difficulty + 0.5 + latencyPenalty).toFixed(2))
      );
      // Estabilidade cresce moderadamente
      nextStability = Math.max(
        0.8,
        Number((stability * (1.1 + (10 - nextDifficulty) * 0.04)).toFixed(2))
      );
      // Multiplicador de freio: 1.25x sobre o intervalo anterior
      const hardMultiplier = 1.25;
      const baseHardInterval = Math.max(
        1,
        Math.round(Math.max(previousInterval, 1) * hardMultiplier)
      );
      // Se for primeira repetição, estabelece 2 dias de intervalo
      nextInterval = repetitions === 0 ? 2 : Math.max(previousInterval + 1, baseHardInterval);
      nextRepetitions = repetitions + 1;
      nextEaseFactor = Math.max(SRS_CONFIG.MIN_EASE_FACTOR, Number((safeDefaults.easeFactor - 0.15).toFixed(2)));
      break;
    }

    case 3: {
      // Grade 3 (Good / Bom):
      // Progressão regular calculada como novoIntervalo = stability * (1 + fatorDeCrescimento)
      // Dificuldade se estabiliza (leve ajuste fino)
      nextDifficulty = Math.max(
        SRS_CONFIG.MIN_DIFFICULTY,
        Number((difficulty - 0.05 + latencyPenalty).toFixed(2))
      );
      // Fator de crescimento derivado da facilidade/dificuldade atual
      const growthFactor = Math.max(0.3, Number(((11 - nextDifficulty) * 0.25).toFixed(2)));
      // Estabilidade se expande
      nextStability = Math.max(
        1.2,
        Number((stability * (1.25 + (10 - nextDifficulty) * 0.08)).toFixed(2))
      );

      if (repetitions === 0) {
        // Primeiro acerto regular estabelece base de ~3 dias
        nextInterval = Math.max(2, Math.round(nextStability * (1 + growthFactor)));
      } else {
        const calculatedInterval = Math.round(nextStability * (1 + growthFactor));
        nextInterval = Math.max(previousInterval + 1, calculatedInterval);
      }

      nextRepetitions = repetitions + 1;
      nextEaseFactor = Number(safeDefaults.easeFactor.toFixed(2));
      break;
    }

    case 4: {
      // Grade 4 (Easy / Fácil):
      // Bônus de facilidade (stability * 1.5)
      // Intervalo expandido
      // Dificuldade reduz (max(1, difficulty - 0.8))
      nextDifficulty = Math.max(
        SRS_CONFIG.MIN_DIFFICULTY,
        Number((difficulty - 0.8).toFixed(2))
      );
      // Estabilidade com bônus direto de 1.5x além da taxa de expansão
      nextStability = Math.max(
        2.0,
        Number((stability * 1.5 * (1.1 + (10 - nextDifficulty) * 0.05)).toFixed(2))
      );
      const easyGrowthFactor = Math.max(0.6, Number(((12 - nextDifficulty) * 0.35).toFixed(2)));

      if (repetitions === 0) {
        // Primeiro acerto como Fácil pula para ~6 a 7 dias
        nextInterval = Math.max(5, Math.round(nextStability * (1 + easyGrowthFactor)));
      } else {
        const calculatedInterval = Math.round(nextStability * (1 + easyGrowthFactor));
        nextInterval = Math.max(previousInterval + 3, calculatedInterval);
      }

      nextRepetitions = repetitions + 1;
      nextEaseFactor = Math.min(SRS_CONFIG.MAX_EASE_FACTOR, Number((safeDefaults.easeFactor + 0.15).toFixed(2)));
      break;
    }
  }

  // 3. Aplicação do Multiplicador de Proteção por Déficit de Matéria (< 65%)
  // Para notas >= 2, reduz o intervalo em 20% (0.8x) para forçar consolidação
  if (isSubjectCriticalDeficit && grade > 1) {
    nextInterval = Math.max(1, Math.round(nextInterval * subjectRetentionFactor));
    nextStability = Math.max(SRS_CONFIG.MIN_STABILITY, Number((nextStability * subjectRetentionFactor).toFixed(2)));
  }

  // 4. Data da próxima revisão baseada no intervalo em dias
  const nextReviewDate = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

  return {
    interval: nextInterval,
    stability: nextStability,
    difficulty: nextDifficulty,
    repetitions: nextRepetitions,
    lapses: nextLapses,
    easeFactor: nextEaseFactor,
    nextReviewDate,
    gradeUsed: grade,
    subjectRetentionFactor,
    isSubjectCriticalDeficit,
  };
}

/**
 * Helper para prever os próximos 4 intervalos na UI de estudo antes do aluno responder.
 * Retorna uma projeção legível (ex: "1d", "3d", "6d", "12d") para cada nota (1 a 4).
 */
export function predictNextIntervals(
  state: SpacedRepetitionCardState,
  subjectAccuracy?: number | null
): Record<ReviewGrade, { interval: number; label: string }> {
  const safe = getDefaultCardState();
  const repetitions: number =
    typeof state.repetitions === "number" && !isNaN(state.repetitions)
      ? state.repetitions
      : safe.repetitions;

  const previousInterval: number =
    typeof state.interval === "number" && !isNaN(state.interval) && state.interval > 0
      ? state.interval
      : safe.interval;

  const stability: number =
    typeof state.stability === "number" && !isNaN(state.stability) && state.stability > 0
      ? state.stability
      : safe.stability;

  const difficulty: number =
    typeof state.difficulty === "number" && !isNaN(state.difficulty) && state.difficulty >= 1
      ? state.difficulty
      : safe.difficulty;

  const grades: ReviewGrade[] = [1, 2, 3, 4];
  const predictions = {} as Record<ReviewGrade, { interval: number; label: string }>;

  for (const g of grades) {
    const res = calculateNextReview({
      grade: g,
      repetitions,
      previousInterval,
      stability,
      difficulty,
      subjectAccuracy,
    });

    let label = `${res.interval}d`;
    if (res.interval >= 30) {
      const months = Number((res.interval / 30).toFixed(1));
      label = `${months}m`;
    }

    predictions[g] = {
      interval: res.interval,
      label,
    };
  }

  return predictions;
}

/**
 * Função de retrocompatibilidade para chamadas legadas que utilizavam calculateSpacedRepetition.
 */
export function calculateSpacedRepetition(
  state: SpacedRepetitionCardState,
  options: SpacedRepetitionOptions
): SpacedRepetitionResult {
  const grade = normalizeGrade(options.rating);
  const safe = getDefaultCardState();

  const repetitions: number =
    typeof state.repetitions === "number" && !isNaN(state.repetitions)
      ? state.repetitions
      : safe.repetitions;

  const interval: number =
    typeof state.interval === "number" && !isNaN(state.interval) && state.interval > 0
      ? state.interval
      : safe.interval;

  const stability: number =
    typeof state.stability === "number" && !isNaN(state.stability) && state.stability > 0
      ? state.stability
      : safe.stability;

  const difficulty: number =
    typeof state.difficulty === "number" && !isNaN(state.difficulty) && state.difficulty >= 1
      ? state.difficulty
      : safe.difficulty;

  const lapses: number =
    typeof state.lapses === "number" && !isNaN(state.lapses)
      ? state.lapses
      : safe.lapses;

  const result = calculateNextReview({
    grade,
    repetitions,
    previousInterval: interval,
    stability,
    difficulty,
    subjectAccuracy: options.subjectAccuracy,
    responseTimeMs: options.responseTimeMs,
    currentDate: options.currentDate,
  });

  return {
    nextInterval: result.interval,
    nextEaseFactor: result.easeFactor,
    nextStability: result.stability,
    nextDifficulty: result.difficulty,
    nextRepetitions: result.repetitions,
    nextLapses: grade === 1 ? lapses + 1 : lapses,
    nextReviewDate: result.nextReviewDate,
    ratingUsed: grade as unknown as EvaluationRating,
    subjectRetentionFactor: result.subjectRetentionFactor,
    isSubjectCriticalDeficit: result.isSubjectCriticalDeficit,
  };
}

/**
 * Calcula o fator de atenuação da matéria (mantido para retrocompatibilidade)
 */
export function calculateSubjectRetentionFactor(subjectAccuracy?: number | null): {
  factor: number;
  isCritical: boolean;
} {
  if (subjectAccuracy === null || subjectAccuracy === undefined || isNaN(subjectAccuracy)) {
    return { factor: 1.0, isCritical: false };
  }

  const isCritical = subjectAccuracy < SRS_CONFIG.CRITICAL_SUBJECT_ACCURACY_THRESHOLD;
  return {
    factor: isCritical ? SRS_CONFIG.CRITICAL_RETENTION_PENALTY : 1.0,
    isCritical,
  };
}
