import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/achievements";

export function calculateLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  return Math.floor((xp - 1000) / 500) + 5;
}

export async function getUserAchievementsProgress(userId: string) {
  try {
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    const reviewCount = await prisma.reviewHistory.count({
      where: {
        topic: {
          subject: {
            userId,
          },
        },
      },
    });

    const quizCount = await prisma.quizAttempt.count({
      where: { userId },
    });

    const currentStreak = userStats?.streakDays ?? 0;
    const totalXp = userStats?.totalXp ?? 0;
    const currentLevel = calculateLevel(totalXp);

    // Converte a string salva no banco em uma lista de IDs resgatados
    const claimedIds = userStats?.claimedAchievements
      ? userStats.claimedAchievements.split(",").map((id) => id.trim())
      : [];

    const progressList = ACHIEVEMENTS.map((badge) => {
      let currentValue = 0;

      if (
        badge.id === "level_5" ||
        badge.id.startsWith("level_") ||
        badge.category === "MASTERY"
      ) {
        currentValue = currentLevel;
      } else if (badge.id === "xp_rookie" || badge.category === "XP") {
        currentValue = totalXp;
      } else if (badge.category === "STREAK") {
        currentValue = currentStreak;
      } else if (badge.category === "REVIEWS") {
        currentValue = reviewCount;
      } else if (badge.id.includes("quiz") || badge.id.includes("simulado")) {
        currentValue = quizCount;
      }

      const isUnlocked = currentValue >= badge.targetValue;
      const isClaimed = claimedIds.includes(badge.id);

      return {
        achievementId: badge.id,
        currentValue: Math.min(currentValue, badge.targetValue),
        isUnlocked,
        isClaimed,
        unlockedAt: isUnlocked ? new Date().toISOString() : undefined,
      };
    });

    return progressList;
  } catch (error) {
    console.error("Erro ao calcular progresso de conquistas:", error);
    return [];
  }
}
