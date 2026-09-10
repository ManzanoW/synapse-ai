import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * 📥 GET: Lista todos os flashcards do usuário logado (ou filtrados por deckId)
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get("deckId");

    // 🛡️ Filtra estritamente apenas os cards pertencentes aos baralhos do usuário logado
    const cards = await prisma.flashcard.findMany({
      where: {
        deck: {
          userId: userId, // Multi-Tenancy isolado por usuário
          ...(deckId ? { id: deckId } : {}),
        },
      },
      include: {
        deck: {
          select: { id: true, title: true, subjectId: true, topicId: true },
        },
        topic: {
          select: { id: true, title: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ data: cards });
  } catch (error) {
    console.error("❌ Erro no GET /api/flashcards:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao buscar flashcards" },
      { status: 500 }
    );
  }
}

/**
 * 📤 POST: Cria um novo flashcard e vincula ao Subject/Deck/Topic do usuário logado
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { question, answer, details, subject, topicId } = await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (question, answer)" },
        { status: 400 }
      );
    }

    // 🛡️ Tratamento ultra seguro para o 'subject'
    const rawSubject =
      typeof subject === "object" && subject !== null
        ? (subject as Record<string, unknown>).name ||
          (subject as Record<string, unknown>).title ||
          ""
        : subject;

    const subjectName =
      typeof rawSubject === "string" && rawSubject.trim() !== ""
        ? rawSubject.trim()
        : "Questões de Prova";

    // 🛡️ 1. Verifica se o flashcard já existe no deck do usuário
    const existingCard = await prisma.flashcard.findFirst({
      where: {
        question: question,
        deck: {
          userId: userId,
        },
      },
    });

    if (existingCard) {
      return NextResponse.json(
        { data: existingCard, message: "Flashcard já existente." },
        { status: 200 }
      );
    }

    // 🚀 2. Executa as verificações e a criação em uma transação limpa
    const newFlashcard = await prisma.$transaction(async (tx) => {
      // Busca ou cria o Subject
      let userSubject = await tx.subject.findFirst({
        where: { name: subjectName, userId },
      });

      if (!userSubject) {
        userSubject = await tx.subject.create({
          data: {
            name: subjectName,
            importance: "Média",
            userId,
          },
        });
      }

      // Busca o tópico especificado pelo ID ou tenta encontrar pelo título do subject
      let topic = topicId
        ? await tx.topic.findFirst({ where: { id: topicId, subjectId: userSubject.id } })
        : await tx.topic.findFirst({ where: { title: subjectName, subjectId: userSubject.id } });

      if (!topic) {
        topic = await tx.topic.create({
          data: {
            title: subjectName,
            subjectId: userSubject.id,
          },
        });
      }

      // Busca ou cria o Deck vinculado também ao topic
      let userDeck = await tx.deck.findFirst({
        where: { title: subjectName, userId },
      });

      if (!userDeck) {
        userDeck = await tx.deck.create({
          data: {
            title: subjectName,
            color: "bg-blue-500",
            userId,
            subjectId: userSubject.id,
            topicId: topic.id,
          },
        });
      } else if (!userDeck.topicId) {
        // Vincula o topicId ao deck caso o deck já existia sem tópico associado
        await tx.deck.update({
          where: { id: userDeck.id },
          data: { topicId: topic.id },
        });
      }

      // Cria o Flashcard
      return await tx.flashcard.create({
        data: {
          question,
          answer,
          details: details || "",
          deckId: userDeck.id,
          topicId: topic.id,
        },
      });
    });

    return NextResponse.json({ data: newFlashcard }, { status: 201 });
  } catch (error) {
    console.error("Erro no servidor ao criar flashcard:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao salvar flashcard" },
      { status: 500 }
    );
  }
}
