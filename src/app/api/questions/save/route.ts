import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateSubjectSRS } from "@/lib/srs-service";
import { auth } from "@/auth";
import { XP_REWARDS, calculateLevel } from "@/lib/gamification/gamification";
import { rebalanceScheduleAction } from "@/actions/adaptive-actions";
import { normalizeTaxonomy } from "@/lib/error-taxonomy";
import crypto from "crypto";

function generateQuestionsFingerprint(questions: any[]): string {
  const content = questions
    .map((q) => (q.enunciado || q.question || q.questionText || "").trim())
    .join("::");
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 32);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
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

    // 2. Busca o tópico correto (UUID, título ou fallback via quizId)
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

    if (!resolvedTopicId && quizId) {
      const existingQuiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: { topicId: true },
      });
      if (existingQuiz?.topicId) {
        resolvedTopicId = existingQuiz.topicId;
      }
    }

    // 3. Calcula acertos com comparação robusta
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

    // 4. Ganho de XP e nível
    const baseXp = correctCount * XP_REWARDS.QUESTION_CORRECT;
    const isPerfectScore = totalCount >= 5 && correctCount === totalCount;
    const perfectBonusMultiplier = isPerfectScore ? 0.25 : 0;

    const currentStats = await prisma.userStats.findUnique({
      where: { userId },
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
        where: { userId },
        update: {
          totalXp: { increment: earnedXp },
        },
        create: {
          userId,
          totalXp: earnedXp,
        },
      });
    } else {
      updatedStats =
        currentStats ??
        (await prisma.userStats.findUnique({
          where: { userId },
        }));
    }

    const totalXp = updatedStats?.totalXp ?? 0;
    const levelInfo = calculateLevel(totalXp);

    // 5. 🛡️ Proteção por Hash/Assinatura determinística em vez de janela de 30 segundos
    let quizRecord;

    if (quizId) {
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
            id: quizId,
            banca: banca || "Geral",
            subject,
            difficulty: difficulty || "Média",
            questions,
            userId,
            topicId: resolvedTopicId,
          },
        });
      }
    } else {
      const signatureFirstQuestion = (
        questions[0]?.enunciado ||
        questions[0]?.question ||
        questions[0]?.questionText ||
        ""
      ).trim();

      // Busca um quiz idêntico recente comparando o enunciado da primeira questão do conjunto
      const candidateDuplicate = await prisma.quiz.findFirst({
        where: {
          userId,
          topicId: resolvedTopicId,
          subject,
        },
        orderBy: { createdAt: "desc" },
      });

      const isExactSameSet =
        candidateDuplicate &&
        Array.isArray(candidateDuplicate.questions) &&
        generateQuestionsFingerprint(candidateDuplicate.questions) ===
          generateQuestionsFingerprint(questions);

      if (isExactSameSet && candidateDuplicate) {
        quizRecord = await prisma.quiz.update({
          where: { id: candidateDuplicate.id },
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
            userId,
            topicId: resolvedTopicId,
          },
        });
      }
    }

    // 6. Registra tentativa no QuizAttempt e atualiza Tópico
    if (resolvedTopicId) {
      await prisma.quizAttempt.create({
        data: {
          userId,
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

    // 6.1 Registra erros no Caderno de Erros (QuestionError)
    try {
      const incorrectItems = (questions as any[]).filter((q: any) => {
        return (
          q.isCorrect === false ||
          q.correct === false ||
          (q.userAnswer &&
            (q.gabaritoCorreto || q.correctAnswer) &&
            String(q.userAnswer).trim().toUpperCase() !==
              String(q.gabaritoCorreto || q.correctAnswer)
                .trim()
                .toUpperCase())
        );
      });

      for (const item of incorrectItems) {
        const text = item.enunciado || item.question || item.questionText;
        if (!text) continue;
        const userAns = String(item.userAnswer || "Não informada").trim();
        const correctAns = String(
          item.gabaritoCorreto || item.correctAnswer || item.answer || "A",
        ).trim();
        const normalizedReason = normalizeTaxonomy(
          item.errorReason || "UNCLASSIFIED",
        );

        const existing = await prisma.questionError.findFirst({
          where: { userId, questionText: text },
        });

        if (existing) {
          await prisma.questionError.update({
            where: { id: existing.id },
            data: {
              userAnswer: userAns,
              correctAnswer: correctAns,
              explanation:
                item.justificativa || item.explanation || existing.explanation,
              errorReason:
                normalizedReason !== "UNCLASSIFIED"
                  ? normalizedReason
                  : existing.errorReason,
              status: "PENDING",
              masteredAt: null,
              updatedAt: new Date(),
            },
          });
        } else {
          await prisma.questionError.create({
            data: {
              userId,
              subjectId: subjectRecord?.id || null,
              topicId: resolvedTopicId || null,
              quizId: quizRecord?.id || null,
              questionText: text,
              options: item.alternativas || item.options || [],
              userAnswer: userAns,
              correctAnswer: correctAns,
              explanation: item.justificativa || item.explanation || null,
              errorReason: normalizedReason,
              status: "PENDING",
            },
          });
        }
      }
    } catch (errErr) {
      console.warn("Aviso ao salvar erros no Caderno de Erros:", errErr);
    }

    // 7. Atualiza SRS da matéria se aplicável
    if (subjectRecord && totalCount > 0) {
      const performance = correctCount / totalCount >= 0.7 ? "bom" : "dificil";
      await updateSubjectSRS(subjectRecord.id, performance);
    }

    // 8. Rebalanceador adaptativo
    let isRebalanced = false;

    if (subjectRecord) {
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          userId,
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
