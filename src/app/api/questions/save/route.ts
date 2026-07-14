import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateSubjectSRS } from "@/lib/srs-service";

export async function POST(request: Request) {
  try {
    const { banca, subject, difficulty, questions } = await request.json();

    if (!subject || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Missing required data." },
        { status: 400 },
      );
    }

    // 2. Salva o Quiz
    const newQuiz = await prisma.quiz.create({
      data: { banca, subject, difficulty, questions },
    });

    // 3. Integração com SRS:
    // Precisamos buscar o ID da matéria (Subject) pelo nome enviado no 'subject'
    const subjectRecord = await prisma.subject.findFirst({
      where: { name: subject },
    });

    if (subjectRecord) {
      // Exemplo: se > 70% de acerto, "bom"; senão, "dificil"
      const total = questions.length;
      const acertos = questions.filter(
        (q: { isCorrect: boolean }) => q.isCorrect,
      ).length;
      const performance = acertos / total >= 0.7 ? "bom" : "dificil";

      await updateSubjectSRS(subjectRecord.id, performance);
    }

    return NextResponse.json(
      { success: true, id: newQuiz.id },
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
