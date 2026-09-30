import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateSimuladoInParallel } from "@/lib/simulado-generator";
import {
  getClientIdentifier,
  checkRateLimitAndGenerateResponse,
  simuladoGenerationLimiter,
} from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

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
      { error: "Falha ao gerar simulado.", details: errorMessage },
      { status: 500 },
    );
  }
}
