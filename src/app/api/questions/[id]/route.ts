import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do simulado não fornecido." },
        { status: 400 },
      );
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Simulado não encontrado ou não pertence a este usuário." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: quiz }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Prisma Error ao buscar simulado:", error);
    return NextResponse.json(
      { error: "Falha ao obter o simulado.", details: errorMessage },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    // Aguarda o unwrapping de params (obrigatório nas versões atuais do Next.js)
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do simulado não fornecido." },
        { status: 400 },
      );
    }

    // Garante que o quiz a ser deletado pertença ao usuário logado
    const existing = await prisma.quiz.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Simulado não encontrado ou sem permissão para exclusão." },
        { status: 404 },
      );
    }

    await prisma.quiz.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Simulado excluído com sucesso." },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Prisma Error ao deletar:", error);
    return NextResponse.json(
      { error: "Falha ao excluir o simulado.", details: errorMessage },
      { status: 500 },
    );
  }
}
