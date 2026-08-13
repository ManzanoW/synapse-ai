// src/app/api/decks/route.ts

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { FlashcardRaw } from "@/types";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    // Se o usuário selecionou um tópico específico, o título do deck é o nome do tópico.
    // Caso contrário, fica "Todos os Tópicos".
    const deckTitle =
      topicName && topicName.trim() !== ""
        ? topicName
        : "Todos os Tópicos";

    const subjectName = materia || name || "Geral";

    let baseText = content;
    if (fonteConteudo === "banca" || !baseText) {
      baseText = `Matéria: ${subjectName}${topicName ? `, Tópico: ${topicName}` : ""}`;
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
      Você é um especialista em memorização ativa e inteligência educacional.
      Gere EXATAMENTE ${totalFlashcards} flashcards de estudo focados no escopo: "${baseText}".
      Nível de profundidade/dificuldade das perguntas: ${depthLevel}.

      Retorne ESTRITAMENTE um JSON válido no seguinte formato e sem explicações externas:
      {
        "flashcards": [
          {
            "question": "Pergunta clara e objetiva para active recall",
            "answer": "Resposta direta e precisa",
            "details": "Breve explicação complementar do conceito"
          }
        ]
      }
    `;

    // modelo atualizado para o endpoint oficial
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const resultText = response.text || '{"flashcards": []}';

    let data: { flashcards: FlashcardRaw[] };
    try {
      data = JSON.parse(resultText) as { flashcards: FlashcardRaw[] };
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
        title: deckTitle, // Salva o nome do tópico ou "Todos os Tópicos"
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
