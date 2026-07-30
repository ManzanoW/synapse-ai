import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ReviewHistoryItem {
  id: string;
  grade: string | number;
  createdAt?: Date | string;
  reviewedAt?: Date | string;
}

// 🟢 Tipo defensivo sem utilizar `any`
interface DynamicFlashcard {
  easiness?: number;
  easeFactor?: number;
  dueDate?: Date | string;
  nextReview?: Date | string;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const now = new Date();

    // 1. Buscar todas as revisões do log
    const reviews = await prisma.reviewHistory.findMany();

    const completedReviews = reviews.length;

    // Helper para converter a nota/grau
    const parseGrade = (grade: string | number): number => {
      if (typeof grade === "number") return grade;
      if (grade === "ERRI") return 1;
      if (grade === "DIFICIL") return 3;
      if (grade === "BOM") return 5;
      const parsed = parseInt(grade, 10);
      return isNaN(parsed) ? 3 : parsed;
    };

    // 2. Classificação de performance SM-2
    const performanceSummary = {
      errei: reviews.filter((r: ReviewHistoryItem) => parseGrade(r.grade) < 3)
        .length,
      dificil: reviews.filter(
        (r: ReviewHistoryItem) => parseGrade(r.grade) === 3,
      ).length,
      bom: reviews.filter((r: ReviewHistoryItem) => parseGrade(r.grade) >= 4)
        .length,
    };

    // 3. Retenção Estimada
    const totalAcertos = performanceSummary.bom + performanceSummary.dificil;
    const estimatedRetention =
      completedReviews > 0
        ? `${Math.round((totalAcertos / completedReviews) * 100)}%`
        : "100%";

    // 4. Buscar Flashcards sem o `select` engessado
    const flashcards = await prisma.flashcard.findMany();

    const totalCards = flashcards.length;

    // Acessamos as propriedades de forma segura utilizando o tipo DynamicFlashcard
    const avgEasiness =
      totalCards > 0
        ? Number(
            (
              (flashcards as DynamicFlashcard[]).reduce((acc, c) => {
                const val = c.easiness ?? c.easeFactor ?? 2.5;
                return acc + (typeof val === "number" ? val : 2.5);
              }, 0) / totalCards
            ).toFixed(2),
          )
        : 2.5;

    // 5. Cards pendentes para hoje
    const materiasPendentes = (flashcards as DynamicFlashcard[]).filter(
      (card) => {
        const targetDate = card.dueDate || card.nextReview;
        return targetDate && new Date(targetDate as string | Date) <= now;
      },
    ).length;

    // 6. Carga de Revisões dos Últimos 7 dias
    const daysMap: Record<string, number> = {};
    const weekDaysNames = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = weekDaysNames[d.getDay()];
      daysMap[dayLabel] = 0;
    }

    reviews.forEach((r: ReviewHistoryItem) => {
      const itemDate = r.createdAt || r.reviewedAt;
      if (itemDate) {
        const dayName = weekDaysNames[new Date(itemDate).getDay()];
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

    const totalTopics = await prisma.deck.count();

    return NextResponse.json({
      metrics: {
        totalTopics,
        completedReviews,
        estimatedRetention,
        avgEasiness,
        materiasPendentes,
      },
      chartDistribution,
      performanceSummary,
    });
  } catch (error) {
    console.error("Erro na rota de performance:", error);
    return NextResponse.json(
      { error: "Erro ao carregar estatísticas do banco de dados." },
      { status: 500 },
    );
  }
}
