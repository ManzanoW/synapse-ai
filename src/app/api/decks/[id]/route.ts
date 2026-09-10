// src/app/api/decks/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * 📥 GET: Busca os detalhes de um baralho específico
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const deck = await prisma.deck.findFirst({
      where: { id, userId }, // 🔒 Garante que só busca baralhos do próprio usuário
      include: {
        subject: true,
        topic: true,
        flashcards: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "Baralho não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error("Erro ao buscar detalhes do deck:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

/**
 * 🗑️ DELETE: Exclui um baralho e seus flashcards associados
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // 🔒 Garante que o baralho pertence ao usuário autenticado antes de apagar
    const deck = await prisma.deck.findFirst({
      where: { id, userId },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "Baralho não encontrado ou sem permissão" },
        { status: 404 },
      );
    }

    await prisma.deck.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar deck:", error);
    return NextResponse.json(
      { error: "Erro ao excluir baralho" },
      { status: 500 },
    );
  }
}
