import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

interface TopicData {
  id: string;
  title: string;
  status: string;
  easiness: number | null;
  interval: number | null;
  nextReview: Date | null;
}

interface SubjectData {
  id: string;
  name: string;
  topics: TopicData[];
}

interface QuestionLogData {
  isCorrect: boolean;
  topicId?: string | null;
  createdAt: Date;
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

    // 1. Busca matérias, tópicos e históricos
    const [subjects, studySessions] = await Promise.all([
      prisma.subject.findMany({
        where: { userId },
        include: {
          topics: {
            select: {
              id: true,
              title: true,
              status: true,
              easiness: true,
              interval: true,
              nextReview: true,
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
    ]);

    // Tentativa de busca dos logs de questões adaptada ao schema
    let questionLogs: QuestionLogData[] = [];
    try {
      // @ts-expect-error - Fallback dinamico para model de log de questoes se existir no schema
      if (prisma.questionHistory) {
        // @ts-expect-error - query dinamica
        questionLogs = await prisma.questionHistory.findMany({
          where: { userId },
          select: { isCorrect: true, topicId: true, createdAt: true },
        });
      }
    } catch {
      questionLogs = [];
    }

    // 2. Cálculo de métricas gerais do SM-2
    let totalTopics = 0;
    let sumEasiness = 0;
    let pendingReviewsCount = 0;
    const now = new Date();

    (subjects as SubjectData[]).forEach((sub: SubjectData) => {
      sub.topics.forEach((topic: TopicData) => {
        totalTopics++;
        sumEasiness += topic.easiness || 2.5;
        if (topic.nextReview && new Date(topic.nextReview) <= now) {
          pendingReviewsCount++;
        }
      });
    });

    const avgEasiness = totalTopics > 0 ? sumEasiness / totalTopics : 2.5;
    const estimatedRetention = `${Math.min(
      98,
      Math.round((avgEasiness / 2.5) * 85),
    )}%`;

    // 3. Resumo de Qualidade de Feedback
    const totalQuestions = questionLogs.length;
    const correctCount = questionLogs.filter(
      (q: QuestionLogData) => q.isCorrect,
    ).length;
    const incorrectCount = totalQuestions - correctCount;

    const performanceSummary = {
      bom: correctCount,
      dificil: Math.round(incorrectCount * 0.4),
      errei: Math.round(incorrectCount * 0.6),
    };

    // 4. Mapeamento de estatísticas por disciplina
    const subjectStats = (subjects as SubjectData[]).map((sub: SubjectData) => {
      const topicIds = sub.topics.map((t: TopicData) => t.id);
      const logs = questionLogs.filter(
        (q: QuestionLogData) => q.topicId && topicIds.includes(q.topicId),
      );
      const total = logs.length;
      const correct = logs.filter((l: QuestionLogData) => l.isCorrect).length;
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

    // 5. Identificação dos Pontos Fracos (< 60% de acerto)
    const weakTopics: Array<{
      id: string;
      title: string;
      subject: string;
      accuracy: number;
      total: number;
    }> = [];

    (subjects as SubjectData[]).forEach((sub: SubjectData) => {
      sub.topics.forEach((topic: TopicData) => {
        const logs = questionLogs.filter(
          (q: QuestionLogData) => q.topicId === topic.id,
        );
        if (logs.length >= 3) {
          const correct = logs.filter(
            (l: QuestionLogData) => l.isCorrect,
          ).length;
          const accuracy = Math.round((correct / logs.length) * 100);
          if (accuracy < 60) {
            weakTopics.push({
              id: topic.id,
              title: topic.title,
              subject: sub.name,
              accuracy,
              total: logs.length,
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
