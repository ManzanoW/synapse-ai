import { NextResponse } from "next/server";
import { auth } from "@/auth";
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
    } = body;

    if (!banca || !materia || !qtdQuestoes) {
      return NextResponse.json(
        { error: "Parâmetros ausentes." },
        { status: 400 },
      );
    }

    // 🛡️ Proteção Leve de Cota Diária do Usuário
    let isUserQuotaLimited = false;
    try {
      const quota = await checkAiQuota(userId, "SIMULADO");
      if (!quota.allowed) {
        isUserQuotaLimited = true;
      }
    } catch {}

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
    if (!result.isFallbackPool && !isUserQuotaLimited) {
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

