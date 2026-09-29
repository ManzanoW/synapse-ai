import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  calculateMemoryRetention,
  getMemoryStatus,
  classifyCardMaturity,
  isLeechCard,
} from "@/lib/spaced-repetition";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const now = new Date();

    // 1. Consultas paralelas otimizadas com projeções seletivas
    const [
      subjects,
      studySessions,
      quizAttempts,
      flashcards,
      reviewHistories,
      userRecord,
    ] = await Promise.all([
      prisma.subject.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          priority: true,
          weight: true,
          topics: {
            select: {
              id: true,
              title: true,
              easiness: true,
              interval: true,
              nextRev: true,
              firstStudy: true,
            },
          },
        },
      }),
      prisma.studySession.findMany({
        where: { userId },
        select: {
          createdAt: true,
        },
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        select: {
          topicId: true,
          totalCount: true,
          correctCount: true,
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
          topicId: true,
          grade: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { weeklyGoalHours: true },
      }),
    ]);

    // 2. Indexação em Hash Maps O(1) para evitar .filter() dentro de loops de tópicos
    const quizStatsByTopic = new Map<string, { total: number; correct: number }>();
    let totalQuizQuestions = 0;
    let correctQuizQuestions = 0;

    for (const q of quizAttempts) {
      totalQuizQuestions += q.totalCount;
      correctQuizQuestions += q.correctCount;

      if (q.topicId) {
        const existing = quizStatsByTopic.get(q.topicId) || { total: 0, correct: 0 };
        existing.total += q.totalCount;
        existing.correct += q.correctCount;
        quizStatsByTopic.set(q.topicId, existing);
      }
    }

    const reviewCountsByTopic = new Map<string, number>();
    let bomCount = 0;
    let dificilCount = 0;
    let erreiCount = 0;

    for (const rh of reviewHistories) {
      if (rh.topicId) {
        reviewCountsByTopic.set(rh.topicId, (reviewCountsByTopic.get(rh.topicId) || 0) + 1);
      }
      if (rh.grade === "1") erreiCount++;
      else if (rh.grade === "2") dificilCount++;
      else if (rh.grade === "3" || rh.grade === "4") bomCount++;
    }

    // 3. Metadados de Tópicos, Revisões Pendentes e Pontos Fracos
    let totalTopics = 0;
    let sumEasiness = 0;
    let pendingReviewsCount = 0;
    let studiedTopicsCount = 0;

    const weakTopics: Array<{
      id: string;
      title: string;
      subject: string;
      accuracy: number;
      total: number;
    }> = [];

    for (const sub of subjects) {
      for (const topic of sub.topics) {
        totalTopics++;
        sumEasiness += topic.easiness || 2.5;

        if (topic.nextRev && new Date(topic.nextRev) <= now) {
          pendingReviewsCount++;
        }

        const topicQuiz = quizStatsByTopic.get(topic.id);
        const hasQuiz = (topicQuiz?.total ?? 0) > 0;
        const hasReviews = (reviewCountsByTopic.get(topic.id) ?? 0) > 0;
        const isNotPending = topic.firstStudy && topic.firstStudy !== "Pendente";

        if (hasQuiz || hasReviews || isNotPending) {
          studiedTopicsCount++;
        }

        // Diagnóstico de Pontos Fracos (< 60% de acerto com pelo menos 3 questões)
        if (topicQuiz && topicQuiz.total >= 3) {
          const accuracy = Math.round((topicQuiz.correct / topicQuiz.total) * 100);
          if (accuracy < 60) {
            weakTopics.push({
              id: topic.id,
              title: topic.title,
              subject: sub.name,
              accuracy,
              total: topicQuiz.total,
            });
          }
        }
      }
    }

    const avgEasiness = totalTopics > 0 ? Number((sumEasiness / totalTopics).toFixed(2)) : 2.5;

    // 4. FSRS Real: Retenção de Memória & Pipeline de Maturidade
    const totalCards = flashcards.length;
    let newCards = 0;
    let learningCards = 0;
    let matureCards = 0;
    let leechCards = 0;
    const cardRetentions: number[] = [];

    for (const card of flashcards) {
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
    }

    // 5. Cálculos de Acurácia e Retenção Global
    const incorrectQuizQuestions = Math.max(0, totalQuizQuestions - correctQuizQuestions);
    const overallQuizAccuracy =
      totalQuizQuestions > 0
        ? Math.round((correctQuizQuestions / totalQuizQuestions) * 100)
        : null;

    let retentionValue: number;
    let retentionStatus;

    if (cardRetentions.length > 0) {
      retentionValue = Math.round(
        cardRetentions.reduce((acc, curr) => acc + curr, 0) / cardRetentions.length,
      );
      retentionStatus = getMemoryStatus(retentionValue);
    } else if (totalQuizQuestions > 0 && overallQuizAccuracy !== null) {
      retentionValue = overallQuizAccuracy;
      retentionStatus = getMemoryStatus(retentionValue);
    } else {
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

    const estimatedRetention =
      cardRetentions.length > 0 || totalQuizQuestions > 0 ? `${retentionValue}%` : "100%";

    // Qualidade da Memorização
    if (reviewHistories.length > 0) {
      bomCount += correctQuizQuestions;
      erreiCount += incorrectQuizQuestions;
    } else {
      bomCount = correctQuizQuestions;
      dificilCount = 0;
      erreiCount = incorrectQuizQuestions;
    }

    const performanceSummary = {
      bom: bomCount,
      dificil: dificilCount,
      errei: erreiCount,
      total: bomCount + dificilCount + erreiCount,
      source:
        reviewHistories.length > 0 && totalQuizQuestions > 0
          ? "mixed"
          : reviewHistories.length > 0
          ? "flashcard"
          : totalQuizQuestions > 0
          ? "quiz"
          : "none",
    };

    // 6. Grau de Domínio Cognitivo (Mastery Score de 0.0 a 10.0)
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
      const weightedRaw = quizScore * 0.5 + retentionScore * 0.3 + coverageScore * 0.2;
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
    }

    // 7. Estatísticas por Disciplina
    const userWeeklyHours = userRecord?.weeklyGoalHours || 10;
    const totalWeeklyMinutesCalc = userWeeklyHours * 60;
    const totalWeight = subjects.reduce((acc, s) => acc + (s.weight || 5), 0);
    const totalPriority = subjects.reduce((acc, s) => acc + (s.priority || 1), 0);
    const avgRatio = totalPriority / Math.max(1, totalWeight);

    const subjectMap = new Map<
      string,
      {
        subjectId: string;
        subject: string;
        priority: number;
        weight: number;
        total: number;
        correct: number;
        baseWeeklyMinutes: number;
        targetWeeklyMinutes: number;
      }
    >();

    for (const sub of subjects) {
      const key = sub.name.trim().toLowerCase();
      let total = 0;
      let correct = 0;

      for (const t of sub.topics) {
        const item = quizStatsByTopic.get(t.id);
        if (item) {
          total += item.total;
          correct += item.correct;
        }
      }

      const baseWeeklyMinutes = Math.round(
        (totalWeeklyMinutesCalc * (sub.weight || 5)) / Math.max(1, totalWeight),
      );
      const targetWeeklyMinutes = Math.round(
        (totalWeeklyMinutesCalc * (sub.priority || 1)) / Math.max(1, totalPriority),
      );

      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          subjectId: sub.id,
          subject: sub.name,
          priority: sub.priority || 1,
          weight: sub.weight || 5,
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
    }

    const subjectStats = Array.from(subjectMap.values()).map((item) => {
      const hasActivity = item.total > 0;
      const accuracy = hasActivity ? Math.round((item.correct / item.total) * 100) : null;
      const priorityRatio = item.priority / Math.max(1, item.weight);

      const isReinforced =
        hasActivity &&
        item.total >= 3 &&
        accuracy !== null &&
        accuracy < 65 &&
        (item.targetWeeklyMinutes > item.baseWeeklyMinutes * 1.03 || priorityRatio > avgRatio * 1.04);

      const isOptimized =
        hasActivity &&
        item.total >= 5 &&
        accuracy !== null &&
        accuracy > 85 &&
        (item.targetWeeklyMinutes < item.baseWeeklyMinutes * 0.98 || priorityRatio < avgRatio * 0.96);

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

    // 8. Rebalanceador Inteligente
    const highPrioritySubjects = subjectStats.filter(
      (s) => s.hasActivity && s.total >= 3 && s.accuracy !== null && s.accuracy < 65,
    );
    const optimizedSubjects = subjectStats.filter(
      (s) => s.hasActivity && s.total >= 5 && s.accuracy !== null && s.accuracy > 85,
    );
    const untestedCount = subjectStats.filter((s) => !s.hasActivity || s.total < 3).length;

    const isRebalanceApplied =
      highPrioritySubjects.length > 0
        ? highPrioritySubjects.every((s) => s.isReinforced)
        : optimizedSubjects.length > 0
        ? optimizedSubjects.every((s) => s.isOptimized)
        : false;

    // 9. Carga de revisão por dia da semana
    const daysOfWeek = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    for (const s of studySessions) {
      const day = new Date(s.createdAt).getDay();
      dayCounts[day]++;
    }

    const chartDistribution = daysOfWeek.map((dayLabel, index) => ({
      day: dayLabel,
      quantidade: dayCounts[index],
    }));

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
        needsRebalance:
          !isRebalanceApplied && (highPrioritySubjects.length > 0 || optimizedSubjects.length > 0),
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
