import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Busca os dados usando a nossa instância global limpa
    const quizzes = await prisma.quiz.findMany({
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
