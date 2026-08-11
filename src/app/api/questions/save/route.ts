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

    // 1. Localiza a matéria
    const subjectRecord = await prisma.subject.findFirst({
      where: {
        name: { equals: subject.trim(), mode: "insensitive" },
        userId: userId,
      },
    });

    // 2. 🟢 BUSCA O TÓPICO CORRETO (por UUID ou por Nome/Título)
    let resolvedTopicId: string | null = null;

    if (topicId) {
      const topicMatch = await prisma.topic.findFirst({
        where: {
          OR: [
            { id: topicId },
            { title: { equals: topicId.trim(), mode: "insensitive" } },
          ],
          subject: { userId: userId },
        },
        select: { id: true },
      });

      if (topicMatch) {
        resolvedTopicId = topicMatch.id;
      }
    }

    // 3. Calcula os acertos da sessão de questões
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

    // 4. ⚡ GANHO DE XP
    const baseXp = correctCount * XP_REWARDS.QUESTION_CORRECT;
    const isPerfectScore = totalCount >= 5 && correctCount === totalCount;
    const perfectBonusMultiplier = isPerfectScore ? 0.25 : 0;

    const currentStats = await prisma.userStats.findUnique({
      where: { userId: userId },
    });

    const streakDays =
      (currentStats as { streakDays?: number } | null)?.streakDays || 0;
    const streakBonus = Math.min(
      streakDays * (XP_REWARDS.STREAK_BONUS_MULTIPLIER || 0.1),
      0.5,
    );

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

    // 5. 🛡️ PROTEÇÃO CONTRA DUPLICAÇÃO: Salva, Atualiza ou Reutiliza Quiz recente
    let quizRecord;

    if (quizId) {
      // Caso 1: ID do Quiz explícito fornecido
      quizRecord = await prisma.quiz.update({
        where: { id: quizId },
        data: {
          questions,
          difficulty: difficulty || "Média",
          banca: banca || "Geral",
          topicId: resolvedTopicId,
        },
      });
    } else {
      // Caso 2: Sem ID explícito -> Verifica se um quiz idêntico foi criado nos últimos 30 segundos
      const recentDuplicate = await prisma.quiz.findFirst({
        where: {
          userId,
          topicId: resolvedTopicId,
          subject,
          createdAt: {
            gte: new Date(Date.now() - 30 * 1000), // 30 segundos de janela para deduplicação
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (recentDuplicate) {
        // Se encontrou um quiz idêntico criado há instantes, apenas atualiza o existente
        quizRecord = await prisma.quiz.update({
          where: { id: recentDuplicate.id },
          data: {
            questions,
            difficulty: difficulty || "Média",
            banca: banca || "Geral",
          },
        });
      } else {
        // Caso contrário, cria um novo registro
        quizRecord = await prisma.quiz.create({
          data: {
            banca: banca || "Geral",
            subject,
            difficulty: difficulty || "Média",
            questions,
            userId: userId,
            topicId: resolvedTopicId,
          },
        });
      }
    }

    // 6. 🚀 Registra no QuizAttempt e atualiza no Tópico exato
    if (resolvedTopicId) {
      await prisma.quizAttempt.create({
        data: {
          userId: userId,
          topicId: resolvedTopicId,
          totalCount,
          correctCount,
        },
      });

      await prisma.topic.update({
        where: { id: resolvedTopicId },
        data: { lastQuizAt: new Date() },
      });
    }

    // 7. Atualiza o SRS da matéria se aplicável
    if (subjectRecord && totalCount > 0) {
      const performance = correctCount / totalCount >= 0.7 ? "bom" : "dificil";
      await updateSubjectSRS(subjectRecord.id, performance);
    }

    return NextResponse.json(
      {
        success: true,
        id: quizRecord.id,
        quizId: quizRecord.id,
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
