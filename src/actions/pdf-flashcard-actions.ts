"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { extractText } from "unpdf";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { generateSimuladoInParallel } from "@/lib/simulado-generator";
import { Type } from "@google/genai";

export interface ExtractedTopicItem {
  id: string;
  title: string;
  pageRange: string;
  startPage: number;
  endPage: number;
  charCount: number;
  suggestedCardCount: number;
  preview: string;
  cleanedText: string;
}

export interface ParsePdfResult {
  success: boolean;
  error?: string;
  pdfName?: string;
  totalPages?: number;
  totalCleanChars?: number;
  topics?: ExtractedTopicItem[];
}

export interface GenerateCardsFromTopicInput {
  topicId: string;
  topicTitle: string;
  text: string;
  deckId?: string;
  deckTitle?: string;
  targetCount?: number;
  mode?: "CLOZE_AND_CONCEPTS" | "LAW_EXCEPTIONS" | "DEADLINES_AND_NUMBERS";
}

export interface GenerateCardsFromTopicResponse {
  success: boolean;
  error?: string;
  deckId?: string;
  deckTitle?: string;
  createdCount?: number;
  cards?: Array<{
    id: string;
    question: string;
    answer: string;
    details: string | null;
  }>;
}

/**
 * Heurística de limpeza de texto para PDFs:
 * - Remove cabeçalhos e rodapés repetitivos entre páginas
 * - Descarta páginas de ruído (Capa vazia, Sumário / Índice, Bibliografia)
 * - Identifica divisões temáticas ou particiona em blocos lógicos coesos
 */
export async function parsePdfAndExtractTopicsAction(
  formData: FormData
): Promise<ParsePdfResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "Nenhum arquivo enviado." };
    }

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return { success: false, error: "Formato inválido. Por favor, envie um arquivo .PDF." };
    }

    // Limite de segurança: 25MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: "O arquivo excede o limite máximo permitido de 25MB." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Extrai texto por páginas via unpdf (0 tokens gastos)
    const { totalPages, text: rawPages } = await extractText(uint8Array, {
      mergePages: false,
    });

    if (!rawPages || rawPages.length === 0) {
      return {
        success: false,
        error: "Não foi possível extrair texto do documento.",
      };
    }

    // Valida se o PDF tem camada de texto pesquisável ou se é imagem escaneada
    const totalRawChars = rawPages.reduce((acc, p) => acc + p.trim().length, 0);
    if (totalRawChars < 80) {
      return {
        success: false,
        error:
          "Este PDF parece ser composto por imagens digitalizadas/escaneadas sem camada de texto (OCR). Por favor, utilize um arquivo com texto pesquisável para que a IA possa analisar o conteúdo.",
      };
    }

    // 1. Identifica padrões de Cabeçalho e Rodapé repetitivos
    const headerCandidates = new Map<string, number>();
    const footerCandidates = new Map<string, number>();

    const pageLinesList = rawPages.map((pageText) => {
      const lines = pageText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      return lines;
    });

    const normalizeHeaderFooter = (str: string) => {
      return str
        .replace(/\b\d+\s*de\s*\d+\b/gi, "")
        .replace(/\bp[áa]g(?:ina)?\.?\s*\d+\b/gi, "")
        .replace(/\b\d+\b/g, "")
        .trim();
    };

    pageLinesList.forEach((lines) => {
      if (lines.length >= 3) {
        const top1 = normalizeHeaderFooter(lines[0]);
        if (top1.length > 5) {
          headerCandidates.set(top1, (headerCandidates.get(top1) || 0) + 1);
        }
        const bottom1 = normalizeHeaderFooter(lines[lines.length - 1]);
        if (bottom1.length > 5) {
          footerCandidates.set(bottom1, (footerCandidates.get(bottom1) || 0) + 1);
        }
      }
    });

    const repeatThreshold = Math.max(3, Math.floor(totalPages * 0.3));
    const badHeaders = new Set<string>();
    const badFooters = new Set<string>();

    headerCandidates.forEach((count, pattern) => {
      if (count >= repeatThreshold) badHeaders.add(pattern);
    });
    footerCandidates.forEach((count, pattern) => {
      if (count >= repeatThreshold) badFooters.add(pattern);
    });

    // 2. Limpeza página por página e descarte de páginas de ruído
    interface CleanedPage {
      pageNumber: number;
      text: string;
      isNoise: boolean;
    }

    const cleanedPages: CleanedPage[] = [];

    pageLinesList.forEach((lines, idx) => {
      const pageNum = idx + 1;
      const filteredLines = [...lines];

      // Remove header e footer detectados
      if (filteredLines.length > 0) {
        const topNorm = normalizeHeaderFooter(filteredLines[0]);
        if (badHeaders.has(topNorm)) filteredLines.shift();
      }
      if (filteredLines.length > 0) {
        const botNorm = normalizeHeaderFooter(filteredLines[filteredLines.length - 1]);
        if (badFooters.has(botNorm)) filteredLines.pop();
      }

      const pageText = filteredLines.join("\n").trim();
      const lowerText = pageText.toLowerCase();

      // Heurística de ruído:
      // - Capa se tiver menos de 180 caracteres na página 1 ou 2
      const isCover = (pageNum === 1 || pageNum === 2) && pageText.length < 180;
      // - Sumário / Índice
      const isIndex =
        (pageNum <= 5 && (lowerText.startsWith("sumário") || lowerText.startsWith("índice"))) ||
        (filteredLines.length > 4 &&
          filteredLines.filter((l) => /\.{3,}|\b\d+$/.test(l)).length / filteredLines.length > 0.4);
      // - Bibliografia / Referências nos finais
      const isBibliography =
        pageNum > totalPages * 0.7 &&
        (lowerText.includes("referências bibliográficas") ||
          lowerText.includes("bibliografia consultada"));

      const isNoise = isCover || isIndex || isBibliography;

      if (!isNoise && pageText.length >= 80) {
        cleanedPages.push({
          pageNumber: pageNum,
          text: pageText,
          isNoise: false,
        });
      }
    });

    if (cleanedPages.length === 0) {
      return {
        success: false,
        error: "O conteúdo de estudo pesquisável no documento é insuficiente para extrair tópicos.",
      };
    }

    // 3. Segmentação Semântica em Tópicos
    interface RawTopicChunk {
      title: string;
      startPage: number;
      endPage: number;
      pages: CleanedPage[];
    }

    const detectedChunks: RawTopicChunk[] = [];
    let currentChunk: RawTopicChunk | null = null;

    // Regex para detectar títulos de capítulos e divisões estruturais de estudo
    const headerRegex =
      /^(?:(?:Cap[íi]tulo|M[óo]dulo|Aula|T[óo]pico|Unidade|Se[çc][ãa]o)\s*[\dIVXLCDM]+[:\-\s.]*(.+)?|(?:\d{1,2}(?:\.\d{1,2}){0,2}\s+[A-ZÀ-Ú][^\n]{3,60}))/i;

    cleanedPages.forEach((cp) => {
      const lines = cp.text.split("\n");
      let foundHeaderInPage = false;

      for (let i = 0; i < Math.min(6, lines.length); i++) {
        const line = lines[i].trim();
        const match = line.match(headerRegex);

        // Também detecta títulos em CAIXA ALTA isolados (entre 5 e 50 chars)
        const isUppercaseTitle =
          !match &&
          line.length >= 6 &&
          line.length <= 50 &&
          line === line.toUpperCase() &&
          !/[0-9.,;:!?]/.test(line.slice(0, 3));

        if (match || isUppercaseTitle) {
          const title = (match ? line : line).replace(/^[\d.\-\s]+/, "").trim() || line;

          if (currentChunk && currentChunk.pages.length > 0) {
            detectedChunks.push(currentChunk);
          }

          currentChunk = {
            title: title.length > 70 ? title.slice(0, 70) + "..." : title,
            startPage: cp.pageNumber,
            endPage: cp.pageNumber,
            pages: [cp],
          };
          foundHeaderInPage = true;
          break;
        }
      }

      if (!foundHeaderInPage) {
        if (!currentChunk) {
          currentChunk = {
            title: `Parte 1: ${file.name.replace(/\.pdf$/i, "")}`,
            startPage: cp.pageNumber,
            endPage: cp.pageNumber,
            pages: [cp],
          };
        } else {
          currentChunk.endPage = cp.pageNumber;
          currentChunk.pages.push(cp);

          // Se um chunk ficar excessivamente longo (> 8 páginas), subdivide para manter o rendimento atômico
          if (currentChunk.pages.length >= 8) {
            detectedChunks.push(currentChunk);
            currentChunk = null;
          }
        }
      }
    });

    if (currentChunk && (currentChunk as RawTopicChunk).pages.length > 0) {
      detectedChunks.push(currentChunk);
    }

    // Se nenhum título formal foi encontrado, particiona por blocos de 3 a 5 páginas
    let finalRawChunks = detectedChunks;
    if (finalRawChunks.length <= 1 && cleanedPages.length >= 4) {
      finalRawChunks = [];
      const pageSize = 3;
      for (let i = 0; i < cleanedPages.length; i += pageSize) {
        const slice = cleanedPages.slice(i, i + pageSize);
        const startP = slice[0].pageNumber;
        const endP = slice[slice.length - 1].pageNumber;
        const partNumber = Math.floor(i / pageSize) + 1;
        const firstWords = slice[0].text
          .split("\n")[0]
          .slice(0, 45)
          .trim();

        finalRawChunks.push({
          title: `Parte ${partNumber}: ${firstWords || "Conteúdo de Estudo"}`,
          startPage: startP,
          endPage: endP,
          pages: slice,
        });
      }
    }

    // Mapeia para tópicos prontos para a interface
    let totalCleanChars = 0;
    const topics: ExtractedTopicItem[] = finalRawChunks.map((chunk, index) => {
      const fullText = chunk.pages.map((p) => p.text).join("\n\n");
      const charCount = fullText.length;
      totalCleanChars += charCount;

      const cleanSnippet = fullText.replace(/\s+/g, " ").trim().slice(0, 180) + "...";
      const suggestedCardCount = Math.min(15, Math.max(5, Math.round(charCount / 800)));

      const pageRange =
        chunk.startPage === chunk.endPage
          ? `Pág. ${chunk.startPage}`
          : `Págs. ${chunk.startPage} – ${chunk.endPage}`;

      return {
        id: `topic-${index + 1}`,
        title: chunk.title,
        pageRange,
        startPage: chunk.startPage,
        endPage: chunk.endPage,
        charCount,
        suggestedCardCount,
        preview: cleanSnippet,
        cleanedText: fullText.slice(0, 10000), // Limita em 10k chars por tópico
      };
    });

    return {
      success: true,
      pdfName: file.name,
      totalPages,
      totalCleanChars,
      topics,
    };
  } catch (err: unknown) {
    console.error("Erro no parsePdfAndExtractTopicsAction:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao processar o arquivo PDF.",
    };
  }
}

/**
 * Gera os flashcards com IA a partir do texto de um tópico específico
 * e salva diretamente no baralho escolhido pelo usuário.
 */
export async function generateCardsFromTopicAction(
  input: GenerateCardsFromTopicInput
): Promise<GenerateCardsFromTopicResponse> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const { text, topicTitle, targetCount = 8, mode = "CLOZE_AND_CONCEPTS" } = input;

    if (!text || text.trim().length < 50) {
      return {
        success: false,
        error: "Texto do tópico insuficiente para gerar flashcards.",
      };
    }

    const count = Math.min(15, Math.max(3, targetCount));

    let modeInstruction = "";
    if (mode === "LAW_EXCEPTIONS") {
      modeInstruction =
        "FOCO OBRIGATÓRIO: Exceções à regra geral, ressalvas legais, palavras críticas de pegadinha das bancas ('salvo', 'exceto', 'vedado', 'não se aplica', 'dispensado vs inexigível'). As perguntas devem testar onde o candidato comumente erra em prova.";
    } else if (mode === "DEADLINES_AND_NUMBERS") {
      modeInstruction =
        "FOCO OBRIGATÓRIO: Prazos (dias úteis vs corridos), quóruns constitucionais/legais, percentuais, frações e idades explícitas. Destaque o número/prazo no gabarito e inclua um mnemônico rápido para memorização.";
    } else {
      modeInstruction =
        "FOCO OBRIGATÓRIO: Princípios essenciais, definições e conceitos doutrinários de alta recorrência. Use perguntas instigantes intercaladas com itens no formato Cloze Deletion '[...]' (onde o candidato preenche o termo-chave).";
    }

    const prompt = `Você é um Engenheiro Pedagógico Sênior especialista em preparação para Concursos Públicos de Alta Performance (Cebraspe, FGV, FCC, Vunesp).
Sua tarefa é analisar o texto do tópico "${topicTitle}" e produzir EXATAMENTE ${count} Flashcards Atômicos de Altíssimo Rendimento baseados no princípio da informação mínima (algoritmo FSRS/Anki).

${modeInstruction}

DIRETRIZES TÉCNICAS OBRIGATÓRIAS:
1. Pergunta (question): Enxuta, direta e desafiadora. Se for lacuna, use '[...]'.
2. Resposta (answer): Objetiva, sem rodeios. Gabarito direto no início seguido de fundamentação legal/doutrinária curta.
3. Detalhes (details): Bizú do professor, mnemônico clássico ou aviso explícito da pegadinha da banca examinadora.

CONTEÚDO DO TÓPICO:
"""
${text.slice(0, 10000)}
"""`;

    const aiRes = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  details: { type: Type.STRING },
                },
                required: ["question", "answer"],
              },
            },
          },
          required: ["cards"],
        },
      },
    });

    if (!aiRes || !aiRes.text) {
      throw new Error("A IA não retornou resposta estruturada.");
    }

    const parsed = JSON.parse(aiRes.text) as {
      cards: Array<{ question: string; answer: string; details?: string }>;
    };

    if (!parsed.cards || parsed.cards.length === 0) {
      throw new Error("Nenhum flashcard pôde ser gerado a partir deste tópico.");
    }

    // Identifica ou cria o baralho (Deck)
    let targetDeckId = input.deckId;
    let finalTitle = input.deckTitle?.trim() || topicTitle || "Baralho PDF IA";

    if (targetDeckId) {
      const existingDeck = await prisma.deck.findUnique({
        where: { id: targetDeckId, userId },
      });
      if (existingDeck) {
        finalTitle = existingDeck.title;
      } else {
        targetDeckId = undefined;
      }
    }

    if (!targetDeckId) {
      const newDeck = await prisma.deck.create({
        data: {
          title: finalTitle,
          color: "bg-indigo-600",
          userId,
        },
      });
      targetDeckId = newDeck.id;
    }

    // Persiste os cards em transação com parâmetros FSRS/SM-2
    const createdCards = await prisma.$transaction(
      parsed.cards.map((c) =>
        prisma.flashcard.create({
          data: {
            deckId: targetDeckId!,
            question: c.question,
            answer: c.answer,
            details: c.details || null,
            stability: 1.0,
            difficulty: 5.0,
            easeFactor: 2.5,
            interval: 1,
            repetitions: 0,
            lapses: 0,
            nextReviewDate: new Date(),
          },
          select: {
            id: true,
            question: true,
            answer: true,
            details: true,
          },
        })
      )
    );

    revalidatePath("/flashcards");
    revalidatePath(`/flashcards/decks/${targetDeckId}`);

    return {
      success: true,
      deckId: targetDeckId,
      deckTitle: finalTitle,
      createdCount: createdCards.length,
      cards: createdCards,
    };
  } catch (err: unknown) {
    console.error("Erro no generateCardsFromTopicAction:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Erro ao gerar flashcards para o tópico selecionado.",
    };
  }
}

export interface GenerateQuizFromPdfTopicInput {
  topicTitle: string;
  text: string;
  banca?: string;
  qtdQuestoes?: number;
  dificuldade?: string;
}

export interface GenerateQuizFromPdfTopicResponse {
  success: boolean;
  error?: string;
  quizId?: string;
  count?: number;
  quizTitle?: string;
}

/**
 * Gera um simulado com questões de concurso a partir do texto do PDF
 * e salva diretamente no banco de questões do aluno.
 */
export async function generateQuizFromPdfTopicAction(
  input: GenerateQuizFromPdfTopicInput
): Promise<GenerateQuizFromPdfTopicResponse> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const {
      topicTitle,
      text,
      banca = "Cebraspe",
      qtdQuestoes = 5,
      dificuldade = "Médio",
    } = input;

    if (!text || text.trim().length < 50) {
      return {
        success: false,
        error: "Texto insuficiente para formular questões a partir do PDF.",
      };
    }

    const count = Math.min(10, Math.max(3, qtdQuestoes));

    const result = await generateSimuladoInParallel(
      {
        banca,
        materia: `PDF: ${topicTitle}`,
        topicoNome: topicTitle,
        qtdQuestoes: count,
        dificuldade,
        textoBase: text.slice(0, 10000),
        fonteConteudo: "pdf",
      },
      userId
    );

    if (!result.success || !result.quizId) {
      throw new Error("Não foi possível salvar o simulado gerado.");
    }

    revalidatePath("/questions");

    return {
      success: true,
      quizId: result.quizId,
      count: result.data.length,
      quizTitle: `Simulado: ${topicTitle}`,
    };
  } catch (err: unknown) {
    console.error("Erro no generateQuizFromPdfTopicAction:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Erro ao gerar questões a partir do PDF.",
    };
  }
}
