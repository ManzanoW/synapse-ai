// src/app/api/flashcards/review/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { calculateEarnedXp, calculateLevel } from "@/lib/gamification";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { cardId, grade, streakDays = 0 } = await request.json();

    if (!cardId || !grade) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (cardId, grade)" },
        { status: 400 },
      );
    }

    // 1. Busca o Flashcard e o seu Tópico associado (se houver)
    const card = await prisma.flashcard.findUnique({
      where: { id: String(cardId) },
      include: {
        topic: true,
      },
    });

    // 2. Calcula e atualiza a Gamificação (XP + Nível)
    const earnedXp = calculateEarnedXp(grade, streakDays);

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
    if (card?.topicId && card.topic) {
      // Mapeamento da nota (ex: "BOM", "EASY", "HARD", "AGAIN" ou valores numéricos 0 a 5)
      let q = 3;
      const gUpper = String(grade).toUpperCase();
      if (gUpper === "AGAIN" || gUpper === "ERREI" || gUpper === "0") q = 1;
      else if (gUpper === "HARD" || gUpper === "DIFICIL" || gUpper === "2")
        q = 2;
      else if (
        gUpper === "GOOD" ||
        gUpper === "BOM" ||
        gUpper === "3" ||
        gUpper === "4"
      )
        q = 4;
      else if (gUpper === "EASY" || gUpper === "FACIL" || gUpper === "5") q = 5;

      let easiness = card.topic.easiness || 2.5;
      let interval = card.topic.interval || 0;
      let repetitions = card.topic.repetitions || 0;

      if (q < 3) {
        // Errou: reseta repetições e intervalo
        repetitions = 0;
        interval = 1;
      } else {
        // Acertou: avança intervalo
        if (repetitions === 0) interval = 1;
        else if (repetitions === 1) interval = 6;
        else interval = Math.round(interval * easiness);

        repetitions += 1;
      }

      // Novo fator de facilidade (EF)
      easiness = Math.max(
        1.3,
        easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
      );

      const now = new Date();
      const nextRev = new Date();
      nextRev.setDate(now.getDate() + interval);

      // Atualiza o Tópico e registra o histórico de revisão em paralelo
      await Promise.all([
        prisma.topic.update({
          where: { id: card.topicId },
          data: {
            easiness,
            interval,
            repetitions,
            lastRev: now,
            nextRev,
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

    // 4. Registra a StudySession para alimentar o gráfico do painel semanal
    await prisma.studySession.create({
      data: {
        userId,
        durationMinutes: 1,
        status: "COMPLETED",
      },
    });

    // 5. Atualiza o timestamp do flashcard
    if (card) {
      await prisma.flashcard.update({
        where: { id: card.id },
        data: { updatedAt: new Date() },
      });
    }

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
