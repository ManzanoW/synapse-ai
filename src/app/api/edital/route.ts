import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PRESET_HEX_COLORS } from "@/constants/subjects";
import { auth } from "@/auth";
import { calculateEarnedXp, calculateLevel } from "@/lib/gamification";

export const dynamic = "force-dynamic";

// Helper para capturar e validar o ID do usuário autenticado
async function getAuthenticatedUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user.id;
}

// GET: Busca o Edital Verticalizado, Lista de Tópicos ou Fila de Revisões Diárias
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "topics"; // 'topics', 'subjects' ou 'review'
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

    // 1. Modo: Filtrar apenas tópicos que precisam ser revisados HOJE (Fila de Ebbinghaus)
    if (mode === "review") {
      const now = new Date();

      const reviewQueue = await prisma.topic.findMany({
        where: {
          subject: { userId: userId },
          OR: [{ firstStudy: "Pendente" }, { nextRev: { lte: now } }],
        },
        include: {
          subject: {
            select: { name: true, color: true },
          },
          flashcards: true,
        },
        orderBy: [{ firstStudy: "asc" }, { nextRev: "asc" }],
      });

      return NextResponse.json({ data: reviewQueue }, { status: 200 });
    }

    // 2. Modo: Subjects (Com Fórmula de Domínio Real & Progresso Geral)
    if (mode === "subjects") {
      try {
        const subjects = await prisma.subject.findMany({
          where: {
            userId: userId,
          },
          select: {
            id: true,
            name: true,
            color: true,
            importance: true,
            topics: {
              select: {
                id: true,
                title: true,
                firstStudy: true,
                interval: true,
                reviewHistories: {
                  select: { grade: true },
                },
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

        let totalTopicsGlobal = 0;
        let accumulatedGlobalProgress = 0;

        const formattedSubjects = (subjects || []).map((sub) => {
          let subjectProgressSum = 0;
          const rawTopics = sub.topics || [];

          const formattedTopics = rawTopics.map((topic) => {
            totalTopicsGlobal++;

            // 1. Teoria Base (Máx 20%)
            const theoryScore =
              topic.firstStudy === "Concluido"
                ? 20
                : topic.firstStudy === "Em Estudo" ||
                    topic.firstStudy === "Em Revisão"
                  ? 10
                  : 0;

            // 2. Retenção SM-2 (Máx 40%)
            const reviewHistories = topic.reviewHistories || [];
            const validReviews = reviewHistories.filter((r) => {
              const gradeStr =
                r && r.grade ? String(r.grade).toUpperCase() : "";
              return ["BOM", "FACIL", "3", "4", "5"].includes(gradeStr);
            }).length;

            const reviewVolumeScore = Math.min(1, validReviews / 4) * 20;
            const intervalScore = Math.min(1, (topic.interval || 0) / 30) * 20;
            const flashcardScore = reviewVolumeScore + intervalScore;

            // 3. Banco de Questões (Máx 40%)
            const quizAttempts = topic.quizAttempts || [];

            const totalAsked = quizAttempts.reduce(
              (acc, q) => acc + Number(q?.totalCount || 0),
              0,
            );
            const totalCorrect = quizAttempts.reduce(
              (acc, q) => acc + Number(q?.correctCount || 0),
              0,
            );

            const MIN_QUESTIONS_TARGET = 20;
            let quizScore = 0;

            if (totalAsked > 0) {
              const accuracyRatio = totalCorrect / totalAsked;
              const volumeRatio = Math.min(
                1,
                totalAsked / MIN_QUESTIONS_TARGET,
              );
              quizScore = accuracyRatio * volumeRatio * 40;
            }

            const topicProgress = Math.min(
              100,
              Math.round(theoryScore + flashcardScore + quizScore),
            );
            subjectProgressSum += topicProgress;

            return {
              id: topic.id,
              title: topic.title,
              progress: topicProgress,
            };
          });

          const subjectProgress =
            formattedTopics.length > 0
              ? Math.round(subjectProgressSum / formattedTopics.length)
              : 0;

          accumulatedGlobalProgress += subjectProgressSum;

          return {
            id: sub.id,
            name: sub.name,
            color: sub.color,
            importance: sub.importance,
            progress: subjectProgress,
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
        console.error("❌ Erro interno no modo subjects:", subErr);
        return NextResponse.json(
          { error: "Erro interno no modo subjects", details: String(subErr) },
          { status: 500 },
        );
      }
    }

    // 3. Modo Padrão (topics)
    const topics = await prisma.topic.findMany({
      where: {
        subject: { userId: userId },
      },
      include: {
        subject: {
          select: { name: true, color: true },
        },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ data: topics }, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ ERRO NO GET /api/edital:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}

// POST: Trata tanto a criação de novos conteúdos quanto a atualização da curva de Ebbinghaus
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // 🌟 FLUXO A: Criação de Novo Conteúdo / Tópico
    if (body.action === "CREATE") {
      const { title, subjectName, relevance } = body;

      if (!title || !subjectName) {
        return NextResponse.json(
          { error: "Título e Matéria são obrigatórios" },
          { status: 400 },
        );
      }

      let subject = await prisma.subject.findFirst({
        where: {
          name: {
            equals: subjectName.trim(),
            mode: "insensitive",
          },
          userId: userId,
        },
      });

      if (!subject) {
        const randomColor =
          PRESET_HEX_COLORS[
            Math.floor(Math.random() * PRESET_HEX_COLORS.length)
          ];

        subject = await prisma.subject.create({
          data: {
            name: subjectName.trim(),
            userId: userId,
            importance: "5",
            color: randomColor,
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

    // 🧠 FLUXO B: Atualizar histórico e curva de esquecimento (SM-2)
    const { topicId, grade, performance, streakDays = 0 } = body;

    if (!topicId || !grade) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const currentTopic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        subject: { userId: userId },
      },
    });

    if (!currentTopic) {
      return NextResponse.json(
        { error: "Topic not found or unauthorized" },
        { status: 404 },
      );
    }

    await prisma.reviewHistory.create({
      data: { topicId, grade },
    });

    // ⚡ CÁLCULO DINÂMICO DE XP COM STREAK MULTIPLIER
    const earnedXp = calculateEarnedXp(grade, Number(streakDays));

    // Persiste o XP no banco de dados
    const updatedStats = await prisma.userStats.upsert({
      where: { userId: userId },
      update: {
        totalXp: { increment: earnedXp },
      },
      create: {
        userId: userId,
        totalXp: earnedXp,
      },
    });

    // Calcula o novo nível e progresso atualizado
    const levelInfo = calculateLevel(updatedStats.totalXp);

    // --- LÓGICA DO ALGORITMO SM-2 ---
    let q = 5;
    if (grade === "Difícil") q = 3;
    if (grade === "Errei") q = 1;
    if (grade === "Bom" && performance < 70) q = 3;

    let easiness = currentTopic.easiness ?? 2.5;
    let repetitions = currentTopic.repetitions ?? 0;
    let interval = currentTopic.interval ?? 0;

    if (q >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        const performanceMultiplier = performance > 90 ? 1.2 : 1.0;
        interval = Math.round(interval * easiness * performanceMultiplier);
      }
      repetitions++;
    } else {
      repetitions = 0;
      interval = performance < 30 ? 0 : 1;
    }

    const performancePenalty = (100 - performance) / 200;
    easiness =
      easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)) - performancePenalty;

    if (easiness < 1.3) easiness = 1.3;
    if (easiness > 3.0) easiness = 3.0;

    const nextRevisionDate = new Date();

    if (interval > 0) {
      nextRevisionDate.setDate(nextRevisionDate.getDate() + interval);
      nextRevisionDate.setUTCHours(8, 0, 0, 0);
    } else {
      nextRevisionDate.setHours(nextRevisionDate.getHours() + 2);
    }

    const updatedTopic = await prisma.topic.update({
      where: { id: topicId },
      data: {
        firstStudy: "Em Revisão",
        performance: performance !== undefined ? performance : 0,
        lastRev: new Date(),
        nextRev: nextRevisionDate,
        easiness: easiness,
        interval: interval,
        repetitions: repetitions,
      },
    });

    return NextResponse.json(
      {
        message: "Curva de Ebbinghaus e Gamificação atualizadas!",
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
        where: {
          id: topicId,
          subject: { userId: userId },
        },
      });

      if (!topic) {
        return NextResponse.json(
          { error: "Tópico não encontrado ou sem permissão." },
          { status: 404 },
        );
      }

      await prisma.topic.delete({
        where: { id: topicId },
      });
      return NextResponse.json({ success: true, deletedTopicId: topicId });
    }

    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: {
          userId: userId,
          OR: [{ id: subjectId }, { name: subjectId }],
        },
      });

      if (!subject) {
        return NextResponse.json(
          { error: "Matéria não encontrada ou sem permissão." },
          { status: 404 },
        );
      }

      await prisma.topic.deleteMany({
        where: { subjectId: subject.id },
      });

      await prisma.subject.delete({
        where: { id: subject.id },
      });

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
