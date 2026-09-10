export interface LevelInfo {
  level: number;
  prestige: number;
  title: string;
  currentLevelMinXp: number;
  nextLevelXp: number;
  progressPercentage: number;
  prestigeTier: {
    name: string;
    badgeColor: string;
    borderGlow: string;
    iconColor: string;
  };
}

export const PRESTIGE_TIERS = [
  {
    tier: 0,
    name: "Iniciado Neural",
    badgeColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    borderGlow: "shadow-[0_0_12px_rgba(99,102,241,0.3)]",
    iconColor: "text-indigo-400",
  },
  {
    tier: 1,
    name: "Cromado Sináptico",
    badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    borderGlow: "shadow-[0_0_15px_rgba(6,182,212,0.4)]",
    iconColor: "text-cyan-400",
  },
  {
    tier: 2,
    name: "Dourado Astral",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    borderGlow: "shadow-[0_0_18px_rgba(245,158,11,0.5)]",
    iconColor: "text-amber-400",
  },
  {
    tier: 3,
    name: "Lorde Obsidiana",
    badgeColor: "bg-purple-500/20 text-purple-200 border-purple-500/50",
    borderGlow: "shadow-[0_0_22px_rgba(168,85,247,0.6)]",
    iconColor: "text-purple-300",
  },
];

const LEVEL_TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 1, title: "Neófito dos Estudos" },
  { minLevel: 5, title: "Praticante de Flashcards" },
  { minLevel: 10, title: "Estrategista do Edital" },
  { minLevel: 15, title: "Mestre da Retenção SRS" },
  { minLevel: 25, title: "Arquiteto Sináptico" },
  { minLevel: 35, title: "Centurião dos Simulados" },
  { minLevel: 45, title: "Oráculo da Memória" },
  { minLevel: 50, title: "Entidade dos Concursos" },
];

/**
 * Retorna o XP total acumulado necessário para alcançar determinado nível.
 */
export function getRequiredXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(150 * Math.pow(level - 1, 1.45));
}

/**
 * Calcula os dados de nível, XP e prestígio a partir do XP Total
 */
export function calculateLevelData(
  totalXp: number,
  prestige: number = 0,
): LevelInfo {
  const MAX_LEVEL_PER_PRESTIGE = 50;
  let level = 1;

  while (
    getRequiredXpForLevel(level + 1) <= totalXp &&
    level < MAX_LEVEL_PER_PRESTIGE
  ) {
    level++;
  }

  const currentLevelMinXp = getRequiredXpForLevel(level);
  const nextLevelXp = getRequiredXpForLevel(level + 1);

  const xpEarnedInLevel = Math.max(0, totalXp - currentLevelMinXp);
  const xpNeededForNext = Math.max(1, nextLevelXp - currentLevelMinXp);

  const progressPercentage =
    level >= MAX_LEVEL_PER_PRESTIGE
      ? 100
      : Math.min(100, Math.round((xpEarnedInLevel / xpNeededForNext) * 100));

  // Determina o título
  let title = "Estudante Synapse";
  for (let i = LEVEL_TITLES.length - 1; i >= 0; i--) {
    if (level >= LEVEL_TITLES[i].minLevel) {
      title = LEVEL_TITLES[i].title;
      break;
    }
  }

  const tierIndex = Math.min(prestige, PRESTIGE_TIERS.length - 1);
  const prestigeTier = PRESTIGE_TIERS[tierIndex];

  return {
    level,
    prestige,
    title,
    currentLevelMinXp,
    nextLevelXp,
    progressPercentage,
    prestigeTier,
  };
}
