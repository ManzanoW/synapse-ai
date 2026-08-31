"use server";

import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getCachedUserStats,
  getCachedAchievementsProgress,
} from "@/lib/cache-service";
import { calculateLevelData } from "@/lib/gamification/levels";

export async function getUserStatsAction(userId: string) {
  try {
    const userStats = await getCachedUserStats(userId);

    const totalXp = userStats?.totalXp ?? 0;
    const prestige = (userStats as { prestige?: number })?.prestige ?? 0;
    const currentStreak = userStats?.streakDays ?? 0;

    const levelInfo = calculateLevelData(totalXp, prestige);

    const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(
      (dayLabel) => ({
        dayLabel,
        active: currentStreak > 0,
      }),
    );

    return {
      success: true,
      data: {
        gamification: {
          totalXp,
          level: levelInfo.level,
          currentLevelXp: levelInfo.currentLevelMinXp,
          nextLevelXp: levelInfo.nextLevelXp,
          progressPercentage: levelInfo.progressPercentage,
          title: levelInfo.title,
          prestige: levelInfo.prestige,
          prestigeTier: levelInfo.prestigeTier,
        },
        streak: {
          currentDays: currentStreak,
          weekDays,
        },
      },
    };
  } catch (err) {
    console.error("Erro em getUserStatsAction:", err);
    return {
      success: false,
      error: "Não foi possível carregar as estatísticas.",
    };
  }
}

export async function getAchievementsProgressAction(userId: string) {
  try {
    const data = await getCachedAchievementsProgress(userId);
    return { success: true, data };
  } catch (err) {
    console.error("Erro em getAchievementsProgressAction:", err);
    return {
      success: false,
      error: "Não foi possível carregar o progresso de conquistas.",
    };
  }
}

/**
 * Realiza a Ascensão de Prestígio (quando o usuário alcança o nível máximo 50)
 */
export async function claimPrestigeAction(userId: string) {
  try {
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!userStats) {
      return { success: false, error: "Usuário não encontrado." };
    }

    const currentPrestige = userStats.prestige ?? 0;
    const levelData = calculateLevelData(userStats.totalXp, currentPrestige);

    if (levelData.level < 50) {
      return {
        success: false,
        error: "Você precisa atingir o nível 50 para ascender de Prestígio.",
      };
    }

    const updated = await prisma.userStats.update({
      where: { userId },
      data: {
        prestige: { increment: 1 },
      },
    });

    await invalidateUserCacheAction(userId);

    const newLevelData = calculateLevelData(updated.totalXp, updated.prestige);

    return {
      success: true,
      data: {
        prestige: updated.prestige,
        prestigeTier: newLevelData.prestigeTier,
      },
    };
  } catch (err) {
    console.error("Erro em claimPrestigeAction:", err);
    return {
      success: false,
      error: "Falha ao processar ascensão de prestígio.",
    };
  }
}

/**
 * Invalida o cache do usuário após ações de ganho de XP ou finalização de estudo
 */
export async function invalidateUserCacheAction(userId: string) {
  try {
    (revalidateTag as (tag: string) => void)(`user-stats-${userId}`);
    (revalidateTag as (tag: string) => void)(`user-achievements-${userId}`);
    return { success: true };
  } catch (err) {
    console.error("Erro ao revalidar cache:", err);
    return { success: false, error: "Falha ao revalidar cache." };
  }
}
