import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

interface TopicData {
  id: string;
  title: string;
  easiness: number | null;
  interval: number | null;
  nextRev?: Date | null;
  nextReview?: Date | null;
}

interface SubjectData {
  id: string;
  name: string;
  topics: TopicData[];
}


interface StudySessionData {
  durationMinutes: number | null;
  createdAt: Date;
}

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 1. Busca matérias, tópicos, históricos e tentativas de simulado
    const [subjects, studySessions, quizAttempts] = await Promise.all([
      prisma.subject.findMany({
        where: { userId },
        include: {
          topics: {
            select: {
              id: true,
              title: true,
              easiness: true,
              interval: true,
              nextRev: true,
            },
          },
        },
      }),
      prisma.studySession.findMany({
        where: { userId },
        select: {
          durationMinutes: true,
          createdAt: true,
        },
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        select: {
          topicId: true,
          totalCount: true,
          correctCount: true,
          completedAt: true,
        },
      }),
    ]);

    // 2. Cálculo de métricas gerais do SM-2
    let totalTopics = 0;
    let sumEasiness = 0;
    let pendingReviewsCount = 0;
    const now = new Date();

    (subjects as SubjectData[]).forEach((sub: SubjectData) => {
      sub.topics.forEach((topic: TopicData) => {
        totalTopics++;
        sumEasiness += topic.easiness || 2.5;

        // Suporta tanto nextRev quanto fallback
        const reviewDate = topic.nextRev || topic.nextReview;
        if (reviewDate && new Date(reviewDate) <= now) {
          pendingReviewsCount++;
        }
      });
    });

    const avgEasiness = totalTopics > 0 ? sumEasiness / totalTopics : 2.5;
    const estimatedRetention = `${Math.min(
      98,
      Math.round((avgEasiness / 2.5) * 85),
    )}%`;

    // 3. Resumo de Qualidade de Feedback com base nos simulados reais
    let totalQuestions = 0;
    let correctCount = 0;

    quizAttempts.forEach((q) => {
      totalQuestions += q.totalCount;
      correctCount += q.correctCount;
    });

    const incorrectCount = Math.max(0, totalQuestions - correctCount);

    const performanceSummary = {
      bom: correctCount,
      dificil: Math.round(incorrectCount * 0.4),
      errei: Math.round(incorrectCount * 0.6),
    };

    // 4. Mapeamento de estatísticas por disciplina
    const subjectStats = (subjects as SubjectData[]).map((sub: SubjectData) => {
      const topicIds = new Set(sub.topics.map((t: TopicData) => t.id));
      const logs = quizAttempts.filter(
        (q) => q.topicId && topicIds.has(q.topicId),
      );
      const total = logs.reduce((acc, curr) => acc + curr.totalCount, 0);
      const correct = logs.reduce((acc, curr) => acc + curr.correctCount, 0);
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      return {
        subjectId: sub.id,
        subject: sub.name,
        total,
        correct,
        accuracy,
        targetWeeklyMinutes: 120,
      };
    });

    // 5. Identificação dos Pontos Fracos (< 60% de acerto com pelo menos 3 questões)
    const weakTopics: Array<{
      id: string;
      title: string;
      subject: string;
      accuracy: number;
      total: number;
    }> = [];

    (subjects as SubjectData[]).forEach((sub: SubjectData) => {
      sub.topics.forEach((topic: TopicData) => {
        const logs = quizAttempts.filter((q) => q.topicId === topic.id);
        const total = logs.reduce((acc, curr) => acc + curr.totalCount, 0);
        const correct = logs.reduce((acc, curr) => acc + curr.correctCount, 0);

        if (total >= 3) {
          const accuracy = Math.round((correct / total) * 100);
          if (accuracy < 60) {
            weakTopics.push({
              id: topic.id,
              title: topic.title,
              subject: sub.name,
              accuracy,
              total,
            });
          }
        }
      });
    });

    // 6. Carga de revisão dos últimos 7 dias da semana
    const daysOfWeek = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
    const chartDistribution = daysOfWeek.map((dayLabel, index) => {
      const count = (studySessions as StudySessionData[]).filter(
        (s: StudySessionData) => {
          const day = new Date(s.createdAt).getDay();
          return day === index;
        },
      ).length;

      return {
        day: dayLabel,
        quantidade: count,
      };
    });

    return NextResponse.json({
      metrics: {
        totalTopics,
        completedReviews: studySessions.length,
        estimatedRetention,
        avgEasiness,
        materiasPendentes: pendingReviewsCount,
      },
      chartDistribution,
      performanceSummary,
      subjectStats,
      weakTopics,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas de performance:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar estatísticas" },
      { status: 500 },
    );
  }
}
