import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { subDays, format } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 98 dias = 14 semanas (preenche perfeitamente a matriz 14x7 do componente Heatmap)
    const ninetyEightDaysAgo = subDays(new Date(), 97);

    // 🔒 Busca em paralelo todas as frentes de estudo do aluno no período
    const [reviews, quizAttempts, studySessions, essays] = await Promise.all([
      // 1. Revisões de tópicos / flashcards
      prisma.reviewHistory.findMany({
        where: {
          topic: {
            subject: {
              userId: userId,
            },
          },
          reviewedAt: {
            gte: ninetyEightDaysAgo,
          },
        },
        select: {
          reviewedAt: true,
        },
      }),

      // 2. Simulados e quizzes resolvidos
      prisma.quizAttempt.findMany({
        where: {
          userId: userId,
          completedAt: {
            gte: ninetyEightDaysAgo,
          },
        },
        select: {
          completedAt: true,
        },
      }),

      // 3. Sessões de estudo registradas
      prisma.studySession.findMany({
        where: {
          userId: userId,
          date: {
            gte: ninetyEightDaysAgo,
          },
        },
        select: {
          date: true,
        },
      }),

      // 4. Redações discursivas avaliadas
      prisma.essaySubmission.findMany({
        where: {
          userId: userId,
          createdAt: {
            gte: ninetyEightDaysAgo,
          },
        },
        select: {
          createdAt: true,
        },
      }),
    ]);

    // Agrupa por data no formato YYYY-MM-DD
    const counts: Record<string, number> = {};

    reviews.forEach((r) => {
      const dateKey = format(r.reviewedAt, "yyyy-MM-dd");
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });

    quizAttempts.forEach((q) => {
      const dateKey = format(q.completedAt, "yyyy-MM-dd");
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });

    studySessions.forEach((s) => {
      const dateKey = format(s.date, "yyyy-MM-dd");
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });

    essays.forEach((e) => {
      const dateKey = format(e.createdAt, "yyyy-MM-dd");
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });

    return NextResponse.json({ data: counts });
  } catch (error) {
    console.error("❌ Erro ao buscar histórico de analytics:", error);
    return NextResponse.json(
      { error: "Falha ao buscar histórico" },
      { status: 500 },
    );
  }
}
