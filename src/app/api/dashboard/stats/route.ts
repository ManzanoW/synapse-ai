import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { startOfWeek, endOfWeek, subDays, format } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // 1. Busca histórico de revisões do usuário
    const reviews = await prisma.reviewHistory.findMany({
      where: {
        topic: {
          subject: {
            userId: userId,
          },
        },
      },
      select: {
        id: true,
        grade: true,
        reviewedAt: true,
        durationSeconds: true,
      },
      orderBy: { reviewedAt: "desc" },
    });

    // 2. Busca sessões de estudo diretas do Cronograma/Ciclo
    const studySessions = await (prisma.studySession as any).findMany({
      where: { userId },
      select: { durationMinutes: true, completedAt: true, createdAt: true },
    });

    const sessionMinutesTotal = studySessions.reduce(
      (acc: number, s: any) => acc + (s.durationMinutes || 0),
      0
    );

    // 3. Busca total de Decks e Flashcards
    const totalDecks = await prisma.deck.count({ where: { userId } });
    const totalFlashcards = await prisma.flashcard.count({
      where: { deck: { userId } },
    });

    // 4. Métrica da Jornada
    const totalTopics = await prisma.topic.count({
      where: { subject: { userId } },
    });

    const completedTopics = await prisma.topic.count({
      where: {
        subject: { userId },
        firstStudy: { in: ["Concluido", "Em Revisão"] },
      },
    });

    const journeyPercentage =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // 5. Data da Prova Alvo
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { targetExamDate: true },
    });

    const hasObjective = !!user?.targetExamDate;
    let daysRemaining = 0;
    let weeksRemaining = 0;
    let daysLeftInWeek = 0;
    let topicsPerWeek = 0;

    if (user?.targetExamDate) {
      const targetDate = new Date(user.targetExamDate);
      const diffTime = targetDate.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      const exactWeeksRemaining = daysRemaining / 7;
      weeksRemaining = Math.floor(daysRemaining / 7);
      daysLeftInWeek = daysRemaining % 7;

      const remainingTopics = Math.max(0, totalTopics - completedTopics);
      if (exactWeeksRemaining > 0 && remainingTopics > 0) {
        topicsPerWeek = Number(
          (remainingTopics / exactWeeksRemaining).toFixed(1)
        );
      }
    }

    // 6. Cálculos de Tempo e Desempenho Combinados
    const totalQuestions = reviews.length;
    const correctQuestions = reviews.filter((r) => {
      const g = r.grade.toUpperCase();
      return ["FACIL", "BOM", "3", "4", "5"].includes(g);
    }).length;

    const precision =
      totalQuestions > 0
        ? Math.round((correctQuestions / totalQuestions) * 100)
        : 0;

    const reviewSeconds = reviews.reduce(
      (acc, r) => acc + (r.durationSeconds || 60),
      0
    );
    const totalMinutes = Math.floor(reviewSeconds / 60) + sessionMinutesTotal;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    // 7. Meta Semanal
    const weeklyLogs = reviews.filter(
      (r) => r.reviewedAt >= weekStart && r.reviewedAt <= weekEnd
    );
    const weeklyGoalTarget = 50;
    const weeklyProgress = Math.min(
      100,
      Math.round((weeklyLogs.length / weeklyGoalTarget) * 100)
    );

    // 8. Streak
    const studyDays = new Set<string>([
      ...reviews.map((r) => format(r.reviewedAt, "yyyy-MM-dd")),
      ...studySessions.map((s: any) =>
        format(s.completedAt || s.createdAt || new Date(), "yyyy-MM-dd")
      ),
    ]);

    let currentStreak = 0;
    let checkDate = new Date();
    const todayStr = format(checkDate, "yyyy-MM-dd");

    if (!studyDays.has(todayStr)) {
      checkDate = subDays(checkDate, 1);
    }

    while (studyDays.has(format(checkDate, "yyyy-MM-dd"))) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }

    // 9. Heatmap
    const heatmap = [];
    for (let i = 27; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStr = format(day, "yyyy-MM-dd");
      const count =
        reviews.filter((r) => format(r.reviewedAt, "yyyy-MM-dd") === dayStr)
          .length +
        studySessions.filter(
          (s: any) =>
            format(s.completedAt || s.createdAt, "yyyy-MM-dd") === dayStr
        ).length;

      let level = 0;
      if (count > 0 && count <= 3) level = 1;
      else if (count <= 8) level = 2;
      else if (count <= 15) level = 3;
      else if (count > 15) level = 4;

      heatmap.push({ date: dayStr, count, level });
    }

    return NextResponse.json({
      journey: {
        hasObjective,
        daysRemaining: hasObjective ? daysRemaining : 0,
        weeksRemaining,
        daysLeftInWeek,
        percentage: journeyPercentage,
        totalTopics,
        completedTopics,
        remainingTopics: Math.max(0, totalTopics - completedTopics),
        topicsPerWeek,
      },
      metrics: {
        totalTimeFormatted: `${hours}h ${mins}m`,
        precision: `${precision}%`,
        sessionsCount: totalDecks + studySessions.length,
        questionsCount: totalQuestions,
        totalFlashcards: totalFlashcards,
        averageTimePerSession:
          totalDecks + studySessions.length > 0
            ? `${Math.round(totalMinutes / (totalDecks + studySessions.length))}min`
            : "0min",
      },
      streak: {
        currentDays: currentStreak,
        weekDays: [1, 2, 3, 4, 5, 6, 0].map((dayOfWeek: number) => {
          const targetDay = new Date(weekStart);
          targetDay.setDate(
            weekStart.getDate() + (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
          );
          return {
            dayLabel: format(targetDay, "ccccc"),
            active: studyDays.has(format(targetDay, "yyyy-MM-dd")),
          };
        }),
      },
      weeklyGoal: {
        percentage: weeklyProgress,
        target: weeklyGoalTarget,
        current: weeklyLogs.length,
      },
      heatmap,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar dados da dashboard:", error);
    return NextResponse.json(
      { error: "Falha ao carregar métricas da dashboard." },
      { status: 500 }
    );
  }
}
