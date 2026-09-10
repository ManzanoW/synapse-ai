import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { calculateLevelData } from "@/lib/gamification/levels";

export async function getUserAchievementsProgress(userId: string) {
  try {
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    const [reviewCount, quizCount, claimedQuestsCount] = await Promise.all([
      prisma.reviewHistory.count({
        where: {
          topic: {
            subject: {
              userId,
            },
          },
        },
      }),
      prisma.quizAttempt.count({
        where: { userId },
      }),
      prisma.dailyQuest.count({
        where: { userId, claimed: true },
      }),
    ]);

    const currentStreak = userStats?.streakDays ?? 0;
    const totalXp = userStats?.totalXp ?? 0;
    const prestige = (userStats as { prestige?: number })?.prestige ?? 0;
    const levelInfo = calculateLevelData(totalXp, prestige);
    const currentLevel = levelInfo.level;

    // Converte a string salva no banco em uma lista de IDs resgatados
    const claimedIds = userStats?.claimedAchievements
      ? userStats.claimedAchievements.split(",").map((id) => id.trim())
      : [];

    const progressList = ACHIEVEMENTS.map((badge) => {
      let currentValue = 0;

      if (badge.id === "quest_master_10") {
        currentValue = claimedQuestsCount;
      } else if (
        badge.id === "adaptive_pioneer" ||
        badge.category === "ADAPTIVE"
      ) {
        // Marcado como desbloqueado se o evento 'adaptive_pioneer_unlocked' ou a badge já foi resgatada
        currentValue =
          claimedIds.includes("adaptive_pioneer_unlocked") ||
          claimedIds.includes(badge.id)
            ? 1
            : 0;
      } else if (
        badge.id === "quiz_sharpshooter" ||
        badge.category === "SIMULADO"
      ) {
        currentValue = quizCount;
      } else if (
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
