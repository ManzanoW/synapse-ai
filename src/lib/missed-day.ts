import { prisma } from "@/lib/prisma";

export const DAYS_MAP = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export const DAY_NAME_TO_INDEX: Record<string, number> = {
  Domingo: 0,
  "Segunda-feira": 1,
  "Terça-feira": 2,
  "Quarta-feira": 3,
  "Quinta-feira": 4,
  "Sexta-feira": 5,
  Sábado: 6,
};

// Cache em memória de último tratamento de dia perdido por usuário
// Evita re-gatilhos redundantes logo após a resposta do endpoint mesmo em caso de latência de banco
export const lastMissedDayHandledAtMap = new Map<string, number>();

export function markMissedDayHandled(userId: string): void {
  lastMissedDayHandledAtMap.set(userId, Date.now());
}

export function isMissedDayHandledRecently(
  userId: string,
  thresholdMs = 1000 * 60 * 60 * 16, // 16 horas
): boolean {
  const lastTime = lastMissedDayHandledAtMap.get(userId);
  if (!lastTime) return false;
  return Date.now() - lastTime < thresholdMs;
}

/**
 * Registra no banco a resolução de um dia perdido/atrasado.
 * Cria log em StudySession, atualiza lastStudyDate em UserStats e toca o updatedAt dos Subjects.
 */
export async function recordMissedDayResolution(
  userId: string,
  action: string,
  missedDayName?: string,
): Promise<void> {
  const now = new Date();

  // 1. Marca no cache de memória imediatamente
  markMissedDayHandled(userId);

  // 2. Normaliza status da sessão de acordo com a ação
  let sessionStatus = "RESCHEDULED";
  if (action === "MARK_REST" || action === "OFF_DAY") {
    sessionStatus = "REST_DAY";
  } else if (action === "SKIP_CYCLE") {
    sessionStatus = "SKIPPED_CYCLE";
  }

  // 3. Registra log em StudySession
  await prisma.studySession.create({
    data: {
      userId,
      date: now,
      status: sessionStatus,
      durationMinutes: 0,
      notes: `MISSED_DAY_HANDLED:${action}:${missedDayName || ""}`,
      createdAt: now,
    },
  });

  // 4. Atualiza lastStudyDate em UserStats
  await prisma.userStats.upsert({
    where: { userId },
    update: {
      lastStudyDate: now,
    },
    create: {
      userId,
      lastStudyDate: now,
    },
  });

  // 5. Atualiza updatedAt de todas as matérias do usuário
  await prisma.subject.updateMany({
    where: { userId },
    data: { updatedAt: now },
  });

  console.log(
    `✅ [recordMissedDayResolution] Resolvido dia perdido para usuário ${userId}: ação=${action}, dia=${missedDayName}`,
  );
}

/**
 * Função utilitária para verificar se o usuário perdeu a meta/estudo de algum dia anterior.
 * Leva em conta:
 * 1. Timestamp em memória (lastMissedDayHandledAt)
 * 2. Sessões recentes de resolução (status REST_DAY, RESCHEDULED, SKIPPED_CYCLE ou nota MISSED_DAY_HANDLED)
 * 3. UserStats.lastStudyDate
 * 4. StudySession mais recente e Subject.updatedAt
 * 5. Dias já compensados/rebalanceados na mesma semana
 */
export async function checkMissedDay(userId: string): Promise<string | null> {
  try {
    const now = new Date();

    // 1. Verificação em memória: se foi tratado recentemente (últimas 16 horas)
    if (isMissedDayHandledRecently(userId)) {
      console.log(
        `🔍 [checkMissedDay] Usuário ${userId} tratou pendência recentemente em memória. Omitindo banner.`,
      );
      return null;
    }

    // 2. Início da semana atual (Segunda-feira 00:00:00)
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay(); // 0 = Domingo, 1 = Segunda
    const diffToMonday =
      startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // 3. Busca resoluções já realizadas nesta semana
    const handledThisWeek = await prisma.studySession.findMany({
      where: {
        userId,
        createdAt: { gte: startOfWeek },
        OR: [
          { notes: { contains: "MISSED_DAY_HANDLED" } },
          {
            status: {
              in: [
                "RESCHEDULED",
                "REST_DAY",
                "SKIPPED_CYCLE",
                "COMPENSATED",
              ],
            },
          },
        ],
      },
      select: { createdAt: true, date: true, notes: true, status: true },
      orderBy: { createdAt: "desc" },
    });

    // Se houve alguma resolução registrada nas últimas 16 horas ou hoje, não aponta pendência
    const todayUTCDate = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );

    for (const session of handledThisWeek) {
      const sDate = new Date(session.date || session.createdAt);
      const sessionUTCDate = Date.UTC(
        sDate.getUTCFullYear(),
        sDate.getUTCMonth(),
        sDate.getUTCDate(),
      );
      const diffHours = (now.getTime() - sDate.getTime()) / (1000 * 60 * 60);

      if (sessionUTCDate === todayUTCDate || diffHours < 16) {
        // Marca no cache de memória para poupar queries subsequentes
        markMissedDayHandled(userId);
        return null;
      }
    }

    // Conjunto de nomes de dias já tratados nesta semana
    const handledDaysSet = new Set<string>();
    for (const session of handledThisWeek) {
      if (session.notes) {
        for (const dayName of DAYS_MAP) {
          if (session.notes.includes(dayName)) {
            handledDaysSet.add(dayName);
          }
        }
      }
    }

    // 4. Busca datas de atividade mais recentes de múltiplas fontes
    const [lastSession, lastSubject, userStats] = await Promise.all([
      prisma.studySession.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, date: true },
      }),
      prisma.subject.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.userStats.findUnique({
        where: { userId },
        select: { lastStudyDate: true },
      }),
    ]);

    const candidateTimestamps: number[] = [];
    if (lastSession) {
      candidateTimestamps.push(
        new Date(lastSession.date || lastSession.createdAt).getTime(),
      );
    }
    if (lastSubject?.updatedAt) {
      candidateTimestamps.push(new Date(lastSubject.updatedAt).getTime());
    }
    if (userStats?.lastStudyDate) {
      candidateTimestamps.push(new Date(userStats.lastStudyDate).getTime());
    }

    // Se o usuário não tem nenhuma atividade registrada, não há o que cobrar
    if (candidateTimestamps.length === 0) {
      return null;
    }

    const latestTimestamp = Math.max(...candidateTimestamps);
    const lastDate = new Date(latestTimestamp);

    const lastUTCDate = Date.UTC(
      lastDate.getUTCFullYear(),
      lastDate.getUTCMonth(),
      lastDate.getUTCDate(),
    );

    // Diferença em dias de calendário
    const diffDays = Math.floor(
      (todayUTCDate - lastUTCDate) / (1000 * 60 * 60 * 24),
    );

    console.log(
      `🔍 DEBUG checkMissedDay: Data Atual=${now.toISOString()}, Último Registro=${lastDate.toISOString()}, Dias Atraso=${diffDays}`,
    );

    // Se a última atividade foi hoje (diffDays <= 0), não há dia perdido
    if (diffDays <= 0) {
      return null;
    }

    // Se houve atraso (diffDays >= 1), o dia perdido teórico é o dia anterior
    const yesterdayIndex = (now.getDay() + 6) % 7;
    const candidateMissedDay = DAYS_MAP[yesterdayIndex];

    // Se este dia já foi rebalanceado ou dispensado nesta semana, não aponta novamente
    if (handledDaysSet.has(candidateMissedDay)) {
      console.log(
        `🔍 [checkMissedDay] Dia '${candidateMissedDay}' já foi tratado nesta semana. Omitindo banner.`,
      );
      return null;
    }

    return candidateMissedDay;
  } catch (err: unknown) {
    console.warn("⚠️ Aviso ao verificar dia perdido:", err);
    return null;
  }
}
