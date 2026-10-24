import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  generateSimuladoInParallel,
  getDeterministicFallbackQuestions,
} from "@/lib/simulado-generator";
import { checkAiQuota, consumeAiQuota } from "@/lib/ai-quota-service";
import {
  getClientIdentifier,
  checkRateLimitAndGenerateResponse,
  questionGenerationLimiter,
} from "@/lib/rate-limiter";

export async function POST(request: Request) {
  let requestBody: any = null;
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Faça login para gerar simulados com IA." },
        { status: 401 },
      );
    }

    const clientId = getClientIdentifier(request, userId);
    const rateCheck = checkRateLimitAndGenerateResponse(
      questionGenerationLimiter,
      clientId,
    );
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    const body = await request.json();
    requestBody = body;
    const {
      banca,
      materia,
      topicoId,
      topicoNome,
      specificTopic,
      qtdQuestoes,
      dificuldade,
      textoBase,
      fonteConteudo,
      adaptiveMode,
      formatoQuestao,
      nivelCargo,
      isFullMockExam,
      subjectsDistribution,
    } = body;

    // 🏆 Simulado Completo Proporcional ao Edital (Modo Dia da Prova)
    if (isFullMockExam && Array.isArray(subjectsDistribution) && subjectsDistribution.length > 0) {
      const distributedResults = await Promise.all(
        subjectsDistribution.map(async (dist: { materia: string; count: number }) => {
          try {
            const res = await generateSimuladoInParallel(
              {
                banca: banca || "FGV",
                materia: dist.materia,
                qtdQuestoes: dist.count,
                dificuldade: dificuldade || "Média",
                formatoQuestao: formatoQuestao || "auto",
                nivelCargo: nivelCargo || "superior",
                fonteConteudo: "banca",
              },
              userId,
            );
            return (res.data || []).map((q: any) => ({
              ...q,
              materia: dist.materia,
            }));
          } catch {
            const fallback = await getDeterministicFallbackQuestions({
              materia: dist.materia,
              banca: banca || "FGV",
              qtdQuestoes: dist.count,
            });
            return fallback.map((q: any) => ({
              ...q,
              materia: dist.materia,
            }));
          }
        }),
      );

      const allMockQuestions = distributedResults.flat();

      let savedQuiz = null;
      if (userId && allMockQuestions.length > 0) {
        savedQuiz = await prisma.quiz.create({
          data: {
            userId,
            banca: banca || "FGV",
            subject: "🏆 Simulado Prova Real • Edital Completo",
            difficulty: dificuldade || "Média",
            questions: allMockQuestions as unknown as Prisma.InputJsonValue,
          },
        });
      }

      await consumeAiQuota(userId, "SIMULADO").catch(() => {});

      return NextResponse.json(
        {
          success: true,
          id: savedQuiz?.id || null,
          simuladoId: savedQuiz?.id || null,
          quizId: savedQuiz?.id || null,
          sessionId: savedQuiz?.id || null,
          total: allMockQuestions.length,
          data: allMockQuestions,
          usedModel: "proportional-full-mock",
          durationMs: 0,
          isFullMockExam: true,
        },
        { headers: rateCheck.headers },
      );
    }

    if (!banca || !materia || !qtdQuestoes) {
      return NextResponse.json(
        { error: "Parâmetros ausentes." },
        { status: 400 },
      );
    }

    // 🛡️ Proteção Estrita de Cota Diária do Usuário
    let quotaCheck: { allowed: boolean; message?: string; canWatchRewardedAd?: boolean } = { allowed: true };
    try {
      quotaCheck = await checkAiQuota(userId, "SIMULADO");
    } catch {}

    if (!quotaCheck.allowed) {
      // Quando a cota de IA estiver esgotada, não chama o Gemini!
      // Entrega o banco de questões determinístico offline para não travar os estudos,
      // e sinaliza isQuotaLimited para a interface alertar sobre recarga via anúncio ou upgrade Pro.
      const fallbackQuestions = await getDeterministicFallbackQuestions({
        materia,
        topicoId,
        banca,
        qtdQuestoes: Math.min(Math.max(parseInt(String(qtdQuestoes || 5), 10), 1), 30),
      });

      return NextResponse.json(
        {
          success: true,
          id: null,
          simuladoId: null,
          total: fallbackQuestions.length,
          data: fallbackQuestions,
          quizId: null,
          sessionId: null,
          usedModel: "deterministic-offline-pool",
          durationMs: 0,
          isFallbackPool: true,
          isQuotaLimited: true,
          quotaMessage: quotaCheck.message || "Cota diária de simulados com IA atingida. Exibindo questões do banco offline.",
          canWatchRewardedAd: Boolean(quotaCheck.canWatchRewardedAd),
        },
        { headers: rateCheck.headers }
      );
    }

    const result = await generateSimuladoInParallel(
      {
        banca,
        materia,
        topicoId,
        topicoNome,
        specificTopic:
          typeof specificTopic === "string" ? specificTopic.trim() : undefined,
        qtdQuestoes,
        dificuldade,
        textoBase,
        fonteConteudo,
        adaptiveMode: Boolean(adaptiveMode),
        formatoQuestao,
        nivelCargo,
      },
      userId,
    );

    const simuladoId = result.quizId || result.sessionId;
    const questions = result.data || [];

    // Consome cota diária de Simulado com IA apenas quando a IA foi acionada com sucesso
    if (!result.isFallbackPool) {
      await consumeAiQuota(userId, "SIMULADO").catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        id: simuladoId,
        simuladoId: simuladoId,
        total: questions.length,
        data: questions,
        quizId: simuladoId,
        sessionId: simuladoId,
        usedModel: result.usedModel,
        durationMs: result.durationMs,
        isFallbackPool: Boolean(result.isFallbackPool),
      },
      { headers: rateCheck.headers },
    );
  } catch (error: unknown) {
    console.error(
      "Erro ao gerar com IA, acionando contingência de Fallback Determinístico:",
      error,
    );

    // 🛡️ REQUISITO 4: Garanta que a rota /api/questions/generate nunca devolva erro 500 por indisponibilidade de cota do Gemini
    try {
      const materia = requestBody?.materia || "Conhecimentos Gerais";
      const banca = requestBody?.banca || "Geral";
      const qtdQuestoes = Math.min(
        Math.max(parseInt(String(requestBody?.qtdQuestoes || 5), 10), 1),
        30,
      );

      const fallbackQuestions = await getDeterministicFallbackQuestions({
        materia,
        topicoId: requestBody?.topicoId,
        banca,
        qtdQuestoes,
      });

      return NextResponse.json({
        success: true,
        id: null,
        simuladoId: null,
        total: fallbackQuestions.length,
        data: fallbackQuestions,
        quizId: null,
        sessionId: null,
        usedModel: "fallback-deterministic-pool",
        durationMs: 0,
        isFallbackPool: true,
      });
    } catch (fallbackError) {
      console.error("Erro no fallback de contingência:", fallbackError);
      return NextResponse.json({
        success: true,
        id: null,
        simuladoId: null,
        total: 0,
        data: [],
        quizId: null,
        sessionId: null,
        usedModel: "fallback-deterministic-pool",
        durationMs: 0,
        isFallbackPool: true,
      });
    }
  }
}

