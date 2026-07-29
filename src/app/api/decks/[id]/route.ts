import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Ajuste a importação do Prisma para a estrutura do seu projeto

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const deck = await prisma.deck.findUnique({
      where: { id },
      include: {
        subject: true,
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

// Certifique-se também de manter seu manipulador DELETE caso exista no mesmo arquivo:
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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
