import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePerformance, Question } from "@/lib/analytics-utils";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 🔒 Filtra os Quizzes do usuário logado
    const rawQuizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          { userId: userId },
          {
            topic: {
              subject: {
                userId: userId,
              },
            },
          },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // Mapeamento fortemente tipado (sem nenhum `any`)
    const allQuizzes = rawQuizzes.map((q) => ({
      id: q.id,
      banca: q.banca,
      subject: q.subject,
      difficulty: q.difficulty,
      createdAt: q.createdAt,
      userId: q.userId,
      topicId: q.topicId,
      questions: q.questions as unknown as Question[],
    }));

    // Agora é passado sem necessidade do cast `as any`
    const stats = calculatePerformance(allQuizzes);

    const hoje = new Date();

    // 1. Matérias pendentes de revisão
    const materiasPendentes = await prisma.subject.count({
      where: {
        userId,
        nextReview: { lte: hoje },
      },
    });

    // 2. Média Real do Easiness Factor (EF)
    const subjects = await prisma.subject.findMany({
      where: { userId },
      select: { easiness: true },
    });

    const avgEasiness =
      subjects.length > 0
        ? Number(
            (
              subjects.reduce((acc, s) => acc + (s.easiness ?? 2.5), 0) /
              subjects.length
            ).toFixed(2),
          )
        : 2.5;

    // 3. Distribuição REAL dos últimos 7 dias
    const weekDaysNames = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
    const daysMap: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = weekDaysNames[d.getDay()];
      daysMap[dayLabel] = 0;
    }

    allQuizzes.forEach((quiz) => {
      if (quiz.createdAt) {
        const dayName = weekDaysNames[new Date(quiz.createdAt).getDay()];
        if (daysMap[dayName] !== undefined) {
          daysMap[dayName] += 1;
        }
      }
    });

    const chartDistribution = Object.entries(daysMap).map(
      ([day, quantidade]) => ({
        day,
        quantidade,
      }),
    );

    const data = {
      metrics: {
        totalTopics: Object.keys(stats.performanceBySubject).length,
        completedReviews: allQuizzes.length,
        estimatedRetention:
          stats.totalQuestions > 0
            ? `${Math.round((stats.totalCorrect / stats.totalQuestions) * 100)}%`
            : "0%",
        avgEasiness,
        materiasPendentes,
      },
      chartDistribution,
      performanceSummary: {
        bom: stats.summary.bom,
        dificil: stats.summary.dificil,
        errei: stats.summary.errei,
      },
    };

    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("DEBUG API ANALYTICS:", errorMessage);

    return NextResponse.json(
      {
        error: "Erro ao calcular analytics",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
