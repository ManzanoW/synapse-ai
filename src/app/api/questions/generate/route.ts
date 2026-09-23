import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateSimuladoInParallel } from "@/lib/simulado-generator";
import { checkAiQuota, consumeAiQuota } from "@/lib/ai-quota-service";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Faça login para gerar simulados com IA." },
        { status: 401 },
      );
    }

    // 🛡️ Proteção Leve de Cota Diária de IA
    const quota = await checkAiQuota(userId, "SIMULADO");
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.message || "Limite diário de simulados com IA atingido." },
        { status: 429 },
      );
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

    // Consome cota diária de Simulado com IA
    await consumeAiQuota(userId, "SIMULADO");

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
