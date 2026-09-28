"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { checkAiQuota, consumeAiQuota } from "@/lib/ai-quota-service";
import { recordStudyActivityAction } from "@/actions/gamification-actions";

export interface ScannedAlternative {
  id: string;
  texto: string;
}

export interface ScannedQuestionResult {
  enunciado: string;
  formato: "MULTIPLA_ESCOLHA" | "CERTO_ERRADO";
  alternativas: ScannedAlternative[];
  disciplina: string;
  assunto: string;
  bancaSugerida?: string;
  anoSugerido?: string;
  gabaritoCorreto: string;
  justificativa: string;
  pegadinhaBanca: string;
  flashcardFrente: string;
  flashcardVerso: string;
}

export interface ScanQuestionResponse {
  success: boolean;
  data?: ScannedQuestionResult;
  error?: string;
  quotaExceeded?: boolean;
}

/**
 * Analisa uma imagem de questão (apostila, livro, PDF, caderno) com Visão Computacional Gemini
 * e retorna enunciado, alternativas, gabarito, justificativa e pegadinha da banca.
 */
export async function scanQuestionFromImageAction(
  formData: FormData,
): Promise<ScanQuestionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;

    // 1. Verificação de cota de IA
    const quotaCheck = await checkAiQuota(userId, "OCR_QUESTION");
    if (!quotaCheck.allowed) {
      return {
        success: false,
        error:
          quotaCheck.message ||
          "Você atingiu o limite de digitalizações de questões com IA de hoje.",
        quotaExceeded: true,
      };
    }

    // 2. Extração do arquivo de imagem
    const file = formData.get("image") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "Nenhuma imagem foi enviada." };
    }

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      return {
        success: false,
        error: "Formato de arquivo inválido. Envie uma foto ou print (JPEG, PNG, WEBP).",
      };
    }

    // Limite de segurança: 12MB
    if (file.size > 12 * 1024 * 1024) {
      return {
        success: false,
        error: "A imagem selecionada é muito pesada (máximo 12MB).",
      };
    }

    // Converte para Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const prompt = `Você é o mais experiente examinador e professor de concursos públicos do Brasil, especialista em análise multimodal de questões de provas e apostilas físicas.

Analise com atenção a imagem enviada (que pode ser uma foto de apostila, livro de questões, caderno de erros, folha de prova ou captura de tela).

Siga rigorosamente estas instruções:
1. Transcreva com fidelidade e sem supressões o ENUNCIADO COMPLETO da questão. Se houver caso hipotético, texto motivador, contextualização fática ou tabela, inclua tudo no enunciado.
2. Identifique o formato da questão:
   - "MULTIPLA_ESCOLHA" se houver alternativas (A, B, C, D, E ou A, B, C, D).
   - "CERTO_ERRADO" se for questão estilo Cebraspe / Certo ou Errado.
3. Extraia e estruture todas as ALTERNATIVAS exatamente como estão no texto:
   - Se Múltipla Escolha: [ { "id": "A", "texto": "..." }, { "id": "B", "texto": "..." }, ... ]
   - Se Certo/Errado: [ { "id": "C", "texto": "Certo" }, { "id": "E", "texto": "Errado" } ]
4. Infira a DISCIPLINA (ex: Direito Constitucional, Direito Administrativo, Língua Portuguesa, Raciocínio Lógico, Direito Penal, Direito Processual Penal, etc.) e o ASSUNTO específico (ex: "Atos Administrativos - Atributos", "Controle de Constitucionalidade", "Crase").
5. Identifique se na imagem consta a BANCA (ex: Cebraspe, FGV, FCC, Vunesp, Cesgranrio) e o ANO da prova. Se não constar, infira qual banca típica costuma formular nesse estilo.
6. Determine com 100% de precisão e segurança jurídica/técnica o GABARITO CORRETO:
   - "A", "B", "C", "D" ou "E" para Múltipla Escolha.
   - "C" ou "E" para Certo ou Errado.
7. Elabore uma JUSTIFICATIVA FUNDAMENTADA e didática:
   - Cite artigos de lei exatos (ex: Art. 37 da CF/88, Art. 14 do CP, Lei 8.112/90, etc.), súmulas de tribunais (STF/STJ) ou conceitos doutrinários consolidados.
   - Explique por que a alternativa correta está certa e, resumidamente, por que os principais distratores estão errados.
8. Destaque a PEGADINHA DA BANCA ("pegadinhaBanca"):
   - Revele o ponto exato onde a banca tenta induzir o candidato ao erro (ex: troca de "pode" por "deve", inversão de competência, exceção jurisprudencial, falsa sinonímia).
9. Gere um par de FLASHCARD de repetição espaçada (FSRS) de alta retenção:
   - "flashcardFrente": Pergunta direta sobre o ponto nevrálgico da questão.
   - "flashcardVerso": Resposta objetiva com mnemônico ou gatilho mental de memorização rápida.

Retorne EXCLUSIVAMENTE um objeto JSON estrito com esta estrutura:
{
  "enunciado": "Texto integral e limpo do enunciado",
  "formato": "MULTIPLA_ESCOLHA",
  "alternativas": [
    { "id": "A", "texto": "texto da alternativa A" },
    { "id": "B", "texto": "texto da alternativa B" },
    { "id": "C", "texto": "texto da alternativa C" },
    { "id": "D", "texto": "texto da alternativa D" },
    { "id": "E", "texto": "texto da alternativa E" }
  ],
  "disciplina": "Nome da Matéria",
  "assunto": "Tópico Específico",
  "bancaSugerida": "Nome da Banca",
  "anoSugerido": "2024",
  "gabaritoCorreto": "B",
  "justificativa": "Fundamentação jurídica e legal detalhada",
  "pegadinhaBanca": "Alerta de armadilha comum dos examinadores",
  "flashcardFrente": "Pergunta ativa para flashcard",
  "flashcardVerso": "Resposta objetiva com mnemônico"
}`;

    const response = await generateContentWithFallback({
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: file.type || "image/jpeg",
            data: base64Data,
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1, // Precisão factual estrita
      },
      preferredModels: [
        "gemini-2.5-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash",
        "gemini-2.5-pro",
      ],
    });

    if (!response || !response.text) {
      return {
        success: false,
        error: "A IA não conseguiu interpretar o texto da imagem. Tente uma foto mais nítida ou mais próxima.",
      };
    }

    let rawText = response.text.trim();
    if (rawText.startsWith("```json")) {
      rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();
    }

    let parsedResult: ScannedQuestionResult;
    try {
      parsedResult = JSON.parse(rawText);
    } catch {
      return {
        success: false,
        error: "Falha ao estruturar os dados da questão digitalizada. Tente novamente com melhor iluminação.",
      };
    }

    // Validação básica do resultado retornado
    if (!parsedResult.enunciado || !parsedResult.gabaritoCorreto) {
      return {
        success: false,
        error: "Não foi possível identificar o enunciado ou gabarito da questão. Verifique a foto.",
      };
    }

    // Garante que alternativas tenham id e texto válidos
    if (!Array.isArray(parsedResult.alternativas) || parsedResult.alternativas.length === 0) {
      if (parsedResult.formato === "CERTO_ERRADO") {
        parsedResult.alternativas = [
          { id: "C", texto: "Certo" },
          { id: "E", texto: "Errado" },
        ];
      }
    }

    // 3. Consome a cota com sucesso
    await consumeAiQuota(userId, "OCR_QUESTION");

    // 4. Registra atividade de gamificação (+25 XP por digitalização de estudo)
    await recordStudyActivityAction(userId, 25, "QUIZ", 1).catch(() => null);

    return {
      success: true,
      data: parsedResult,
    };
  } catch (error) {
    console.error("[OCR Question Action Error]:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao digitalizar questão com IA.",
    };
  }
}

/**
 * Salva uma questão digitalizada diretamente no Caderno de Erros do usuário
 */
export async function saveScannedQuestionToNotebookAction(input: {
  questionText: string;
  options?: ScannedAlternative[];
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  aiExplanation?: string;
  mnemonic?: string;
  disciplina?: string;
  assunto?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;

    // Busca ou cria a disciplina se o nome foi fornecido
    let subjectId: string | undefined = undefined;
    let topicId: string | undefined = undefined;

    if (input.disciplina) {
      const existingSubject = await prisma.subject.findFirst({
        where: {
          userId,
          name: { equals: input.disciplina, mode: "insensitive" },
        },
      });

      if (existingSubject) {
        subjectId = existingSubject.id;
        if (input.assunto) {
          const existingTopic = await prisma.topic.findFirst({
            where: {
              subjectId: existingSubject.id,
              title: { equals: input.assunto, mode: "insensitive" },
            },
          });
          if (existingTopic) {
            topicId = existingTopic.id;
          }
        }
      }
    }

    const createdError = await prisma.questionError.create({
      data: {
        userId,
        subjectId: subjectId || null,
        topicId: topicId || null,
        questionText: input.questionText,
        options: (input.options || []) as any,
        userAnswer: input.userAnswer,
        correctAnswer: input.correctAnswer,
        explanation: input.explanation,
        aiExplanation: input.aiExplanation || input.explanation,
        mnemonic: input.mnemonic || null,
        errorReason: "CONTENT_GAP",
        status: "PENDING",
      },
      select: { id: true },
    });

    revalidatePath("/notebook");
    revalidatePath("/questions");

    return { success: true, id: createdError.id };
  } catch (error) {
    console.error("[Save Scanned Question Error]:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao salvar no caderno de erros.",
    };
  }
}

/**
 * Cria um flashcard FSRS diretamente a partir da questão digitalizada
 */
export async function saveScannedQuestionToFlashcardAction(input: {
  front: string;
  back: string;
  details?: string;
  deckName?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const targetDeckName = input.deckName || "Questões Escaneadas (OCR)";

    // Busca deck existente ou cria um novo
    let deck = await prisma.deck.findFirst({
      where: {
        userId,
        title: { equals: targetDeckName, mode: "insensitive" },
      },
    });

    if (!deck) {
      deck = await prisma.deck.create({
        data: {
          userId,
          title: targetDeckName,
          color: "#8b5cf6",
        },
      });
    }

    const flashcard = await prisma.flashcard.create({
      data: {
        deckId: deck.id,
        question: input.front,
        answer: input.back,
        details: input.details || null,
        stability: 1.0,
        difficulty: 5.0,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        lapses: 0,
        nextReviewDate: new Date(),
      },
      select: { id: true },
    });

    revalidatePath("/flashcards");

    return { success: true, id: flashcard.id };
  } catch (error) {
    console.error("[Save Scanned Flashcard Error]:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao salvar flashcard.",
    };
  }
}
