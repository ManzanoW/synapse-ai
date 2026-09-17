import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  calculateMemoryRetention,
  getMemoryStatus,
  classifyCardMaturity,
  isLeechCard,
} from "@/lib/spaced-repetition";

interface TopicData {
  id: string;
  title: string;
  easiness: number | null;
  interval: number | null;
  nextRev?: Date | null;
  firstStudy?: string | null;
  reviewHistories?: Array<{ grade: string; reviewedAt: Date }>;
  quizAttempts?: Array<{ totalCount: number; correctCount: number }>;
}

interface SubjectData {
  id: string;
  name: string;
  priority?: number | null;
  weight?: number | null;
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

    // 1. Busca todas as entidades reais com dados de estudo do usuário
    const [subjects, studySessions, quizAttempts, flashcards, reviewHistories] =
      await Promise.all([
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
                firstStudy: true,
                reviewHistories: {
                  select: {
                    grade: true,
                    reviewedAt: true,
                  },
                },
                quizAttempts: {
                  select: {
                    totalCount: true,
                    correctCount: true,
                  },
                },
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
        prisma.flashcard.findMany({
          where: { deck: { userId } },
          select: {
            id: true,
            stability: true,
            difficulty: true,
            repetitions: true,
            lapses: true,
            lastReviewed: true,
            nextReviewDate: true,
          },
        }),
        prisma.reviewHistory.findMany({
          where: {
            topic: {
              subject: {
                userId,
              },
            },
          },
          select: {
            grade: true,
            reviewedAt: true,
          },
        }),
      ]);

    // 2. Metadados de Tópicos e Revisões Pendentes
    let totalTopics = 0;
    let sumEasiness = 0;
    let pendingReviewsCount = 0;
    let studiedTopicsCount = 0;
    const now = new Date();

    (subjects as SubjectData[]).forEach((sub: SubjectData) => {
      sub.topics.forEach((topic: TopicData) => {
        totalTopics++;
        sumEasiness += topic.easiness || 2.5;

        // Se a revisão estiver agendada para antes de agora
        if (topic.nextRev && new Date(topic.nextRev) <= now) {
          pendingReviewsCount++;
        }

        // Tópico iniciado/estudado
        const hasQuiz = (topic.quizAttempts?.length ?? 0) > 0;
        const hasReviews = (topic.reviewHistories?.length ?? 0) > 0;
        const isNotPending = topic.firstStudy && topic.firstStudy !== "Pendente";
        if (hasQuiz || hasReviews || isNotPending) {
          studiedTopicsCount++;
        }
      });
    });

    const avgEasiness = totalTopics > 0 ? Number((sumEasiness / totalTopics).toFixed(2)) : 2.5;

    // 3. FSRS Real: Retenção de Memória & Pipeline de Maturidade
    const totalCards = flashcards.length;
    let newCards = 0;
    let learningCards = 0;
    let matureCards = 0;
    let leechCards = 0;
    const cardRetentions: number[] = [];

    flashcards.forEach((card) => {
      const maturity = classifyCardMaturity(card.repetitions, card.stability);
      if (maturity === "NEW") newCards++;
      else if (maturity === "LEARNING") learningCards++;
      else if (maturity === "MATURE") matureCards++;

      if (isLeechCard(card.lapses, card.repetitions)) {
        leechCards++;
      }

      if (card.lastReviewed) {
        const retention = calculateMemoryRetention(card.stability, card.lastReviewed, now);
        cardRetentions.push(retention);
      }
    });

    // 4. Questões / Simulados Reais
    let totalQuizQuestions = 0;
    let correctQuizQuestions = 0;

    quizAttempts.forEach((q) => {
      totalQuizQuestions += q.totalCount;
      correctQuizQuestions += q.correctCount;
    });

    const incorrectQuizQuestions = Math.max(0, totalQuizQuestions - correctQuizQuestions);
    const overallQuizAccuracy =
      totalQuizQuestions > 0
        ? Math.round((correctQuizQuestions / totalQuizQuestions) * 100)
        : null;

    // Cálculo da taxa de retenção autêntica
    let retentionValue: number;
    let retentionStatus;

    if (cardRetentions.length > 0) {
      // Tem flashcards com revisões reais -> média ponderada das retenções atuais
      retentionValue = Math.round(
        cardRetentions.reduce((acc, curr) => acc + curr, 0) / cardRetentions.length,
      );
      retentionStatus = getMemoryStatus(retentionValue);
    } else if (totalQuizQuestions > 0 && overallQuizAccuracy !== null) {
      // Fallback em simulados reais
      retentionValue = overallQuizAccuracy;
      retentionStatus = getMemoryStatus(retentionValue);
    } else {
      // Sem dados históricos
      retentionValue = 100;
      retentionStatus = {
        status: "OPTIMAL" as const,
        label: "Calibração Inicial",
        description: "Inicie suas revisões para calcular sua curva de esquecimento FSRS real.",
        color: "emerald" as const,
        bgBadge: "bg-indigo-500/15",
        textBadge: "text-indigo-300",
        borderBadge: "border-indigo-500/30",
      };
    }

    const estimatedRetention = cardRetentions.length > 0 || totalQuizQuestions > 0
      ? `${retentionValue}%`
      : "100%";

    // 5. Qualidade da Memorização 100% Real (ReviewHistory + QuizAttempts)
    let bomCount = 0;
    let dificilCount = 0;
    let erreiCount = 0;

    if (reviewHistories.length > 0) {
      reviewHistories.forEach((rh) => {
        if (rh.grade === "1") erreiCount++;
        else if (rh.grade === "2") dificilCount++;
        else if (rh.grade === "3" || rh.grade === "4") bomCount++;
      });
      // Soma também os acertos e erros dos simulados
      bomCount += correctQuizQuestions;
      erreiCount += incorrectQuizQuestions;
    } else {
      // Baseado puramente nos simulados (sem multiplicação arbitrária)
      bomCount = correctQuizQuestions;
      dificilCount = 0;
      erreiCount = incorrectQuizQuestions;
    }

    const performanceSummary = {
      bom: bomCount,
      dificil: dificilCount,
      errei: erreiCount,
      total: bomCount + dificilCount + erreiCount,
      source: (reviewHistories.length > 0 && totalQuizQuestions > 0)
        ? "mixed"
        : (reviewHistories.length > 0 ? "flashcard" : (totalQuizQuestions > 0 ? "quiz" : "none")),
    };

    // 6. Grau de Domínio Cognitivo (Mastery Score de 0.0 a 10.0)
    // Ponderação transparente: 50% Acurácia em Questões, 30% Retenção FSRS, 20% Cobertura do Edital
    const quizScore = overallQuizAccuracy !== null ? (overallQuizAccuracy / 100) * 10 : 0;
    const retentionScore = (retentionValue / 100) * 10;
    const coverageRate = totalTopics > 0 ? studiedTopicsCount / totalTopics : 0;
    const coverageScore = coverageRate * 10;

    let masteryScore = 0.0;
    let masteryLevel = "Fase Inicial";
    let badgeColor: "rose" | "amber" | "indigo" | "emerald" = "rose";

    const hasAnyStudyActivity =
      totalQuizQuestions > 0 || cardRetentions.length > 0 || studiedTopicsCount > 0;

    if (hasAnyStudyActivity) {
      const weightedRaw = (quizScore * 0.5) + (retentionScore * 0.3) + (coverageScore * 0.2);
      masteryScore = Number(Math.min(10.0, Math.max(0.0, weightedRaw)).toFixed(1));

      if (masteryScore >= 8.5) {
        masteryLevel = "Alta Maestria";
        badgeColor = "emerald";
      } else if (masteryScore >= 6.5) {
        masteryLevel = "Consolidado";
        badgeColor = "indigo";
      } else if (masteryScore >= 4.0) {
        masteryLevel = "Em Desenvolvimento";
        badgeColor = "amber";
      } else {
        masteryLevel = "Fase Inicial";
        badgeColor = "rose";
      }
    } else {
      masteryScore = 0.0;
      masteryLevel = "Fase Inicial";
      badgeColor = "rose";
    }

    // Busca também a meta semanal do usuário
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { weeklyGoalHours: true },
    });

    const userWeeklyHours = userRecord?.weeklyGoalHours || 10;
    const totalWeeklyMinutesCalc = userWeeklyHours * 60;
    const totalWeight = subjects.reduce((acc, s) => acc + (s.weight || 5), 0);

    // 7. Estatísticas por Disciplina (Deduplicadas e com diferenciação de atividades)
    const subjectMap = new Map<string, {
      subjectId: string;
      subject: string;
      total: number;
      correct: number;
      baseWeeklyMinutes: number;
      targetWeeklyMinutes: number;
    }>();

    (subjects as SubjectData[]).forEach((sub: SubjectData) => {
      const key = sub.name.trim().toLowerCase();
      const topicIds = new Set(sub.topics.map((t: TopicData) => t.id));
      const logs = quizAttempts.filter(
        (q) => q.topicId && topicIds.has(q.topicId),
      );
      const total = logs.reduce((acc, curr) => acc + curr.totalCount, 0);
      const correct = logs.reduce((acc, curr) => acc + curr.correctCount, 0);

      const baseWeeklyMinutes = Math.round(
        (totalWeeklyMinutesCalc * (sub.weight || 5)) / Math.max(1, totalWeight),
      );
      const targetWeeklyMinutes =
        sub.priority && sub.priority > 10
          ? Math.round(sub.priority)
          : baseWeeklyMinutes;

      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          subjectId: sub.id,
          subject: sub.name,
          total,
          correct,
          baseWeeklyMinutes,
          targetWeeklyMinutes,
        });
      } else {
        const existing = subjectMap.get(key)!;
        existing.total += total;
        existing.correct += correct;
      }
    });

    const subjectStats = Array.from(subjectMap.values()).map((item) => {
      const hasActivity = item.total > 0;
      const accuracy = hasActivity ? Math.round((item.correct / item.total) * 100) : null;
      const isReinforced =
        hasActivity &&
        item.total >= 3 &&
        accuracy !== null &&
        accuracy < 65 &&
        item.targetWeeklyMinutes > item.baseWeeklyMinutes * 1.1;
      const isOptimized =
        hasActivity &&
        item.total >= 5 &&
        accuracy !== null &&
        accuracy > 85 &&
        item.targetWeeklyMinutes < item.baseWeeklyMinutes * 0.95;

      return {
        subjectId: item.subjectId,
        subject: item.subject,
        total: item.total,
        correct: item.correct,
        hasActivity,
        accuracy,
        baseWeeklyMinutes: item.baseWeeklyMinutes,
        targetWeeklyMinutes: item.targetWeeklyMinutes,
        isReinforced,
        isOptimized,
      };
    });

    // 8. Rebalanceador Inteligente: Sugestões Precisas (Exclui matérias não testadas)
    const highPrioritySubjects = subjectStats.filter(
      (s) => s.hasActivity && s.total >= 3 && s.accuracy !== null && s.accuracy < 65,
    );
    const optimizedSubjects = subjectStats.filter(
      (s) => s.hasActivity && s.total >= 5 && s.accuracy !== null && s.accuracy > 85,
    );
    const untestedCount = subjectStats.filter(
      (s) => !s.hasActivity || s.total < 3,
    ).length;

    // Se as matérias com déficit já possuem minutos superiores à base (+25%), a calibração já está ativa
    const isRebalanceApplied =
      highPrioritySubjects.length > 0 &&
      highPrioritySubjects.some((s) => s.isReinforced);

    // 9. Pontos Fracos (< 60% de acerto com pelo menos 3 questões)
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

    // 10. Carga de revisão da semana
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
        retentionValue,
        retentionStatus,
        avgEasiness,
        materiasPendentes: pendingReviewsCount,
        cognitiveMastery: {
          score: masteryScore,
          level: masteryLevel,
          badgeColor,
          components: {
            quizAccuracy: overallQuizAccuracy,
            quizScore: Number(quizScore.toFixed(1)),
            memoryRetention: retentionValue,
            retentionScore: Number(retentionScore.toFixed(1)),
            editalCoverage: Math.round(coverageRate * 100),
            coverageScore: Number(coverageScore.toFixed(1)),
            studiedTopicsCount,
            totalTopics,
            totalQuizQuestions,
          },
        },
        fsrsMaturity: {
          totalCards,
          newCards,
          learningCards,
          matureCards,
          leechCards,
        },
      },
      chartDistribution,
      performanceSummary,
      subjectStats,
      rebalanceSuggestions: {
        needsRebalance: highPrioritySubjects.length > 0 || optimizedSubjects.length > 0,
        isApplied: isRebalanceApplied,
        highPriority: highPrioritySubjects,
        optimized: optimizedSubjects,
        untestedCount,
      },
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
