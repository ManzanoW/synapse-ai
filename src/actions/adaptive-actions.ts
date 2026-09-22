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
import { buildWeeklySchedule } from "@/lib/study-cycle";

export interface RebalanceComparisonItem {
  subjectId: string;
  subjectName: string;
  accuracyPercentage: number;
  previousWeeklyMinutes: number;
  newWeeklyMinutes: number;
  diffMinutes: number;
}

export interface RebalanceActionResult {
  success: boolean;
  data?: AdaptiveAdjustment[];
  comparison?: RebalanceComparisonItem[];
  totalWeeklyHours?: number;
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

      const userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: { weeklyGoalHours: true },
      });
      const totalWeeklyMinutes =
        (params.weeklyGoalHours || userRecord?.weeklyGoalHours || 10) * 60;
      const totalRawAdjusted = adjustments.reduce(
        (acc, a) =>
          acc + (a.adjustedMinutes || a.targetWeeklyMinutes || 1),
        0,
      );

      for (const adj of adjustments) {
        if (adj.subjectId) {
          const rawMinutes =
            adj.targetWeeklyMinutes ??
            adj.adjustedWeeklyMinutes ??
            adj.adjustedMinutes ??
            120;
          const normalizedMinutes = Math.max(
            15,
            Math.round(
              (totalWeeklyMinutes * rawMinutes) /
                Math.max(1, totalRawAdjusted),
            ),
          );

          await prisma.subject.updateMany({
            where: { id: adj.subjectId, userId },
            data: {
              priority: Number(normalizedMinutes),
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
 * Analisa as tentativas reais (QuizAttempts) no banco de dados,
 * recalibra a semana, gera o comparativo "Antes vs. Depois" e registra conquista
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
    const totalWeight = user.subjects.reduce(
      (acc: number, s: { weight?: number | null }) => acc + (s.weight || 5),
      0,
    );

    // 2. Monta o vetor de SubjectPerformance com base nos QuizAttempts e peso base do edital
    const performances: SubjectPerformance[] = user.subjects.map((subject: any) => {
      let totalQuestions = 0;
      let totalCorrect = 0;
      let latestQuizDate = subject.updatedAt;

      subject.topics.forEach((topic: any) => {
        topic.quizAttempts.forEach((attempt: any) => {
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
          : 70;

      // Base padrão do edital (distribuição ponderada pelo peso da matéria)
      const baseWeeklyMinutes = Math.round(
        (totalWeeklyMinutes * (subject.weight || 5)) /
          Math.max(1, totalWeight),
      );

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        accuracyPercentage,
        totalQuestionsSolved: totalQuestions,
        lastStudiedAt: latestQuizDate,
        targetWeeklyMinutes: baseWeeklyMinutes,
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

    // 4. Normaliza os novos minutos para que a soma bata EXATAMENTE com a meta semanal do usuário (ex: 600m = 10h)
    const totalRawAdjusted = adjustments.reduce(
      (acc, a) => acc + (a.adjustedMinutes || a.targetWeeklyMinutes || 1),
      0,
    );

    const comparison: RebalanceComparisonItem[] = [];

    for (const adj of adjustments) {
      if (adj.subjectId) {
        const rawNewMinutes = adj.adjustedMinutes;
        const normalizedNewMinutes = Math.max(
          15,
          Math.round(
            (totalWeeklyMinutes * rawNewMinutes) / Math.max(1, totalRawAdjusted),
          ),
        );
        const originalPerf = performances.find(
          (p) => p.subjectId === adj.subjectId,
        );
        const baseMinutes = originalPerf?.targetWeeklyMinutes ?? 60;
        const diff = normalizedNewMinutes - baseMinutes;

        comparison.push({
          subjectId: adj.subjectId,
          subjectName: adj.subjectName,
          accuracyPercentage: originalPerf?.accuracyPercentage ?? 70,
          previousWeeklyMinutes: baseMinutes,
          newWeeklyMinutes: normalizedNewMinutes,
          diffMinutes: diff,
        });

        await prisma.subject.updateMany({
          where: { id: adj.subjectId, userId },
          data: {
            priority: Number(normalizedNewMinutes),
          },
        });
      }
    }

    comparison.sort((a, b) => b.diffMinutes - a.diffMinutes);

    // 5. Registra o evento para desbloqueio da conquista "Estrategista Adaptativo"
    try {
      const userStats = await prisma.userStats.findUnique({
        where: { userId },
        select: { claimedAchievements: true },
      });

      const claimedList = (userStats?.claimedAchievements || "")
        .split(",")
        .map((id: string) => id.trim())
        .filter(Boolean);

      if (!claimedList.includes("adaptive_pioneer_unlocked")) {
        claimedList.push("adaptive_pioneer_unlocked");
        await prisma.userStats.upsert({
          where: { userId },
          update: { claimedAchievements: claimedList.join(",") },
          create: { userId, claimedAchievements: claimedList.join(",") },
        });
      }
    } catch (achieveErr) {
      console.warn(
        "Aviso ao registrar conquista de rebalanceamento:",
        achieveErr,
      );
    }

    // 6. Revalida caches
    try {
      (revalidateTag as (tag: string) => void)(`user-schedule-${userId}`);
      revalidatePath("/week");
      revalidatePath("/performance");
      revalidatePath("/dashboard");
      revalidatePath("/achievements");
    } catch {
      // Ignora erro fora de contexto HTTP
    }

    return {
      success: true,
      data: adjustments,
      comparison,
      totalWeeklyHours,
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { weeklyGoalHours: true },
    });

    const totalWeeklyHours = user?.weeklyGoalHours || 10;
    const totalWeeklyMinutes = totalWeeklyHours * 60;
    const totalWeight = subjects.reduce((acc, s) => acc + (s.weight || 5), 0);
    const totalPriority = subjects.reduce((acc, s) => acc + (s.priority || 1), 0);

    const criticalList: RebalanceAlertStatus["criticalSubjects"] = [];
    let unreinforcedCount = 0;

    for (const subject of subjects) {
      let total = 0;
      let correct = 0;

      subject.topics.forEach((t: any) => {
        t.quizAttempts.forEach((a: any) => {
          total += a.totalCount;
          correct += a.correctCount;
        });
      });

      if (total >= 3) {
        const accuracy = Math.round((correct / total) * 100);
        if (accuracy < 65) {
          criticalList.push({
            id: subject.id,
            name: subject.name,
            accuracy,
            totalQuestions: total,
          });

          const baseMinutes =
            (totalWeeklyMinutes * (subject.weight || 5)) / Math.max(1, totalWeight);
          const currentMinutes =
            (totalWeeklyMinutes * (subject.priority || 1)) /
            Math.max(1, totalPriority);
          const avgRatio = totalPriority / Math.max(1, totalWeight);
          const priorityRatio = (subject.priority || 1) / (subject.weight || 5);

          const isReinforced =
            currentMinutes >= baseMinutes * 1.03 || priorityRatio > avgRatio * 1.04;

          if (!isReinforced) {
            unreinforcedCount++;
          }
        }
      }
    }

    return {
      success: true,
      data: {
        // Só aciona o banner de alerta se houver disciplinas críticas que ainda não receberam a calibração
        needsRebalance: unreinforcedCount > 0,
        criticalSubjects: criticalList,
      },
    };
  } catch (err) {
    console.error("Erro em checkRebalanceNeedsAction:", err);
    return { success: false, error: "Falha ao verificar rebalanceamento." };
  }
}

export type EmergencyScenario =
  | "MISSED_TODAY"
  | "SURVIVAL_MICRO"
  | "REDUCE_LOAD"
  | "CORE_FOCUS";

export interface EmergencyRescheduleInput {
  scenario: EmergencyScenario;
  availableMinutesToday?: number;
}

export interface EmergencyRescheduleResult {
  success: boolean;
  scenario?: EmergencyScenario;
  message?: string;
  affectedSubjects?: string[];
  recommendation?: string;
  error?: string;
}

/**
 * Replanejamento Emergencial com Inteligência Artificial
 * Salva a rotina de estudos do concurseiro redistribuindo a carga de forma inteligente
 */
export async function emergencyRescheduleAction(
  input: EmergencyRescheduleInput
): Promise<EmergencyRescheduleResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        weeklyGoalHours: true,
        activeDaysPerWeek: true,
        studyMode: true,
      },
    });

    const activeDaysCount = Math.max(1, Math.min(7, user?.activeDaysPerWeek ?? 5));
    const weeklyGoalHours = user?.weeklyGoalHours ?? 10;

    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        topics: {
          select: {
            id: true,
            title: true,
            firstStudy: true,
            relevance: true,
            performance: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    if (!subjects || subjects.length === 0) {
      return {
        success: false,
        error: "Nenhuma disciplina cadastrada para replanejamento.",
      };
    }

    // Mapeamento correto de dias:
    // JavaScript getDay(): 0 = Domingo, 1 = Segunda, 2 = Terça, ..., 6 = Sábado
    // Cronograma semanal (buildWeeklySchedule): 0 = Segunda, 1 = Terça, 2 = Quarta, 3 = Quinta, 4 = Sexta, 5 = Sábado, 6 = Domingo
    const jsDay = new Date().getDay();
    const scheduleTodayIndex = jsDay === 0 ? 6 : jsDay - 1;

    // Obtém o cronograma atual real de todos os dias
    const { scheduleByDay } = buildWeeklySchedule(
      subjects,
      weeklyGoalHours,
      activeDaysCount,
    );

    // Identifica as matérias agendadas para o dia de hoje
    const todayDaySchedule = scheduleByDay.find(
      (d) => d.dayIndex === scheduleTodayIndex,
    );
    const todaySubjects = todayDaySchedule?.subjects || [];

    // Dias ativos restantes na semana (ex: se hoje é Segunda (0) e activeDays=5, restantes = [1, 2, 3, 4])
    const remainingDays = Array.from(
      { length: activeDaysCount },
      (_, i) => i,
    ).filter((d) => d > scheduleTodayIndex);

    // Se hoje for o último dia ativo da semana (ex: Sexta) ou fim de semana, distribui pelos dias ativos da semana
    const fallbackDays =
      remainingDays.length > 0
        ? remainingDays
        : Array.from({ length: activeDaysCount }, (_, i) => i);

    let message = "";
    let affectedSubjects: string[] = [];

    // ================= CENÁRIO 1: PERDI O DIA DE HOJE =================
    if (input.scenario === "MISSED_TODAY") {
      const targets = todaySubjects.length > 0 ? todaySubjects : subjects.slice(0, 2);

      for (let i = 0; i < targets.length; i++) {
        const sub = targets[i];
        const nextDay = fallbackDays[i % fallbackDays.length];
        await prisma.subject.update({
          where: { id: sub.id },
          data: {
            assignedDay: nextDay,
            priority: Math.max(10, (sub.priority || 6.3) + 1.0),
            updatedAt: new Date(),
          },
        });
        affectedSubjects.push(sub.name);
      }

      message =
        "Replanejamento concluído com sucesso! Os estudos de hoje foram redistribuídos suavemente para os próximos dias da semana, protegendo o seu edital sem sobrecarga no fim de semana.";
    }

    // ================= CENÁRIO 2: MICRO-REVISÃO DE SOBREVIVÊNCIA =================
    else if (input.scenario === "SURVIVAL_MICRO") {
      const minutes = input.availableMinutesToday || 30;
      const targets = todaySubjects.length > 0 ? todaySubjects : subjects;

      // Matéria mais importante fica hoje
      const topSubject = targets[0];
      const otherSubjects = targets.slice(1);

      await prisma.subject.update({
        where: { id: topSubject.id },
        data: {
          assignedDay: scheduleTodayIndex < activeDaysCount ? scheduleTodayIndex : 0,
          priority: Math.max(10, (topSubject.priority || 6.3) + 2.0),
          updatedAt: new Date(),
        },
      });
      affectedSubjects.push(topSubject.name);

      // As outras matérias vão para os próximos dias ativos
      for (let i = 0; i < otherSubjects.length; i++) {
        const sub = otherSubjects[i];
        const targetDay = fallbackDays[i % fallbackDays.length];
        await prisma.subject.update({
          where: { id: sub.id },
          data: {
            assignedDay: targetDay,
            updatedAt: new Date(),
          },
        });
      }

      message = `Modo Sobrevivência ativado! Plano condensado para ${minutes} minutos hoje focando exclusivamente em ${topSubject.name}. O restante foi remanejado sem perder a ofensiva!`;
    }

    // ================= CENÁRIO 3: SEMANA CAÓTICA (REDUÇÃO DE 30%) =================
    else if (input.scenario === "REDUCE_LOAD") {
      const currentHours = user?.weeklyGoalHours || 10;
      const newHours = Math.max(3, Math.round(currentHours * 0.7));

      await prisma.user.update({
        where: { id: userId },
        data: {
          weeklyGoalHours: newHours,
        },
      });

      // Suaviza as prioridades de todas as matérias
      for (const sub of subjects) {
        await prisma.subject.update({
          where: { id: sub.id },
          data: {
            priority: Math.max(5, Math.round((sub.priority || 6.3) * 0.8 * 10) / 10),
            updatedAt: new Date(),
          },
        });
      }

      affectedSubjects = subjects.map((s) => s.name);
      message = `Meta semanal reduzida temporariamente de ${currentHours}h para ${newHours}h (-30%). O foco desta semana é manter a constância e respirar sem culpa.`;
    }

    // ================= CENÁRIO 4: BLINDAGEM DE EDITAL (FOCO CORE) =================
    else if (input.scenario === "CORE_FOCUS") {
      const halfCount = Math.max(1, Math.ceil(subjects.length / 2));
      const sortedByWeight = [...subjects].sort(
        (a, b) => (b.weight || 5) - (a.weight || 5)
      );
      const topSubjects = sortedByWeight.slice(0, halfCount);
      const secondarySubjects = sortedByWeight.slice(halfCount);

      // Eleva matérias principais e distribui nos dias ativos
      for (let i = 0; i < topSubjects.length; i++) {
        const sub = topSubjects[i];
        const day = i % activeDaysCount;
        await prisma.subject.update({
          where: { id: sub.id },
          data: {
            assignedDay: day,
            priority: Math.round((sub.priority || 6.3) * 1.4 * 10) / 10,
            updatedAt: new Date(),
          },
        });
        affectedSubjects.push(sub.name);
      }

      // Reduz matérias secundárias
      for (const sub of secondarySubjects) {
        await prisma.subject.update({
          where: { id: sub.id },
          data: {
            priority: Math.max(3, Math.round((sub.priority || 6.3) * 0.5 * 10) / 10),
            updatedAt: new Date(),
          },
        });
      }

      message = `Blindagem ativada! Foco máximo direcionado para as matérias nucleares do seu edital: ${topSubjects
        .map((s) => s.name)
        .join(", ")}. Disciplinas secundárias foram colocadas em ritmo de manutenção leve.`;
    }

    // Invalidação de Cache
    try {
      (revalidateTag as (tag: string) => void)(`user-schedule-${userId}`);
      revalidatePath("/week");
      revalidatePath("/dashboard");
      revalidatePath("/performance");
    } catch {
      // Ignora erro fora de contexto HTTP
    }

    return {
      success: true,
      scenario: input.scenario,
      message,
      affectedSubjects,
    };
  } catch (error) {
    console.error("Erro em emergencyRescheduleAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Falha ao aplicar replanejamento emergencial.",
    };
  }
}

/**
 * Restaura todas as prioridades das matérias para a carga horária base do edital
 */
export async function resetScheduleToDefaultAction(userIdParam?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = userIdParam || session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subjects: true },
    });

    if (!user || !user.subjects.length) {
      return { success: false, error: "Nenhuma matéria cadastrada." };
    }

    const totalWeeklyHours = user.weeklyGoalHours || 10;
    const totalWeeklyMinutes = totalWeeklyHours * 60;
    const totalWeight = user.subjects.reduce(
      (acc, s) => acc + (s.weight || 5),
      0,
    );

    for (const sub of user.subjects) {
      const baseMinutes = Math.round(
        (totalWeeklyMinutes * (sub.weight || 5)) / Math.max(1, totalWeight),
      );
      await prisma.subject.updateMany({
        where: { id: sub.id, userId },
        data: {
          priority: baseMinutes,
        },
      });
    }

    try {
      (revalidateTag as (tag: string) => void)(`user-schedule-${userId}`);
      revalidatePath("/week");
      revalidatePath("/dashboard");
      revalidatePath("/performance");
    } catch {
      // Ignora erro fora de contexto HTTP
    }

    return { success: true };
  } catch (error) {
    console.error("Erro em resetScheduleToDefaultAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Falha ao restaurar metas originais.",
    };
  }
}

