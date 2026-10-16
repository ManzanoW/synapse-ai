"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildWeeklySchedule, ScheduledSubject, DaySchedule } from "@/lib/study-cycle";
import {
  DAY_INDEX_TO_BYDAY,
  escapeIcsText,
  formatUtcIcs,
  formatFloatingIcs,
  generateGoogleCalendarUrl,
} from "@/lib/calendar-utils";

export interface NextBlockDetails {
  subjectName: string;
  dayName: string;
  dayIndex: number;
  startTime: string;
  durationMinutes: number;
  topics: string[];
}

export interface CalendarExportResult {
  success: boolean;
  icsContent?: string;
  fileName?: string;
  nextBlockGoogleUrl?: string | null;
  nextBlockDetails?: NextBlockDetails | null;
  totalEventsScheduled?: number;
  error?: string;
}

export interface CalendarExportOptions {
  startHour?: number;
  startMinute?: number;
}

/**
 * Server Action principal para gerar o arquivo RFC 5545 (.ics)
 * e o link rápido para o Google Calendar do próximo bloco de estudo
 */
export async function generateWeeklyScheduleIcsAction(
  options?: CalendarExportOptions,
): Promise<CalendarExportResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // 1. Busca configurações do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        weeklyGoalHours: true,
        activeDaysPerWeek: true,
      },
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado." };
    }

    // 2. Busca matérias e tópicos
    const rawSubjects = await prisma.subject.findMany({
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

    if (!rawSubjects || rawSubjects.length === 0) {
      return {
        success: false,
        error: "Nenhuma disciplina cadastrada para exportar.",
      };
    }

    // 3. Monta o cronograma inteligente via buildWeeklySchedule
    const { scheduleByDay } = buildWeeklySchedule(
      rawSubjects,
      user.weeklyGoalHours ?? 10,
      user.activeDaysPerWeek ?? 5,
    );

    if (!scheduleByDay || scheduleByDay.length === 0) {
      return {
        success: false,
        error: "Não foi possível gerar a grade semanal com os dados atuais.",
      };
    }

    const defaultStartHour = options?.startHour ?? 19;
    const defaultStartMinute = options?.startMinute ?? 0;

    const now = new Date();
    // Determina a Segunda-feira da semana corrente
    const currentJsDay = now.getDay(); // 0 = Domingo, 1 = Segunda...
    const diffToMonday = (currentJsDay === 0 ? -6 : 1) - currentJsDay;
    const mondayOfCurrentWeek = new Date(now);
    mondayOfCurrentWeek.setDate(now.getDate() + diffToMonday);
    mondayOfCurrentWeek.setHours(0, 0, 0, 0);

    // Monta o arquivo RFC 5545
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Synapse AI//Cronograma Semanal de Estudos//PT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Synapse AI - Cronograma de Estudos",
      "X-WR-TIMEZONE:America/Sao_Paulo",
    ];

    let totalEventsScheduled = 0;

    // Próximo bloco para gerar Google Calendar URL
    let nextBlockDetails: NextBlockDetails | null = null;
    let nextBlockGoogleUrl: string | null = null;
    let nextBlockStartDate: Date | null = null;
    let nextBlockEndDate: Date | null = null;
    let nextBlockByDay: string = "MO";

    const todaySynapseIndex = currentJsDay === 0 ? 6 : currentJsDay - 1;

    scheduleByDay.forEach((daySchedule: DaySchedule) => {
      const byDay = DAY_INDEX_TO_BYDAY[daySchedule.dayIndex] || "MO";

      // Calcula a data base para este dia da semana
      const dayDate = new Date(mondayOfCurrentWeek);
      dayDate.setDate(mondayOfCurrentWeek.getDate() + daySchedule.dayIndex);

      let currentHour = defaultStartHour;
      let currentMinute = defaultStartMinute;

      daySchedule.subjects.forEach((subject: ScheduledSubject, subIdx: number) => {
        const duration = subject.dailyMinutesAllocated;
        if (!duration || duration <= 0) return;

        const eventStart = new Date(dayDate);
        eventStart.setHours(currentHour, currentMinute, 0, 0);

        const eventEnd = new Date(eventStart);
        eventEnd.setMinutes(eventStart.getMinutes() + duration);

        const topicTitles = (subject.assignedTopics || []).map((t) => t.title);
        const formattedTopicList = topicTitles.length > 0
          ? topicTitles.map((t, i) => `${i + 1}. ${escapeIcsText(t)}`).join("\\n")
          : "Revisão geral e questões do edital";

        const uid = `synapse-sched-${daySchedule.dayIndex}-${subject.id}-${subIdx}@synapse.ai`;

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${formatUtcIcs(now)}`);
        lines.push(`DTSTART:${formatFloatingIcs(eventStart)}`);
        lines.push(`DTEND:${formatFloatingIcs(eventEnd)}`);
        lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`);
        lines.push(`SUMMARY:[Synapse] ${escapeIcsText(subject.name)}`);
        lines.push(
          `DESCRIPTION:Sessão Semanal de Estudo - Synapse AI\\n\\nMatéria: ${escapeIcsText(subject.name)}\\nDuração: ${duration} minutos\\n\\nTópicos Programados:\\n${formattedTopicList}\\n\\nGerado automaticamente pelo Synapse AI`,
        );
        lines.push("STATUS:CONFIRMED");

        // Alarme / Lembrete 15 minutos antes
        lines.push("BEGIN:VALARM");
        lines.push("TRIGGER:-PT15M");
        lines.push("ACTION:DISPLAY");
        lines.push(`DESCRIPTION:Lembrete de estudo: [Synapse] ${escapeIcsText(subject.name)}`);
        lines.push("END:VALARM");

        lines.push("END:VEVENT");
        totalEventsScheduled++;

        // Checa se este pode ser o próximo bloco de estudo (hoje ou no primeiro dia ativo seguinte)
        if (!nextBlockDetails) {
          const isToday = daySchedule.dayIndex === todaySynapseIndex;
          const isFutureDay = daySchedule.dayIndex > todaySynapseIndex;

          if (isToday) {
            // Se for hoje, verifica se o horário do evento já passou
            const todayEventStart = new Date(now);
            todayEventStart.setHours(currentHour, currentMinute, 0, 0);
            const todayEventEnd = new Date(todayEventStart);
            todayEventEnd.setMinutes(todayEventStart.getMinutes() + duration);

            if (todayEventEnd.getTime() > now.getTime()) {
              nextBlockDetails = {
                subjectName: subject.name,
                dayName: daySchedule.dayName,
                dayIndex: daySchedule.dayIndex,
                startTime: `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`,
                durationMinutes: duration,
                topics: topicTitles,
              };
              nextBlockStartDate = todayEventStart;
              nextBlockEndDate = todayEventEnd;
              nextBlockByDay = byDay;
            }
          } else if (isFutureDay) {
            // Próximo dia ativo da semana
            const futureStart = new Date(now);
            const daysAhead = daySchedule.dayIndex - todaySynapseIndex;
            futureStart.setDate(now.getDate() + daysAhead);
            futureStart.setHours(currentHour, currentMinute, 0, 0);

            const futureEnd = new Date(futureStart);
            futureEnd.setMinutes(futureStart.getMinutes() + duration);

            nextBlockDetails = {
              subjectName: subject.name,
              dayName: daySchedule.dayName,
              dayIndex: daySchedule.dayIndex,
              startTime: `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`,
              durationMinutes: duration,
              topics: topicTitles,
            };
            nextBlockStartDate = futureStart;
            nextBlockEndDate = futureEnd;
            nextBlockByDay = byDay;
          }
        }

        // Avança o horário para o próximo bloco daquele dia
        currentHour = eventEnd.getHours();
        currentMinute = eventEnd.getMinutes();
      });
    });

    // Se a semana já passou dos blocos ou começou no final de semana, pega o primeiro bloco da grade (Segunda)
    if (!nextBlockDetails && scheduleByDay.length > 0 && scheduleByDay[0].subjects.length > 0) {
      const firstDay = scheduleByDay[0];
      const firstSubj = firstDay.subjects[0];
      const firstByDay = DAY_INDEX_TO_BYDAY[firstDay.dayIndex] || "MO";

      const nextWeekStart = new Date(mondayOfCurrentWeek);
      nextWeekStart.setDate(mondayOfCurrentWeek.getDate() + 7 + firstDay.dayIndex);
      nextWeekStart.setHours(defaultStartHour, defaultStartMinute, 0, 0);

      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setMinutes(nextWeekStart.getMinutes() + firstSubj.dailyMinutesAllocated);

      const topicTitles = (firstSubj.assignedTopics || []).map((t) => t.title);

      nextBlockDetails = {
        subjectName: firstSubj.name,
        dayName: firstDay.dayName,
        dayIndex: firstDay.dayIndex,
        startTime: `${String(defaultStartHour).padStart(2, "0")}:${String(defaultStartMinute).padStart(2, "0")}`,
        durationMinutes: firstSubj.dailyMinutesAllocated,
        topics: topicTitles,
      };
      nextBlockStartDate = nextWeekStart;
      nextBlockEndDate = nextWeekEnd;
      nextBlockByDay = firstByDay;
    }

    // Gera o Google Calendar URL para o próximo bloco se encontrado
    if (nextBlockDetails && nextBlockStartDate && nextBlockEndDate) {
      const gcalTopics = nextBlockDetails.topics.length > 0
        ? nextBlockDetails.topics.map((t, i) => `${i + 1}. ${t}`).join("\n")
        : "Revisão e resolução de questões";

      const details = `Sessão Semanal de Estudo - Synapse AI\n\nMatéria: ${nextBlockDetails.subjectName}\nDuração: ${nextBlockDetails.durationMinutes} minutos\nDia: ${nextBlockDetails.dayName} às ${nextBlockDetails.startTime}\n\nTópicos:\n${gcalTopics}\n\nGerado automaticamente pelo Synapse AI`;

      nextBlockGoogleUrl = generateGoogleCalendarUrl({
        title: `[Synapse] ${nextBlockDetails.subjectName}`,
        details,
        startDate: nextBlockStartDate,
        endDate: nextBlockEndDate,
        recurWeekly: true,
        byDay: nextBlockByDay,
      });
    }

    lines.push("END:VCALENDAR");

    const icsContent = lines.join("\r\n");

    return {
      success: true,
      icsContent,
      fileName: "Cronograma_Synapse_AI.ics",
      nextBlockGoogleUrl,
      nextBlockDetails,
      totalEventsScheduled,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao exportar cronograma";
    console.error("❌ ERRO em generateWeeklyScheduleIcsAction:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action auxiliar para obter rapidamente o link do Google Calendar do próximo bloco
 */
export async function getNextStudyBlockGoogleCalendarLinkAction(): Promise<{
  success: boolean;
  url?: string;
  block?: NextBlockDetails;
  error?: string;
}> {
  const result = await generateWeeklyScheduleIcsAction();
  if (!result.success || !result.nextBlockGoogleUrl || !result.nextBlockDetails) {
    return {
      success: false,
      error: result.error || "Nenhum bloco de estudo agendado encontrado.",
    };
  }

  return {
    success: true,
    url: result.nextBlockGoogleUrl,
    block: result.nextBlockDetails,
  };
}
