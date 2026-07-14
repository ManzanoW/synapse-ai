import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { FlashcardRaw } from "@/types";
import { Prisma } from "@prisma/client"; // Importamos o namespace do Prisma

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function GET() {
  try {
    const decks = await prisma.deck.findMany({
      include: {
        subject: true,
        _count: {
          select: { flashcards: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: decks }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao buscar decks." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, subjectId, topicId, content, color } = await request.json();

    const prompt = `
      Você é um especialista em memorização ativa. Gere flashcards baseados neste conteúdo: "${content}".
      Retorne ESTRITAMENTE um JSON no seguinte formato:
      {
        "flashcards": [
          { "question": "Pergunta curta e direta", "answer": "Resposta clara", "details": "Explicação breve" }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const resultText = response.text || '{"flashcards": []}';
    const data = JSON.parse(resultText) as { flashcards: FlashcardRaw[] };

    const newDeck = await prisma.deck.create({
      data: {
        title: name,
        color: color || "bg-indigo-500",
        subjectId: subjectId,
        userId: "test",
        flashcards: {
          create: data.flashcards.map(
            (f): Prisma.FlashcardCreateWithoutDeckInput => ({
              question: f.question,
              answer: f.answer,
              details: f.details,
              topic: topicId ? { connect: { id: topicId } } : undefined,
            }),
          ),
        },
      },
    });

    return NextResponse.json({ data: newDeck }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar deck:", error);
    return NextResponse.json(
      { error: "Falha ao processar deck." },
      { status: 500 },
    );
  }
}
