import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, UserAchievementProgress } from "@/lib/achievements";

export async function getUserAchievementsProgress(userId: string) {
  // 1. Busca dados do usuário no banco
  const userStats = await prisma.userStats.findUnique({
    where: { userId },
  });

  const reviewCount = await prisma.reviewHistory.count({
    where: { topic: { subject: { userId } } },
  });

  const currentStreak = userStats?.streakDays ?? 0;
  const totalXp = userStats?.totalXp ?? 0;

  // 2. Mapeia cada conquista com o progresso real do usuário
  const progressList: UserAchievementProgress[] = ACHIEVEMENTS.map((badge) => {
    let currentValue = 0;

    switch (badge.category) {
      case "REVIEWS":
        currentValue = reviewCount;
        break;
      case "STREAK":
        currentValue = currentStreak;
        break;
      case "XP":
        currentValue = totalXp;
        break;
      case "MASTERY":
        if (badge.id.startsWith("level_")) {
          currentValue = Math.floor(totalXp / 1000) + 1;
        }
        break;
    }

    const isUnlocked = currentValue >= badge.targetValue;

    return {
      achievementId: badge.id,
      currentValue: Math.min(currentValue, badge.targetValue),
      isUnlocked,
      unlockedAt: isUnlocked ? userStats?.updatedAt?.toISOString() : undefined,
    };
  });

  return progressList;
}
