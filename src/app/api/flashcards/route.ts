import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client"; // Importação necessária para o tipo

export async function POST(request: Request) {
  try {
    const { topicId, question, answer, details, deckId } = await request.json();

    if (!topicId || !question || !answer || !deckId) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (incluindo deckId)" },
        { status: 400 },
      );
    }

    // Criamos o objeto de dados usando o tipo gerado pelo Prisma
    const flashcardData: Prisma.FlashcardCreateInput = {
      question,
      answer,
      details: details || "",
      topic: { connect: { id: topicId } },
      deck: { connect: { id: deckId } }, // Conectamos ao deck obrigatório
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
