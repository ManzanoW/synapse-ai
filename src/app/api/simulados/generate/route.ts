import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateSimuladoInParallel } from "@/lib/simulado-generator";
import { checkAiQuota, consumeAiQuota } from "@/lib/ai-quota-service";
import {
  getClientIdentifier,
  checkRateLimitAndGenerateResponse,
  simuladoGenerationLimiter,
} from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para gerar simulados." },
        { status: 401 },
      );
    }

    const clientId = getClientIdentifier(request, userId);
    const rateCheck = checkRateLimitAndGenerateResponse(
      simuladoGenerationLimiter,
      clientId,
    );
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    const body = await request.json();
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
    } = body;

    if (!banca || !materia || !qtdQuestoes) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios ausentes (banca, matéria e quantidade)." },
        { status: 400 },
      );
    }

    if (userId) {
      const quota = await checkAiQuota(userId, "SIMULADO");
      if (!quota.allowed) {
        return NextResponse.json(
          {
            error: quota.message || "Cota diária de simulados com IA atingida.",
            isQuotaExceeded: true,
            canWatchRewardedAd: quota.canWatchRewardedAd,
          },
          { status: 403, headers: rateCheck.headers }
        );
      }
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
      },
      userId,
    );

    if (userId && !result.isFallbackPool) {
      await consumeAiQuota(userId, "SIMULADO").catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        quizId: result.quizId,
        sessionId: result.sessionId,
        usedModel: result.usedModel,
        durationMs: result.durationMs,
      },
      { status: 200, headers: rateCheck.headers },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro ao gerar simulado em /api/simulados/generate:", error);

    return NextResponse.json(
      { error: "Falha ao gerar simulado." },
      { status: 500 },
    );
  }
}
