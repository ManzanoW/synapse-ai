"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek } from "date-fns";

export interface ApprovalOddsData {
  overallOdds: number; // 0 a 100
  status: "FASE_INICIAL" | "EM_CONSTRUCAO" | "COMPETITIVO" | "ZONA_DE_APROVACAO";
  statusLabel: string;
  statusDescription: string;
  hasEnoughData: boolean;
  pillars: {
    coverage: {
      score: number; // 0 a 100%
      completedTopics: number;
      totalTopics: number;
      weightPercentage: 40;
    };
    domain: {
      score: number; // 0 a 100%
      totalQuestions: number;
      correctQuestions: number;
      weightPercentage: 40;
    };
    constancy: {
      score: number; // 0 a 100%
      streakDays: number;
      weeklyMinutes: number;
      weeklyTargetMinutes: number;
      weightPercentage: 20;
    };
  };
}

export async function getApprovalOddsAction(
  userIdParam?: string,
): Promise<{ success: boolean; data?: ApprovalOddsData; error?: string }> {
  try {
    const session = await auth();
    const userId = userIdParam || session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // 1. Busca matérias, tópicos e tentativas de simulado
    const [subjects, user, weeklySessions] = await Promise.all([
      prisma.subject.findMany({
        where: { userId },
        include: {
          topics: {
            include: {
              quizAttempts: {
                select: {
                  totalCount: true,
                  correctCount: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          weeklyGoalHours: true,
          userStats: {
            select: {
              streakDays: true,
            },
          },
        },
      }),
      prisma.studySession.findMany({
        where: {
          userId,
          date: { gte: weekStart, lte: weekEnd },
        },
        select: {
          durationMinutes: true,
        },
      }),
    ]);

    // 2. Pilar 1: Cobertura do Edital (40%)
    let totalTopics = 0;
    let completedTopics = 0;

    subjects.forEach((s: any) => {
      s.topics.forEach((t: any) => {
        totalTopics++;
        if (["Concluido", "Em Revisão"].includes(t.firstStudy)) {
          completedTopics++;
        }
      });
    });

    const coverageScore =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // 3. Pilar 2: Retenção Ponderada em Simulados (40%)
    let totalWeightedSum = 0;
    let totalWeights = 0;
    let totalQuestionsAnswered = 0;
    let totalQuestionsCorrect = 0;

    subjects.forEach((subject: any) => {
      const weight = Math.max(0.5, Number(subject.weight ?? (subject.priority === "Alta" ? 3 : subject.priority === "Baixa" ? 1 : 2)));
      let subTotal = 0;
      let subCorrect = 0;

      subject.topics.forEach((topic: any) => {
        topic.quizAttempts.forEach((attempt: any) => {
          subTotal += attempt.totalCount;
          subCorrect += attempt.correctCount;
        });
      });

      totalQuestionsAnswered += subTotal;
      totalQuestionsCorrect += subCorrect;

      if (subTotal > 0) {
        const subAccuracy = (subCorrect / subTotal) * 100;
        totalWeightedSum += subAccuracy * weight;
        totalWeights += weight;
      } else {
        // Fallback para tópicos com performance anotada
        const scoredTopics = subject.topics.filter((t: any) => t.performance > 0);
        if (scoredTopics.length > 0) {
          const avgPerf =
            scoredTopics.reduce((sum: number, t: any) => sum + t.performance, 0) /
            scoredTopics.length;
          totalWeightedSum += avgPerf * weight;
          totalWeights += weight;
        } else if (subjects.length > 0) {
          totalWeights += weight;
        }
      }
    });

    const domainScore =
      totalWeights > 0 ? Math.round(totalWeightedSum / totalWeights) : 0;

    // 4. Pilar 3: Constância Semanal (20%)
    const streakDays = user?.userStats?.streakDays || 0;
    const streakFactor = Math.min(
      100,
      streakDays >= 7 ? 100 : streakDays > 0 ? Math.round(streakDays * 14.3) : 0,
    );

    const weeklyTargetMinutes = Math.max(
      60,
      (user?.weeklyGoalHours || 10) * 60,
    );
    const weeklyMinutes = weeklySessions.reduce(
      (acc: number, s: any) => acc + (s.durationMinutes || 0),
      0,
    );
    const weeklyProgressFactor = Math.min(
      100,
      Math.round((weeklyMinutes / weeklyTargetMinutes) * 100),
    );

    const constancyScore = Math.min(
      100,
      Math.round(streakFactor * 0.5 + weeklyProgressFactor * 0.5),
    );

    // 5. Avaliação de Suficiência de Dados
    const hasEnoughData =
      totalTopics > 0 &&
      (totalQuestionsAnswered > 0 || completedTopics > 0 || streakDays > 0);

    // 6. Cálculo do Índice Geral (0 a 100%)
    const overallOdds = hasEnoughData
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              coverageScore * 0.4 + domainScore * 0.4 + constancyScore * 0.2,
            ),
          ),
        )
      : 0;

    // 7. Qualificação Dinâmica
    let status: ApprovalOddsData["status"] = "FASE_INICIAL";
    let statusLabel = "Fase Inicial";
    let statusDescription =
      "Inicie simulados e avance nos tópicos para calibrar sua projeção estatística.";

    if (overallOdds >= 75) {
      status = "ZONA_DE_APROVACAO";
      statusLabel = "Zona de Aprovação";
      statusDescription =
        "Probabilidade estatística elevada. Mantenha o ritmo de revisões e aprofunde simulados!";
    } else if (overallOdds >= 50) {
      status = "COMPETITIVO";
      statusLabel = "Competitivo";
      statusDescription =
        "Desempenho sólido e competitivo. Foque nos pontos fracos para cruzar a nota de corte.";
    } else if (overallOdds >= 25) {
      status = "EM_CONSTRUCAO";
      statusLabel = "Em Construção";
      statusDescription =
        "Base em evolução. Aumente o volume de simulados e conclua mais tópicos do edital.";
    }

    return {
      success: true,
      data: {
        overallOdds,
        status,
        statusLabel,
        statusDescription,
        hasEnoughData,
        pillars: {
          coverage: {
            score: coverageScore,
            completedTopics,
            totalTopics,
            weightPercentage: 40,
          },
          domain: {
            score: domainScore,
            totalQuestions: totalQuestionsAnswered,
            correctQuestions: totalQuestionsCorrect,
            weightPercentage: 40,
          },
          constancy: {
            score: constancyScore,
            streakDays,
            weeklyMinutes,
            weeklyTargetMinutes,
            weightPercentage: 20,
          },
        },
      },
    };
  } catch (err) {
    console.error("Erro em getApprovalOddsAction:", err);
    return {
      success: false,
      error: "Falha ao calcular chance de aprovação.",
    };
  }
}

export type ReviewUrgencyLevel = "LOW" | "NORMAL" | "HIGH" | "OVERLOAD";

export interface DailyReviewForecast {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // Seg, Ter, Qua...
  dayOfMonth: number;
  formattedDate: string; // DD/MM
  topicsDueCount: number;
  flashcardsDueCount: number;
  totalDue: number;
  urgencyLevel: ReviewUrgencyLevel;
  isOverloaded: boolean; // totalDue > 15
  isToday: boolean;
}

export interface UpcomingReviewsForecastData {
  days: DailyReviewForecast[];
  totalTopicsDue: number;
  totalFlashcardsDue: number;
  totalDue: number;
  overloadedDaysCount: number;
  peakDay: {
    date: string;
    formattedDate: string;
    totalDue: number;
  } | null;
  todaySummary: {
    totalDue: number;
    topicsDue: number;
    flashcardsDue: number;
    isOverloaded: boolean;
  };
}

export interface UpcomingReviewsForecastResult {
  success: boolean;
  data?: UpcomingReviewsForecastData;
  error?: string;
}

/**
 * Projeta a carga futura de revisões FSRS dos próximos 14 dias
 * Consultando de forma enxuta e agrupada por data Topic.nextRev e Flashcard.nextReviewDate
 */
export async function getUpcomingReviewsForecastAction(
  userIdParam?: string,
): Promise<UpcomingReviewsForecastResult> {
  try {
    const session = await auth();
    const userId = userIdParam || session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOf14Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 23, 59, 59, 999);

    // Consultas estritas: apenas id, nextRev e nextReviewDate para máxima performance
    const [topics, flashcards] = await Promise.all([
      prisma.topic.findMany({
        where: {
          subject: { userId },
          nextRev: {
            gte: startOfToday,
            lte: endOf14Days,
          },
        },
        select: {
          id: true,
          nextRev: true,
        },
      }),
      prisma.flashcard.findMany({
        where: {
          deck: { userId },
          nextReviewDate: {
            gte: startOfToday,
            lte: endOf14Days,
          },
        },
        select: {
          id: true,
          nextReviewDate: true,
        },
      }),
    ]);

    const DOW_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const formatDateKey = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const dateMap = new Map<string, { topics: number; flashcards: number; dateObj: Date }>();

    // Inicializa a régua com os próximos 14 dias contínuos
    for (let i = 0; i < 14; i++) {
      const targetDate = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate() + i);
      const key = formatDateKey(targetDate);
      dateMap.set(key, { topics: 0, flashcards: 0, dateObj: targetDate });
    }

    // Agrupa tópicos por data
    for (const topic of topics) {
      if (topic.nextRev) {
        const key = formatDateKey(new Date(topic.nextRev));
        const entry = dateMap.get(key);
        if (entry) {
          entry.topics++;
        }
      }
    }

    // Agrupa flashcards por data
    for (const card of flashcards) {
      if (card.nextReviewDate) {
        const key = formatDateKey(new Date(card.nextReviewDate));
        const entry = dateMap.get(key);
        if (entry) {
          entry.flashcards++;
        }
      }
    }

    let totalTopicsDue = 0;
    let totalFlashcardsDue = 0;
    let overloadedDaysCount = 0;
    let peakDay: { date: string; formattedDate: string; totalDue: number } | null = null;

    const days: DailyReviewForecast[] = [];
    const todayKey = formatDateKey(startOfToday);

    let todayTopics = 0;
    let todayFlashcards = 0;

    for (const [key, value] of dateMap.entries()) {
      const total = value.topics + value.flashcards;
      totalTopicsDue += value.topics;
      totalFlashcardsDue += value.flashcards;

      const isOverloaded = total > 15;
      if (isOverloaded) {
        overloadedDaysCount++;
      }

      let urgencyLevel: ReviewUrgencyLevel = "LOW";
      if (total > 15) {
        urgencyLevel = "OVERLOAD";
      } else if (total > 10) {
        urgencyLevel = "HIGH";
      } else if (total > 5) {
        urgencyLevel = "NORMAL";
      }

      const d = value.dateObj;
      const pad = (n: number) => String(n).padStart(2, "0");
      const formattedDate = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
      const dayOfWeek = DOW_PT[d.getDay()];
      const isToday = key === todayKey;

      if (isToday) {
        todayTopics = value.topics;
        todayFlashcards = value.flashcards;
      }

      if (!peakDay || total > peakDay.totalDue) {
        peakDay = { date: key, formattedDate, totalDue: total };
      }

      days.push({
        date: key,
        dayOfWeek,
        dayOfMonth: d.getDate(),
        formattedDate,
        topicsDueCount: value.topics,
        flashcardsDueCount: value.flashcards,
        totalDue: total,
        urgencyLevel,
        isOverloaded,
        isToday,
      });
    }

    const todayTotal = todayTopics + todayFlashcards;

    return {
      success: true,
      data: {
        days,
        totalTopicsDue,
        totalFlashcardsDue,
        totalDue: totalTopicsDue + totalFlashcardsDue,
        overloadedDaysCount,
        peakDay: peakDay && peakDay.totalDue > 0 ? peakDay : null,
        todaySummary: {
          totalDue: todayTotal,
          topicsDue: todayTopics,
          flashcardsDue: todayFlashcards,
          isOverloaded: todayTotal > 15,
        },
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao projetar revisões";
    console.error("❌ ERRO em getUpcomingReviewsForecastAction:", error);
    return {
      success: false,
      error: message,
    };
  }
}

export interface WeeklyPerformanceReportData {
  userName: string;
  periodLabel: string;
  totalMinutes: number;
  totalHoursFormatted: string;
  sessionsCount: number;
  questionsTotal: number;
  questionsCorrect: number;
  accuracyPercentage: number;
  masteredErrorsCount: number;
  streakDays: number;
  totalXp: number;
  estimatedWeekXp: number;
  flashcardsReviewed: number;
  archetype: {
    title: string;
    badge: string;
    quote: string;
  };
}

/**
 * Compila o Boletim Semanal do Concurseiro com métricas de estudo,
 * acertos, erros cicatrizados, constância e arquétipo de performance.
 */
export async function getWeeklyPerformanceReportAction(): Promise<{
  success: boolean;
  data?: WeeklyPerformanceReportData;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [user, userStats, sessions, quizAttempts, masteredErrors, flashcardsReviewedCount] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        }),
        prisma.userStats.findUnique({
          where: { userId },
          select: { streakDays: true, totalXp: true },
        }),
        prisma.studySession.findMany({
          where: {
            userId,
            date: { gte: sevenDaysAgo },
            status: "COMPLETED",
          },
          select: { durationMinutes: true },
        }),
        prisma.quizAttempt.findMany({
          where: {
            userId,
            completedAt: { gte: sevenDaysAgo },
          },
          select: { totalCount: true, correctCount: true },
        }),
        prisma.questionError.count({
          where: {
            userId,
            status: "MASTERED",
            updatedAt: { gte: sevenDaysAgo },
          },
        }),
        prisma.flashcard.count({
          where: {
            deck: { userId },
            lastReviewed: { gte: sevenDaysAgo },
          },
        }),
      ]);

    // 1. Minutos e horas de estudo
    const totalMinutes = sessions.reduce(
      (acc, s) => acc + (s.durationMinutes || 0),
      0,
    );
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const totalHoursFormatted =
      hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim() : `${mins}min`;

    // 2. Questões e taxa de acertos
    let questionsTotal = 0;
    let questionsCorrect = 0;
    for (const qa of quizAttempts) {
      questionsTotal += qa.totalCount;
      questionsCorrect += qa.correctCount;
    }
    const accuracyPercentage =
      questionsTotal > 0 ? Math.round((questionsCorrect / questionsTotal) * 100) : 0;

    // 3. XP e Streak
    const streakDays = userStats?.streakDays ?? (sessions.length > 0 ? 1 : 0);
    const totalXp = userStats?.totalXp ?? 0;
    const estimatedWeekXp =
      totalMinutes * 2 + questionsCorrect * 10 + masteredErrors * 25;

    // 4. Período formatado
    const startDay = sevenDaysAgo.getDate();
    const endDay = now.getDate();
    const monthNames = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];
    const periodLabel = `${startDay} a ${endDay} de ${monthNames[now.getMonth()]}`;

    // 5. Determinação do arquétipo de desempenho
    let archetype = {
      title: "Concurseiro Implacável 🚀",
      badge: "Constância de Elite",
      quote: "A constância vence o talento. Cada dia no plano te aproxima da posse.",
    };

    if (accuracyPercentage >= 80 && questionsTotal >= 10) {
      archetype = {
        title: "Sniper de Questões 🎯",
        badge: "Alta Precisão",
        quote: "Mira cirúrgica e domínio da banca examinadora.",
      };
    } else if (totalMinutes >= 600) {
      archetype = {
        title: "Máquina de Foco ⚡",
        badge: "Hiperfoco Absoluto",
        quote: "Mais de 10 horas de foco profundo. Ninguém tira seu ritmo.",
      };
    } else if (masteredErrors >= 5) {
      archetype = {
        title: "Mente Resiliente 🛡️",
        badge: "Blindagem Cognitiva",
        quote: "Transformando pontos cegos em fortalezas inexpugnáveis.",
      };
    } else if (streakDays >= 5) {
      archetype = {
        title: "Chama Olímpica 🔥",
        badge: "Ofensiva Blindada",
        quote: "O hábito já virou identidade. Nada para quem estuda todo dia.",
      };
    }

    const userName =
      user?.name?.split(" ")[0] ||
      user?.email?.split("@")[0] ||
      "Concurseiro(a)";

    return {
      success: true,
      data: {
        userName,
        periodLabel,
        totalMinutes,
        totalHoursFormatted,
        sessionsCount: sessions.length,
        questionsTotal,
        questionsCorrect,
        accuracyPercentage,
        masteredErrorsCount: masteredErrors,
        streakDays,
        totalXp,
        estimatedWeekXp: Math.max(estimatedWeekXp, 50),
        flashcardsReviewed: flashcardsReviewedCount,
        archetype,
      },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao compilar boletim semanal";
    console.error("❌ ERRO em getWeeklyPerformanceReportAction:", err);
    return {
      success: false,
      error: message,
    };
  }
}


