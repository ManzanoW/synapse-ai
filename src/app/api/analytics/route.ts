import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePerformance, Quiz, Question } from "@/lib/analytics-utils";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 🔒 Filtra Quizzes onde o Tópico associado pertence a uma Matéria do Usuário
    const rawQuizzes = await prisma.quiz.findMany({
      where: {
        topic: {
          subject: {
            userId: userId,
          },
        },
      },
    });

    const allQuizzes: Quiz[] = rawQuizzes.map((q) => ({
      ...q,
      questions: q.questions as unknown as Question[],
    }));

    const stats = calculatePerformance(allQuizzes);

    const hoje = new Date();

    const materiasPendentes = await prisma.subject.count({
      where: {
        userId,
        nextReview: { lte: hoje },
      },
    });

    const data = {
      metrics: {
        totalTopics: Object.keys(stats.performanceBySubject).length,
        completedReviews: allQuizzes.length,
        estimatedRetention:
          stats.totalQuestions > 0
            ? `${Math.round((stats.totalCorrect / stats.totalQuestions) * 100)}%`
            : "0%",
        avgEasiness: 2.5,
        materiasPendentes: materiasPendentes,
      },
      chartDistribution: [
        { day: "SEG", quantidade: 2 },
        { day: "TER", quantidade: 5 },
        { day: "QUA", quantidade: 3 },
        { day: "QUI", quantidade: 7 },
        { day: "SEX", quantidade: 1 },
        { day: "SAB", quantidade: 0 },
        { day: "DOM", quantidade: 4 },
      ],
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
