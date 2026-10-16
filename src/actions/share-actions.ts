// src/actions/share-actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface PublicDeckCard {
  id: string;
  question: string;
  answer: string;
  details?: string | null;
}

export interface PublicDeckData {
  id: string;
  title: string;
  color: string;
  createdAt: string;
  subjectName?: string | null;
  topicTitle?: string | null;
  totalCards: number;
  flashcards: PublicDeckCard[];
  author: {
    name: string;
    image?: string | null;
    isPro: boolean;
    role: string;
  };
}

/**
 * 📥 Busca dados públicos de um Baralho para visualização e compartilhamento
 * Não exige autenticação — acessível para qualquer visitante.
 */
export async function getPublicDeckAction(deckId: string): Promise<{
  success: boolean;
  data?: PublicDeckData;
  error?: string;
}> {
  try {
    if (!deckId) {
      return { success: false, error: "ID do baralho não fornecido." };
    }

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        subject: { select: { name: true } },
        topic: { select: { title: true } },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            planTier: true,
          },
        },
        flashcards: {
          select: {
            id: true,
            question: true,
            answer: true,
            details: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!deck) {
      return { success: false, error: "Baralho não encontrado ou removido." };
    }

    const isPro = deck.user.role === "ADMIN" || deck.user.planTier === "PREMIUM";

    const formatted: PublicDeckData = {
      id: deck.id,
      title: deck.title,
      color: deck.color,
      createdAt: deck.createdAt.toISOString(),
      subjectName: deck.subject?.name || null,
      topicTitle: deck.topic?.title || null,
      totalCards: deck.flashcards.length,
      flashcards: deck.flashcards,
      author: {
        name: deck.user.name || "Estudante Synapse",
        image: deck.user.image,
        isPro,
        role: deck.user.role,
      },
    };

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Erro em getPublicDeckAction:", error);
    return { success: false, error: "Falha ao carregar baralho compartilhado." };
  }
}

/**
 * ⚡ Clona um baralho público para a biblioteca pessoal do usuário autenticado.
 * Reseta os parâmetros de FSRS para que o novo usuário comece da estaca zero.
 */
export async function clonePublicDeckAction(deckId: string): Promise<{
  success: boolean;
  newDeckId?: string;
  cardsCloned?: number;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: "Faça login ou crie uma conta gratuita para clonar este baralho.",
      };
    }

    const sourceDeck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        flashcards: true,
      },
    });

    if (!sourceDeck || sourceDeck.flashcards.length === 0) {
      return { success: false, error: "Baralho vazio ou não encontrado." };
    }

    // Cria o novo baralho na conta do usuário autenticado
    const clonedDeck = await prisma.deck.create({
      data: {
        title: `${sourceDeck.title} (Clonado)`,
        color: sourceDeck.color || "bg-violet-600",
        userId,
        flashcards: {
          create: sourceDeck.flashcards.map((card) => ({
            question: card.question,
            answer: card.answer,
            details: card.details,
            // Inicializa parâmetros FSRS limpos
            interval: 1,
            easeFactor: 2.5,
            stability: 1.0,
            difficulty: 5.0,
            repetitions: 0,
            lapses: 0,
            nextReviewDate: new Date(),
          })),
        },
      },
      include: {
        _count: { select: { flashcards: true } },
      },
    });

    revalidatePath("/flashcards");
    revalidatePath("/flashcards/decks");

    return {
      success: true,
      newDeckId: clonedDeck.id,
      cardsCloned: clonedDeck._count.flashcards,
    };
  } catch (error) {
    console.error("Erro em clonePublicDeckAction:", error);
    return { success: false, error: "Não foi possível clonar o baralho." };
  }
}

/**
 * 📥 Busca dados públicos de um Mapa Mental (por preset ou tópico do banco)
 */
export async function getPublicMindmapAction(mindmapId: string): Promise<{
  success: boolean;
  data?: import("@/actions/mindmap-actions").MindmapData;
  error?: string;
}> {
  try {
    if (!mindmapId) {
      return { success: false, error: "ID do mapa mental não fornecido." };
    }

    // 1. Busca nos presets do sistema
    const { PRESET_MINDMAPS } = await import("@/lib/mindmap-presets");
    const preset = PRESET_MINDMAPS.find((m) => m.id === mindmapId);
    if (preset) {
      return { success: true, data: preset };
    }

    // 2. Busca no banco de dados por ID de tópico
    const topic = await prisma.topic.findUnique({
      where: { id: mindmapId },
      include: { subject: true },
    });

    if (topic?.mindMap) {
      const formatted: import("@/actions/mindmap-actions").MindmapData = {
        id: topic.id,
        title: topic.title,
        subject: topic.subject?.name || "Geral",
        summary: `Esquematização neural de alta densidade sobre "${topic.title}".`,
        rootNode: topic.mindMap as unknown as import("@/actions/mindmap-actions").MindmapNode,
        createdAt: topic.lastRev?.toISOString() || new Date().toISOString(),
      };
      return { success: true, data: formatted };
    }

    return { success: false, error: "Mapa mental não encontrado." };
  } catch (error) {
    console.error("Erro em getPublicMindmapAction:", error);
    return { success: false, error: "Falha ao carregar mapa mental compartilhado." };
  }
}

