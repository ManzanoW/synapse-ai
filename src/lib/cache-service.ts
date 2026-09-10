import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserAchievementsProgress } from "@/lib/achievements-engine";

/**
 * Cache para busca das estatísticas do usuário (XP, Nível, Streak)
 */
export const getCachedUserStats = (userId: string) =>
  unstable_cache(
    async () => {
      return await prisma.userStats.findUnique({
        where: { userId },
      });
    },
    [`user-stats-${userId}`],
    {
      tags: [`user-stats-${userId}`],
      revalidate: 300, // Revalida automaticamente a cada 5 minutos
    },
  )();

/**
 * Cache para o progresso de conquistas do usuário
 */
export const getCachedAchievementsProgress = (userId: string) =>
  unstable_cache(
    async () => {
      return await getUserAchievementsProgress(userId);
    },
    [`user-achievements-${userId}`],
    {
      tags: [`user-achievements-${userId}`],
      revalidate: 300,
    },
  )();
