// src/app/api/decks/route.ts

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { FlashcardRaw } from "@/types";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

    // 🟢 1. Resolve o título final do Baralho e o contexto do texto
    const deckTitle = name || materia || "Novo Baralho";
    
    // Se o usuário selecionou "Matéria/Edital", monta o texto base com os nomes da matéria e tópico
    let baseText = content;
    if (fonteConteudo === "banca" || !baseText) {
      baseText = `Matéria: ${materia || deckTitle}${topicName ? `, Tópico: ${topicName}` : ""}`;
    }

    if (!deckTitle || !baseText) {
      return NextResponse.json(
        { error: "Matéria principal ou conteúdo para a IA é obrigatório." },
        { status: 400 }
      );
    }

    // 🟢 2. Monta o Prompt alinhado aos filtros do modal
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

    // 🟢 3. Chamada corrigida da Gemini API usando modelo estável
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
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

    // 🟢 4. Busca ou associa o SubjectId caso não tenha sido enviado
    let resolvedSubjectId = subjectId || null;
    if (!resolvedSubjectId && materia) {
      const foundSubject = await prisma.subject.findFirst({
        where: {
          name: { equals: materia.trim(), mode: "insensitive" },
          userId: userId,
        },
        select: { id: true },
      });
      if (foundSubject) {
        resolvedSubjectId = foundSubject.id;
      }
    }

    // 🟢 5. Persiste o Deck e seus Flashcards atomicamente no Prisma
    const newDeck = await prisma.deck.create({
      data: {
        title: deckTitle,
        color: color || "bg-indigo-500",
        subjectId: resolvedSubjectId,
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
