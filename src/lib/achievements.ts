export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  category: "STREAK" | "REVIEWS" | "XP" | "MASTERY";
  targetValue: number;
}

export interface UserAchievementProgress {
  achievementId: string;
  currentValue: number;
  isUnlocked: boolean;
  isClaimed?: boolean;
  unlockedAt?: string;
  claimedAt?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_step",
    title: "Primeiro Passo",
    description: "Concluiu a primeira sessão de revisão.",
    icon: "🌱",
    xpReward: 50,
    category: "REVIEWS",
    targetValue: 1,
  },
  {
    id: "fire_starter",
    title: "Chama Inicial",
    description: "Manteve um streak de 3 dias consecutivos.",
    icon: "🔥",
    xpReward: 100,
    category: "STREAK",
    targetValue: 3,
  },
  {
    id: "fire_master",
    title: "Inabalável",
    description: "Manteve um streak de 7 dias consecutivos.",
    icon: "⚡",
    xpReward: 250,
    category: "STREAK",
    targetValue: 7,
  },
  {
    id: "card_master",
    title: "Mestre dos Cards",
    description: "Completou 100 revisões ativas no sistema.",
    icon: "🎴",
    xpReward: 300,
    category: "REVIEWS",
    targetValue: 100,
  },
  {
    id: "xp_rookie",
    title: "Acumulador de Conhecimento",
    description: "Alcançou 1.000 XP total no Synapse AI.",
    icon: "🏆",
    xpReward: 150,
    category: "XP",
    targetValue: 1000,
  },
  {
    id: "level_5",
    title: "Mente Afiada",
    description: "Alcançou o Nível 5 de Synapse.",
    icon: "🚀",
    xpReward: 500,
    category: "MASTERY",
    targetValue: 5,
  },
];
