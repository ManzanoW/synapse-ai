"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordStudyActivityAction } from "./gamification-actions";

export interface FinishFocusSessionInput {
  durationMinutes: number;
  subjectId?: string;
  tasksCompleted?: string[];
  notes?: string;
  isFullPomodoroCycle?: boolean;
}

export interface FinishFocusSessionResult {
  xpGained: number;
  totalXp: number;
  streakDays: number;
  streakProtected: boolean;
  durationMinutes: number;
  completedAt: string;
}

export interface FocusMetricsData {
  todayMinutes: number;
  todayCycles: number;
  weeklyMinutes: number;
  currentStreak: number;
  streakFreezes: number;
}

/**
 * Registra a conclusão de uma sessão de foco / Pomodoro,
 * calculando XP e alimentando atomicamente streaks e sessões de estudo.
 */
export async function finishFocusSessionAction(
  input: FinishFocusSessionInput,
): Promise<{ success: boolean; data?: FinishFocusSessionResult; error?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Não autorizado" };
    }

    const duration = Math.max(1, Math.round(input.durationMinutes));

    // Regra de XP: 2 XP por minuto de foco + 25 XP de bônus por ciclo Pomodoro completo (>= 25 min)
    let xpGained = duration * 2;
    if (input.isFullPomodoroCycle || duration >= 25) {
      xpGained += 25;
    }

    // Bônus adicional por tarefas concluídas no checklist (5 XP cada)
    const taskBonus = (input.tasksCompleted?.length ?? 0) * 5;
    xpGained += taskBonus;

    // Conecta com o motor unificado de gamificação
    const recordResult = await recordStudyActivityAction(
      userId,
      xpGained,
      "POMODORO",
      duration,
    );

    return {
      success: true,
      data: {
        xpGained,
        totalXp: recordResult.data?.totalXp ?? xpGained,
        streakDays: recordResult.data?.streakDays ?? 1,
        streakProtected: recordResult.data?.streakProtected ?? false,
        durationMinutes: duration,
        completedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("❌ [finishFocusSessionAction] Erro ao concluir sessão de foco:", error);
    return {
      success: false,
      error: "Falha ao registrar sessão de estudo no servidor.",
    };
  }
}

/**
 * Recupera as métricas de foco e pomodoro do estudante para alimentar o cockpit
 */
export async function getFocusMetricsAction(
  userId: string,
): Promise<{ success: boolean; data?: FocusMetricsData; error?: string }> {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Início da semana (Segunda-feira)
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);

    const [todaySessions, weekSessions, userStats] = await Promise.all([
      prisma.studySession.findMany({
        where: {
          userId,
          date: { gte: startOfToday },
        },
        select: {
          durationMinutes: true,
          notes: true,
        },
      }),
      prisma.studySession.findMany({
        where: {
          userId,
          date: { gte: startOfWeek },
        },
        select: {
          durationMinutes: true,
        },
      }),
      prisma.userStats.findUnique({
        where: { userId },
        select: {
          streakDays: true,
          streakFreezes: true,
        },
      }),
    ]);

    const todayMinutes = todaySessions.reduce(
      (acc, s) => acc + (s.durationMinutes || 0),
      0,
    );
    const weeklyMinutes = weekSessions.reduce(
      (acc, s) => acc + (s.durationMinutes || 0),
      0,
    );

    // Ciclos pomodoro completados hoje (sessões com mais de 20min ou marcadas como pomodoro)
    const todayCycles = todaySessions.filter(
      (s) => (s.durationMinutes || 0) >= 20 || (s.notes && s.notes.includes("POMODORO")),
    ).length;

    return {
      success: true,
      data: {
        todayMinutes,
        todayCycles,
        weeklyMinutes,
        currentStreak: userStats?.streakDays ?? 0,
        streakFreezes: userStats?.streakFreezes ?? 0,
      },
    };
  } catch (error) {
    console.error("❌ [getFocusMetricsAction] Erro ao obter métricas de foco:", error);
    return {
      success: false,
      error: "Falha ao carregar métricas de foco.",
    };
  }
}
