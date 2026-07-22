import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 🔑 DEFINIR AQUI O ID REAL DO USUÁRIO
const REAL_USER_ID = "test";

// GET: Busca o Edital Verticalizado, Lista de Tópicos ou Fila de Revisões Diárias
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "topics"; // 'topics', 'subjects' ou 'review'
    const type = searchParams.get("type");

    if (type === "pending") {
      const hoje = new Date();
      const pendencias = await prisma.topic.findMany({
        where: {
          nextRev: { lte: hoje }, // Ajuste o campo conforme seu schema real
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
          subject: { userId: REAL_USER_ID },
          OR: [{ firstStudy: "Pendente" }, { nextRev: { lte: now } }],
        },
        include: {
          subject: {
            select: { name: true },
          },
          flashcards: true,
        },
        orderBy: [{ firstStudy: "asc" }, { nextRev: "asc" }],
      });

      return NextResponse.json({ data: reviewQueue }, { status: 200 });
    }

    // 2. Modo: Retorna o Edital Macro agrupado por Matérias
    if (mode === "subjects") {
      const subjects = await prisma.subject.findMany({
        where: { userId: REAL_USER_ID },
        include: {
          _count: {
            select: { topics: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ data: subjects }, { status: 200 });
    }

    // 3. Modo Padrão (topics): Retorna a listagem detalhada de todos os tópicos
    const topics = await prisma.topic.findMany({
      where: {
        subject: { userId: REAL_USER_ID },
      },
      include: {
        subject: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
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
          userId: REAL_USER_ID,
        },
      });

      const userExists = await prisma.user.findUnique({
        where: { id: REAL_USER_ID },
      });
      if (!userExists) {
        console.error(
          "ERRO: Usuário não encontrado no banco com o ID:",
          REAL_USER_ID,
        );
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            name: subjectName.trim(),
            userId: REAL_USER_ID,
            importance: "5", // Ótima sacada colocar o campo obrigatório aqui!
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

    // 🧠 FLUXO B: Atualizar histórico e curva de esquecimento (Algoritmo SM-2 Avançado)
    const { topicId, grade, performance } = body;

    if (!topicId || !grade) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Registra a sessão de revisão no histórico para auditoria e IA futura
    await prisma.reviewHistory.create({
      data: { topicId, grade },
    });

    // 2. Busca os dados atuais do tópico para saber em qual estágio da curva ele está
    const currentTopic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!currentTopic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // 3. Mapeia o feedback com maior granularidade
    let q = 5;
    if (grade === "Difícil") q = 3;
    if (grade === "Errei") q = 1;

    // Ajuste Fino: Se o usuário marcou "Bom" mas a performance foi < 70%,
    // tratamos como um "Difícil" para não inflar a facilidade do tópico.
    if (grade === "Bom" && performance < 70) q = 3;

    let easiness = currentTopic.easiness ?? 2.5;
    let repetitions = currentTopic.repetitions ?? 0;
    let interval = currentTopic.interval ?? 0;

    // 4. Lógica SM-2 Refinada
    if (q >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        // Aumentamos a agressividade do multiplicador se a performance for excelente (>90%)
        const performanceMultiplier = performance > 90 ? 1.2 : 1.0;
        interval = Math.round(interval * easiness * performanceMultiplier);
      }
      repetitions++;
    } else {
      // Se errou, zeramos a progressão, mas se a performance foi quase zero,
      // reduzimos o easiness de forma mais drástica.
      repetitions = 0;
      interval = performance < 30 ? 0 : 1; // 0 = Revisar hoje ainda (urgente)
    }

    // 5. Ajuste de Easiness com penalidade baseada em Performance
    // Se a performance estiver ruim, reduzimos o fator de facilidade (easiness)
    const performancePenalty = (100 - performance) / 200; // Penalidade sutil
    easiness =
      easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)) - performancePenalty;

    if (easiness < 1.3) easiness = 1.3;
    if (easiness > 3.0) easiness = 3.0; // Teto para não deixar o intervalo infinito

    // 6. Calcula a data (Garantindo UTC para consistência total)
    const nextRevisionDate = new Date();

    if (interval > 0) {
      // Adiciona os dias
      nextRevisionDate.setDate(nextRevisionDate.getDate() + interval);
      // Força o horário para o início da manhã em UTC (08:00 AM)
      nextRevisionDate.setUTCHours(8, 0, 0, 0);
    } else {
      // Revisão urgente: daqui a 2 horas, mantendo a consistência
      nextRevisionDate.setHours(nextRevisionDate.getHours() + 2);
    }

    // 7. Salva o novo estado matemático e metadados no banco de dados
    const updatedTopic = await prisma.topic.update({
      where: { id: topicId },
      data: {
        firstStudy: "Em Revisão",
        performance: performance !== undefined ? performance : 0,
        lastRev: new Date(),
        nextRev: nextRevisionDate,
        // Salvando os novos campos do SM-2:
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
    console.error("❌ ERRO CRÍTICO NO PRISMA 7:", error);

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("id");
    const subjectId = searchParams.get("subjectId");

    // 1. Deleção de Tópico Individual
    if (topicId) {
      await prisma.topic.delete({
        where: { id: topicId },
      });
      return NextResponse.json({ success: true, deletedTopicId: topicId });
    }

    // 2. Deleção de Matéria Inteira
    if (subjectId) {
      // Tenta buscar a matéria pelo ID ou pelo NOME
      const subject = await prisma.subject.findFirst({
        where: {
          OR: [{ id: subjectId }, { name: subjectId }],
        },
      });

      if (!subject) {
        // Se a matéria não existir na tabela Subject, mas houver tópicos com esse name
        await prisma.topic.deleteMany({
          where: {
            subject: {
              name: subjectId,
            },
          },
        });
        return NextResponse.json({
          success: true,
          message: "Tópicos da matéria removidos",
        });
      }

      // Caso a matéria exista na tabela Subject, remove em cascata (Tópicos + Matéria)
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
