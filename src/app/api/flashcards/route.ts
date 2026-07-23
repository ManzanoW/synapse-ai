import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { topicId, question, answer, details, deckId } = await request.json();

    if (!topicId || !question || !answer || !deckId) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (incluindo deckId)" },
        { status: 400 },
      );
    }

    // 🔒 Garante que o deck pertence ao usuário
    const userDeck = await prisma.deck.findFirst({
      where: { id: deckId, userId },
    });

    if (!userDeck) {
      return NextResponse.json(
        { error: "Deck não encontrado ou sem permissão." },
        { status: 403 },
      );
    }

    const flashcardData: Prisma.FlashcardCreateInput = {
      question,
      answer,
      details: details || "",
      topic: { connect: { id: topicId } },
      deck: { connect: { id: deckId } },
    };

    const newFlashcard = await prisma.flashcard.create({
      data: flashcardData,
    });

    return NextResponse.json({ data: newFlashcard }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar flashcard:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar flashcard" },
      { status: 500 },
    );
  }
}
