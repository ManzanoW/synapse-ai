import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 🔑 DEFINIR AQUI O ID REAL DO USUÁRIO
const REAL_USER_ID = "test";

// GET: Busca o Edital Verticalizado ou a Lista de Tópicos do usuário
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "topics";

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
    const { topicId, grade, performance } = body; // grade: "Bom", "Difícil", "Errei"

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

    // 3. Mapeia o feedback visual em notas numéricas do SM-2 (de 0 a 5)
    // "Bom" mapeia para 5 (memorização perfeita)
    // "Difícil" mapeia para 3 (resposta correta, mas com esforço significativo)
    // "Errei" mapeia para 1 (resposta incorreta, mas lembra vagamente do assunto)
    let q = 5;
    if (grade === "Difícil") q = 3;
    if (grade === "Errei") q = 1;

    // Recarrega os estados atuais salvos no banco
    let easiness = currentTopic.easiness ?? 2.5;
    let repetitions = currentTopic.repetitions ?? 0;
    let interval = currentTopic.interval ?? 0;

    // 4. Aplica a lógica matemática do SM-2
    if (q >= 3) {
      // Se o usuário acertou ("Bom" ou "Difícil")
      if (repetitions === 0) {
        interval = 1; // 1º acerto: revisa amanhã
      } else if (repetitions === 1) {
        interval = 6; // 2º acerto seguido: revisa em 6 dias
      } else {
        // A partir do 3º acerto: multiplica o intervalo anterior pelo fator de facilidade
        interval = Math.round(interval * easiness);
      }
      repetitions++; // Incrementa a sequência de acertos
    } else {
      // Se o usuário errou
      repetitions = 0; // Zera a sequência de acertos consecutivo
      interval = 1; // Volta para a esteira inicial (revisar amanhã)
    }

    // 5. Atualiza o Fator de Facilidade (Easiness Factor) com base na nota
    // Fórmula clássica do SM-2: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easiness = easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

    // Garante que o Fator de Facilidade nunca caia abaixo do limite crítico de 1.3
    if (easiness < 1.3) {
      easiness = 1.3;
    }

    // 6. Calcula a data exata da próxima revisão somando o intervalo de dias
    const nextRevisionDate = new Date();
    nextRevisionDate.setDate(nextRevisionDate.getDate() + interval);

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
