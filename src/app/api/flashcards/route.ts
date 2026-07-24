import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { question, answer, details, subject } = await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (question, answer)" },
        { status: 400 },
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

    // 🛡️ 1. Verifica se o flashcard já existe no deck do usuário antes de abrir a transação
    const existingCard = await prisma.flashcard.findFirst({
      where: {
        question: question,
        deck: {
          userId: userId,
        },
      },
    });

    if (existingCard) {
      // Retorna 200/201 amigável com os dados do card existente, sem duplicar no banco
      return NextResponse.json(
        { data: existingCard, message: "Flashcard já existente." },
        { status: 200 },
      );
    }

    // 🚀 2. Executa as verificações e a criação em uma única transação limpa
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

      // Busca ou cria o Deck
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
          },
        });
      }

      // Busca ou cria o Topic
      let topic = await tx.topic.findFirst({
        where: { title: subjectName, subjectId: userSubject.id },
      });

      if (!topic) {
        topic = await tx.topic.create({
          data: {
            title: subjectName,
            subjectId: userSubject.id,
          },
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
      { status: 500 },
    );
  }
}
