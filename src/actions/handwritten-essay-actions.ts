"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { Type } from "@google/genai";
import { revalidatePath } from "next/cache";
import { checkAiQuota, consumeAiQuota } from "@/lib/ai-quota-service";

export interface HandwrittenLineItem {
  lineNumber: number;
  text: string;
}

export interface HandwrittenCriterionScore {
  name: string;
  maxScore: number;
  awardedScore: number;
  comments: string;
}

export interface HandwrittenLineError {
  line: number;
  excerpt: string;
  errorType: string;
  explanation: string;
  suggestion: string;
}

export interface HandwrittenEssayResult {
  id: string;
  score: number;
  maxScore: number;
  isApproved: boolean;
  transcription: HandwrittenLineItem[];
  fullText: string;
  lineCount: number;
  wordCount: number;
  generalFeedback: string;
  criteriaScores: HandwrittenCriterionScore[];
  lineErrors: HandwrittenLineError[];
  strengths: string[];
  improvements: string[];
  goldenVersion: string;
}

/**
 * Avalia uma redação manuscrita a partir de foto ou digitalização da folha pautada
 */
export async function evaluateHandwrittenEssayAction(
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
  data?: HandwrittenEssayResult;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // Validação de cota de IA
    const quotaCheck = await checkAiQuota(userId, "OCR_ESSAY");
    if (!quotaCheck.allowed) {
      return {
        success: false,
        error:
          "Cota diária de inteligência artificial atingida. Atualize para o Synapse Pro ou aguarde o ciclo de amanhã.",
      };
    }

    const file = formData.get("file") as File | null;
    const themeTitle = (formData.get("themeTitle") as string) || "Tema Livre";
    const banca = (formData.get("banca") as string) || "CEBRASPE";
    const subjectArea = (formData.get("subjectArea") as string) || "Geral";
    const motivatingText = (formData.get("motivatingText") as string) || "";
    const expectedPoints = (formData.get("expectedPoints") as string) || "";

    if (!file) {
      return {
        success: false,
        error: "Nenhuma imagem ou arquivo da folha manuscrita foi enviado.",
      };
    }

    // Suporta formatos de imagem comuns e PDF
    const validMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "application/pdf",
    ];

    const mimeType = file.type || "image/jpeg";
    if (!validMimes.includes(mimeType) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      return {
        success: false,
        error: "Formato inválido. Envie uma foto em JPG, PNG, WEBP ou arquivo PDF da folha.",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const prompt = `Você é o Corretor Oficial e Banca Examinadora Chefe de Redações e Discursivas de Concursos Públicos da Synapse AI.
Você está avaliando uma FOLHA MANUSCRITA oficial de prova discursiva de concurso público.

INFORMAÇÕES DA PROVA:
- Tema Proposto: "${themeTitle}"
- Banca Examinadora: "${banca}"
- Área/Carreira: "${subjectArea}"
- Textos Motivadores: ${motivatingText || "Não fornecido"}
- Padrão de Resposta / Tópicos Esperados: ${expectedPoints || "Não fornecido"}

SUA MISSÃO:
1. TRANSCRIÇÃO PALEOGRÁFICA LINHA A LINHA:
   - Leia atentamente a caligrafia cursiva ou de forma da folha.
   - Transcreva linha por linha, respeitando rigorosamente a numeração de linhas da folha pautada de prova (1, 2, 3... até 30).
   - Se uma palavra estiver ilegível ou com rasura, indique fielmente o que foi possível decodificar.
2. AVALIAÇÃO MACROESTRUTURAL:
   - Apresentação, legibilidade e respeito às margens.
   - Atendimento integral ao tema e posicionamento crítico/jurídico.
   - Estrutura dissertativa clássica (Introdução com tese, desenvolvimento articulado e conclusão com fechamento).
3. AVALIAÇÃO MICROESTRUTURAL LINHA A LINHA (NORMA CULTA):
   - Aponte os desvios gramaticais, ortográficos, de concordância, regência, pontuação ou crase.
   - Para cada desvio, INDIQUE O NÚMERO EXATO DA LINHA onde ocorreu o erro.
4. VERSÃO NOTA 10 (PADRÃO DE OURO):
   - Reescreva o mesmo texto do candidato corrigindo todas as falhas e elevando o nível formal, mantendo a autoria e os argumentos do aluno.

Retorne OBRIGATORIAMENTE um JSON estrito correspondente ao schema especificado.`;

    const contents = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType.startsWith("application/pdf")
                ? "application/pdf"
                : "image/jpeg",
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
    ];

    const aiResult = await generateContentWithFallback({
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcription: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  lineNumber: { type: Type.INTEGER },
                  text: { type: Type.STRING },
                },
                required: ["lineNumber", "text"],
              },
            },
            score: { type: Type.NUMBER },
            maxScore: { type: Type.NUMBER },
            isApproved: { type: Type.BOOLEAN },
            generalFeedback: { type: Type.STRING },
            criteriaScores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  maxScore: { type: Type.NUMBER },
                  awardedScore: { type: Type.NUMBER },
                  comments: { type: Type.STRING },
                },
                required: ["name", "maxScore", "awardedScore", "comments"],
              },
            },
            lineErrors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  line: { type: Type.INTEGER },
                  excerpt: { type: Type.STRING },
                  errorType: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                },
                required: [
                  "line",
                  "excerpt",
                  "errorType",
                  "explanation",
                  "suggestion",
                ],
              },
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            goldenVersion: { type: Type.STRING },
          },
          required: [
            "transcription",
            "score",
            "maxScore",
            "isApproved",
            "generalFeedback",
            "criteriaScores",
            "goldenVersion",
          ],
        },
      },
      timeoutMs: 90000,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(aiResult.text);
    } catch {
      return {
        success: false,
        error: "Falha ao interpretar a transcrição e o espelho de correção da redação.",
      };
    }

    const transcription: HandwrittenLineItem[] = parsed.transcription || [];
    const fullText = transcription.map((l) => l.text).join("\n");
    const lineCount = transcription.length;
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;

    // Consome cota de IA
    await consumeAiQuota(userId, "OCR_ESSAY");

    // Salva no banco de dados
    const submission = await prisma.essaySubmission.create({
      data: {
        userId,
        themeTitle,
        banca,
        subjectArea,
        motivatingText,
        expectedPoints,
        content: fullText,
        lineCount,
        wordCount,
        durationSeconds: 0,
        score: parsed.score || 70,
        maxScore: parsed.maxScore || 100,
        isApproved: parsed.isApproved ?? (parsed.score >= (parsed.maxScore || 100) * 0.6),
        generalFeedback: parsed.generalFeedback || "Redação avaliada.",
        criteriaScores: parsed.criteriaScores || [],
        lineErrors: parsed.lineErrors || [],
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        goldenVersion: parsed.goldenVersion || "",
        status: "EVALUATED",
      },
    });

    try {
      revalidatePath("/redacao");
      revalidatePath("/performance");
    } catch {}

    const resultData: HandwrittenEssayResult = {
      id: submission.id,
      score: parsed.score || 70,
      maxScore: parsed.maxScore || 100,
      isApproved: parsed.isApproved ?? (parsed.score >= (parsed.maxScore || 100) * 0.6),
      transcription,
      fullText,
      lineCount,
      wordCount,
      generalFeedback: parsed.generalFeedback || "Redação avaliada.",
      criteriaScores: parsed.criteriaScores || [],
      lineErrors: parsed.lineErrors || [],
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      goldenVersion: parsed.goldenVersion || "",
    };

    return {
      success: true,
      data: resultData,
    };
  } catch (err) {
    console.error("[evaluateHandwrittenEssayAction] Erro:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Erro inesperado ao processar folha manuscrita.",
    };
  }
}
