import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    // Busca os dados incluindo o relacionamento com o tópico específico, filtrando estritamente pelo usuário logado
    const quizzes = await prisma.quiz.findMany({
      where: {
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ data: quizzes }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("ERRO REAL DA API LIST:", error);
    return NextResponse.json(
      { error: "Failed to list history.", details: errorMessage },
      { status: 500 },
    );
  }
}
