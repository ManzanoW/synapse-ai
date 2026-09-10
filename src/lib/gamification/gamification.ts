export interface LevelInfo {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progressPercentage: number; // 👈 Adicionado
  title: string;
}

// Configuração das patentes por nível
export const TITLES: Record<number, string> = {
  1: "Iniciante Consciente",
  3: "Aprendiz de Elite",
  5: "Mestre da Retenção",
  10: "Sábio da Memória",
  15: "Estrategista de Edital",
  20: "Especialista em Domínio",
  30: "Mestre da Neuroplasticidade",
  40: "Arquiteto do Conhecimento",
  50: "Lenda da Aprovação",
};

/**
 * Calcula o nível com base no XP acumulado (fórmula progressiva)
 */
export function calculateLevel(totalXp: number): LevelInfo {
  let level = 1;
  let xpForNext = 500;
  let accumulatedXp = 0;

  while (totalXp >= accumulatedXp + xpForNext) {
    accumulatedXp += xpForNext;
    level++;
    xpForNext = Math.floor(xpForNext * 1.25); // Cada nível exige 25% a mais de XP
  }

  const currentXp = totalXp - accumulatedXp;

  // 📐 Calcula a porcentagem do progresso do nível atual (0% a 100%)
  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round((currentXp / xpForNext) * 100)),
  );

  // Encontra o título correspondente ao nível atual
  const titleKeys = Object.keys(TITLES)
    .map(Number)
    .sort((a, b) => b - a);
  const titleKey = titleKeys.find((k) => level >= k) || 1;

  return {
    level,
    currentXp,
    nextLevelXp: xpForNext,
    progressPercentage,
    title: TITLES[titleKey],
  };
}

/**
 * Valores padrão de ganho de XP por ação no sistema
 */
export const XP_REWARDS = {
  REVIEW_EASY: 25, // Revisão classificada como "Fácil"
  REVIEW_HARD: 15, // Revisão "Difícil"
  REVIEW_AGAIN: 5, // Revisão "Errei"
  QUESTION_CORRECT: 20, // Questão/Quiz correto
  POMODORO_COMPLETE: 50, // Ciclo Pomodoro concluído
  STREAK_BONUS_MULTIPLIER: 0.1, // +10% de XP por dia de streak ativo
};

/**
 * Calcula o ganho de XP considerando a classificação e o streak ativo
 */
export function calculateEarnedXp(
  grade: string,
  streakDays: number = 0,
): number {
  let baseXp = XP_REWARDS.REVIEW_AGAIN;

  if (grade === "Bom" || grade === "Fácil") {
    baseXp = XP_REWARDS.REVIEW_EASY;
  } else if (grade === "Difícil") {
    baseXp = XP_REWARDS.REVIEW_HARD;
  }

  // Bônus de 10% por dia, limitado a um máximo de +50% (1.5x)
  const streakBonus = Math.min(
    streakDays * XP_REWARDS.STREAK_BONUS_MULTIPLIER,
    0.5,
  );
  const multiplier = 1 + streakBonus;

  return Math.round(baseXp * multiplier);
}
