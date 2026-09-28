import { NextResponse } from "next/server";
import { reviewFlashcardAction } from "@/actions/flashcard-actions";

/**
 * 📥 POST: Adapter HTTP para a Server Action oficial reviewFlashcardAction
 * Mantém total compatibilidade retroativa com clientes REST existentes.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cardId, grade, rating, responseTimeMs } = body;

    const rawRating = rating ?? grade;

    if (!cardId || rawRating === undefined) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (cardId, grade/rating)" },
        { status: 400 },
      );
    }

    const result = await reviewFlashcardAction({
      cardId: String(cardId),
      grade: rawRating,
      rating: rawRating,
      responseTimeMs,
    });

    if (!result.success || !result.data) {
      const isAuthError = result.error?.toLowerCase().includes("autenticado");
      return NextResponse.json(
        { error: result.error || "Falha ao processar revisão do flashcard" },
        { status: isAuthError ? 401 : 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        earnedXp: result.data.earnedXp,
        totalXp: result.data.totalXp,
        levelInfo: result.data.levelInfo,
        data: result.data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Erro no adapter POST /api/flashcards/review:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar revisão do flashcard" },
      { status: 500 },
    );
  }
}
