import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PRESET_HEX_COLORS } from "@/constants/subjects";
import { auth } from "@/auth"; // Importação do Auth.js v5

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
          subject: { userId: userId }, // 🔒 Filtrado por usuário
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
          subject: { userId: userId }, // 🔒 Filtrado por usuário
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

    // 2. Modo: Subjects
    if (mode === "subjects") {
      const subjects = await prisma.subject.findMany({
        where: {
          userId: userId, // 🔒 Filtrado por usuário
        },
        include: {
          topics: {
            select: {
              firstStudy: true,
              performance: true,
            },
          },
          _count: {
            select: { topics: true },
          },
        },
      });

      // Mapeia cada matéria calculando o progresso dinamicamente
      const formattedSubjects = subjects.map((sub) => {
        const totalTopics = sub.topics.length;

        // Considera concluído o tópico cujo status não é mais "Pendente"
        const completedTopics = sub.topics.filter(
          (t) => t.firstStudy !== "Pendente",
        ).length;

        // Cálculo do progresso percentual (0 a 100)
        const progress =
          totalTopics > 0
            ? Math.round((completedTopics / totalTopics) * 100)
            : 0;

        // Cálculo da média de acertos/desempenho
        const totalPerformance = sub.topics.reduce(
          (acc, t) => acc + t.performance,
          0,
        );
        const accuracy =
          completedTopics > 0
            ? Math.round(totalPerformance / completedTopics)
            : 0;

        return {
          ...sub,
          progress,
          accuracy,
        };
      });

      return NextResponse.json({ data: formattedSubjects });
    }

    // 3. Modo Padrão (topics)
    const topics = await prisma.topic.findMany({
      where: {
        subject: { userId: userId }, // 🔒 Filtrado por usuário
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
          userId: userId, // 🔒 Procura matérias existentes deste usuário específico
        },
      });

      if (!subject) {
        // Escolhe uma cor aleatória do preset caso a matéria seja nova
        const randomColor =
          PRESET_HEX_COLORS[
            Math.floor(Math.random() * PRESET_HEX_COLORS.length)
          ];

        subject = await prisma.subject.create({
          data: {
            name: subjectName.trim(),
            userId: userId, // 🔒 Cria vinculando ao ID real do usuário autenticado
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

    // 🧠 FLUXO B: Atualizar histórico e curva de esquecimento (SM-2 Avançado)
    const { topicId, grade, performance } = body;

    if (!topicId || !grade) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Garante que o tópico pertence a uma matéria do usuário autenticado
    const currentTopic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        subject: { userId: userId }, // 🔒 Validação de segurança
      },
    });

    if (!currentTopic) {
      return NextResponse.json(
        { error: "Topic not found or unauthorized" },
        { status: 404 },
      );
    }

    // Registra a sessão de revisão no histórico
    await prisma.reviewHistory.create({
      data: { topicId, grade },
    });

    // Mapeia o feedback
    let q = 5;
    if (grade === "Difícil") q = 3;
    if (grade === "Errei") q = 1;

    if (grade === "Bom" && performance < 70) q = 3;

    let easiness = currentTopic.easiness ?? 2.5;
    let repetitions = currentTopic.repetitions ?? 0;
    let interval = currentTopic.interval ?? 0;

    // Algoritmo SM-2
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
        message: "Curva de Ebbinghaus atualizada via SM-2!",
        data: updatedTopic,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("❌ ERRO NO POST /api/planner:", error);
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

    // 1. Deleção de Tópico Individual (Valida se pertence ao usuário)
    if (topicId) {
      const topic = await prisma.topic.findFirst({
        where: {
          id: topicId,
          subject: { userId: userId }, // 🔒 Verificação de posse
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

    // 2. Deleção de Matéria Inteira (Valida se pertence ao usuário)
    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: {
          userId: userId, // 🔒 Verificação de posse
          OR: [{ id: subjectId }, { name: subjectId }],
        },
      });

      if (!subject) {
        return NextResponse.json(
          { error: "Matéria não encontrada ou sem permissão." },
          { status: 404 },
        );
      }

      // Remove os tópicos associados e depois a matéria
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
    console.error("Erro no DELETE /api/planner:", error);
    return NextResponse.json(
      { error: "Erro interno ao tentar excluir do banco de dados." },
      { status: 500 },
    );
  }
}
