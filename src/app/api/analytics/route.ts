import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Ajuste o import conforme a estrutura do seu projeto

// Mock temporário para o ID do usuário
const REAL_USER_ID = "user_default_id";

export async function GET() {
  try {
    const now = new Date();

    // 1. Busca todos os tópicos do usuário para calcular as médias macros
    const allTopics = await prisma.topic.findMany({
      where: {
        subject: { userId: REAL_USER_ID },
      },
      select: {
        easiness: true,
        interval: true,
        firstStudy: true,
        nextRev: true,
      },
    });

    // 2. Calcula o Fator de Facilidade Médio (Métrica de Retenção)
    const studiedTopics = allTopics.filter((t) => t.firstStudy !== "Pendente");
    const totalStudied = studiedTopics.length;

    const avgEasiness =
      totalStudied > 0
        ? studiedTopics.reduce((acc, curr) => acc + (curr.easiness ?? 2.5), 0) /
          totalStudied
        : 2.5;

    // Traduz o Easiness Factor em uma porcentagem amigável de retenção estimada
    // 2.5 de EF costuma equivaler a ~85% de retenção na curva teórica do SM-2
    const estimatedRetention = Math.min(
      Math.round((avgEasiness / 3.0) * 100),
      100,
    );

    // 3. Calcula o volume da fila de revisões para os próximos 7 dias
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(now.getDate() + i);
      return date.toDateString();
    });

    const revisionDistribution = next7Days.map((dayStr) => {
      const count = allTopics.filter(
        (t) => t.nextRev && new Date(t.nextRev).toDateString() === dayStr,
      ).length;
      return {
        day: new Date(dayStr).toLocaleDateString("pt-BR", { weekday: "short" }),
        quantidade: count,
      };
    });

    // 4. Busca o histórico recente de cliques para ver a constância de desempenho
    const history = await prisma.reviewHistory.findMany({
      where: {
        topic: { subject: { userId: REAL_USER_ID } },
      },
      take: 10,
      orderBy: { reviewedAt: "desc" },
    });

    const performanceSummary = {
      bom: history.filter((h) => h.grade === "Bom").length,
      dificil: history.filter((h) => h.grade === "Difícil").length,
      errei: history.filter((h) => h.grade === "Errei").length,
    };

    return NextResponse.json(
      {
        metrics: {
          totalTopics: allTopics.length,
          completedReviews: history.length,
          estimatedRetention:
            totalStudied > 0 ? `${estimatedRetention}%` : "0%",
          avgEasiness: Number(avgEasiness.toFixed(2)),
        },
        chartDistribution: revisionDistribution,
        performanceSummary,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}
