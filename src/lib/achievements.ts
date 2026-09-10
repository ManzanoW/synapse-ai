export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  category: "STREAK" | "REVIEWS" | "XP" | "MASTERY" | "SIMULADO" | "ADAPTIVE";
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
  // 🎯 NOVAS CONQUISTAS INTEGRADAS
  {
    id: "quiz_sharpshooter",
    title: "Tiro Certeiro",
    description: "Conclua pelo menos 5 simulados com diagnóstico taxonômico.",
    icon: "🎯",
    xpReward: 200,
    category: "SIMULADO",
    targetValue: 5,
  },
  {
    id: "adaptive_pioneer",
    title: "Estrategista Adaptativo",
    description:
      "Aplique a calibragem preditiva sugerida pela IA para corrigir defasagens.",
    icon: "🔮",
    xpReward: 150,
    category: "ADAPTIVE",
    targetValue: 1,
  },
  {
    id: "quest_master_10",
    title: "Senhor das Missões",
    description: "Complete e resgate as recompensas de 10 missões diárias.",
    icon: "⚔️",
    xpReward: 350,
    category: "MASTERY",
    targetValue: 10,
  },
];
