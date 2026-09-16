import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateSimuladoInParallel } from "@/lib/simulado-generator";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

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
        { error: "Parâmetros ausentes." },
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

    const simuladoId = result.quizId || result.sessionId;
    const questions = result.data || [];

    return NextResponse.json({
      success: true,
      id: simuladoId,
      simuladoId: simuladoId,
      total: questions.length,
      data: questions,
      quizId: simuladoId,
      sessionId: simuladoId,
      usedModel: result.usedModel,
      durationMs: result.durationMs,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro Gemini Fallback:", error);

    return NextResponse.json(
      { error: "Falha ao gerar simulado.", details: errorMessage },
      { status: 500 },
    );
  }
}
