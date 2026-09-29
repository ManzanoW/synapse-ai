import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PRESET_HEX_COLORS } from "@/constants/subjects";
import { auth } from "@/auth";
import {
  calculateEarnedXp,
  calculateLevel,
} from "@/lib/gamification/gamification";
import {
  calculateTopicFSRSReview,
  normalizeGrade,
} from "@/lib/spaced-repetition";

export const dynamic = "force-dynamic";

async function getAuthenticatedUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user.id;
}
 
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "topics";
    const type = searchParams.get("type");

    if (type === "pending") {
      const hoje = new Date();
      const pendencias = await prisma.topic.findMany({
        where: {
          nextRev: { lte: hoje },
          subject: { userId: userId },
        },
        include: { subject: true },
      });
      return NextResponse.json({ data: pendencias });
    }

    if (mode === "review") {
      const now = new Date();
      const reviewQueue = await prisma.topic.findMany({
        where: {
          subject: { userId: userId },
          OR: [{ firstStudy: "Pendente" }, { nextRev: { lte: now } }],
        },
        include: {
          subject: { select: { name: true, color: true } },
          flashcards: true,
        },
        orderBy: [{ firstStudy: "asc" }, { nextRev: "asc" }],
      });

      return NextResponse.json({ data: reviewQueue }, { status: 200 });
    }

    const userQuizzes = await prisma.quiz.findMany({
      where: { userId },
      select: { id: true, topicId: true, subject: true },
      orderBy: { createdAt: "desc" },
    });

    if (mode === "subjects") {
      try {
        const subjects = await prisma.subject.findMany({
          where: { userId },
          orderBy: { name: "asc" },
          include: {
            topics: {
              orderBy: { title: "asc" },
              include: {
                reviewHistories: { select: { grade: true } },
              },
            },
          },
        });

        let totalTopicsGlobal = 0;
        let accumulatedGlobalProgress = 0;

        const formattedSubjects = (subjects || []).map((sub) => {
          let subjectProgressSum = 0;
          const rawTopics = sub.topics || [];

          const formattedTopics = rawTopics.map((topic: any) => {
            totalTopicsGlobal++;

            const matchingQuiz = (userQuizzes || []).find((q) => {
              if (!q || !q.id || !q.topicId) return false;
              return String(q.topicId).trim() === String(topic.id).trim();
            });

            const activeQuizId = matchingQuiz?.id ? String(matchingQuiz.id) : null;

            // 1. Teoria Base
            const theoryScore =
              topic.firstStudy === "Concluido"
                ? 20
                : topic.firstStudy === "Em Estudo" || topic.firstStudy === "Em Revisão"
                  ? 10
                  : 0;

            // 2. Retenção FSRS / Histórico
            const reviewHistories = topic.reviewHistories || [];
            const validReviews = reviewHistories.filter((r: any) => {
              const gradeStr = r && r.grade ? String(r.grade).toUpperCase() : "";
              return ["BOM", "FACIL", "3", "4", "5"].includes(gradeStr);
            }).length;

            const reviewVolumeScore = Math.min(1, validReviews / 4) * 20;
            const intervalScore = Math.min(1, (topic.interval || 0) / 30) * 20;
            const flashcardScore = reviewVolumeScore + intervalScore;

            // 3. Banco de Questões
            const quizScore = activeQuizId ? 40 : 0;

            const topicProgress = Math.min(
              100,
              Math.round(theoryScore + flashcardScore + quizScore),
            );
            subjectProgressSum += topicProgress;

            return {
              id: topic.id,
              title: topic.title,
              subjectName: sub.name,
              subjectColor: sub.color,
              firstStudy: topic.firstStudy,
              performance: topic.performance,
              lastRev: topic.lastRev,
              nextRev: topic.nextRev,
              progress: topicProgress,
              quizId: activeQuizId,
            };
          });

          const subjectProgress =
            formattedTopics.length > 0
              ? Math.round(subjectProgressSum / formattedTopics.length)
              : 0;

          const allReviews = rawTopics.flatMap((t: any) => t.reviewHistories || []);
          const correctReviews = allReviews.filter((r: any) => {
            const gradeStr = r && r.grade ? String(r.grade).toUpperCase() : "";
            return ["BOM", "FACIL", "3", "4", "5"].includes(gradeStr);
          }).length;

          const subjectAccuracy =
            allReviews.length > 0
              ? Math.round((correctReviews / allReviews.length) * 100)
              : subjectProgress;

          accumulatedGlobalProgress += subjectProgressSum;

          return {
            id: sub.id,
            name: sub.name,
            color: sub.color,
            importance: sub.importance,
            priority: sub.priority ?? 6.3,
            weight:
              typeof (sub as any).weight === "number" && !isNaN((sub as any).weight)
                ? (sub as any).weight
                : sub.priority && sub.priority <= 10
                  ? sub.priority
                  : 5.0,
            progress: subjectProgress,
            accuracy: subjectAccuracy,
            domain: subjectAccuracy,
            topics: formattedTopics,
          };
        });

        const globalProgress =
          totalTopicsGlobal > 0
            ? Math.round(accumulatedGlobalProgress / totalTopicsGlobal)
            : 0;

        return NextResponse.json({
          globalProgress,
          data: formattedSubjects,
        });
      } catch (subErr) {
        console.error("❌ Erro no modo subjects:", subErr);
        return NextResponse.json(
          { error: "Erro interno no modo subjects", details: String(subErr) },
          { status: 500 },
        );
      }
    }

    // Modo Padrão
    const topics = await prisma.topic.findMany({
      where: { subject: { userId } },
      include: {
        subject: { select: { name: true, color: true } },
      },
      orderBy: { id: "desc" },
    });

    const formattedTopics = topics.map((t: any) => {
      const matchingQuiz = userQuizzes.find(
        (q) =>
          q.topicId === t.id ||
          (q.topicId && q.topicId.trim().toLowerCase() === t.title.trim().toLowerCase()),
      );
      return {
        ...t,
        subjectName: t.subject?.name || "Geral",
        subjectColor: t.subject?.color || "#3B82F6",
        quizId: matchingQuiz?.id || null,
      };
    });

    return NextResponse.json({ data: formattedTopics }, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ ERRO NO GET /api/edital:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.action === "CREATE") {
      const { title, subjectName, relevance, weight } = body;

      if (!title || !subjectName) {
        return NextResponse.json(
          { error: "Título e Matéria são obrigatórios" },
          { status: 400 },
        );
      }

      let subject = await prisma.subject.findFirst({
        where: {
          name: { equals: subjectName.trim(), mode: "insensitive" },
          userId,
        },
      });

      if (!subject) {
        const randomColor =
          PRESET_HEX_COLORS[Math.floor(Math.random() * PRESET_HEX_COLORS.length)];

        const rawWeight =
          typeof weight === "number" ? weight : parseFloat(String(weight || "5.0"));
        const safeWeight = !isNaN(rawWeight)
          ? Math.min(10, Math.max(1, rawWeight))
          : 5.0;

        subject = await prisma.subject.create({
          data: {
            name: subjectName.trim(),
            userId,
            importance: "5",
            color: randomColor,
            weight: safeWeight,
          },
        });
      }

      const newTopic = await prisma.topic.create({
        data: {
          title: title.trim(),
          subjectId: subject.id,
          firstStudy: "Pendente",
          performance: 0,
          relevance: relevance || "5/10",
        },
      });

      return NextResponse.json(
        { message: "Conteúdo criado com sucesso!", data: newTopic },
        { status: 201 },
      );
    }

    const { topicId, grade, performance, streakDays = 0 } = body;

    if (!topicId || grade === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const currentTopic = await prisma.topic.findFirst({
      where: { id: topicId, subject: { userId } },
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

    if (!currentTopic) {
      return NextResponse.json(
        { error: "Topic not found or unauthorized" },
        { status: 404 },
      );
    }

    // Calcula acurácia real da disciplina
    let totalQuestions = 0;
    let totalCorrect = 0;
    (currentTopic.subject?.topics || []).forEach((t: any) => {
      (t.quizAttempts || []).forEach((qa: any) => {
        totalQuestions += qa.totalCount;
        totalCorrect += qa.correctCount;
      });
    });
    const subjectAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : null;

    // Normaliza a nota para escala FSRS (1..4)
    const normalizedGrade = normalizeGrade(grade);
    const earnedXp = calculateEarnedXp(String(grade), Number(streakDays));

    // Executa algoritmo FSRS unificado
    const fsrsResult = calculateTopicFSRSReview({
      grade: normalizedGrade,
      currentInterval: currentTopic.interval,
      currentEasiness: currentTopic.easiness,
      currentRepetitions: currentTopic.repetitions,
      subjectAccuracy,
      subjectPriority: Number(currentTopic.subject?.weight || 5.0),
    });

    // Transação para registro de XP, histórico e atualização do tópico
    const [, updatedStats, updatedTopic] = await prisma.$transaction([
      prisma.reviewHistory.create({
        data: {
          topicId,
          grade: String(normalizedGrade),
        },
      }),
      prisma.userStats.upsert({
        where: { userId },
        update: { totalXp: { increment: earnedXp } },
        create: { userId, totalXp: earnedXp },
      }),
      prisma.topic.update({
        where: { id: topicId },
        data: {
          firstStudy: "Em Revisão",
          performance:
            performance !== undefined
              ? Math.round(Number(performance))
              : Math.round((normalizedGrade / 4) * 100),
          lastRev: new Date(),
          nextRev: fsrsResult.nextReviewDate,
          easiness: fsrsResult.newEasiness,
          interval: fsrsResult.newInterval,
          repetitions: fsrsResult.newRepetitions,
        },
      }),
    ]);

    const levelInfo = calculateLevel(updatedStats.totalXp);

    return NextResponse.json(
      {
        message: "Motor FSRS e Gamificação atualizados com sucesso!",
        earnedXp,
        totalXp: updatedStats.totalXp,
        levelInfo,
        data: updatedTopic,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("❌ ERRO NO POST /api/edital:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("id");
    const subjectId = searchParams.get("subjectId");

    if (topicId) {
      const topic = await prisma.topic.findFirst({
        where: { id: topicId, subject: { userId } },
      });

      if (!topic) {
        return NextResponse.json(
          { error: "Tópico não encontrado ou sem permissão." },
          { status: 404 },
        );
      }

      await prisma.topic.delete({ where: { id: topicId } });
      return NextResponse.json({ success: true, deletedTopicId: topicId });
    }

    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: {
          userId,
          OR: [{ id: subjectId }, { name: subjectId }],
        },
      });

      if (!subject) {
        return NextResponse.json(
          { error: "Matéria não encontrada ou sem permissão." },
          { status: 404 },
        );
      }

      await prisma.topic.deleteMany({ where: { subjectId: subject.id } });
      await prisma.subject.delete({ where: { id: subject.id } });

      return NextResponse.json({ success: true, deletedSubjectId: subject.id });
    }

    return NextResponse.json(
      { error: "Nenhum ID de tópico ou matéria foi fornecido." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Erro no DELETE /api/edital:", error);
    return NextResponse.json(
      { error: "Erro interno ao tentar excluir do banco de dados." },
      { status: 500 },
    );
  }
}
