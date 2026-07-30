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
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Segunda-feira
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // 1. Busca todo o histórico de revisões do usuário através dos seus tópicos
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
      },
      orderBy: { reviewedAt: "desc" },
    });

    // 2. Busca o número total de Decks e Flashcards criados para métricas dinâmicas
    const totalDecks = await prisma.deck.count({ where: { userId } });
    const totalFlashcards = await prisma.flashcard.count({
      where: { deck: { userId } },
    });

    // 3. Cálculos de Desempenho
    const totalQuestions = reviews.length;
    // Considera "BOM" ou "FACIL" (ou notas numéricas >= 3) como resposta correta
    const correctQuestions = reviews.filter((r) => {
      const g = r.grade.toUpperCase();
      return (
        g === "FACIL" || g === "BOM" || g === "3" || g === "4" || g === "5"
      );
    }).length;

    const precision =
      totalQuestions > 0
        ? Math.round((correctQuestions / totalQuestions) * 100)
        : 0;

    // Estimativa de tempo total de estudo (2 min por cartão revisado)
    const totalMinutes = totalQuestions * 2;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    // 4. Meta Semanal (Baseada nos logs da semana atual)
    const weeklyLogs = reviews.filter(
      (r) => r.reviewedAt >= weekStart && r.reviewedAt <= weekEnd,
    );
    const weeklyGoalTarget = 50; // Alvo dinâmico de revisões por semana
    const weeklyProgress = Math.min(
      100,
      Math.round((weeklyLogs.length / weeklyGoalTarget) * 100),
    );

    // 5. Cálculo de Constância (Streak)
    let currentStreak = 0;
    let checkDate = new Date();

    const studyDays = new Set<string>(
      reviews.map((r) => format(r.reviewedAt, "yyyy-MM-dd")),
    );

    while (studyDays.has(format(checkDate, "yyyy-MM-dd"))) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }

    // 6. Heatmap de Intensidade (Matriz de 28 dias)
    const heatmap = [];
    for (let i = 27; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStr = format(day, "yyyy-MM-dd");
      const count = reviews.filter(
        (r) => format(r.reviewedAt, "yyyy-MM-dd") === dayStr,
      ).length;

      let level = 0;
      if (count > 0 && count <= 3) level = 1;
      else if (count <= 8) level = 2;
      else if (count <= 15) level = 3;
      else if (count > 15) level = 4;

      heatmap.push({ date: dayStr, count, level });
    }

    return NextResponse.json({
      metrics: {
        totalTimeFormatted: `${hours}h ${mins}m`,
        precision: `${precision}%`,
        sessionsCount: totalDecks,
        questionsCount: totalQuestions,
        totalFlashcards: totalFlashcards,
        averageTimePerSession:
          totalDecks > 0
            ? `${Math.round(totalMinutes / totalDecks)}min`
            : "0min",
      },
      streak: {
        currentDays: currentStreak,
        weekDays: [1, 2, 3, 4, 5, 6, 0].map((dayOfWeek: number) => {
          const targetDay = new Date(weekStart);
          targetDay.setDate(
            weekStart.getDate() + (dayOfWeek === 0 ? 6 : dayOfWeek - 1),
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
      { status: 500 },
    );
  }
}
