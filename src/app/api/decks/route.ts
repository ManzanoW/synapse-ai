// src/app/api/decks/route.ts

import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { FlashcardRaw } from "@/types";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface AIResponse {
  text: string | null;
}

/**
 * 🔄 Função de geração com Retry e Schema Estruturado usando gemini-3.5-flash-lite
 */
async function generateFlashcardsWithRetry(
  prompt: string,
  retries = 2
): Promise<AIResponse> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
          maxOutputTokens: 8192,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: {
                      type: Type.STRING,
                      description: "Pergunta objetiva e conceitual para active recall.",
                    },
                    answer: {
                      type: Type.STRING,
                      description: "Resposta direta e precisa do conceito.",
                    },
                    details: {
                      type: Type.STRING,
                      description: "Breve explicação ou dica complementar do tema.",
                    },
                  },
                  required: ["question", "answer"],
                },
              },
            },
            required: ["flashcards"],
          },
        },
      });

      return { text: result.text || "" };
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status === 503 && i < retries - 1) {
        await new Promise((res) => setTimeout(res, 1000));
        continue;
      }
      throw error;
    }
  }

  throw new Error("Falha ao gerar flashcards após múltiplas tentativas.");
}

/**
 * 📥 GET: Lista todos os baralhos do usuário autenticado
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const decks = await prisma.deck.findMany({
      where: { userId },
      include: {
        subject: true,
        _count: {
          select: { flashcards: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: decks }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Erro no GET /api/decks:", error);
    return NextResponse.json(
      { error: "Falha ao buscar decks.", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * 📤 POST: Gera um novo baralho com flashcards via IA
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      materia,
      subjectId,
      topicId,
      topicName,
      content,
      fonteConteudo,
      dificuldade,
      qtdCards,
      color,
    } = body;

    // 🟢 DEFINE O TÍTULO DO BARALHO:
    // Se selecionou um tópico específico, o título é o nome do tópico. Senão "Todos os Tópicos".
    const deckTitle =
      topicName && topicName.trim() !== ""
        ? topicName
        : "Todos os Tópicos";

    const subjectName = materia || name || "Geral";

    let baseText = content;
    if (fonteConteudo === "banca" || !baseText) {
      baseText = `Matéria: ${subjectName}${
        topicName ? `, Tópico: ${topicName}` : ""
      }`;
    }

    if (!subjectName || !baseText) {
      return NextResponse.json(
        { error: "Matéria principal ou conteúdo para a IA é obrigatório." },
        { status: 400 }
      );
    }

    const totalFlashcards = qtdCards || 10;
    const depthLevel = dificuldade || "MÉDIA";

    const prompt = `
      Você é um professor PhD e especialista em memorização ativa.
      Gere EXATAMENTE ${totalFlashcards} flashcards de estudo focados no escopo: "${baseText}".
      Nível de profundidade/dificuldade dos conceitos: ${depthLevel}.
    `;

    // 🟢 CHAMADA GEMINI 3.5 FLASH LITE COM SCHEMA OBRIGATÓRIO E RETRY
    const response = await generateFlashcardsWithRetry(prompt);

    if (!response.text) {
      throw new Error("Nenhum conteúdo retornado pela IA.");
    }

    let data: { flashcards: FlashcardRaw[] };
    try {
      data = JSON.parse(response.text) as { flashcards: FlashcardRaw[] };
    } catch {
      data = { flashcards: [] };
    }

    let resolvedSubjectId = subjectId || null;
    if (!resolvedSubjectId && subjectName) {
      const foundSubject = await prisma.subject.findFirst({
        where: {
          name: { equals: subjectName.trim(), mode: "insensitive" },
          userId: userId,
        },
        select: { id: true },
      });
      if (foundSubject) {
        resolvedSubjectId = foundSubject.id;
      }
    }

    const newDeck = await prisma.deck.create({
      data: {
        title: deckTitle, // Salva o nome do Tópico Específico ou "Todos os Tópicos"
        color: color || "bg-indigo-500",
        subjectId: resolvedSubjectId, // Associa à Matéria Principal
        userId: userId,
        flashcards: {
          create: (data.flashcards || []).map(
            (f): Prisma.FlashcardCreateWithoutDeckInput => ({
              question: f.question,
              answer: f.answer,
              details: f.details || "",
              topic: topicId ? { connect: { id: topicId } } : undefined,
            })
          ),
        },
      },
      include: {
        subject: true,
        _count: { select: { flashcards: true } },
      },
    });

    return NextResponse.json({ data: newDeck }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Erro ao criar deck:", error);
    return NextResponse.json(
      { error: "Falha ao processar deck.", details: error.message },
      { status: 500 }
    );
  }
}
