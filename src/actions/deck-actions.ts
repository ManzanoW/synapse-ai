"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag, revalidatePath } from "next/cache";
import {
  parseAndValidateAIResponse,
  generatedDeckResponseSchema,
} from "@/lib/ai-validator";
import { ErrorClassification } from "@/types/quiz";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { trackQuestProgressAction } from "@/actions/quest-actions";
import { Type } from "@google/genai";

export interface GenerateTargetedDeckInput {
  topicId?: string;
  subjectId?: string;
  questionEnunciado: string;
  gabarito: string;
  justificativa?: string;
  errorReason?: ErrorClassification;
}

export async function generateTargetedDeckAction(input: GenerateTargetedDeckInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // 1. Identifica tópico e matéria associados
    let targetTopic = null;
    if (input.topicId) {
      targetTopic = await prisma.topic.findUnique({
        where: { id: input.topicId },
        include: { subject: true },
      });
    }

    const subjectName = targetTopic?.subject?.name || "Reforço";
    const topicTitle = targetTopic?.title || "Pontos Cegos da Prova";

    // 2. Monta o Prompt Especializado focado na Lacuna Teórica
    const reasonText =
      input.errorReason === "THEORY_GAP"
        ? "Lacuna Teórica (conceito desconhecido/esquecido)"
        : input.errorReason === "ATTENTION_LAPSE"
          ? "Falta de Atenção (pegadinhas e detalhes de enunciado)"
          : input.errorReason === "MISINTERPRETATION"
            ? "Erro de Interpretação (diferenciação de termos semelhantes)"
            : "Fixação e Retenção";

    const prompt = `Você é um tutor especialista em concursos públicos e neurociência da aprendizagem.
O estudante errou uma questão de ${subjectName} sobre "${topicTitle}".
Motivo diagnosticado pelo aluno: ${reasonText}.

DETALHES DA QUESTÃO ERRADA:
- Enunciado: "${input.questionEnunciado}"
- Gabarito Correto: "${input.gabarito}"
- Explicação da Banca: "${input.justificativa || "Não informada"}"

SUA MISSÃO:
Gere exatamente 5 flashcards no formato JSON estrito para fixar este conceito, eliminar a pegadinha e evitar que ele erre novamente.
- "front": Pergunta direta, objetiva e desafiadora.
- "back": Resposta concisa com a regra, artigo ou conceito mnemônico.
- "details": Dica rápida de memorização ou alerta sobre pegadinhas comuns da banca.

Retorne APENAS um JSON no seguinte formato:
{
  "title": "Reforço: ${topicTitle.slice(0, 30)}",
  "cards": [
    {
      "front": "Pergunta...",
      "back": "Resposta...",
      "details": "Dica rápida..."
    }
  ]
}`;

    // 3. Chamada via Motor de Fallback Centralizado do Gemini
    const aiResult = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  details: { type: Type.STRING },
                },
                required: ["front", "back"],
              },
            },
          },
          required: ["title", "cards"],
        },
      },
    });

    const validation = await parseAndValidateAIResponse(
      aiResult.text,
      generatedDeckResponseSchema,
    );

    if (!validation.success || !validation.data) {
      throw new Error(validation.error || "Falha na estrutura gerada pela IA.");
    }

    const { title, cards } = validation.data;

    // 4. Grava o Baralho e os Flashcards no Banco (Prisma)
    const newDeck = await prisma.deck.create({
      data: {
        title,
        color: "bg-violet-600",
        userId,
        ...(targetTopic?.id ? { topicId: targetTopic.id } : {}),
        ...(targetTopic?.subjectId ? { subjectId: targetTopic.subjectId } : {}),
        flashcards: {
          create: cards.map((c) => ({
            question: c.front,
            answer: c.back,
            details: c.details || null,
            ...(targetTopic?.id ? { topicId: targetTopic.id } : {}),
          })),
        },
      },
      include: {
        _count: { select: { flashcards: true } },
      },
    });

    // 5. Atualiza progresso da Missão Diária
    await trackQuestProgressAction("AI_DECK_CREATED", 1);

    // 6. Revalida caches
    try {
      (revalidateTag as (tag: string) => void)(`user-decks-${userId}`);
      revalidatePath("/flashcards");
    } catch {
      // Ignora fora de contexto HTTP
    }

    return {
      success: true,
      data: newDeck,
    };
  } catch (err) {
    console.error("Erro em generateTargetedDeckAction:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao gerar flashcards automáticos.",
    };
  }
}
