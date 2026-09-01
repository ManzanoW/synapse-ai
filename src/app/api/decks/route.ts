// src/app/api/decks/route.ts

import { NextResponse } from "next/server";
import { Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { FlashcardRaw } from "@/types";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { generateContentWithFallback } from "@/lib/gemini-fallback";

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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ Erro no GET /api/decks:", error);
    return NextResponse.json(
      { error: "Falha ao buscar decks.", details: message },
      { status: 500 },
    );
  }
}

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

    const deckTitle =
      topicName && topicName.trim() !== "" ? topicName : "Todos os Tópicos";

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
        { status: 400 },
      );
    }

    const totalFlashcards = qtdCards || 10;
    const depthLevel = dificuldade || "MÉDIA";

    const prompt = `
      Você é um professor PhD e especialista em memorização ativa.
      Gere EXATAMENTE ${totalFlashcards} flashcards de estudo focados no escopo: "${baseText}".
      Nível de profundidade/dificuldade dos conceitos: ${depthLevel}.
    `;

    // 🚀 Chamada com fallback automático
    const response = await generateContentWithFallback({
      prompt,
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
                    description:
                      "Pergunta objetiva e conceitual para active recall.",
                  },
                  answer: {
                    type: Type.STRING,
                    description: "Resposta direta e precisa do conceito.",
                  },
                  details: {
                    type: Type.STRING,
                    description:
                      "Breve explicação ou dica complementar do tema.",
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
            }),
          ),
        },
      },
      include: {
        subject: true,
        _count: { select: { flashcards: true } },
      },
    });

    return NextResponse.json(
      { data: newDeck, usedModel: response.usedModel },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ Erro ao criar deck:", error);
    return NextResponse.json(
      { error: "Falha ao processar deck.", details: message },
      { status: 500 },
    );
  }
}
