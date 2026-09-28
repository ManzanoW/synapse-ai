import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { evaluateDiscursivaEssay } from "@/lib/discursiva-evaluator";
import { recordStudyActivityAction } from "@/actions/gamification-actions";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      themeTitle,
      banca = "CEBRASPE",
      subjectArea = "Geral",
      motivatingText = "",
      expectedPoints = "",
      content,
      lineCount = 0,
      wordCount = 0,
      durationSeconds = 0,
    } = body;

    const cleanContent = (content || "").trim();
    if (!cleanContent || cleanContent.length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: "O texto da redação é muito curto para avaliação pela banca.",
        },
        { status: 400 }
      );
    }

    // 1. Executa a avaliação calibrada CEBRASPE com fórmula oficial
    const evaluation = await evaluateDiscursivaEssay({
      themeTitle,
      banca,
      subjectArea,
      motivatingText,
      expectedPoints,
      content: cleanContent,
      lineCount,
      wordCount,
      durationSeconds,
    });

    // 2. Salva no banco de dados
    const submission = await prisma.essaySubmission.create({
      data: {
        userId,
        themeTitle,
        banca,
        subjectArea,
        motivatingText: motivatingText || null,
        expectedPoints: expectedPoints || null,
        content: cleanContent,
        lineCount,
        wordCount,
        durationSeconds,
        score: evaluation.score,
        maxScore: evaluation.maxScore,
        isApproved: evaluation.isApproved,
        generalFeedback: evaluation.generalFeedback,
        criteriaScores: evaluation.criteriaScores as any,
        lineErrors: evaluation.lineErrors as any,
        strengths: evaluation.strengths as any,
        improvements: evaluation.improvements as any,
        goldenVersion: evaluation.goldenVersion,
        status: "EVALUATED",
      },
    });

    // 3. Concede XP na Gamificação (+120 XP)
    const xpReward = 120;
    const sessionMinutes = Math.max(15, Math.round(durationSeconds / 60));
    try {
      await recordStudyActivityAction(userId, xpReward, "ESSAY", sessionMinutes);
    } catch (xpErr) {
      console.warn("[/api/discursiva/evaluate] Aviso ao conceder XP:", xpErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: submission.id,
        themeTitle: submission.themeTitle,
        banca: submission.banca,
        subjectArea: submission.subjectArea,
        motivatingText: submission.motivatingText,
        expectedPoints: submission.expectedPoints,
        content: submission.content,
        lineCount: submission.lineCount,
        wordCount: submission.wordCount,
        durationSeconds: submission.durationSeconds || 0,
        score: submission.score ?? evaluation.score,
        maxScore: submission.maxScore,
        isApproved: submission.isApproved ?? evaluation.isApproved,
        generalFeedback: submission.generalFeedback || "",
        criteriaScores: evaluation.criteriaScores,
        lineErrors: evaluation.lineErrors,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        goldenVersion: submission.goldenVersion || "",
        createdAt: submission.createdAt.toISOString(),
        xpEarned: xpReward,
        notaConteudo: evaluation.notaConteudo,
        descontoFormal: evaluation.descontoFormal,
        numeroErros: evaluation.numeroErros,
      },
    });
  } catch (error) {
    console.error("[/api/discursiva/evaluate] Erro ao avaliar redação:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha interna ao processar a avaliação discursiva.",
      },
      { status: 500 }
    );
  }
}
