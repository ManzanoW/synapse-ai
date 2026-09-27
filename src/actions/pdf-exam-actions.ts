"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { Type } from "@google/genai";
import { revalidatePath } from "next/cache";

export interface ParsedQuestionOption {
  id: string; // A, B, C, D, E ou C, E
  texto: string;
}

export interface ParsedExamQuestion {
  numero: number;
  materia: string;
  enunciado: string;
  tipo: "MULTIPLA_ESCOLHA" | "CERTO_ERRADO";
  options: ParsedQuestionOption[];
  gabarito: string | null; // ex: "A", "C", etc.
  explicacao?: string;
}

export interface ParsedExamData {
  titulo: string;
  banca: string;
  orgao?: string;
  cargo?: string;
  ano?: number;
  questoes: ParsedExamQuestion[];
}

export interface ParseExamPdfResult {
  success: boolean;
  error?: string;
  exam?: ParsedExamData;
}

/**
 * Disseca um arquivo PDF de prova de concurso via Gemini Multimodal
 */
export async function parseExamPdfAction(
  formData: FormData
): Promise<ParseExamPdfResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "Nenhum arquivo PDF fornecido." };
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return { success: false, error: "O arquivo precisa estar no formato PDF." };
    }

    // Limite razoável para processamento em memória (~25MB)
    if (file.size > 25 * 1024 * 1024) {
      return {
        success: false,
        error: "Arquivo muito grande. O limite máximo para análise de PDF é de 25MB.",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const prompt = `Você é o Perito Especialista em Bancas de Concurso Público e OCR da Synapse AI.
Analise detalhadamente este caderno de prova em PDF e extraia estruturadamente as informações e todas as questões de concurso presentes.

DIRETRIZES DE EXTRAÇÃO:
1. METADADOS:
   - Identifique a Banca Examinadora (ex: CEBRASPE, FGV, FCC, VUNESP, CESGRANRIO, etc.).
   - Órgão realizador (ex: TJ-SP, Receita Federal, PF, Banco do Brasil, etc.).
   - Cargo ou Especialidade (ex: Analista Judiciário, Auditor, etc.).
   - Ano da aplicação.
2. DISSECAÇÃO DAS QUESTÕES:
   - Extraia o número ordinal original da questão no caderno.
   - Extraia o enunciado completo, incluindo trechos motivadores essenciais.
   - Identifique a Matéria/Disciplina (ex: "Direito Constitucional", "Direito Administrativo", "Língua Portuguesa", "Tecnologia da Informação", "Raciocínio Lógico").
   - Identifique o tipo: MULTIPLA_ESCOLHA (com alternativas A, B, C, D, E) ou CERTO_ERRADO (Cebraspe).
   - Extraia cada alternativa com o identificador 'id' e o 'texto' correspondente.
   - Caso haja Gabarito Oficial ao final do PDF ou gabarito marcado, extraia a letra correspondente em 'gabarito' (ex: "A", "B", "C", "D", "E" ou "C", "E"). Se não constar gabarito expresso, deduza a alternativa correta com base no melhor direito/conhecimento consolidado.

Retorne OBRIGATORIAMENTE um JSON estrito correspondente ao schema fornecido.`;

    const contents = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ];

    const aiResponse = await generateContentWithFallback({
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titulo: { type: Type.STRING },
            banca: { type: Type.STRING },
            orgao: { type: Type.STRING },
            cargo: { type: Type.STRING },
            ano: { type: Type.INTEGER },
            questoes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  numero: { type: Type.INTEGER },
                  materia: { type: Type.STRING },
                  enunciado: { type: Type.STRING },
                  tipo: {
                    type: Type.STRING,
                    enum: ["MULTIPLA_ESCOLHA", "CERTO_ERRADO"],
                  },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        texto: { type: Type.STRING },
                      },
                      required: ["id", "texto"],
                    },
                  },
                  gabarito: { type: Type.STRING },
                  explicacao: { type: Type.STRING },
                },
                required: ["numero", "materia", "enunciado", "options", "gabarito"],
              },
            },
          },
          required: ["titulo", "banca", "questoes"],
        },
      },
      timeoutMs: 90000,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(aiResponse.text);
    } catch {
      return {
        success: false,
        error: "Falha ao interpretar a estrutura das questões extraídas da prova.",
      };
    }

    if (!parsed.questoes || !Array.isArray(parsed.questoes) || parsed.questoes.length === 0) {
      return {
        success: false,
        error: "Nenhuma questão objetiva foi identificada no PDF enviado. Verifique se o PDF contém páginas de prova nítidas.",
      };
    }

    // Normalização das questões
    const cleanedQuestions: ParsedExamQuestion[] = parsed.questoes.map((q: any, idx: number) => {
      let optionsList: ParsedQuestionOption[] = [];

      if (Array.isArray(q.options) && q.options.length > 0) {
        optionsList = q.options.map((opt: any, optIdx: number) => ({
          id: String(opt.id || String.fromCharCode(65 + optIdx)).trim().toUpperCase(),
          texto: String(opt.texto || "").trim(),
        }));
      } else if (q.tipo === "CERTO_ERRADO") {
        optionsList = [
          { id: "C", texto: "Certo" },
          { id: "E", texto: "Errado" },
        ];
      } else {
        optionsList = [
          { id: "A", texto: "Alternativa A" },
          { id: "B", texto: "Alternativa B" },
          { id: "C", texto: "Alternativa C" },
          { id: "D", texto: "Alternativa D" },
          { id: "E", texto: "Alternativa E" },
        ];
      }

      return {
        numero: q.numero || idx + 1,
        materia: q.materia || "Conhecimentos Gerais",
        enunciado: q.enunciado || "",
        tipo: q.tipo === "CERTO_ERRADO" ? "CERTO_ERRADO" : "MULTIPLA_ESCOLHA",
        options: optionsList,
        gabarito: q.gabarito ? String(q.gabarito).trim().toUpperCase() : optionsList[0]?.id || "A",
        explicacao: q.explicacao || undefined,
      };
    });

    const examData: ParsedExamData = {
      titulo: parsed.titulo || `${parsed.banca || "Concurso"} - ${parsed.cargo || "Prova Completa"}`,
      banca: parsed.banca || "Banca Oficial",
      orgao: parsed.orgao || undefined,
      cargo: parsed.cargo || undefined,
      ano: parsed.ano || new Date().getFullYear(),
      questoes: cleanedQuestions,
    };

    return {
      success: true,
      exam: examData,
    };
  } catch (err) {
    console.error("[parseExamPdfAction] Erro:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Erro inesperado ao processar o arquivo PDF da prova.",
    };
  }
}

/**
 * Salva a prova importada no banco de dados como um Simulado (Quiz) para ser resolvido
 */
export async function saveImportedExamToQuizAction(params: {
  exam: ParsedExamData;
}): Promise<{ success: boolean; error?: string; quizId?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const { exam } = params;

    // Converte as questões para o formato salvo no Quiz model
    const quizQuestionsPayload = exam.questoes.map((q) => ({
      id: `q_pdf_${q.numero}_${Date.now()}`,
      enunciado: q.enunciado,
      options: q.options,
      respostaCorreta: q.gabarito,
      explicacao: q.explicacao || `Gabarito oficial da banca ${exam.banca}: Alternativa ${q.gabarito}.`,
      materia: q.materia,
      banca: exam.banca,
      ano: exam.ano,
    }));

    const newQuiz = await prisma.quiz.create({
      data: {
        userId,
        banca: exam.banca,
        subject: exam.titulo,
        difficulty: "Intermediário",
        questions: quizQuestionsPayload as any,
      },
    });

    try {
      revalidatePath("/quiz");
      revalidatePath("/banco");
    } catch {}

    return {
      success: true,
      quizId: newQuiz.id,
    };
  } catch (err) {
    console.error("[saveImportedExamToQuizAction] Erro:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao salvar a prova no seu acervo.",
    };
  }
}
