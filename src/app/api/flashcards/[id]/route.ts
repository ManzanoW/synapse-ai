// app/api/flashcards/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * 🗑️ DELETE: Remove um flashcard específico garantindo que pertença ao usuário logado
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const flashcardId = params.id;

    // 🛡️ Verifica se o flashcard existe e pertence a um deck do usuário logado
    const existingCard = await prisma.flashcard.findFirst({
      where: {
        id: flashcardId,
        deck: {
          userId: userId,
        },
      },
    });

    if (!existingCard) {
      return NextResponse.json(
        { error: "Flashcard não encontrado ou sem permissão" },
        { status: 404 },
      );
    }

    // Deleta o flashcard
    await prisma.flashcard.delete({
      where: { id: flashcardId },
    });

    return NextResponse.json(
      { message: "Flashcard excluído com sucesso" },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Erro ao excluir flashcard:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao excluir flashcard" },
      { status: 500 },
    );
  }
}
