import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function POST(request: Request) {
  try {
    const { banca, subject, difficulty, questions } = await request.json();

    if (!subject || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Missing required data." },
        { status: 400 },
      );
    }

    // Usa a instância global que criamos no passo 1
    const newQuiz = await prisma.quiz.create({
      data: {
        banca,
        subject,
        difficulty,
        questions: questions,
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: newQuiz.id,
        message: "Quiz successfully saved to Supabase!",
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Prisma Error:", error);
    return NextResponse.json(
      { error: "Failed to save quiz.", details: errorMessage },
      { status: 500 },
    );
  }
}
