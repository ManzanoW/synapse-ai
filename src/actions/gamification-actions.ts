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
    const streakFreezes = (userStats as { streakFreezes?: number })?.streakFreezes ?? 0;

    const levelInfo = calculateLevelData(totalXp, prestige);

    // Início da semana atual (Segunda-feira 00:00:00)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, ... 6 = Sábado
    const diffToMonday = (dayOfWeek + 6) % 7; // Segunda vira 0, Terça vira 1, ..., Domingo vira 6
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklySessions = await prisma.studySession.findMany({
      where: {
        userId,
        date: { gte: startOfWeek },
      },
      select: { date: true },
    });

    const activeDaysSet = new Set<number>();
    weeklySessions.forEach((s) => {
      const sDay = new Date(s.date).getDay();
      const index = (sDay + 6) % 7; // 0 = Seg, 6 = Dom
      activeDaysSet.add(index);
    });

    // Se o usuário estudou hoje (lastStudyDate hoje), garante o dia de hoje ativo
    if (userStats?.lastStudyDate) {
      const lastDate = new Date(userStats.lastStudyDate);
      if (
        lastDate.getFullYear() === now.getFullYear() &&
        lastDate.getMonth() === now.getMonth() &&
        lastDate.getDate() === now.getDate()
      ) {
        activeDaysSet.add(diffToMonday);
      }
    }

    const dayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const weekDays = dayLabels.map((dayLabel, index) => ({
      dayLabel,
      active:
        activeDaysSet.has(index) ||
        (currentStreak > 0 && index === diffToMonday),
    }));

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
          streakFreezes,
        },
        streak: {
          currentDays: currentStreak,
          streakFreezes,
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

export interface RecordStudyActivityResult {
  success: boolean;
  error?: string;
  data?: {
    totalXp: number;
    earnedXp: number;
    streakDays: number;
    streakProtected: boolean;
    streakFreezes: number;
    levelInfo: ReturnType<typeof calculateLevelData>;
  };
}

/**
 * Motor centralizado de atividade de estudo, ganho de XP e cálculo de ofensiva com proteção Anti-Frustração (Streak Freeze)
 */
export async function recordStudyActivityAction(
  userId: string,
  earnedXp: number,
  activityType: "QUIZ" | "FLASHCARD" | "ERROR_FIX" | "POMODORO" | "FOCUS" = "QUIZ",
  durationMinutes: number = 1,
): Promise<RecordStudyActivityResult> {
  try {
    const now = new Date();
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();

    // 1. Busca estatísticas atuais do usuário
    let stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      stats = await prisma.userStats.create({
        data: {
          userId,
          totalXp: 0,
          streakDays: 0,
          streakFreezes: 0,
          prestige: 0,
        },
      });
    }

    let newStreak = stats.streakDays;
    let newFreezes = stats.streakFreezes ?? 0;
    let streakProtected = false;

    if (!stats.lastStudyDate) {
      // Primeiro estudo registrado na plataforma
      newStreak = 1;
    } else {
      const lastDate = new Date(stats.lastStudyDate);
      const lastMidnight = new Date(
        lastDate.getFullYear(),
        lastDate.getMonth(),
        lastDate.getDate(),
      ).getTime();
      const diffDays = Math.round(
        (todayMidnight - lastMidnight) / (24 * 60 * 60 * 1000),
      );

      if (diffDays <= 0) {
        // Já estudou hoje, mantém a sequência atual (mínimo 1)
        newStreak = Math.max(1, stats.streakDays);
      } else if (diffDays === 1) {
        // Dia consecutivo (ontem) -> incrementa ofensiva
        newStreak = stats.streakDays + 1;
      } else if (diffDays === 2) {
        // Perdeu exatamente 1 dia (anteontem) -> Mecânica Anti-Frustração via Streak Freeze
        if (newFreezes > 0) {
          newFreezes -= 1;
          newStreak = stats.streakDays + 1;
          streakProtected = true;
          console.log(
            `🛡️ [recordStudyActivityAction] Streak freeze consumido para salvar ofensiva do usuário ${userId}. Sequência preservada: ${newStreak} dias`,
          );
        } else {
          // Sem congelamentos: reinicia a sequência
          newStreak = 1;
        }
      } else {
        // Ausência prolongada (> 2 dias): reinicia a sequência
        newStreak = 1;
      }
    }

    // 2. Atualização atômica em transação com registro em StudySession
    const [updatedStats] = await prisma.$transaction([
      prisma.userStats.update({
        where: { userId },
        data: {
          totalXp: { increment: earnedXp },
          streakDays: newStreak,
          streakFreezes: newFreezes,
          lastStudyDate: now,
        },
      }),
      prisma.studySession.create({
        data: {
          userId,
          date: now,
          status: "COMPLETED",
          durationMinutes: Math.max(1, Math.round(durationMinutes)),
          notes: `ACTIVITY:${activityType}${streakProtected ? ":STREAK_PROTECTED" : ""}`,
        },
      }),
    ]);

    // 3. Invalida os caches do usuário
    await invalidateUserCacheAction(userId);

    const levelInfo = calculateLevelData(
      updatedStats.totalXp,
      updatedStats.prestige ?? 0,
    );

    return {
      success: true,
      data: {
        totalXp: updatedStats.totalXp,
        earnedXp,
        streakDays: updatedStats.streakDays,
        streakProtected,
        streakFreezes: updatedStats.streakFreezes,
        levelInfo,
      },
    };
  } catch (err) {
    console.error("[recordStudyActivityAction] Erro:", err);
    return {
      success: false,
      error: "Falha ao registrar atividade de estudo.",
    };
  }
}

