"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { recordStudyActivityAction } from "@/actions/gamification-actions";

import {
  type JurisprudenceItem,
  CURATED_JURISPRUDENCE,
} from "@/lib/jurisprudence-data";

export type { JurisprudenceItem };

/**
 * Busca súmulas e jurisprudência no catálogo curado ou gera com IA em tempo real caso não encontre
 */
export async function searchJurisprudenceAction(input: {
  query: string;
  tribunal?: string;
  disciplina?: string;
}): Promise<{ success: boolean; data: JurisprudenceItem[]; error?: string }> {
  try {
    const q = input.query.trim().toLowerCase();
    const tribunalFilter = input.tribunal?.toUpperCase();
    const disciplinaFilter = input.disciplina?.toLowerCase();

    // 1. Filtra catálogo curado
    let matches = CURATED_JURISPRUDENCE.filter((item) => {
      const matchTribunal =
        !tribunalFilter || tribunalFilter === "TODOS" || item.tribunal === tribunalFilter;
      const matchDisciplina =
        !disciplinaFilter ||
        disciplinaFilter === "todas" ||
        item.disciplina.toLowerCase().includes(disciplinaFilter);

      if (!matchTribunal || !matchDisciplina) return false;

      if (!q) return true;

      return (
        item.numero.toLowerCase().includes(q) ||
        item.titulo.toLowerCase().includes(q) ||
        item.assunto.toLowerCase().includes(q) ||
        item.teseResumida.toLowerCase().includes(q) ||
        item.pegadinhaBanca.toLowerCase().includes(q)
      );
    });

    // 2. Se houver correspondência curada, retorna imediatamente
    if (matches.length > 0) {
      return { success: true, data: matches };
    }

    // 3. Se não houver correspondência curada e o usuário buscou um termo específico, aciona a IA
    if (q.length >= 3) {
      const prompt = `Você é o maior especialista em jurisprudência do STF, STJ e tribunais superiores do Brasil para concursos públicos.
O usuário pesquisou pelo seguinte tema ou súmula jurídica: "${input.query}" (Tribunal: ${input.tribunal || "STF/STJ"}, Disciplina: ${input.disciplina || "Geral"}).

Gere um "Raio-X Jurisprudencial Cognitivo" com rigor técnico absoluto e linguagem didática para concurseiros.

Estrutura JSON obrigatória:
{
  "numero": "Identificação exata (ex: 'Súmula Vinculante X', 'Tema Y STF', 'Súmula Z STJ', ou julgado paradigmático)",
  "tribunal": "STF" | "STJ" | "TST" | "TSE" | "GERAL",
  "disciplina": "Nome da Matéria (ex: Direito Constitucional, Administrativo, Penal, Tributário)",
  "assunto": "Tópico Específico",
  "titulo": "Título didático e intuitivo da tese",
  "teseResumida": "Explicação limpa, didática e direta em português claro sem juridiquês dispensável",
  "teseOriginal": "Texto oficial da ementa ou súmula com termos técnicos",
  "divergenciaOuEvolucao": "Existe divergência entre STF e STJ sobre o tema? Houve superação de entendimento (overruling) recente? Explique em 2 parágrafos.",
  "pegadinhaBanca": "Como as bancas examinadoras (FGV, Cebraspe, FCC, Vunesp) formulam questões capciosas sobre essa tese para induzir o candidato ao erro?",
  "casoPratico": "Um exemplo hipotético breve e palpável aplicando a tese a uma situação fática.",
  "flashcardFrente": "Pergunta ativa direta sobre o ponto nevrálgico da tese.",
  "flashcardVerso": "Resposta concisa com palavra-chave ou gatilho mental de memorização."
}`;

      const aiResponse = await generateContentWithFallback({
        prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
        preferredModels: [
          "gemini-2.5-flash",
          "gemini-3.7-flash",
          "gemini-3.6-flash",
        ],
      });

      if (aiResponse?.text) {
        let cleanText = aiResponse.text.trim();
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const parsed = JSON.parse(cleanText) as JurisprudenceItem;
        parsed.id = `ai-gen-${Date.now()}`;
        parsed.isCustomGenerated = true;

        return { success: true, data: [parsed] };
      }
    }

    return { success: true, data: [] };
  } catch (error) {
    console.error("[Search Jurisprudence Action Error]:", error);
    return {
      success: false,
      data: CURATED_JURISPRUDENCE,
      error: "Não foi possível conectar ao motor jurisprudencial de IA.",
    };
  }
}

/**
 * Cria um Flashcard FSRS a partir de uma súmula ou tese jurisprudencial
 */
export async function createJurisprudenceFlashcardAction(input: {
  front: string;
  back: string;
  details?: string;
  disciplina: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const targetDeckTitle = `Jurisprudência - ${input.disciplina}`;

    let deck = await prisma.deck.findFirst({
      where: {
        userId,
        title: { equals: targetDeckTitle, mode: "insensitive" },
      },
    });

    if (!deck) {
      deck = await prisma.deck.create({
        data: {
          userId,
          title: targetDeckTitle,
          color: "#3b82f6",
        },
      });
    }

    const card = await prisma.flashcard.create({
      data: {
        deckId: deck.id,
        question: input.front,
        answer: input.back,
        details: input.details || null,
        stability: 1.0,
        difficulty: 5.0,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        lapses: 0,
        nextReviewDate: new Date(),
      },
      select: { id: true },
    });

    revalidatePath("/flashcards");

    // Atribui XP por criação de card de jurisprudência
    await recordStudyActivityAction(userId, 15, "FLASHCARD", 1).catch(() => null);

    return { success: true, id: card.id };
  } catch (error) {
    console.error("[Create Jurisprudence Flashcard Error]:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao salvar flashcard de jurisprudência.",
    };
  }
}
