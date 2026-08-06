import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateSubjectSRS } from "@/lib/srs-service";
import { auth } from "@/auth";
import { XP_REWARDS, calculateLevel } from "@/lib/gamification";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Payload recebido no save:", body);

    const { quizId, banca, subject, difficulty, questions, topicId } = body;

    if (!subject || !questions || questions.length === 0) {
      return NextResponse.json(
        {
          error: "Dados obrigatórios ausentes.",
          received: { subject, questionsCount: questions?.length },
        },
        { status: 400 },
      );
    }

    // 1. Calcula os acertos da sessão de questões
    const totalCount = questions.length;
    const correctCount = questions.filter(
      (q: {
        isCorrect?: boolean;
        correct?: boolean;
        userAnswer?: string;
        answer?: string;
        gabaritoCorreto?: string;
      }) =>
        q.isCorrect === true ||
        (q.userAnswer &&
          (q.userAnswer === q.answer || q.userAnswer === q.gabaritoCorreto)),
    ).length;

    // 2. ⚡ GANHO DE XP COM MULTIPLICADOR DE STREAK E BÔNUS DE GABARITO (PERFECT SCORE)
    const baseXp = correctCount * XP_REWARDS.QUESTION_CORRECT;

    // Bônus de Perfect Score: +25% de XP se acertar 100% em cadernos de no mínimo 5 questões
    const isPerfectScore = totalCount >= 5 && correctCount === totalCount;
    const perfectBonusMultiplier = isPerfectScore ? 0.25 : 0;

    // Resgata o registro atual de estatísticas para verificar o streak do usuário
    const currentStats = await prisma.userStats.findUnique({
      where: { userId: userId },
    });

    const streakDays =
      (currentStats as { streakDays?: number } | null)?.streakDays || 0;
    const streakBonus = Math.min(
      streakDays * (XP_REWARDS.STREAK_BONUS_MULTIPLIER || 0.1),
      0.5,
    );

    // Multiplicador Total (1 + Streak + Gabarito)
    const totalMultiplier = 1 + streakBonus + perfectBonusMultiplier;
    const earnedXp = Math.round(baseXp * totalMultiplier);

    let updatedStats;

    if (earnedXp > 0) {
      updatedStats = await prisma.userStats.upsert({
        where: { userId: userId },
        update: {
          totalXp: { increment: earnedXp },
        },
        create: {
          userId: userId,
          totalXp: earnedXp,
        },
      });
    } else {
      updatedStats =
        currentStats ??
        (await prisma.userStats.findUnique({
          where: { userId: userId },
        }));
    }

    const totalXp = updatedStats?.totalXp ?? 0;
    const levelInfo = calculateLevel(totalXp);

    // 3. Localiza o registro da matéria vinculada ao usuário
    const subjectRecord = await prisma.subject.findFirst({
      where: {
        name: { equals: subject.trim(), mode: "insensitive" },
        userId: userId,
      },
      include: {
        topics: { take: 1 },
      },
    });

    const targetTopicId = topicId || subjectRecord?.topics[0]?.id;

    // 4. Salva ou Atualiza o Quiz existente para não duplicar no Histórico
    let quizRecord;

    if (quizId) {
      quizRecord = await prisma.quiz.update({
        where: { id: quizId },
        data: {
          questions,
          difficulty: difficulty || "Média",
          banca: banca || "Geral",
        },
      });
    } else {
      quizRecord = await prisma.quiz.create({
        data: {
          banca: banca || "Geral",
          subject,
          difficulty: difficulty || "Média",
          questions,
          userId: userId,
          topicId: targetTopicId || null,
        },
      });
    }

    // 5. 🚀 Registra no QuizAttempt para histórico e fórmula do Edital
    if (targetTopicId) {
      await prisma.quizAttempt.create({
        data: {
          userId: userId,
          topicId: targetTopicId,
          totalCount,
          correctCount,
        },
      });

      await prisma.topic.update({
        where: { id: targetTopicId },
        data: { lastQuizAt: new Date() },
      });
    }

    // 6. Atualiza o SRS da matéria se aplicável
    if (subjectRecord && totalCount > 0) {
      const performance = correctCount / totalCount >= 0.7 ? "bom" : "dificil";
      await updateSubjectSRS(subjectRecord.id, performance);
    }

    return NextResponse.json(
      {
        success: true,
        id: quizRecord.id,
        correctCount,
        totalCount,
        earnedXp,
        totalXp,
        levelInfo,
        isPerfectScore,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro ao salvar quiz e tentativas:", error);
    return NextResponse.json(
      { error: "Falha ao salvar quiz.", details: errorMessage },
      { status: 500 },
    );
  }
}
