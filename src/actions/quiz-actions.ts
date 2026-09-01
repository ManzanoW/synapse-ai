"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { invalidateUserCacheAction } from "@/actions/gamification-actions";
import { trackQuestProgressAction } from "@/actions/quest-actions";
import {
  SubmitQuizAttemptInput,
  SubjectDomainMetric,
} from "@/types/quiz";

export async function submitQuizAttemptAction(input: SubmitQuizAttemptInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // Garante que haja um topicId válido (busca o primeiro tópico disponível caso não informado)
    let targetTopicId = input.topicId;

    if (!targetTopicId) {
      const fallbackTopic = await prisma.topic.findFirst({
        where: input.subjectId
          ? { subjectId: input.subjectId, subject: { userId } }
          : { subject: { userId } },
        select: { id: true },
      });
      targetTopicId = fallbackTopic?.id;
    }

    if (!targetTopicId) {
      return {
        success: false,
        error: "Nenhum tópico cadastrado no edital para vincular a esta tentativa.",
      };
    }

    const accuracyPercentage = Math.round(
      (input.correctAnswers / Math.max(1, input.totalQuestions)) * 100
    );

    // XP: 20 XP por acerto + bônus de 50 XP para precisão >= 80%
    const earnedXp =
      input.correctAnswers * 20 + (accuracyPercentage >= 80 ? 50 : 0);

    // 1. Grava a tentativa no banco e atualiza XP atômico
    const [attempt] = await prisma.$transaction([
      prisma.quizAttempt.create({
        data: {
          userId,
          topicId: targetTopicId,
          totalCount: input.totalQuestions,
          correctCount: input.correctAnswers,
        },
      }),
      prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          totalXp: earnedXp,
          lastStudyDate: new Date(),
        },
        update: {
          totalXp: { increment: earnedXp },
          lastStudyDate: new Date(),
        },
      }),
    ]);

    // 2. Atualiza a performance e última data no tópico
    await prisma.topic.update({
      where: { id: targetTopicId },
      data: {
        performance: accuracyPercentage,
        lastQuizAt: new Date(),
      },
    });

    // 3. Atualiza progresso das Missões Diárias
    await trackQuestProgressAction("QUESTIONS_SOLVED", input.totalQuestions);

    // 4. Revalida caches
    await invalidateUserCacheAction(userId);

    return {
      success: true,
      data: {
        attemptId: attempt.id,
        accuracyPercentage,
        earnedXp,
      },
    };
  } catch (err) {
    console.error("Erro em submitQuizAttemptAction:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao registrar tentativa do simulado.",
    };
  }
}

export async function getSubjectDomainStatsAction(userIdParam?: string) {
  try {
    const session = await auth();
    const userId = userIdParam || session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        topics: {
          include: {
            quizAttempts: true,
          },
        },
      },
    });

    const metrics: SubjectDomainMetric[] = subjects.map((subject) => {
      let totalQuestions = 0;
      let totalCorrect = 0;

      subject.topics.forEach((topic) => {
        topic.quizAttempts.forEach((attempt) => {
          totalQuestions += attempt.totalCount;
          totalCorrect += attempt.correctCount;
        });
      });

      const domainPercentage =
        totalQuestions > 0
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : 0;

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        color: subject.color,
        totalAnswered: totalQuestions,
        correctCount: totalCorrect,
        domainPercentage,
        weight: Number(subject.priority || 1),
      };
    });

    return { success: true, data: metrics };
  } catch (err) {
    console.error("Erro em getSubjectDomainStatsAction:", err);
    return {
      success: false,
      error: "Falha ao calcular métricas de domínio.",
    };
  }
}
