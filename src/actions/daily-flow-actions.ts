"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFlashcardsAnalyticsAction } from "@/actions/flashcard-actions";
import { invalidateUserCacheAction } from "@/actions/gamification-actions";

export interface DailyFlowStep {
  id: "flashcards" | "questions" | "remediation";
  title: string;
  subtitle: string;
  durationMinutes: number;
  badge: string;
  actionUrl: string;
  count: number;
  isReady: boolean;
  isCompleted: boolean;
}

export interface DailyFlowData {
  totalMinutes: number;
  hasActivity: boolean;
  steps: DailyFlowStep[];
  greeting: string;
  completedStepsCount: number;
  allCompleted: boolean;
  bonusXp: number;
  isBonusClaimed: boolean;
}

export async function getDailyFlowRecommendationAction(): Promise<{
  success: boolean;
  data?: DailyFlowData;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // 1. Busca cards vencidos no FSRS
    const flashcardsRes = await getFlashcardsAnalyticsAction().catch(() => null);
    const dueCardsCount = flashcardsRes?.success && flashcardsRes.data
      ? flashcardsRes.data.dueTodayCount
      : 0;

    // 2. Busca tópicos e matérias para identificar ponto de menor rendimento
    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        topics: {
          include: {
            quizAttempts: {
              select: {
                totalCount: true,
                correctCount: true,
              },
            },
          },
        },
      },
    });

    let weakestSubjectName = "Direito Constitucional";
    let weakestTopicName = "Geral";
    let lowestAccuracy = 1.0;
    let foundTopic = false;

    for (const sub of subjects) {
      for (const top of sub.topics) {
        if (top.quizAttempts && top.quizAttempts.length > 0) {
          const totalQ = top.quizAttempts.reduce((acc, q) => acc + q.totalCount, 0);
          const totalC = top.quizAttempts.reduce((acc, q) => acc + q.correctCount, 0);
          if (totalQ >= 3) {
            const acc = totalC / totalQ;
            if (acc < lowestAccuracy) {
              lowestAccuracy = acc;
              weakestSubjectName = sub.name;
              weakestTopicName = top.title;
              foundTopic = true;
            }
          }
        }
      }
    }

    if (!foundTopic && subjects.length > 0) {
      weakestSubjectName = subjects[0].name;
      weakestTopicName = subjects[0].topics[0]?.title || "Geral";
    }

    // 3. Busca atividades de hoje para verificação de conclusão em tempo real
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [cardsReviewedToday, quizzesToday, masteredErrorsToday, todayBonusClaimed] =
      await Promise.all([
        prisma.flashcard.count({
          where: {
            deck: { userId },
            lastReviewed: { gte: startOfToday },
          },
        }).catch(() => 0),
        prisma.quiz.count({
          where: {
            userId,
            createdAt: { gte: startOfToday },
          },
        }).catch(() => 0),
        prisma.questionError.count({
          where: {
            userId,
            masteredAt: { gte: startOfToday },
          },
        }).catch(() => 0),
        prisma.dailyQuest.findFirst({
          where: {
            userId,
            title: "Missão Diária Completa",
            questDate: { gte: startOfToday },
            claimed: true,
          },
        }).catch(() => null),
      ]);

    // 4. Busca erros ativos no Caderno de Erros
    const pendingErrorsCount = await prisma.questionError.count({
      where: {
        userId,
        status: "ACTIVE",
      },
    }).catch(() => 0);

    // 5. Calcula conclusão de cada etapa
    const isFlashcardsCompleted =
      cardsReviewedToday >= Math.min(Math.max(dueCardsCount, 1), 5) ||
      (dueCardsCount === 0 && cardsReviewedToday > 0);
    const isQuestionsCompleted = quizzesToday > 0;
    const isRemediationCompleted =
      masteredErrorsToday > 0 || (pendingErrorsCount === 0 && quizzesToday > 0);

    // 6. Monta os 3 passos pedagógicos
    const flashcardsMinutes = Math.min(Math.max(Math.ceil(dueCardsCount * 0.75), 5), 15);
    const questionsMinutes = 15;
    const remediationMinutes = pendingErrorsCount > 0 ? 8 : 5;

    const steps: DailyFlowStep[] = [
      {
        id: "flashcards",
        title:
          dueCardsCount > 0
            ? `Revisar ${dueCardsCount} Flashcards Vencidos`
            : "Revisão Rápida de Flashcards",
        subtitle: isFlashcardsCompleted
          ? "✓ Etapa concluída hoje! Memória de longo prazo blindada."
          : dueCardsCount > 0
            ? "Retenção com repetição espaçada FSRS"
            : "Consolidação de memória de longo prazo",
        durationMinutes: flashcardsMinutes,
        badge: isFlashcardsCompleted
          ? "✓ Concluído"
          : dueCardsCount > 0
            ? `${dueCardsCount} cards`
            : "Em dia",
        actionUrl: "/flashcards",
        count: dueCardsCount,
        isReady: true,
        isCompleted: isFlashcardsCompleted,
      },
      {
        id: "questions",
        title: `Treino de 5 Questões: ${weakestSubjectName}`,
        subtitle: isQuestionsCompleted
          ? "✓ Etapa concluída hoje! Bateria de questões finalizada."
          : `Reforço no seu ponto de menor acerto (${weakestTopicName})`,
        durationMinutes: questionsMinutes,
        badge: isQuestionsCompleted ? "✓ Concluído" : "5 questões",
        actionUrl: `/questions?materia=${encodeURIComponent(weakestSubjectName)}&qtd=5&auto=1`,
        count: 5,
        isReady: true,
        isCompleted: isQuestionsCompleted,
      },
      {
        id: "remediation",
        title:
          pendingErrorsCount > 0
            ? `Curar ${pendingErrorsCount} Erro(s) Pendente(s)`
            : "Revisão de Erros & Macetes",
        subtitle: isRemediationCompleted
          ? "✓ Etapa concluída hoje! Ponto cego desarmado."
          : pendingErrorsCount > 0
            ? "Desarmar pegadinhas e fixar conceitos"
            : "Caderno de Erros e prevenção de falhas",
        durationMinutes: remediationMinutes,
        badge: isRemediationCompleted
          ? "✓ Concluído"
          : pendingErrorsCount > 0
            ? `${pendingErrorsCount} erro(s)`
            : "Zero erros",
        actionUrl: "/notebook",
        count: pendingErrorsCount,
        isReady: true,
        isCompleted: isRemediationCompleted,
      },
    ];

    const completedStepsCount = steps.filter((s) => s.isCompleted).length;
    const allCompleted = completedStepsCount === 3;
    const isBonusClaimed = Boolean(todayBonusClaimed);
    const totalMinutes = flashcardsMinutes + questionsMinutes + remediationMinutes;

    return {
      success: true,
      data: {
        totalMinutes,
        hasActivity: dueCardsCount > 0 || pendingErrorsCount > 0 || subjects.length > 0,
        steps,
        greeting: allCompleted
          ? "Parabéns! Todas as etapas da sua Trilha do Aprovado foram batidas hoje!"
          : "Seu plano de estudo de alta intensidade calibrado por IA para hoje",
        completedStepsCount,
        allCompleted,
        bonusXp: 150,
        isBonusClaimed,
      },
    };
  } catch (err) {
    console.error("[getDailyFlowRecommendationAction] Erro:", err);
    return {
      success: false,
      error: "Falha ao calcular recomendação diária.",
    };
  }
}

export async function claimDailyMissionBonusAction(): Promise<{
  success: boolean;
  awardedXp?: number;
  newTotalXp?: number;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Usuário não autenticado." };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const alreadyClaimed = await prisma.dailyQuest.findFirst({
      where: {
        userId,
        title: "Missão Diária Completa",
        questDate: { gte: startOfToday },
        claimed: true,
      },
    });

    if (alreadyClaimed) {
      return { success: false, error: "Bônus diário já resgatado hoje!" };
    }

    const BONUS_XP = 150;

    await prisma.dailyQuest.create({
      data: {
        userId,
        title: "Missão Diária Completa",
        description: "Completou todas as 3 etapas da Trilha Diária do Aprovado.",
        xpReward: BONUS_XP,
        targetCount: 3,
        currentCount: 3,
        completed: true,
        claimed: true,
        questDate: new Date(),
      },
    });

    const updatedUserStats = await prisma.userStats.upsert({
      where: { userId },
      create: {
        userId,
        totalXp: BONUS_XP,
        streakDays: 1,
        lastStudyDate: new Date(),
      },
      update: {
        totalXp: { increment: BONUS_XP },
        lastStudyDate: new Date(),
      },
    });

    await invalidateUserCacheAction(userId);

    return {
      success: true,
      awardedXp: BONUS_XP,
      newTotalXp: updatedUserStats.totalXp,
    };
  } catch (err: any) {
    console.error("[claimDailyMissionBonusAction] Erro:", err);
    return { success: false, error: "Falha ao resgatar bônus diário." };
  }
}
