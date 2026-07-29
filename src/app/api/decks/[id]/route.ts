// src/app/api/decks/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * 🗑️ DELETE: Remove um baralho e seus flashcards associados
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // 🟢 Atualizado para Promise
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: deckId } = await params; // 🟢 Resolve a Promise do params

    // 🛡️ Verifica se o deck pertence ao usuário logado
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId: userId,
      },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "Baralho não encontrado ou sem permissão" },
        { status: 404 },
      );
    }

    // Deleta o baralho (deleção em cascata remove os flashcards)
    await prisma.deck.delete({
      where: { id: deckId },
    });

    return NextResponse.json(
      { message: "Baralho excluído com sucesso" },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Erro ao excluir deck:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao excluir baralho" },
      { status: 500 },
    );
  }
}
