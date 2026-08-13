"use server";

import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export interface CreateDeckWithAIInput {
  name: string;
  content: string;
  color?: string;
  userId: string; // Campo obrigatório exigido pelo Prisma Schema
}

export async function createDeckWithAIAction(input: CreateDeckWithAIInput) {
  try {
    if (!input.userId) {
      return {
        success: false,
        error: "Usuário não autenticado para criar o baralho.",
      };
    }

    if (!input.name.trim() || !input.content.trim()) {
      return {
        success: false,
        error: "O título e o conteúdo base são obrigatórios.",
      };
    }

    // Criação do baralho no banco vinculada ao usuário
    const newDeck = await prisma.deck.create({
      data: {
        title: input.name,
        color: input.color || "bg-indigo-500",
        userId: input.userId,
      },
    });

    (revalidateTag as (tag: string) => void)(`user-decks-${input.userId}`);

    return {
      success: true,
      data: newDeck,
    };
  } catch (err) {
    console.error("Erro ao criar baralho com IA:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao gerar o baralho. Tente novamente.",
    };
  }
}
