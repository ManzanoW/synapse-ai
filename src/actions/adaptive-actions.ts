"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateAdaptiveRebalance } from "@/lib/adaptive-rebalancer";
import {
  RebalanceParams,
  AdaptiveAdjustment,
  SubjectPerformance,
} from "@/types/adaptive";
import { revalidateTag, revalidatePath } from "next/cache";

export interface RebalanceActionResult {
  success: boolean;
  data?: AdaptiveAdjustment[];
  error?: string;
}

/**
 * Rebalanceamento manual ou com parâmetros externos
 */
export async function rebalanceScheduleAction(
  params: RebalanceParams,
  userIdParam?: string,
): Promise<RebalanceActionResult> {
  try {
    const session = await auth();
    const userId = userIdParam || session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: "Usuário não autenticado.",
      };
    }

    // 1. Atualiza metas de estudo se fornecidas
    if (
      params.weeklyGoalHours ||
      params.activeDaysPerWeek ||
      params.studyMode
    ) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(params.weeklyGoalHours && {
            weeklyGoalHours: params.weeklyGoalHours,
          }),
          ...(params.activeDaysPerWeek && {
            activeDaysPerWeek: params.activeDaysPerWeek,
          }),
          ...(params.studyMode && { studyMode: params.studyMode }),
        },
      });
    }

    // 2. Executa a inteligência de rebalanceamento
    let adjustments: AdaptiveAdjustment[] = [];

    if (params.performances && params.performances.length > 0) {
      adjustments = calculateAdaptiveRebalance(params);

      for (const adj of adjustments) {
        if (adj.subjectId) {
          const targetMinutes =
            adj.targetWeeklyMinutes ??
            adj.adjustedWeeklyMinutes ??
            adj.adjustedMinutes ??
            120;

          await prisma.subject.updateMany({
            where: { id: adj.subjectId, userId },
            data: {
              priority: Number(targetMinutes),
            },
          });
        }
      }
    }

    // 3. Revalida caches
    try {
      (revalidateTag as (tag: string) => void)(`user-schedule-${userId}`);
      revalidatePath("/week");
      revalidatePath("/performance");
      revalidatePath("/dashboard");
    } catch {
      // Ignora erro fora de contexto HTTP
    }

    return {
      success: true,
      data: adjustments,
    };
  } catch (err) {
    console.error("Erro em rebalanceScheduleAction:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao recalcular o rebalanceamento adaptativo.",
    };
  }
}

/**
 * Rebalanceamento Preditivo Automático:
 * Analisa as tentativas reais (QuizAttempts) no banco de dados e recalibra a semana
 */
export async function autoRebalanceFromPerformanceAction(
  userIdParam?: string,
): Promise<RebalanceActionResult> {
  try {
    const session = await auth();
    const userId = userIdParam || session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: "Usuário não autenticado.",
      };
    }

    // 1. Busca usuário, metas e matérias com histórico de quizzes
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subjects: {
          include: {
            topics: {
              include: {
                quizAttempts: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.subjects.length) {
      return {
        success: false,
        error: "Nenhuma matéria cadastrada para análise preditiva.",
      };
    }

    const totalWeeklyHours = user.weeklyGoalHours || 10;
    const totalWeeklyMinutes = totalWeeklyHours * 60;
    const totalPriority = user.subjects.reduce(
      (acc, s) => acc + (s.priority || 1),
      0,
    );

    // 2. Monta o vetor de SubjectPerformance com base nos QuizAttempts
    const performances: SubjectPerformance[] = user.subjects.map((subject) => {
      let totalQuestions = 0;
      let totalCorrect = 0;
      let latestQuizDate = subject.updatedAt;

      subject.topics.forEach((topic) => {
        topic.quizAttempts.forEach((attempt) => {
          totalQuestions += attempt.totalCount;
          totalCorrect += attempt.correctCount;
          if (attempt.completedAt > latestQuizDate) {
            latestQuizDate = attempt.completedAt;
          }
        });
      });

      const accuracyPercentage =
        totalQuestions > 0
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : 70; // 70% neutro se ainda não tiver questões resolvidas

      const targetWeeklyMinutes = Math.round(
        (totalWeeklyMinutes * (subject.priority || 1)) /
          Math.max(1, totalPriority),
      );

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        accuracyPercentage,
        totalQuestionsSolved: totalQuestions,
        lastStudiedAt: latestQuizDate,
        targetWeeklyMinutes,
      };
    });

    // 3. Executa o algoritmo adaptativo
    const rebalanceParams: RebalanceParams = {
      studyMode: (user.studyMode as "WEEKLY" | "CYCLE") || "WEEKLY",
      weeklyGoalHours: totalWeeklyHours,
      activeDaysPerWeek: user.activeDaysPerWeek || 5,
      daysMissedThisWeek: 0,
      performances,
    };

    const adjustments = calculateAdaptiveRebalance(rebalanceParams);

    // 4. Grava os novos tempos calibrados no banco
    for (const adj of adjustments) {
      if (adj.subjectId) {
        const newMinutes = adj.adjustedMinutes;
        await prisma.subject.updateMany({
          where: { id: adj.subjectId, userId },
          data: {
            priority: Number(newMinutes),
          },
        });
      }
    }

    // 5. Revalida caches
    try {
      (revalidateTag as (tag: string) => void)(`user-schedule-${userId}`);
      revalidatePath("/week");
      revalidatePath("/performance");
      revalidatePath("/dashboard");
    } catch {
      // Ignora erro fora de contexto HTTP
    }

    return {
      success: true,
      data: adjustments,
    };
  } catch (err) {
    console.error("Erro em autoRebalanceFromPerformanceAction:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao executar rebalanceamento preditivo automático.",
    };
  }
}

export interface RebalanceAlertStatus {
  needsRebalance: boolean;
  criticalSubjects: {
    id: string;
    name: string;
    accuracy: number;
    totalQuestions: number;
  }[];
}

/**
 * Consulta se o usuário possui matérias com acurácia crítica (< 65%)
 * para sugerir rebalanceamento preventivo
 */
export async function checkRebalanceNeedsAction(): Promise<{
  success: boolean;
  data?: RebalanceAlertStatus;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        topics: {
          include: {
            quizAttempts: true,
          },
        },
      },
    });

    const criticalList: RebalanceAlertStatus["criticalSubjects"] = [];

    for (const subject of subjects) {
      let total = 0;
      let correct = 0;

      subject.topics.forEach((t) => {
        t.quizAttempts.forEach((a) => {
          total += a.totalCount;
          correct += a.correctCount;
        });
      });

      if (total >= 5) {
        const accuracy = Math.round((correct / total) * 100);
        if (accuracy < 65) {
          criticalList.push({
            id: subject.id,
            name: subject.name,
            accuracy,
            totalQuestions: total,
          });
        }
      }
    }

    return {
      success: true,
      data: {
        needsRebalance: criticalList.length > 0,
        criticalSubjects: criticalList,
      },
    };
  } catch (err) {
    console.error("Erro em checkRebalanceNeedsAction:", err);
    return { success: false, error: "Falha ao verificar rebalanceamento." };
  }
}
