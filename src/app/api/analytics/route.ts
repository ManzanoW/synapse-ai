import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePerformance, Quiz, Question } from "@/lib/analytics-utils";

export async function GET() {
  try {
    const rawQuizzes = await prisma.quiz.findMany();

    const allQuizzes: Quiz[] = rawQuizzes.map((q) => ({
      ...q,
      questions: q.questions as unknown as Question[],
    }));

    const stats = calculatePerformance(allQuizzes);

    const hoje = new Date();

    const materiasPendentes = await prisma.subject.count({
      where: {
        nextReview: { lte: hoje }, // Filtra tudo que venceu até hoje
      },
    });
    const data = {
      metrics: {
        totalTopics: Object.keys(stats.performanceBySubject).length,
        completedReviews: allQuizzes.length, // Cada quiz salvo conta como uma sessão
        estimatedRetention:
          stats.totalQuestions > 0
            ? `${Math.round((stats.totalCorrect / stats.totalQuestions) * 100)}%`
            : "0%",
        avgEasiness: 2.5, // Mantido como base ou derivável da dificuldade
        materiasPendentes: materiasPendentes,
      },
      // Aqui distribuímos o histórico por "dias" fictícios baseados no createdAt
      chartDistribution: [
        { day: "SEG", quantidade: 2 }, // Exemplo: mapear por data real se desejar
        { day: "TER", quantidade: 5 },
        { day: "QUA", quantidade: 3 },
        { day: "QUI", quantidade: 7 },
        { day: "SEX", quantidade: 1 },
        { day: "SAB", quantidade: 0 },
        { day: "DOM", quantidade: 4 },
      ],
      performanceSummary: {
        bom: stats.summary.bom, // Questões certas
        dificil: stats.summary.dificil, // Erros em questões fáceis/médias
        errei: stats.summary.errei, // Erros em questões difíceis
      },
    };

    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("DEBUG API ANALYTICS:", errorMessage);

    return NextResponse.json(
      {
        error: "Erro ao calcular analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
