"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { trackQuestProgressAction } from "@/actions/quest-actions";
import { invalidateUserCacheAction } from "@/actions/gamification-actions";
import {
  calculateNextReview,
  normalizeGrade,
  ReviewGrade,
  EvaluationRating,
  NextReviewResult,
} from "@/lib/spaced-repetition";

export interface ReviewFlashcardInput {
  cardId: string;
  rating?: ReviewGrade | EvaluationRating | number | string;
  grade?: ReviewGrade | EvaluationRating | number | string;
  responseTimeMs?: number;
}

export interface ReviewFlashcardResponse {
  success: boolean;
  error?: string;
  data?: {
    cardId: string;
    nextReviewDate: Date;
    interval: number;
    easeFactor: number;
    stability: number;
    difficulty: number;
    repetitions: number;
    lapses: number;
    isCriticalSubjectDeficit: boolean;
    subjectRetentionFactor: number;
    earnedXp?: number;
    totalXp?: number;
  };
}

/**
 * Server Action para processar a revisão ativa de um Flashcard
 * com algoritmo FSRS / SM-2 Otimizado e gamificação calibrada.
 */
export async function reviewFlashcardAction(
  input: ReviewFlashcardInput,
): Promise<ReviewFlashcardResponse> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    if (!input.cardId) {
      return { success: false, error: "ID do flashcard não informado." };
    }

    const rawRating = input.rating ?? input.grade ?? 3;
    const grade = normalizeGrade(rawRating);

    // 1. Busca o card e suas relações de Deck, Topic, Subject e histórico de questões
    const card = await prisma.flashcard.findUnique({
      where: { id: input.cardId },
      include: {
        deck: {
          include: {
            subject: {
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
            },
          },
        },
        topic: {
          include: {
            subject: {
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
            },
          },
        },
      },
    });

    if (!card) {
      return { success: false, error: "Flashcard não encontrado." };
    }

    // 2. Calcula a taxa de acertos e retenção da matéria (Subject Domain)
    const subject = card.topic?.subject || card.deck?.subject;
    let subjectAccuracy: number | null = null;

    if (subject && subject.topics && subject.topics.length > 0) {
      let totalQuestions = 0;
      let totalCorrect = 0;

      for (const t of subject.topics) {
        if (t.quizAttempts && t.quizAttempts.length > 0) {
          for (const attempt of t.quizAttempts) {
            totalQuestions += attempt.totalCount;
            totalCorrect += attempt.correctCount;
          }
        }
      }

      if (totalQuestions > 0) {
        subjectAccuracy = (totalCorrect / totalQuestions) * 100;
      } else {
        // Fallback: média de aproveitamento anotado nos tópicos
        const scoredTopics = subject.topics.filter((t) => t.performance > 0);
        if (scoredTopics.length > 0) {
          subjectAccuracy =
            scoredTopics.reduce((sum, t) => sum + t.performance, 0) / scoredTopics.length;
        }
      }
    }

    // 3. Executa o algoritmo FSRS / SM-2 calibrado
    const srsResult: NextReviewResult = calculateNextReview({
      grade,
      repetitions: typeof card.repetitions === "number" ? card.repetitions : 0,
      previousInterval: typeof card.interval === "number" && card.interval > 0 ? card.interval : 1,
      stability: typeof card.stability === "number" && card.stability > 0 ? card.stability : 1.0,
      difficulty: typeof card.difficulty === "number" && card.difficulty >= 1 ? card.difficulty : 5.0,
      subjectAccuracy,
      responseTimeMs: input.responseTimeMs,
    });

    const currentLapses = typeof card.lapses === "number" ? card.lapses : 0;
    const nextLapses = grade === 1 ? currentLapses + 1 : currentLapses;

    // 4. Persiste no banco os novos valores do card
    const updatedCard = await prisma.flashcard.update({
      where: { id: card.id },
      data: {
        interval: srsResult.interval,
        easeFactor: srsResult.easeFactor,
        stability: srsResult.stability,
        difficulty: srsResult.difficulty,
        repetitions: srsResult.repetitions,
        lapses: nextLapses,
        nextReviewDate: srsResult.nextReviewDate,
        lastReviewed: new Date(),
      },
    });

    // 5. Se o card estiver associado a um Tópico do edital, sincroniza a data de revisão
    if (card.topicId) {
      await prisma.topic.update({
        where: { id: card.topicId },
        data: {
          lastRev: new Date(),
          nextRev: srsResult.nextReviewDate,
          firstStudy: "Concluido",
        },
      });

      // Registra no ReviewHistory
      await prisma.reviewHistory.create({
        data: {
          topicId: card.topicId,
          grade: String(grade),
          durationSeconds: input.responseTimeMs ? Math.round(input.responseTimeMs / 1000) : 30,
        },
      });
    }

    // 6. Registra StudySession para métricas do painel semanal
    await prisma.studySession.create({
      data: {
        userId,
        durationMinutes: 1,
        status: "COMPLETED",
      },
    });

    // 7. Gamificação: XP escalonado (+5 XP por revisão, +8 XP se acertado/grade >= 3)
    const isCorrect = grade >= 3;
    const earnedXp = 5 + (isCorrect ? 8 : 0); // 5 XP se errou, 13 XP se acertou

    const updatedStats = await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalXp: { increment: earnedXp },
        lastStudyDate: new Date(),
      },
      create: {
        userId,
        totalXp: earnedXp,
        lastStudyDate: new Date(),
      },
    });

    // 8. Sincroniza com as missões diárias
    try {
      await trackQuestProgressAction("FLASHCARDS_REVIEWED", 1);
    } catch (questErr) {
      console.warn("Aviso ao atualizar missão diária de flashcards:", questErr);
    }

    try {
      await invalidateUserCacheAction(userId);
    } catch (cacheErr) {
      console.warn("Aviso ao invalidar cache do usuário:", cacheErr);
    }

    // 9. Revalida caches de páginas
    try {
      revalidatePath("/flashcards");
      revalidatePath("/flashcards/decks");
      if (card.deckId) {
        revalidatePath(`/flashcards/study/${card.deckId}`);
      }
    } catch {
      // Ignora erro fora de contexto de renderização
    }

    return {
      success: true,
      data: {
        cardId: updatedCard.id,
        nextReviewDate: updatedCard.nextReviewDate,
        interval: updatedCard.interval,
        easeFactor: updatedCard.easeFactor,
        stability: updatedCard.stability,
        difficulty: updatedCard.difficulty,
        repetitions: updatedCard.repetitions,
        lapses: updatedCard.lapses,
        isCriticalSubjectDeficit: srsResult.isSubjectCriticalDeficit,
        subjectRetentionFactor: srsResult.subjectRetentionFactor,
        earnedXp,
        totalXp: updatedStats.totalXp,
      },
    };
  } catch (error) {
    console.error("Erro em reviewFlashcardAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao revisar flashcard.",
    };
  }
}
