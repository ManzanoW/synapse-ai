// app/api/review/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { calculateTopicFSRSReview, normalizeGrade } from "@/lib/spaced-repetition";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { topicId, grade, source } = body;

    if (!topicId || grade === undefined) {
      return NextResponse.json(
        { error: "topicId e grade são obrigatórios" },
        { status: 400 },
      );
    }

    // 1. Busca o tópico e a matéria relacionada com métricas reais
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        subject: {
          include: {
            topics: {
              select: {
                quizAttempts: {
                  select: { totalCount: true, correctCount: true },
                },
              },
            },
          },
        },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { error: "Tópico não encontrado" },
        { status: 404 },
      );
    }

    // 2. Calcula acurácia histórica da disciplina para o freio de proteção FSRS
    let totalQuestions = 0;
    let totalCorrect = 0;
    (topic.subject?.topics || []).forEach((t: any) => {
      (t.quizAttempts || []).forEach((qa: any) => {
        totalQuestions += qa.totalCount;
        totalCorrect += qa.correctCount;
      });
    });

    const subjectAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : null;
    const normalizedGrade = normalizeGrade(grade);

    // 3. Processa a revisão via Motor FSRS Unificado
    const fsrsResult = calculateTopicFSRSReview({
      grade: normalizedGrade,
      currentInterval: topic.interval,
      currentEasiness: topic.easiness,
      currentRepetitions: topic.repetitions,
      subjectAccuracy,
      subjectPriority: Number(topic.subject?.weight || topic.subject?.priority || 5.0),
    });

    const performancePercentage = Math.round((normalizedGrade / 4) * 100);

    // 4. Transação atômica para salvar Histórico e atualizar Tópico e Matéria
    await prisma.$transaction([
      prisma.reviewHistory.create({
        data: {
          topicId: topic.id,
          grade: String(normalizedGrade),
        },
      }),

      prisma.topic.update({
        where: { id: topic.id },
        data: {
          firstStudy: "Em Revisão",
          performance: performancePercentage,
          easiness: fsrsResult.newEasiness,
          interval: fsrsResult.newInterval,
          repetitions: fsrsResult.newRepetitions,
          lastRev: new Date(),
          nextRev: fsrsResult.nextReviewDate,
          lastQuizAt: source === "QUIZ" ? new Date() : topic.lastQuizAt,
        },
      }),

      prisma.subject.update({
        where: { id: topic.subjectId },
        data: {
          lastReviewed: new Date(),
          nextReview: fsrsResult.nextReviewDate,
          interval: fsrsResult.newInterval,
          easiness: fsrsResult.newEasiness,
        },
      }),
    ]);

    return NextResponse.json({
      message: "FSRS atualizado com sucesso!",
      data: {
        nextReview: fsrsResult.nextReviewDate,
        interval: fsrsResult.newInterval,
        easiness: fsrsResult.newEasiness,
        stability: fsrsResult.newStability,
        retentionEstimate: fsrsResult.retentionEstimate,
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
