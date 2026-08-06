export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  category: "STREAK" | "REVIEWS" | "XP" | "MASTERY";
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_step",
    title: "Primeiro Passo",
    description: "Concluiu a primeira sessão de revisão.",
    icon: "🌱",
    category: "REVIEWS",
  },
  {
    id: "fire_starter",
    title: "Chama Inicial",
    description: "Manteve um streak de 3 dias consecutivos.",
    icon: "🔥",
    category: "STREAK",
  },
  {
    id: "card_master",
    title: "Mestre dos Cards",
    description: "Completou 100 revisões ativas no sistema.",
    icon: "🎴",
    category: "REVIEWS",
  },
  {
    id: "xp_rookie",
    title: "Acumulador de Conhecimento",
    description: "Alcançou 1.000 XP total no Synapse AI.",
    icon: "⚡",
    category: "XP",
  },
];
