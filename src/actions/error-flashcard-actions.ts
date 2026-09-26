"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ConvertErrorResult {
  success: boolean;
  flashcardId?: string;
  deckId?: string;
  deckTitle?: string;
  alreadyExisted?: boolean;
  error?: string;
}

export interface ConvertBatchResult {
  success: boolean;
  createdCount?: number;
  deckId?: string;
  deckTitle?: string;
  error?: string;
}

/**
 * Converte um erro específico do Caderno de Erros em um Flashcard FSRS.
 */
export async function convertSingleErrorToFlashcardAction(
  questionErrorId: string,
): Promise<ConvertErrorResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const questionError = await prisma.questionError.findFirst({
      where: { id: questionErrorId, userId },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        topic: { select: { id: true, title: true } },
      },
    });

    if (!questionError) {
      return { success: false, error: "Questão do caderno de erros não encontrada." };
    }

    const subjectName = questionError.subject?.name || "Geral";
    const deckTitle = `Erros: ${subjectName}`;
    const deckColor = questionError.subject?.color || "#8b5cf6";

    // 1. Busca ou cria o Deck correspondente da matéria
    let deck = await prisma.deck.findFirst({
      where: {
        userId,
        title: { equals: deckTitle, mode: "insensitive" },
      },
    });

    if (!deck) {
      deck = await prisma.deck.create({
        data: {
          userId,
          title: deckTitle,
          color: deckColor,
          subjectId: questionError.subjectId,
          topicId: questionError.topicId,
        },
      });
    }

    // 2. Verifica se o flashcard já existe para evitar duplicatas idênticas
    const existingCard = await prisma.flashcard.findFirst({
      where: {
        deckId: deck.id,
        question: questionError.questionText,
      },
      select: { id: true },
    });

    if (existingCard) {
      return {
        success: true,
        flashcardId: existingCard.id,
        deckId: deck.id,
        deckTitle: deck.title,
        alreadyExisted: true,
      };
    }

    // 3. Monta o verso do card com o gabarito oficial e explicação pedagógica
    const formattedAnswer = [
      `🎯 Gabarito Correto: ${questionError.correctAnswer}`,
      questionError.explanation ? `\n\n📖 Explicação:\n${questionError.explanation}` : "",
      questionError.aiExplanation ? `\n\n🤖 Diagnóstico da IA:\n${questionError.aiExplanation}` : "",
    ]
      .filter(Boolean)
      .join("");

    const details = questionError.mnemonic
      ? `🧠 Mnemônico / Regra de Ouro:\n${questionError.mnemonic}`
      : undefined;

    // 4. Cria o Flashcard calibrado para repetição espaçada FSRS
    const flashcard = await prisma.flashcard.create({
      data: {
        deckId: deck.id,
        topicId: questionError.topicId,
        question: questionError.questionText,
        answer: formattedAnswer,
        details,
        interval: 1,
        stability: 1.0,
        difficulty: 5.0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
        nextReviewDate: new Date(),
      },
      select: { id: true },
    });

    revalidatePath("/flashcards");
    revalidatePath("/notebook");

    return {
      success: true,
      flashcardId: flashcard.id,
      deckId: deck.id,
      deckTitle: deck.title,
      alreadyExisted: false,
    };
  } catch (err) {
    console.error("Erro em convertSingleErrorToFlashcardAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao converter erro em flashcard.",
    };
  }
}

/**
 * Converte um lote de erros do Caderno de Erros em um Deck exclusivo de Flashcards FSRS.
 */
export async function convertBatchErrorsToFlashcardsAction(
  questionErrorIds: string[],
  customDeckTitle?: string,
): Promise<ConvertBatchResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    if (!questionErrorIds.length) {
      return { success: false, error: "Nenhum erro selecionado para conversão." };
    }

    const errors = await prisma.questionError.findMany({
      where: {
        id: { in: questionErrorIds },
        userId,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    if (!errors.length) {
      return { success: false, error: "Nenhum erro válido encontrado." };
    }

    const deckTitle =
      customDeckTitle ||
      `Remediação FSRS (${new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      })})`;

    // 1. Busca ou cria o deck de lote
    let deck = await prisma.deck.findFirst({
      where: {
        userId,
        title: { equals: deckTitle, mode: "insensitive" },
      },
    });

    if (!deck) {
      deck = await prisma.deck.create({
        data: {
          userId,
          title: deckTitle,
          color: "#8b5cf6",
        },
      });
    }

    // 2. Busca cards já existentes no deck para deduplicação
    const existingCards = await prisma.flashcard.findMany({
      where: { deckId: deck.id },
      select: { question: true },
    });
    const existingQuestions = new Set(existingCards.map((c) => c.question.trim().toLowerCase()));

    let createdCount = 0;

    for (const qe of errors) {
      const qKey = qe.questionText.trim().toLowerCase();
      if (existingQuestions.has(qKey)) continue;

      const formattedAnswer = [
        `🎯 Gabarito Correto: ${qe.correctAnswer}`,
        qe.explanation ? `\n\n📖 Explicação:\n${qe.explanation}` : "",
        qe.aiExplanation ? `\n\n🤖 Diagnóstico da IA:\n${qe.aiExplanation}` : "",
      ]
        .filter(Boolean)
        .join("");

      const details = qe.mnemonic
        ? `🧠 Mnemônico / Regra de Ouro:\n${qe.mnemonic}`
        : undefined;

      await prisma.flashcard.create({
        data: {
          deckId: deck.id,
          topicId: qe.topicId,
          question: qe.questionText,
          answer: formattedAnswer,
          details,
          interval: 1,
          stability: 1.0,
          difficulty: 5.0,
          easeFactor: 2.5,
          repetitions: 0,
          lapses: 0,
          nextReviewDate: new Date(),
        },
      });

      existingQuestions.add(qKey);
      createdCount++;
    }

    revalidatePath("/flashcards");
    revalidatePath("/notebook");

    return {
      success: true,
      createdCount,
      deckId: deck.id,
      deckTitle: deck.title,
    };
  } catch (err) {
    console.error("Erro em convertBatchErrorsToFlashcardsAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao converter lote de erros.",
    };
  }
}

/**
 * Retorna os IDs dos QuestionError do usuário que já foram transformados em Flashcards.
 */
export async function getConvertedFlashcardQuestionTextsAction(): Promise<{
  success: boolean;
  convertedQuestions?: string[];
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const cards = await prisma.flashcard.findMany({
      where: {
        deck: { userId },
      },
      select: { question: true },
    });

    return {
      success: true,
      convertedQuestions: cards.map((c) => c.question.trim().toLowerCase()),
    };
  } catch (err) {
    console.error("Erro em getConvertedFlashcardQuestionTextsAction:", err);
    return { success: false, error: "Falha ao obter status de flashcards." };
  }
}
