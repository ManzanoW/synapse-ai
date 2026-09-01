"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag, revalidatePath } from "next/cache";
import {
  parseAndValidateAIResponse,
  generatedDeckResponseSchema,
} from "@/lib/ai-validator";
import { ErrorClassification } from "@/types/quiz";

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

    // 3. Chamada ao endpoint da IA com fallback seguro
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Chave de IA não configurada no servidor." };
    }

    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY || apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      throw new Error(`Erro na API de IA: ${aiRes.statusText}`);
    }

    const aiJson = await aiRes.json();
    const rawContent = aiJson.choices?.[0]?.message?.content || "";

    const validation = await parseAndValidateAIResponse(
      rawContent,
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

    // 5. Revalida caches
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
