import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  calculateEarnedXp,
  calculateLevel,
} from "@/lib/gamification/gamification";
import { calculateSM2, convertLabelToGrade, PerformanceLabel } from "@/lib/sm2";
import { trackQuestProgressAction } from "@/actions/quest-actions";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { cardId, grade, streakDays = 0 } = await request.json();

    if (!cardId || grade === undefined) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (cardId, grade)" },
        { status: 400 },
      );
    }

    // 1. Busca o Flashcard e o seu Tópico associado
    const card = await prisma.flashcard.findUnique({
      where: { id: String(cardId) },
      include: {
        topic: true,
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Flashcard não encontrado" },
        { status: 404 },
      );
    }

    // Convertemos o valor recebido para o padrão numérico SM-2 (0 a 5)
    const numericGrade =
      typeof grade === "number"
        ? grade
        : convertLabelToGrade(String(grade) as PerformanceLabel);

    // 2. Calcula e atualiza a Gamificação (XP + Nível)
    const earnedXp = calculateEarnedXp(String(grade), streakDays);

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

    // 3. Atualiza o algoritmo SM-2 no Tópico do Edital (se vinculado)
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
            grade: String(grade),
            durationSeconds: 30,
          },
        }),
      ]);
    }

    // 4. Registra a StudySession para o painel semanal
    await prisma.studySession.create({
      data: {
        userId,
        durationMinutes: 1,
        status: "COMPLETED",
      },
    });

    // 5. Atualiza o timestamp do flashcard
    await prisma.flashcard.update({
      where: { id: card.id },
      data: { updatedAt: new Date() },
    });

    // 6. Atualiza o progresso das Missões Diárias
    await trackQuestProgressAction("FLASHCARDS_REVIEWED", 1);

    return NextResponse.json(
      {
        success: true,
        earnedXp,
        totalXp: updatedStats.totalXp,
        levelInfo,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Erro ao registrar revisão de flashcard:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar XP do flashcard" },
      { status: 500 },
    );
  }
}
