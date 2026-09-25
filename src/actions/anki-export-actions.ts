"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface AnkiExportResult {
  success: boolean;
  error?: string;
  deckTitle?: string;
  fileName?: string;
  content?: string;
  cardCount?: number;
}

function formatForAnkiField(text: string): string {
  if (!text) return "";
  // Escapa tabulações para não quebrar as colunas do Anki
  let safe = text.replace(/\t/g, "    ").trim();
  // Converte quebras de linha em <br> para renderização correta no Anki Desktop e AnkiDroid
  safe = safe.replace(/\r\n/g, "<br>").replace(/\n/g, "<br>");
  return safe;
}

export async function exportDeckToAnkiAction(
  deckId: string
): Promise<AnkiExportResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const deck = await prisma.deck.findUnique({
      where: { id: deckId, userId },
      include: {
        subject: { select: { name: true } },
        topic: { select: { title: true } },
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
      return { success: false, error: "Baralho não encontrado." };
    }

    if (deck.flashcards.length === 0) {
      return {
        success: false,
        error: "Este baralho não possui flashcards para exportar.",
      };
    }

    // Monta a tag oficial do Anki
    const sanitizeTag = (str: string) =>
      str.replace(/[^a-zA-Z0-9À-ú_-]/g, "").trim();

    let tagHierarchy = "synapse-ai";
    if (deck.subject?.name) {
      tagHierarchy += `::${sanitizeTag(deck.subject.name)}`;
    }
    if (deck.title) {
      tagHierarchy += `::${sanitizeTag(deck.title)}`;
    }

    // Cabeçalho com especificações oficiais do Anki
    const lines: string[] = [
      "#separator:tab",
      "#html:true",
      "#tags column:3",
    ];

    for (const card of deck.flashcards) {
      const front = formatForAnkiField(card.question);
      let back = formatForAnkiField(card.answer);

      // Se houver anotações ou bizús/mnemônicos, adiciona ao verso com formatação destacada
      if (card.details?.trim()) {
        const detailsFormatted = formatForAnkiField(card.details);
        back += `<br><br><div style="margin-top:8px;padding:8px 12px;background:#2d1b4e;border-left:3px solid #8b5cf6;border-radius:4px;color:#ddd6fe;font-size:0.9em;text-align:left;">💡 <b>Bizu / Pegadinha da Banca:</b><br>${detailsFormatted}</div>`;
      }

      lines.push(`${front}\t${back}\t${tagHierarchy}`);
    }

    const content = lines.join("\n");
    const safeTitle = deck.title.replace(/[^a-zA-Z0-9À-ú_-]/g, "_");
    const fileName = `${safeTitle}_Anki.txt`;

    return {
      success: true,
      deckTitle: deck.title,
      fileName,
      content,
      cardCount: deck.flashcards.length,
    };
  } catch (err: unknown) {
    console.error("Erro no exportDeckToAnkiAction:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Erro ao gerar arquivo de exportação para o Anki.",
    };
  }
}
