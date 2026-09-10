import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateSubjectSRS } from "@/lib/srs-service";
import { auth } from "@/auth";
import { XP_REWARDS, calculateLevel } from "@/lib/gamification/gamification";
import { rebalanceScheduleAction } from "@/actions/adaptive-actions";

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

    // src/app/api/questions/save/route.ts (Substitua as seções 2 e 3 do arquivo)

    // 2. 🟢 BUSCA O TÓPICO CORRETO (Resolução por UUID, Nome ou Fallback via Quiz existente)
    let resolvedTopicId: string | null = null;

    if (topicId && topicId !== "ALL") {
      const topicMatch = await prisma.topic.findFirst({
        where: {
          OR: [
            { id: topicId },
            { title: { equals: String(topicId).trim(), mode: "insensitive" } },
          ],
          subject: { userId: userId },
        },
        select: { id: true },
      });

      if (topicMatch) {
        resolvedTopicId = topicMatch.id;
      }
    }

    // 🔄 FALLBACK: Se o topicId não foi encontrado pelo filtro, recupera o topicId original salvo no Quiz
    if (!resolvedTopicId && quizId) {
      const existingQuiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: { topicId: true },
      });
      if (existingQuiz?.topicId) {
        resolvedTopicId = existingQuiz.topicId;
      }
    }

    // 3. 🟢 CALCULA OS ACERTOS COM COMPARAÇÃO ROBUSTA
    const totalCount = questions.length;
    const correctCount = questions.filter(
      (q: {
        isCorrect?: boolean;
        correct?: boolean;
        userAnswer?: string;
        answer?: string;
        gabaritoCorreto?: string;
        correctAnswer?: string;
      }) => {
        if (q.isCorrect === true || q.correct === true) return true;

        const userAns = q.userAnswer
          ? String(q.userAnswer).trim().toLowerCase()
          : null;
        const correctAns =
          q.gabaritoCorreto || q.answer || q.correctAnswer
            ? String(q.gabaritoCorreto || q.answer || q.correctAnswer)
                .trim()
                .toLowerCase()
            : null;

        return Boolean(userAns && correctAns && userAns === correctAns);
      },
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
      // Caso 1: ID do Quiz explícito fornecido (garante estritamente que pertence ao usuário)
      const existingUserQuiz = await prisma.quiz.findFirst({
        where: { id: quizId, userId },
      });

      if (existingUserQuiz) {
        quizRecord = await prisma.quiz.update({
          where: { id: existingUserQuiz.id },
          data: {
            questions,
            difficulty: difficulty || "Média",
            banca: banca || "Geral",
            topicId: resolvedTopicId,
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
            topicId: resolvedTopicId,
          },
        });
      }
    } else {
      // Caso 2: Sem ID explícito -> Verifica se um quiz idêntico foi criado nos últimos 30 segundos
      const recentDuplicate = await prisma.quiz.findFirst({
        where: {
          userId,
          topicId: resolvedTopicId,
          subject,
          createdAt: {
            gte: new Date(Date.now() - 30 * 1000),
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (recentDuplicate) {
        quizRecord = await prisma.quiz.update({
          where: { id: recentDuplicate.id },
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

    // 6.1 📓 Registra os erros no Caderno de Erros (QuestionError)
    try {
      const incorrectItems = (questions as any[]).filter((q: any) => {
        return (
          q.isCorrect === false ||
          q.correct === false ||
          (q.userAnswer &&
            (q.gabaritoCorreto || q.correctAnswer) &&
            String(q.userAnswer).trim().toUpperCase() !==
              String(q.gabaritoCorreto || q.correctAnswer).trim().toUpperCase())
        );
      });

      for (const item of incorrectItems) {
        const text = item.enunciado || item.question || item.questionText;
        if (!text) continue;
        const userAns = String(item.userAnswer || "Não informada").trim();
        const correctAns = String(
          item.gabaritoCorreto || item.correctAnswer || item.answer || "A",
        ).trim();
        const reason = item.errorReason || "UNCLASSIFIED";

        await prisma.questionError.create({
          data: {
            userId: userId,
            subjectId: subjectRecord?.id || null,
            topicId: resolvedTopicId || null,
            quizId: quizRecord?.id || null,
            questionText: text,
            options: item.alternativas || item.options || [],
            userAnswer: userAns,
            correctAnswer: correctAns,
            explanation: item.justificativa || item.explanation || null,
            errorReason: String(reason),
            status: "PENDING",
          },
        });
      }
    } catch (errErr) {
      console.warn("Aviso ao salvar erros no Caderno de Erros:", errErr);
    }

    // 7. Atualiza o SRS da matéria se aplicável
    if (subjectRecord && totalCount > 0) {
      const performance = correctCount / totalCount >= 0.7 ? "bom" : "dificil";
      await updateSubjectSRS(subjectRecord.id, performance);
    }

    // 8. 🎯 ADAPTIVE REBALANCER: Avalia o histórico de questões da matéria
    let isRebalanced = false;

    if (subjectRecord) {
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          userId: userId,
          topic: {
            subjectId: subjectRecord.id,
          },
        },
        select: {
          totalCount: true,
          correctCount: true,
        },
      });

      const totalQuestionsSolved = attempts.reduce(
        (acc, curr) => acc + curr.totalCount,
        0,
      );

      if (totalQuestionsSolved >= 10) {
        isRebalanced = true;
        const totalCorrectSolved = attempts.reduce(
          (acc, curr) => acc + curr.correctCount,
          0,
        );
        const accuracyPercentage = Math.round(
          (totalCorrectSolved / totalQuestionsSolved) * 100,
        );

        await rebalanceScheduleAction({
          studyMode: "WEEKLY",
          weeklyGoalHours: 10,
          activeDaysPerWeek: 5,
          daysMissedThisWeek: 0,
          performances: [
            {
              subjectId: subjectRecord.id,
              subjectName: subjectRecord.name,
              accuracyPercentage,
              totalQuestionsSolved,
              lastStudiedAt: new Date(),
              targetWeeklyMinutes: 120,
            },
          ],
        });
      }
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
        rebalanced: isRebalanced,
        rebalancedSubject: subjectRecord ? subjectRecord.name : subject,
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
