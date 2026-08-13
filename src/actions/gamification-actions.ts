"use server";

import { revalidateTag } from "next/cache";
import {
  getCachedUserStats,
  getCachedAchievementsProgress,
} from "@/lib/cache-service";
import { calculateLevel } from "@/lib/gamification";

export async function getUserStatsAction(userId: string) {
  try {
    const userStats = await getCachedUserStats(userId);

    const totalXp = userStats?.totalXp ?? 0;
    const levelInfo = calculateLevel(totalXp);
    const currentStreak = userStats?.streakDays ?? 0;

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
          currentLevelXp: levelInfo.currentXp,
          nextLevelXp: levelInfo.nextLevelXp,
          progressPercentage: levelInfo.progressPercentage,
          title: levelInfo.title,
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
 * Invalida o cache do usuário após ações de ganho de XP ou finalização de estudo
 */
export async function invalidateUserCacheAction(userId: string) {
  try {
    // Passamos o perfil 'default' ou forçamos a chamada sem o segundo argumento usando tipagem se necessário
    (revalidateTag as (tag: string) => void)(`user-stats-${userId}`);
    (revalidateTag as (tag: string) => void)(`user-achievements-${userId}`);
    return { success: true };
  } catch (err) {
    console.error("Erro ao revalidar cache:", err);
    return { success: false, error: "Falha ao revalidar cache." };
  }
}
