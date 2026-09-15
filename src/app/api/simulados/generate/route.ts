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
      qtdQuestoes,
      dificuldade,
      textoBase,
      fonteConteudo,
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
        qtdQuestoes,
        dificuldade,
        textoBase,
        fonteConteudo,
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
      { status: 200 },
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
