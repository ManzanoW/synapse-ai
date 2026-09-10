import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { calculateLevel } from "@/lib/gamification/gamification";
import { calculateSM2, convertLabelToGrade, PerformanceLabel } from "@/lib/sm2";
import {
  calculateNextReview,
  normalizeGrade,
} from "@/lib/spaced-repetition";
import { trackQuestProgressAction } from "@/actions/quest-actions";
import { invalidateUserCacheAction } from "@/actions/gamification-actions";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { cardId, grade, rating, responseTimeMs } = body;
    const rawRating = rating ?? grade;

    if (!cardId || rawRating === undefined) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (cardId, grade/rating)" },
        { status: 400 },
      );
    }

    const normalizedGrade = normalizeGrade(rawRating);

    // 1. Busca o Flashcard e as relações de Tópico, Deck e Matéria
    const card = await prisma.flashcard.findUnique({
      where: { id: String(cardId) },
      include: {
        topic: {
          include: {
            subject: {
              include: {
                topics: {
                  include: {
                    quizAttempts: {
                      select: { totalCount: true, correctCount: true },
                    },
                  },
                },
              },
            },
          },
        },
        deck: {
          include: {
            subject: {
              include: {
                topics: {
                  include: {
                    quizAttempts: {
                      select: { totalCount: true, correctCount: true },
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
      return NextResponse.json(
        { error: "Flashcard não encontrado" },
        { status: 404 },
      );
    }

    // Calcula retenção da matéria para ajuste de proteção
    const subject = card.topic?.subject || card.deck?.subject;
    let subjectAccuracy: number | null = null;
    if (subject && subject.topics) {
      let totalQ = 0;
      let totalC = 0;
      for (const t of subject.topics) {
        if (t.quizAttempts) {
          for (const a of t.quizAttempts) {
            totalQ += a.totalCount;
            totalC += a.correctCount;
          }
        }
      }
      if (totalQ > 0) {
        subjectAccuracy = (totalC / totalQ) * 100;
      }
    }

    // 2. Processa FSRS / SM-2 calibrado no Flashcard
    const srsResult = calculateNextReview({
      grade: normalizedGrade,
      repetitions: card.repetitions ?? 0,
      previousInterval: card.interval ?? 1,
      stability: card.stability ?? 1.0,
      difficulty: card.difficulty ?? 5.0,
      subjectAccuracy,
      responseTimeMs,
    });

    const currentLapses = card.lapses ?? 0;
    const nextLapses = normalizedGrade === 1 ? currentLapses + 1 : currentLapses;

    // Convertemos o valor recebido para o padrão numérico SM-2 (0 a 5) caso afete o Tópico
    const numericGrade =
      typeof rawRating === "number"
        ? rawRating
        : convertLabelToGrade(String(rawRating) as PerformanceLabel);

    // 3. Calcula e atualiza a Gamificação com XP escalonado (+5 XP por revisão, +8 XP se acertado)
    const isCorrect = normalizedGrade >= 3;
    const earnedXp = 5 + (isCorrect ? 8 : 0);

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

    const levelInfo = calculateLevel(updatedStats.totalXp);

    // 4. Atualiza o algoritmo SM-2 no Tópico do Edital (se vinculado)
    if (card.topicId && card.topic) {
      const topicSm2 = calculateSM2({
        interval: card.topic.interval || 0,
        easiness: card.topic.easiness || 2.5,
        repetitions: card.topic.repetitions || 0,
        grade: numericGrade,
      });

      const now = new Date();

      await Promise.all([
        prisma.topic.update({
          where: { id: card.topicId },
          data: {
            easiness: topicSm2.nextEasiness,
            interval: topicSm2.nextInterval,
            repetitions: topicSm2.nextRepetitions,
            lastRev: now,
            nextRev: topicSm2.nextReviewDate,
            firstStudy: "Concluido",
          },
        }),
        prisma.reviewHistory.create({
          data: {
            topicId: card.topicId,
            grade: String(rawRating),
            durationSeconds: responseTimeMs ? Math.round(responseTimeMs / 1000) : 30,
          },
        }),
      ]);
    }

    // 5. Registra a StudySession para o painel semanal
    await prisma.studySession.create({
      data: {
        userId,
        durationMinutes: 1,
        status: "COMPLETED",
      },
    });

    // 6. Atualiza o flashcard com os valores FSRS / SM-2 persistidos
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

    // 7. Atualiza o progresso das Missões Diárias e invalida cache
    try {
      await trackQuestProgressAction("FLASHCARDS_REVIEWED", 1);
    } catch (qErr) {
      console.warn("Aviso na missão diária:", qErr);
    }

    try {
      await invalidateUserCacheAction(userId);
    } catch (cErr) {
      console.warn("Aviso no cache:", cErr);
    }

    return NextResponse.json(
      {
        success: true,
        earnedXp,
        totalXp: updatedStats.totalXp,
        levelInfo,
        data: {
          cardId: updatedCard.id,
          nextReviewDate: updatedCard.nextReviewDate,
          interval: updatedCard.interval,
          stability: updatedCard.stability,
          difficulty: updatedCard.difficulty,
          repetitions: updatedCard.repetitions,
          lapses: updatedCard.lapses,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Erro ao registrar revisão de flashcard:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar revisão do flashcard" },
      { status: 500 },
    );
  }
}
