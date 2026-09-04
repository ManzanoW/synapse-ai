"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { invalidateUserCacheAction } from "@/actions/gamification-actions";
import { trackQuestProgressAction } from "@/actions/quest-actions";
import { revalidatePath } from "next/cache";
import { SubmitQuizAttemptInput, SubjectDomainMetric } from "@/types/quiz";

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
        error:
          "Nenhum tópico cadastrado no edital para vincular a esta tentativa.",
      };
    }

    const accuracyPercentage = Math.round(
      (input.correctAnswers / Math.max(1, input.totalQuestions)) * 100,
    );

    // XP Base: 20 XP por acerto + bônus de 50 XP para precisão >= 80%
    const baseEarnedXp = input.correctAnswers * 20;
    const accuracyBonusXp = accuracyPercentage >= 80 ? 50 : 0;

    // Bônus de Prova Real / Simulado Cronometrado
    let timedBonusXp = 0;
    const completedWithinTime = input.totalAllocatedSeconds
      ? input.timeSpentSeconds <= input.totalAllocatedSeconds + 5
      : true;

    if (input.isTimedSimulation && completedWithinTime) {
      if (accuracyPercentage >= 80) {
        timedBonusXp = 100; // Alta performance sob pressão
      } else if (accuracyPercentage >= 70) {
        timedBonusXp = 75;  // Rendimento consistente dentro do tempo
      } else if (accuracyPercentage >= 50) {
        timedBonusXp = 40;  // Gestão de tempo completada com êxito
      }
    }

    const earnedXp = baseEarnedXp + accuracyBonusXp + timedBonusXp;

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

    // 3.1 📓 Registra os erros das respostas no Caderno de Erros (se detalhadas)
    if (Array.isArray(input.answers)) {
      const incorrectAnswers = input.answers.filter(
        (a) => !a.isCorrect && Boolean(a.questionText)
      );

      const fallbackErrorReason =
        input.isTimedSimulation && !completedWithinTime
          ? "TIME_PRESSURE"
          : "UNCLASSIFIED";

      for (const item of incorrectAnswers) {
        const errorReasonToSave =
          item.errorReason && item.errorReason !== "UNCLASSIFIED"
            ? String(item.errorReason)
            : fallbackErrorReason;

        await prisma.questionError
          .create({
            data: {
              userId,
              subjectId: item.subjectId || input.subjectId || null,
              topicId: item.topicId || targetTopicId || null,
              questionText: item.questionText!,
              options: (item.options as any) || [],
              userAnswer: String(item.selectedOption || "Não informada"),
              correctAnswer: String(item.correctAnswer || "A"),
              explanation: item.explanation || null,
              errorReason: errorReasonToSave,
              status: "PENDING",
            },
          })
          .catch((e) =>
            console.warn("Erro ao registrar questionError em submitQuizAttemptAction:", e)
          );
      }
    }

    // 4. Revalida caches e rotas
    await invalidateUserCacheAction(userId);
    try {
      revalidatePath("/achievements");
      revalidatePath("/notebook");
      revalidatePath("/performance");
    } catch {
      // Ignora erro fora de contexto HTTP
    }

    return {
      success: true,
      data: {
        attemptId: attempt.id,
        accuracyPercentage,
        earnedXp,
        baseEarnedXp,
        accuracyBonusXp,
        timedBonusXp,
        completedWithinTime,
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

/**
 * Busca todos os simulados/cadernos salvos estritamente pertencentes ao usuário logado
 */
export async function getSavedQuizzesAction() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const quizzes = await prisma.quiz.findMany({
      where: { userId },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: quizzes };
  } catch (err) {
    console.error("Erro em getSavedQuizzesAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao carregar simulados salvos.",
    };
  }
}

/**
 * Obtém um simulado específico pelo ID, garantindo que pertença ao usuário logado
 */
export async function getSavedQuizByIdAction(quizId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId,
      },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!quiz) {
      return {
        success: false,
        error: "Simulado não encontrado ou não pertence a este usuário.",
      };
    }

    return { success: true, data: quiz };
  } catch (err) {
    console.error("Erro em getSavedQuizByIdAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao buscar simulado.",
    };
  }
}

/**
 * Exclui um simulado salvo garantindo validação estrita de posse pelo userId
 */
export async function deleteSavedQuizAction(quizId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const deleted = await prisma.quiz.deleteMany({
      where: {
        id: quizId,
        userId,
      },
    });

    if (deleted.count === 0) {
      return {
        success: false,
        error: "Simulado não encontrado ou sem permissão para exclusão.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Erro em deleteSavedQuizAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao excluir simulado.",
    };
  }
}
