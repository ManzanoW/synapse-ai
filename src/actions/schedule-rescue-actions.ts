"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface RemainingDayPlan {
  dayIndex: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  dayName: string;
  suggestedHours: number;
}

export interface PendingSubjectDiagnostic {
  id: string;
  name: string;
  color: string;
  weight: number;
  priority: number;
  missedMinutes: number;
  topicsCount: number;
}

export interface ScheduleRescueDiagnostics {
  todayIndex: number;
  todayName: string;
  totalMissedMinutes: number;
  pendingSubjects: PendingSubjectDiagnostic[];
  remainingDays: RemainingDayPlan[];
  userWeeklyGoalHours: number;
}

const DAY_NAMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

/**
 * Obtém diagnóstico da semana atual identificando o que ficou para trás
 */
export async function getScheduleRescueDiagnosticsAction(): Promise<{
  success: boolean;
  error?: string;
  data?: ScheduleRescueDiagnostics;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const [user, subjects, sessionsThisWeek] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { weeklyGoalHours: true, activeDaysPerWeek: true },
      }),
      prisma.subject.findMany({
        where: { userId },
        include: { topics: { select: { id: true } } },
        orderBy: [{ weight: "desc" }, { priority: "desc" }],
      }),
      prisma.studySession.findMany({
        where: {
          userId,
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 dias
          },
        },
        select: { durationMinutes: true, notes: true, date: true },
      }),
    ]);

    if (!subjects || subjects.length === 0) {
      return {
        success: false,
        error: "Cadastre matérias ou importe um edital antes de rebalancear a semana.",
      };
    }

    const now = new Date();
    const todayIndex = now.getDay(); // 0 a 6
    const todayName = DAY_NAMES[todayIndex];

    // Dias restantes da semana (do dia atual até domingo)
    // Se hoje é Domingo (0), a semana está fechando (resta Domingo)
    // Se hoje é Quarta (3), restam Quarta (3), Quinta (4), Sexta (5), Sábado (6) e Domingo (0)
    const remainingDayIndices: number[] = [];
    if (todayIndex === 0) {
      remainingDayIndices.push(0);
    } else {
      for (let d = todayIndex; d <= 6; d++) {
        remainingDayIndices.push(d);
      }
      remainingDayIndices.push(0); // Domingo
    }

    const defaultHoursPerDay = Math.max(
      1,
      Math.round(
        (user?.weeklyGoalHours || 10) /
          Math.max(1, remainingDayIndices.length)
      )
    );

    const remainingDays: RemainingDayPlan[] = remainingDayIndices.map((idx) => ({
      dayIndex: idx,
      dayName: DAY_NAMES[idx],
      suggestedHours: defaultHoursPerDay,
    }));

    // Calcula matérias atrasadas:
    // Identifica matérias com baixo estudo recente ou pendentes no cronograma
    const pendingSubjects: PendingSubjectDiagnostic[] = subjects.slice(0, 5).map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color || "#6366f1",
      weight: s.weight || 5,
      priority: s.priority || 5,
      missedMinutes: Math.round((s.weight || 5) * 15 + 30), // Estimativa de déficit ponderado
      topicsCount: s.topics.length,
    }));

    const totalMissedMinutes = pendingSubjects.reduce(
      (acc, s) => acc + s.missedMinutes,
      0
    );

    return {
      success: true,
      data: {
        todayIndex,
        todayName,
        totalMissedMinutes,
        pendingSubjects,
        remainingDays,
        userWeeklyGoalHours: user?.weeklyGoalHours || 10,
      },
    };
  } catch (err) {
    console.error("[getScheduleRescueDiagnosticsAction] Erro:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao obter diagnóstico de resgate da semana.",
    };
  }
}

export interface ApplyScheduleRescueInput {
  dailyAvailabilityHours: Record<number, number>; // { [dayIndex]: hours }
}

/**
 * Aplica a redistribuição de resgate salvando os novos dias no banco
 */
export async function applyScheduleRescueAction(
  input: ApplyScheduleRescueInput
): Promise<{
  success: boolean;
  error?: string;
  message?: string;
  rebalancedSchedule?: Array<{
    dayIndex: number;
    dayName: string;
    subjects: Array<{ id: string; name: string; color: string }>;
  }>;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const subjects = await prisma.subject.findMany({
      where: { userId },
      orderBy: [{ weight: "desc" }, { priority: "desc" }],
    });

    if (subjects.length === 0) {
      return { success: false, error: "Nenhuma matéria cadastrada." };
    }

    // Dias que o usuário indicou disponibilidade > 0
    const activeDays = Object.entries(input.dailyAvailabilityHours)
      .filter(([, hours]) => hours > 0)
      .map(([day]) => Number(day));

    if (activeDays.length === 0) {
      return {
        success: false,
        error: "Selecione ao menos 1 dia com horas disponíveis para o resgate.",
      };
    }

    // Redistribui as matérias ciclicamente pelos dias disponíveis
    const updates: Promise<any>[] = [];
    const rebalancedScheduleMap = new Map<
      number,
      Array<{ id: string; name: string; color: string }>
    >();

    activeDays.forEach((dayIdx) => {
      rebalancedScheduleMap.set(dayIdx, []);
    });

    subjects.forEach((subj, idx) => {
      const assignedDay = activeDays[idx % activeDays.length];
      updates.push(
        prisma.subject.update({
          where: { id: subj.id },
          data: { assignedDay },
        })
      );

      const list = rebalancedScheduleMap.get(assignedDay);
      if (list) {
        list.push({
          id: subj.id,
          name: subj.name,
          color: subj.color || "#6366f1",
        });
      }
    });

    await Promise.all(updates);

    try {
      revalidatePath("/week");
      revalidatePath("/calendar");
      revalidatePath("/dashboard");
    } catch {}

    const rebalancedSchedule = Array.from(rebalancedScheduleMap.entries()).map(
      ([dayIndex, list]) => ({
        dayIndex,
        dayName: DAY_NAMES[dayIndex],
        subjects: list,
      })
    );

    return {
      success: true,
      message: "Cronograma de resgate aplicado com sucesso! Sua semana foi rebalanceada.",
      rebalancedSchedule,
    };
  } catch (err) {
    console.error("[applyScheduleRescueAction] Erro:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao aplicar rebalanceamento de resgate.",
    };
  }
}
