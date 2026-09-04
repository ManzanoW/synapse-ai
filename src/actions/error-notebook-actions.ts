"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { Type } from "@google/genai";
import { trackQuestProgressAction } from "@/actions/quest-actions";
import {
  ErrorNotebookFilters,
  ErrorNotebookItem,
  ErrorNotebookMetrics,
  ErrorRemediationData,
  ErrorTaxonomyMetric,
  GenerateRemediationInput,
} from "@/types/quiz";
import { TAXONOMY_METADATA, normalizeTaxonomy } from "@/lib/error-taxonomy";

/**
 * Normaliza o texto de uma questão para comparação e deduplicação
 */
function normalizeQuestionKey(text: string | null | undefined): string {
  if (!text) return "";
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

// Lock em memória por userId para evitar condições de corrida (ex: chamadas simultâneas de getErrorMetrics e getErrorNotebookItems)
const syncLockMap = new Map<string, Promise<void>>();

/**
 * Sanitiza o banco de dados identificando e deletando registros duplicados em QuestionError
 * para um mesmo userId e questionText.
 * Preserva o registro mais qualificado (MASTERED > com remediação IA gerada > mais recente).
 */
export async function cleanupDuplicateQuestionErrors(userId: string): Promise<number> {
  try {
    const records = await prisma.questionError.findMany({
      where: { userId },
      select: {
        id: true,
        questionText: true,
        status: true,
        aiExplanation: true,
        mnemonic: true,
        drillQuestion: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (records.length <= 1) return 0;

    // Agrupa por questionText normalizado
    const groups = new Map<string, typeof records>();

    for (const r of records) {
      const key = normalizeQuestionKey(r.questionText);
      if (!key) continue;
      const list = groups.get(key);
      if (list) {
        list.push(r);
      } else {
        groups.set(key, [r]);
      }
    }

    const idsToDelete: string[] = [];

    for (const [, group] of groups) {
      if (group.length <= 1) continue;

      // Ordena o grupo elegendo o melhor registro para o índice 0
      group.sort((a, b) => {
        // Prioridade 1: Status MASTERED
        const aMastered = a.status === "MASTERED" ? 1 : 0;
        const bMastered = b.status === "MASTERED" ? 1 : 0;
        if (aMastered !== bMastered) return bMastered - aMastered;

        // Prioridade 2: Já possui análise ou remediação por IA gerada
        const aHasAi =
          a.aiExplanation || a.drillQuestion || a.mnemonic ? 1 : 0;
        const bHasAi =
          b.aiExplanation || b.drillQuestion || b.mnemonic ? 1 : 0;
        if (aHasAi !== bHasAi) return bHasAi - aHasAi;

        // Prioridade 3: Mais recente (updatedAt ou createdAt)
        const aTime = a.updatedAt?.getTime?.() || a.createdAt.getTime();
        const bTime = b.updatedAt?.getTime?.() || b.createdAt.getTime();
        return bTime - aTime;
      });

      // Mantém group[0] e marca os clones duplicados para exclusão
      for (let i = 1; i < group.length; i++) {
        idsToDelete.push(group[i].id);
      }
    }

    if (idsToDelete.length > 0) {
      await prisma.questionError.deleteMany({
        where: {
          id: { in: idsToDelete },
          userId,
        },
      });
      console.log(
        `[cleanupDuplicateQuestionErrors] Removidas ${idsToDelete.length} duplicatas de QuestionError para o usuário ${userId}`,
      );
    }

    return idsToDelete.length;
  } catch (err) {
    console.error("[cleanupDuplicateQuestionErrors] Erro ao limpar duplicatas:", err);
    return 0;
  }
}

/**
 * Action exposta para sanitização manual ou sob demanda de erros duplicados
 */
export async function cleanupDuplicateQuestionErrorsAction() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const deletedCount = await cleanupDuplicateQuestionErrors(userId);
    return { success: true, deletedCount };
  } catch (err) {
    console.error("[cleanupDuplicateQuestionErrorsAction] Erro:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao limpar erros duplicados.",
    };
  }
}

/**
 * Sincroniza retroativamente os erros encontrados nos quizzes já respondidos pelo usuário
 * se a tabela QuestionError ainda estiver zerada para ele.
 * Protegido por lock em memória por userId, sanitização prévia e checagem de unicidade.
 */
async function syncLegacyErrorsIfEmpty(userId: string) {
  // Se já houver sincronização em andamento para este userId, aguarda a mesma Promise
  const ongoing = syncLockMap.get(userId);
  if (ongoing) {
    return ongoing;
  }

  const promise = (async () => {
    try {
      // 1. Sanitização prévia de duplicatas residuais no banco
      await cleanupDuplicateQuestionErrors(userId);

      // 2. Busca questões já existentes no banco para este usuário
      const existingErrors = await prisma.questionError.findMany({
        where: { userId },
        select: { questionText: true },
      });

      // Se já existirem registros para o usuário, não é necessário importar histórico legado
      if (existingErrors.length > 0) {
        return;
      }

      const existingKeys = new Set(
        existingErrors.map((r) => normalizeQuestionKey(r.questionText)),
      );

      // 3. Busca quizzes anteriores salvos com questions JSON
      const quizzes = await prisma.quiz.findMany({
        where: { userId },
        take: 20,
        orderBy: { createdAt: "desc" },
      });

      const errorsToInsert: {
        userId: string;
        subjectId: string | null;
        topicId: string | null;
        quizId: string;
        questionText: string;
        options: any;
        userAnswer: string;
        correctAnswer: string;
        explanation: string | null;
        errorReason: string;
        status: string;
        createdAt: Date;
      }[] = [];

      const seenKeysInBatch = new Set<string>();

      for (const quiz of quizzes) {
        if (!Array.isArray(quiz.questions)) continue;

        for (const q of quiz.questions as any[]) {
          const isCorrect =
            q.isCorrect === true ||
            q.correct === true ||
            (q.userAnswer &&
              (q.gabaritoCorreto || q.correctAnswer) &&
              String(q.userAnswer).trim().toUpperCase() ===
                String(q.gabaritoCorreto || q.correctAnswer)
                  .trim()
                  .toUpperCase());

          if (isCorrect) continue;

          const userAns = String(q.userAnswer || "").trim();
          const correctAns = String(
            q.gabaritoCorreto || q.correctAnswer || q.answer || "A",
          ).trim();
          const enunciado = q.enunciado || q.question || q.questionText;

          if (!enunciado || typeof enunciado !== "string") continue;

          const key = normalizeQuestionKey(enunciado);
          if (!key || existingKeys.has(key) || seenKeysInBatch.has(key)) {
            continue;
          }
          seenKeysInBatch.add(key);

          const normalizedReason = normalizeTaxonomy(q.errorReason);

          errorsToInsert.push({
            userId,
            subjectId: q.subjectId || null,
            topicId: q.topicId || quiz.topicId || null,
            quizId: quiz.id,
            questionText: enunciado.trim(),
            options: q.alternativas || q.options || [],
            userAnswer: userAns || "Não informada",
            correctAnswer: correctAns,
            explanation: q.justificativa || q.explanation || null,
            errorReason: normalizedReason,
            status: "PENDING",
            createdAt: quiz.createdAt,
          });
        }
      }

      if (errorsToInsert.length > 0) {
        // Inserção em lote deduplicada
        await prisma.questionError.createMany({
          data: errorsToInsert,
        });
      }
    } catch (err) {
      console.error("[syncLegacyErrorsIfEmpty] Erro ao sincronizar legado:", err);
    } finally {
      syncLockMap.delete(userId);
    }
  })();

  syncLockMap.set(userId, promise);
  return promise;
}

/**
 * Lista os itens do Caderno de Erros com filtros dinâmicos
 */
export async function getErrorNotebookItemsAction(
  filters: ErrorNotebookFilters = {},
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // Auto-popula com histórico se vazio e sanitiza duplicatas
    await syncLegacyErrorsIfEmpty(userId);

    const where: any = { userId };

    if (filters.subjectId && filters.subjectId !== "ALL") {
      where.subjectId = filters.subjectId;
    }

    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters.errorReason && filters.errorReason !== "ALL") {
      const normalized = normalizeTaxonomy(filters.errorReason);
      where.errorReason = normalized;
    }

    if (filters.period && filters.period !== "all") {
      const now = new Date();
      let days = 7;
      if (filters.period === "30d") days = 30;
      if (filters.period === "90d") days = 90;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: startDate };
    }

    if (filters.search && filters.search.trim() !== "") {
      const term = filters.search.trim();
      where.OR = [
        { questionText: { contains: term, mode: "insensitive" } },
        { explanation: { contains: term, mode: "insensitive" } },
      ];
    }

    const records = await prisma.questionError.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        topic: {
          select: { id: true, title: true },
        },
      },
    });

    // Deduplicação na memória para garantir que nenhuma duplicata residual seja entregue à UI
    const grouped = new Map<string, (typeof records)[number]>();
    for (const r of records) {
      const key = normalizeQuestionKey(r.questionText);
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, r);
      } else {
        // Elege o registro com melhor qualidade
        const existingScore =
          (existing.status === "MASTERED" ? 10 : 0) +
          (existing.aiExplanation || existing.drillQuestion ? 5 : 0);
        const newScore =
          (r.status === "MASTERED" ? 10 : 0) +
          (r.aiExplanation || r.drillQuestion ? 5 : 0);
        if (newScore > existingScore) {
          grouped.set(key, r);
        }
      }
    }

    const deduplicatedRecords = Array.from(grouped.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const items: ErrorNotebookItem[] = deduplicatedRecords.map((r) => ({
      id: r.id,
      userId: r.userId,
      subjectId: r.subjectId,
      topicId: r.topicId,
      quizId: r.quizId,
      questionText: r.questionText,
      options: (r.options as any) || [],
      userAnswer: r.userAnswer,
      correctAnswer: r.correctAnswer,
      explanation: r.explanation,
      errorReason: r.errorReason,
      status: r.status as "PENDING" | "MASTERED",
      masteredAt: r.masteredAt,
      aiExplanation: r.aiExplanation,
      mnemonic: r.mnemonic,
      drillQuestion: (r.drillQuestion as any) || null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      subject: r.subject,
      topic: r.topic,
    }));

    return { success: true, data: items };
  } catch (err) {
    console.error("[getErrorNotebookItemsAction] Erro:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao listar caderno de erros.",
    };
  }
}

/**
 * Obtém métricas globais e distribuição taxonômica para o header
 */
export async function getErrorMetricsAction() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    await syncLegacyErrorsIfEmpty(userId);

    const allErrors = await prisma.questionError.findMany({
      where: { userId },
      select: {
        id: true,
        questionText: true,
        status: true,
        errorReason: true,
      },
    });

    // Deduplicação defensiva por questão única para métricas 100% alinhadas com a listagem
    const seenMetricsKeys = new Set<string>();
    const uniqueErrors = allErrors.filter((e) => {
      const key = normalizeQuestionKey(e.questionText);
      if (!key || seenMetricsKeys.has(key)) return false;
      seenMetricsKeys.add(key);
      return true;
    });

    const totalErrors = uniqueErrors.length;
    const pendingErrors = uniqueErrors.filter(
      (e) => e.status === "PENDING",
    ).length;
    const masteredErrors = uniqueErrors.filter(
      (e) => e.status === "MASTERED",
    ).length;
    const masteryRate =
      totalErrors > 0 ? Math.round((masteredErrors / totalErrors) * 100) : 0;

    // Contagem por taxonomia
    const counts: Record<string, number> = {
      CONTENT_GAP: 0,
      TRICK_QUESTION: 0,
      INTERPRETATION: 0,
      TIME_PRESSURE: 0,
      UNCLASSIFIED: 0,
    };

    uniqueErrors.forEach((e) => {
      const norm = normalizeTaxonomy(e.errorReason);
      counts[norm] = (counts[norm] || 0) + 1;
    });

    const taxonomyDistribution: ErrorTaxonomyMetric[] = Object.keys(
      TAXONOMY_METADATA,
    ).map((key) => {
      const count = counts[key] || 0;
      const meta = TAXONOMY_METADATA[key];
      return {
        reason: key,
        label: meta.label,
        count,
        percentage:
          totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0,
        color: meta.color,
      };
    });

    const metrics: ErrorNotebookMetrics = {
      totalErrors,
      pendingErrors,
      masteredErrors,
      masteryRate,
      taxonomyDistribution,
    };

    return { success: true, data: metrics };
  } catch (err) {
    console.error("[getErrorMetricsAction] Erro:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao calcular métricas de erros.",
    };
  }
}

/**
 * Marca um erro como "Superado / Dominado", integrando com missões diárias e XP
 */
export async function markErrorAsMasteredAction(
  errorId: string,
  solvedDrill: boolean = false,
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const updated = await prisma.questionError.update({
      where: { id: errorId, userId },
      data: {
        status: "MASTERED",
        masteredAt: new Date(),
      },
    });

    let earnedXp = 20;

    // Se acertou a questão de fixação sob demanda, premia com mais XP e avança missão diária
    if (solvedDrill) {
      earnedXp += 30;
      await trackQuestProgressAction("QUESTIONS_SOLVED", 1);
    }

    await prisma.userStats.upsert({
      where: { userId },
      create: {
        userId,
        totalXp: earnedXp,
        lastStudyDate: new Date(),
      },
      update: {
        totalXp: { increment: earnedXp },
        lastStudyDate: new Date(),
      },
    });

    try {
      revalidatePath("/notebook");
      revalidatePath("/questions");
    } catch {
      // Ignora erro fora de contexto HTTP
    }

    return {
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        earnedXp,
      },
    };
  } catch (err) {
    console.error("[markErrorAsMasteredAction] Erro:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao atualizar status do erro.",
    };
  }
}

/**
 * Reverte o status de um erro para PENDING para permitir novo treino
 */
export async function markErrorAsPendingAction(errorId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const updated = await prisma.questionError.update({
      where: { id: errorId, userId },
      data: {
        status: "PENDING",
        masteredAt: null,
      },
    });

    try {
      revalidatePath("/notebook");
      revalidatePath("/questions");
    } catch {}

    return { success: true, data: updated };
  } catch (err) {
    console.error("[markErrorAsPendingAction] Erro:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao reverter status.",
    };
  }
}

/**
 * Remove um item do caderno de erros
 */
export async function deleteErrorNotebookItemAction(errorId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    await prisma.questionError.delete({
      where: { id: errorId, userId },
    });

    try {
      revalidatePath("/notebook");
      revalidatePath("/questions");
    } catch {}

    return { success: true };
  } catch (err) {
    console.error("[deleteErrorNotebookItemAction] Erro:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao remover item.",
    };
  }
}

/**
 * Gera a micro-explicação, mnemônico e micro-questão de fixação via Gemini IA
 */
export async function generateErrorRemediationAction(
  input: GenerateRemediationInput,
): Promise<{ success: boolean; data?: ErrorRemediationData; error?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // 1. Se existir errorId, verifica se já foi gerado e salvo em cache no banco
    if (input.errorId) {
      const existing = await prisma.questionError.findUnique({
        where: { id: input.errorId, userId },
        select: {
          aiExplanation: true,
          mnemonic: true,
          drillQuestion: true,
        },
      });

      if (
        existing?.aiExplanation &&
        existing?.mnemonic &&
        existing?.drillQuestion
      ) {
        return {
          success: true,
          data: {
            microExplanation: existing.aiExplanation,
            mnemonicOrRule: existing.mnemonic,
            drillQuestion: existing.drillQuestion as any,
          },
        };
      }
    }

    const normalizedReason = normalizeTaxonomy(input.errorReason);
    const reasonMeta =
      TAXONOMY_METADATA[normalizedReason] || TAXONOMY_METADATA.UNCLASSIFIED;

    // 2. Monta o prompt especializado de tutoria ativa para concursos
    const prompt = `
Você é um Tutor Pedagógico Especialista em Aprendizado Ativo e Desarmamento de Pegadinhas em Concursos Públicos e Exames de Alto Desempenho.

O estudante errou a questão abaixo e o diagnóstico taxonômico apontou a causa-raiz: "${reasonMeta.label}" (${reasonMeta.desc}).

DETALHES DO ERRO:
- Matéria: ${input.subjectName || "Geral"}
- Tópico: ${input.topicTitle || "Geral"}
- Enunciado da Questão:
"${input.questionText}"

- Alternativa assinalada pelo aluno: "${input.userAnswer}"
- Gabarito oficial correto: "${input.correctAnswer}"
${input.explanation ? `- Justificativa original da banca: "${input.explanation}"` : ""}
- Causa-raiz diagnosticada: ${reasonMeta.label}

SUA MISSÃO:
1. "microExplanation": Produza uma explicação concisa, direta e pedagógica (máximo de 2 a 3 parágrafos curtos). Foque exatamente em DESARMAR a confusão mental, a pegadinha da banca ou a lacuna conceitual que levou o aluno a marcar a alternativa errada.
2. "mnemonicOrRule": Crie uma regra mnemônica elegante (acrônimo, rima, frase gatilho) ou uma regra prática infalível de apenas 1 a 2 linhas para que o estudante memorize o critério decisivo e nunca mais caia nesse erro.
3. "drillQuestion": Elabore uma MICRO-QUESTÃO INÉDITA (estilo concurso, nível equivalente) para fixação imediata do MESMO conceito ou regra. Deve conter:
   - "enunciado": O texto da questão inédita (curto e objetivo, sem pegadinhas inúteis).
   - "alternativas": Exatamente 4 alternativas (com ids "A", "B", "C", "D" e o texto de cada uma).
   - "gabaritoCorreto": Apenas a letra da alternativa correta ("A", "B", "C" ou "D").
   - "justificativa": Uma explicação sucinta (1 parágrafo) do porquê o gabarito é o correto.

Responda ESTRITAMENTE no formato JSON com os campos solicitados.
`;

    // 3. Executa com cascade fallback e structured output
    const result = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            microExplanation: { type: Type.STRING },
            mnemonicOrRule: { type: Type.STRING },
            drillQuestion: {
              type: Type.OBJECT,
              properties: {
                enunciado: { type: Type.STRING },
                alternativas: {
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
                gabaritoCorreto: { type: Type.STRING },
                justificativa: { type: Type.STRING },
              },
              required: [
                "enunciado",
                "alternativas",
                "gabaritoCorreto",
                "justificativa",
              ],
            },
          },
          required: ["microExplanation", "mnemonicOrRule", "drillQuestion"],
        },
      },
    });

    const parsed: ErrorRemediationData = JSON.parse(result.text);

    // Validação básica do retorno estruturado
    if (
      !parsed.microExplanation ||
      !parsed.mnemonicOrRule ||
      !parsed.drillQuestion?.enunciado ||
      !Array.isArray(parsed.drillQuestion?.alternativas)
    ) {
      throw new Error("Estrutura de dados retornada pela IA inválida.");
    }

    // 4. Salva em cache no banco se o errorId existir
    if (input.errorId) {
      await prisma.questionError.update({
        where: { id: input.errorId, userId },
        data: {
          aiExplanation: parsed.microExplanation,
          mnemonic: parsed.mnemonicOrRule,
          drillQuestion: parsed.drillQuestion as any,
        },
      });
    }

    return { success: true, data: parsed };
  } catch (err) {
    console.error("[generateErrorRemediationAction] Erro:", err);

    // Fallback resiliente pedagógico caso a API de IA esteja indisponível
    const fallbackData: ErrorRemediationData = {
      microExplanation: `Análise pedagógica de emergência: O gabarito oficial é "${input.correctAnswer}". A opção marcada pelo aluno ("${input.userAnswer}") colidiu com a restrição central do conceito cobrado. Sempre atente para conectivos restritivos e o comando do enunciado.`,
      mnemonicOrRule:
        "Dica de Fixação: Sublinhe palavras-chave restritivas no enunciado ('exceto', 'sempre', 'vedado') antes de julgar as alternativas.",
      drillQuestion: {
        enunciado: `[Questão de Fixação] Em relação aos fundamentos de ${input.subjectName || "estudo"}, qual postura garante a correta identificação de pegadinhas relacionadas a ${TAXONOMY_METADATA[normalizeTaxonomy(input.errorReason)]?.label || "atenção"}?`,
        alternativas: [
          {
            id: "A",
            texto:
              "Julgar as alternativas com pressa confiando exclusivamente na primeira impressão.",
          },
          {
            id: "B",
            texto:
              "Validar sistematicamente cada palavra restritiva da alternativa contra a regra central.",
          },
          {
            id: "C",
            texto:
              "Marcar a alternativa mais longa ignorando eventuais contradições conceituais.",
          },
          {
            id: "D",
            texto:
              "Ignorar o comando do enunciado e focar apenas nas palavras familiares.",
          },
        ],
        gabaritoCorreto: "B",
        justificativa:
          "A validação sistemática de cada termo restritivo assegura precisão absoluta e desmantela pegadinhas da banca.",
      },
    };

    return {
      success: true,
      data: fallbackData,
    };
  }
}

/**
 * Diagnostica automaticamente a causa-raiz taxonômica de questões não classificadas
 * via Gemini AI em lote com fallback heurístico.
 */
export async function autoClassifyPendingErrorsAction(): Promise<{
  success: boolean;
  classifiedCount?: number;
  message?: string;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // Busca registros onde a causa-raiz não está classificada
    const unclassifiedRecords = await prisma.questionError.findMany({
      where: {
        userId,
        OR: [
          { errorReason: "UNCLASSIFIED" },
          { errorReason: "NAO_CLASSIFICADO" },
          { errorReason: "" },
          { errorReason: "Geral" },
        ],
      },
      select: {
        id: true,
        questionText: true,
        userAnswer: true,
        correctAnswer: true,
        explanation: true,
      },
      take: 60,
    });

    if (unclassifiedRecords.length === 0) {
      return {
        success: true,
        classifiedCount: 0,
        message: "Todas as falhas pendentes já estão diagnosticadas.",
      };
    }

    const BATCH_SIZE = 15;
    let totalClassified = 0;

    for (let i = 0; i < unclassifiedRecords.length; i += BATCH_SIZE) {
      const batch = unclassifiedRecords.slice(i, i + BATCH_SIZE);

      const promptData = batch.map((item, idx) => ({
        index: idx + 1,
        id: item.id,
        enunciado: item.questionText.slice(0, 300),
        respostaMarcada: item.userAnswer,
        gabaritoOficial: item.correctAnswer,
        justificativa: (item.explanation || "").slice(0, 250),
      }));

      const prompt = `
Você é um Auditor e Pedagogo Especialista em Taxonomia de Erros em Concursos Públicos e Exames.
Analise cada uma das questões abaixo e infira a causa-raiz mais provável para o erro cometido pelo candidato.

Taxonomias permitidas (escolha exatamente uma por questão):
- CONTENT_GAP: Lacuna Teórica (desconhecimento da lei, doutrina, jurisprudência, teoria ou conceito técnico).
- TRICK_QUESTION: Falta de Atenção / Pegadinha (a banca usou distratores sutis, pegadinhas, palavras restritivas como "apenas/salvo/vedado" ou detalhes ardilosos).
- INTERPRETATION: Erro de Interpretação (o estudante compreendeu equivocadamente o comando da questão, contexto ou assertivas).
- TIME_PRESSURE: Pressão de Tempo (questão com cálculo longo ou texto excessivo sujeita a resolução precipitada).

Questões a diagnosticar:
${JSON.stringify(promptData, null, 2)}

Retorne um JSON com a lista de classificações contendo o id e a categoria taxonômica inferida ("errorReason").
`;

      let batchClassified = false;

      try {
        const result = await generateContentWithFallback({
          prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                classifications: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      errorReason: {
                        type: Type.STRING,
                        enum: [
                          "CONTENT_GAP",
                          "TRICK_QUESTION",
                          "INTERPRETATION",
                          "TIME_PRESSURE",
                        ],
                      },
                    },
                    required: ["id", "errorReason"],
                  },
                },
              },
              required: ["classifications"],
            },
          },
        });

        const parsed = JSON.parse(result.text);
        if (parsed.classifications && Array.isArray(parsed.classifications)) {
          for (const c of parsed.classifications) {
            const valid = normalizeTaxonomy(c.errorReason);
            if (valid !== "UNCLASSIFIED") {
              await prisma.questionError.update({
                where: { id: c.id, userId },
                data: { errorReason: valid },
              });
              totalClassified++;
            }
          }
          batchClassified = true;
        }
      } catch (geminiErr) {
        console.warn(
          "[autoClassifyPendingErrorsAction] Erro no Gemini, acionando heurística pedagógica:",
          geminiErr,
        );
      }

      // Fallback heurístico caso o Gemini não tenha retornado este batch
      if (!batchClassified) {
        for (const item of batch) {
          const combined = `${item.questionText} ${item.explanation || ""}`.toLowerCase();
          let inferred = "CONTENT_GAP";

          if (
            combined.includes("pegadinha") ||
            combined.includes("atenção") ||
            combined.includes("cuidado") ||
            combined.includes("exceto") ||
            combined.includes("distrator") ||
            combined.includes("vedado")
          ) {
            inferred = "TRICK_QUESTION";
          } else if (
            combined.includes("interpreta") ||
            combined.includes("infere") ||
            combined.includes("compreens") ||
            combined.includes("texto") ||
            combined.includes("conclui") ||
            combined.includes("sentido")
          ) {
            inferred = "INTERPRETATION";
          } else if (
            combined.includes("cálculo") ||
            combined.includes("tempo") ||
            combined.includes("pressa")
          ) {
            inferred = "TIME_PRESSURE";
          }

          await prisma.questionError.update({
            where: { id: item.id, userId },
            data: { errorReason: inferred },
          });
          totalClassified++;
        }
      }
    }

    try {
      revalidatePath("/notebook");
      revalidatePath("/questions");
    } catch {}

    return {
      success: true,
      classifiedCount: totalClassified,
    };
  } catch (err) {
    console.error("[autoClassifyPendingErrorsAction] Erro:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao classificar falhas pendentes.",
    };
  }
}
