"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFlashcardsAnalyticsAction } from "@/actions/flashcard-actions";

export interface DailyFlowStep {
  id: "flashcards" | "questions" | "remediation";
  title: string;
  subtitle: string;
  durationMinutes: number;
  badge: string;
  actionUrl: string;
  count: number;
  isReady: boolean;
}

export interface DailyFlowData {
  totalMinutes: number;
  hasActivity: boolean;
  steps: DailyFlowStep[];
  greeting: string;
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

    // 3. Busca erros ativos no Caderno de Erros
    const pendingErrorsCount = await prisma.questionError.count({
      where: {
        userId,
        status: "ACTIVE",
      },
    }).catch(() => 0);

    // 4. Monta os 3 passos pedagógicos
    const flashcardsMinutes = Math.min(Math.max(Math.ceil(dueCardsCount * 0.75), 5), 15);
    const questionsMinutes = 15;
    const remediationMinutes = pendingErrorsCount > 0 ? 8 : 5;

    const steps: DailyFlowStep[] = [
      {
        id: "flashcards",
        title: dueCardsCount > 0 ? `Revisar ${dueCardsCount} Flashcards Vencidos` : "Revisão Rápida de Flashcards",
        subtitle: dueCardsCount > 0 ? "Retenção com repetição espaçada FSRS" : "Consolidação de memória de longo prazo",
        durationMinutes: flashcardsMinutes,
        badge: dueCardsCount > 0 ? `${dueCardsCount} cards` : "Em dia",
        actionUrl: "/flashcards",
        count: dueCardsCount,
        isReady: true,
      },
      {
        id: "questions",
        title: `Treino de 5 Questões: ${weakestSubjectName}`,
        subtitle: `Reforço no seu ponto de menor acerto (${weakestTopicName})`,
        durationMinutes: questionsMinutes,
        badge: "5 questões",
        actionUrl: `/questions?materia=${encodeURIComponent(weakestSubjectName)}&qtd=5&auto=1`,
        count: 5,
        isReady: true,
      },
      {
        id: "remediation",
        title: pendingErrorsCount > 0 ? `Curar ${pendingErrorsCount} Erro(s) Pendente(s)` : "Cura Cognitiva & Mnemônicos",
        subtitle: pendingErrorsCount > 0 ? "Desarmar pegadinhas e fixar conceitos" : "Caderno de Erros e prevenção de falhas",
        durationMinutes: remediationMinutes,
        badge: pendingErrorsCount > 0 ? `${pendingErrorsCount} erro(s)` : "Zero erros",
        actionUrl: "/notebook",
        count: pendingErrorsCount,
        isReady: true,
      },
    ];

    const totalMinutes = flashcardsMinutes + questionsMinutes + remediationMinutes;

    return {
      success: true,
      data: {
        totalMinutes,
        hasActivity: dueCardsCount > 0 || pendingErrorsCount > 0 || subjects.length > 0,
        steps,
        greeting: "Seu plano de estudo de alta intensidade calibrado por IA para hoje",
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
