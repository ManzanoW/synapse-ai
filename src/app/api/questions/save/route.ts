import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateSubjectSRS } from "@/lib/srs-service";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { banca, subject, difficulty, questions, topicId } = await request.json();

    if (!subject || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes." },
        { status: 400 }
      );
    }

    // 1. Calcula os acertos da sessão de questões
    const totalCount = questions.length;
    const correctCount = questions.filter(
      (q: { isCorrect?: boolean; correct?: boolean; userAnswer?: string; answer?: string }) => 
        q.isCorrect === true || (q.userAnswer && q.userAnswer === q.answer)
    ).length;

    // 2. Localiza o registro da matéria vinculada ao usuário
    const subjectRecord = await prisma.subject.findFirst({
      where: {
        name: { equals: subject.trim(), mode: "insensitive" },
        userId: userId,
      },
      include: {
        topics: { take: 1 }, // Fallback para vincular ao 1º tópico caso topicId não venha no payload
      },
    });

    // Tenta usar o topicId enviado, ou resgata o primeiro tópico da matéria
    const targetTopicId = topicId || subjectRecord?.topics[0]?.id;

    // 3. Salva o Quiz vinculado ao usuário e tópico
    const newQuiz = await prisma.quiz.create({
      data: {
        banca: banca || "Geral",
        subject,
        difficulty: difficulty || "Média",
        questions,
        userId: userId,
        topicId: targetTopicId || null,
      },
    });

    // 4. 🚀 CRUCIAL: Grava a tentativa no QuizAttempt para alimentar a fórmula do Edital
    if (targetTopicId) {
      await prisma.quizAttempt.create({
        data: {
          userId: userId,
          topicId: targetTopicId,
          totalCount,
          correctCount,
        },
      });

      // Atualiza também o timestamp do último quiz no tópico
      await prisma.topic.update({
        where: { id: targetTopicId },
        data: { lastQuizAt: new Date() },
      });
    }

    // 5. Atualiza o SRS da matéria se aplicável
    if (subjectRecord) {
      const performance = correctCount / totalCount >= 0.7 ? "bom" : "dificil";
      await updateSubjectSRS(subjectRecord.id, performance);
    }

    return NextResponse.json(
      { success: true, id: newQuiz.id, correctCount, totalCount },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro ao salvar quiz e tentativas:", error);
    return NextResponse.json(
      { error: "Falha ao salvar quiz.", details: errorMessage },
      { status: 500 }
    );
  }
}
