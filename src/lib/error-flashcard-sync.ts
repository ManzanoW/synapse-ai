import { prisma } from "@/lib/prisma";

/**
 * ⚡ FUNÇÃO CENTRAL DE SERVIÇO: Cria ou sincroniza flashcard FSRS direto de um QuestionError (Zero tokens de IA).
 * Executado estritamente no backend (sem exposição como Server Action pública).
 * Idempotente: verifica se o flashcard já existe no baralho antes de criar.
 */
export async function syncErrorToFlashcardCore(
  userId: string,
  errorId: string,
): Promise<{
  success: boolean;
  cardId?: string;
  error?: string;
}> {
  try {
    const item = await prisma.questionError.findFirst({
      where: { id: errorId, userId },
      include: { subject: true, topic: true },
    });

    if (!item) {
      return {
        success: false,
        error: "Questão não encontrada no caderno de erros.",
      };
    }

    // Busca ou cria o baralho da matéria
    const subjectName = item.subject?.name || "Caderno de Erros";
    let deck = await prisma.deck.findFirst({
      where: { userId, title: subjectName },
    });

    if (!deck) {
      deck = await prisma.deck.create({
        data: {
          userId,
          title: subjectName,
          color: "bg-rose-500",
          subjectId: item.subjectId || null,
          topicId: item.topicId || null,
        },
      });
    }

    // 🛡️ Idempotência: verifica se o flashcard já foi gerado para este baralho
    const existingCard = await prisma.flashcard.findFirst({
      where: {
        deckId: deck.id,
        question: item.questionText,
      },
    });

    if (existingCard) {
      return { success: true, cardId: existingCard.id };
    }

    let backText = `Gabarito Correto: ${item.correctAnswer}`;
    if (item.explanation) {
      backText += `\n\n${item.explanation}`;
    }

    const card = await prisma.flashcard.create({
      data: {
        deckId: deck.id,
        topicId: item.topicId || null,
        question: item.questionText,
        answer: backText,
        details: item.mnemonic || null,
        stability: 1.0,
        difficulty: 6.0,
        interval: 1,
        repetitions: 0,
        lapses: 1,
        nextReviewDate: new Date(),
      },
    });

    return { success: true, cardId: card.id };
  } catch (err: unknown) {
    console.error("[syncErrorToFlashcardCore] Erro:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao sincronizar erro com flashcards.",
    };
  }
}
