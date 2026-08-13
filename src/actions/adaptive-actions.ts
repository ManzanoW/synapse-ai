"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateAdaptiveRebalance } from "@/lib/adaptive-rebalancer";
import { RebalanceParams, AdaptiveAdjustment } from "@/types/adaptive";
import { revalidateTag, revalidatePath } from "next/cache";

export interface RebalanceActionResult {
  success: boolean;
  data?: AdaptiveAdjustment[];
  error?: string;
}

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

    // 1. Atualiza as metas gerais de estudo no usuário se fornecidas
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

    // 2. Executa a inteligência de rebalanceamento adaptativo se houver dados de performance
    let adjustments: AdaptiveAdjustment[] = [];

    if (params.performances && params.performances.length > 0) {
      adjustments = calculateAdaptiveRebalance(params);

      // Atualiza o tempo/prioridade das matérias rebalanceadas no banco
      for (const adj of adjustments) {
        if (adj.subjectId) {
          // Casting duplo para evitar o erro de sobreposição de tipos do TS
          const adjRecord = adj as unknown as Record<string, unknown>;
          const targetMinutes =
            adjRecord.targetWeeklyMinutes ??
            adjRecord.adjustedWeeklyMinutes ??
            adjRecord.suggestedMinutes ??
            adjRecord.targetMinutes ??
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

    // 3. Revalida o cache das rotas afetadas
    try {
      (revalidateTag as unknown as (tag: string) => void)(
        `user-schedule-${userId}`,
      );
      revalidatePath("/week");
      revalidatePath("/performance");
    } catch {
      // Ignora falhas de revalidação caso executado fora do contexto HTTP
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
