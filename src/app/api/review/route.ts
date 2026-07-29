// app/api/review/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { processSM2Review } from "@/lib/study-cycle";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { topicId, grade, source } = body;
    // source: "FLASHCARD" ou "QUIZ"
    // grade: nota de 0 a 5 (se for Quiz, converter % de acertos antes)

    if (!topicId || grade === undefined) {
      return NextResponse.json(
        { error: "topicId e grade são obrigatórios" },
        { status: 400 },
      );
    }

    // 1. Busca o tópico e a matéria relacionada
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { subject: true },
    });

    if (!topic) {
      return NextResponse.json(
        { error: "Tópico não encontrado" },
        { status: 404 },
      );
    }

    // 2. Processa o SM-2 para o Tópico
    const sm2Topic = processSM2Review(
      topic.interval,
      topic.easiness,
      topic.repetitions,
      grade,
      topic.subject.priority,
    );

    // 3. Transação atômica para salvar Histórico, atualizar Tópico e Matéria
    await prisma.$transaction([
      // a) Registra Histórico de Revisão
      prisma.reviewHistory.create({
        data: {
          topicId: topic.id,
          grade: String(grade),
        },
      }),

      // b) Atualiza metadados SM-2 do Tópico
      prisma.topic.update({
        where: { id: topic.id },
        data: {
          firstStudy: "Em Revisão",
          performance: Math.round((grade / 5) * 100),
          easiness: sm2Topic.newEasiness,
          interval: sm2Topic.newInterval,
          repetitions: sm2Topic.newRepetitions,
          lastRev: new Date(),
          nextRev: sm2Topic.nextReviewDate,
          lastQuizAt: source === "QUIZ" ? new Date() : topic.lastQuizAt,
        },
      }),

      // c) Atualiza a Matéria pai (Subject) para refletir a última revisão
      prisma.subject.update({
        where: { id: topic.subjectId },
        data: {
          lastReviewed: new Date(),
          nextReview: sm2Topic.nextReviewDate,
          interval: sm2Topic.newInterval,
          easiness: sm2Topic.newEasiness,
        },
      }),
    ]);

    return NextResponse.json({
      message: "SM-2 atualizado com sucesso!",
      data: {
        nextReview: sm2Topic.nextReviewDate,
        interval: sm2Topic.newInterval,
        easiness: sm2Topic.newEasiness,
      },
    });
  } catch (error) {
    console.error("❌ ERRO NO POST /api/review:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
