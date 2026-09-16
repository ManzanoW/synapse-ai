"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { trackQuestProgressAction } from "@/actions/quest-actions";
import {
  invalidateUserCacheAction,
  recordStudyActivityAction,
} from "@/actions/gamification-actions";
import { calculateLevel, type LevelInfo } from "@/lib/gamification/gamification";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { Type } from "@google/genai";
import {
  calculateNextReview,
  normalizeGrade,
  ReviewGrade,
  EvaluationRating,
  NextReviewResult,
  calculateMemoryRetention,
  isLeechCard,
  classifyCardMaturity,
} from "@/lib/spaced-repetition";

export interface ReviewFlashcardInput {
  cardId: string;
  rating?: ReviewGrade | EvaluationRating | number | string;
  grade?: ReviewGrade | EvaluationRating | number | string;
  responseTimeMs?: number;
}

export interface ReviewFlashcardResponse {
  success: boolean;
  error?: string;
  data?: {
    cardId: string;
    nextReviewDate: Date;
    interval: number;
    easeFactor: number;
    stability: number;
    difficulty: number;
    repetitions: number;
    lapses: number;
    isCriticalSubjectDeficit: boolean;
    subjectRetentionFactor: number;
    earnedXp?: number;
    totalXp?: number;
    streakDays?: number;
    streakProtected?: boolean;
    levelInfo?: LevelInfo;
  };
}

/**
 * Server Action para processar a revisão ativa de um Flashcard
 * com algoritmo FSRS / SM-2 Otimizado e gamificação calibrada.
 */
export async function reviewFlashcardAction(
  input: ReviewFlashcardInput,
): Promise<ReviewFlashcardResponse> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    if (!input.cardId) {
      return { success: false, error: "ID do flashcard não informado." };
    }

    const rawRating = input.rating ?? input.grade ?? 3;
    const grade = normalizeGrade(rawRating);

    // 1. Busca o card e suas relações de Deck, Topic, Subject e histórico de questões
    const card = await prisma.flashcard.findUnique({
      where: { id: input.cardId },
      include: {
        deck: {
          include: {
            subject: {
              include: {
                topics: {
                  include: {
                    quizAttempts: {
                      select: {
                        totalCount: true,
                        correctCount: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        topic: {
          include: {
            subject: {
              include: {
                topics: {
                  include: {
                    quizAttempts: {
                      select: {
                        totalCount: true,
                        correctCount: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!card) {
      return { success: false, error: "Flashcard não encontrado." };
    }

    // 2. Calcula a taxa de acertos e retenção da matéria (Subject Domain)
    const subject = card.topic?.subject || card.deck?.subject;
    let subjectAccuracy: number | null = null;

    if (subject && subject.topics && subject.topics.length > 0) {
      let totalQuestions = 0;
      let totalCorrect = 0;

      for (const t of subject.topics) {
        if (t.quizAttempts && t.quizAttempts.length > 0) {
          for (const attempt of t.quizAttempts) {
            totalQuestions += attempt.totalCount;
            totalCorrect += attempt.correctCount;
          }
        }
      }

      if (totalQuestions > 0) {
        subjectAccuracy = (totalCorrect / totalQuestions) * 100;
      } else {
        // Fallback: média de aproveitamento anotado nos tópicos
        const scoredTopics = subject.topics.filter((t: any) => t.performance > 0);
        if (scoredTopics.length > 0) {
          subjectAccuracy =
            scoredTopics.reduce((sum: number, t: any) => sum + t.performance, 0) / scoredTopics.length;
        }
      }
    }

    // 3. Executa o algoritmo FSRS / SM-2 calibrado
    const srsResult: NextReviewResult = calculateNextReview({
      grade,
      repetitions: typeof card.repetitions === "number" ? card.repetitions : 0,
      previousInterval: typeof card.interval === "number" && card.interval > 0 ? card.interval : 1,
      stability: typeof card.stability === "number" && card.stability > 0 ? card.stability : 1.0,
      difficulty: typeof card.difficulty === "number" && card.difficulty >= 1 ? card.difficulty : 5.0,
      subjectAccuracy,
      responseTimeMs: input.responseTimeMs,
    });

    const currentLapses = typeof card.lapses === "number" ? card.lapses : 0;
    const nextLapses = grade === 1 ? currentLapses + 1 : currentLapses;

    // 4. Persiste no banco os novos valores do card
    const updatedCard = await prisma.flashcard.update({
      where: { id: card.id },
      data: {
        interval: srsResult.interval,
        easeFactor: srsResult.easeFactor,
        stability: srsResult.stability,
        difficulty: srsResult.difficulty,
        repetitions: srsResult.repetitions,
        lapses: nextLapses,
        nextReviewDate: srsResult.nextReviewDate,
        lastReviewed: new Date(),
      },
    });

    // 5. Se o card estiver associado a um Tópico do edital, sincroniza a data de revisão
    if (card.topicId) {
      await prisma.topic.update({
        where: { id: card.topicId },
        data: {
          lastRev: new Date(),
          nextRev: srsResult.nextReviewDate,
          firstStudy: "Concluido",
        },
      });

      // Registra no ReviewHistory
      await prisma.reviewHistory.create({
        data: {
          topicId: card.topicId,
          grade: String(grade),
          durationSeconds: input.responseTimeMs ? Math.round(input.responseTimeMs / 1000) : 30,
        },
      });
    }

    // 6. Gamificação: XP escalonado (+5 XP por revisão, +8 XP se acertado/grade >= 3) e Ofensiva
    const isCorrect = grade >= 3;
    const earnedXp = 5 + (isCorrect ? 8 : 0); // 5 XP se errou, 13 XP se acertou

    const activityResult = await recordStudyActivityAction(
      userId,
      earnedXp,
      "FLASHCARD",
    );

    // 8. Sincroniza com as missões diárias
    try {
      await trackQuestProgressAction("FLASHCARDS_REVIEWED", 1);
    } catch (questErr) {
      console.warn("Aviso ao atualizar missão diária de flashcards:", questErr);
    }

    try {
      await invalidateUserCacheAction(userId);
    } catch (cacheErr) {
      console.warn("Aviso ao invalidar cache do usuário:", cacheErr);
    }

    // 9. Revalida caches de páginas
    try {
      revalidatePath("/flashcards");
      revalidatePath("/flashcards/decks");
      if (card.deckId) {
        revalidatePath(`/flashcards/study/${card.deckId}`);
      }
    } catch {
      // Ignora erro fora de contexto de renderização
    }

    return {
      success: true,
      data: {
        cardId: updatedCard.id,
        nextReviewDate: updatedCard.nextReviewDate,
        interval: updatedCard.interval,
        easeFactor: updatedCard.easeFactor,
        stability: updatedCard.stability,
        difficulty: updatedCard.difficulty,
        repetitions: updatedCard.repetitions,
        lapses: updatedCard.lapses,
        isCriticalSubjectDeficit: srsResult.isSubjectCriticalDeficit,
        subjectRetentionFactor: srsResult.subjectRetentionFactor,
        earnedXp,
        totalXp: activityResult.data?.totalXp ?? 0,
        streakDays: activityResult.data?.streakDays ?? 0,
        streakProtected: activityResult.data?.streakProtected ?? false,
        levelInfo: calculateLevel(activityResult.data?.totalXp ?? 0),
      },
    };
  } catch (error) {
    console.error("Erro em reviewFlashcardAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao revisar flashcard.",
    };
  }
}

export interface FlashcardMnemonicResult {
  cardId: string;
  mnemonic: string;
  explanation: string;
  details: string;
}

/**
 * 🤖 Gera uma regra mnemônica via IA (Gemini) para desatar pontos cegos e cards difíceis (Leeches)
 */
export async function generateFlashcardMnemonicAction(
  cardId: string,
): Promise<{ success: boolean; data?: FlashcardMnemonicResult; error?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Não autorizado" };
    }

    const card = await prisma.flashcard.findFirst({
      where: {
        id: cardId,
        deck: { userId },
      },
      select: {
        id: true,
        question: true,
        answer: true,
        details: true,
        deckId: true,
      },
    });

    if (!card) {
      return { success: false, error: "Flashcard não encontrado." };
    }

    // Prompt pedagógico de alta memorização para concurseiros
    const prompt = `
Você é o NeuroMemory AI do Synapse AI, especialista em neurociência da aprendizagem e memorização acelerada para concursos públicos.

O concurseiro está enfrentando dificuldades de retenção para fixar o seguinte flashcard:
- Pergunta / Gatilho de Memória: "${card.question}"
- Resposta Correta: "${card.answer}"
${card.details ? `- Contexto / Detalhes atuais: "${card.details}"` : ""}

SUA MISSÃO:
1. "mnemonic": Crie uma regra mnemônica elegante, acrônimo infalível, rima marcante ou frase-gatilho de NO MÁXIMO 2 LINHAS para que o candidato nunca mais erre essa informação.
2. "explanation": Explicação sucinta de 1 linha sobre como associar o gatilho à resposta na hora da prova.

Responda ESTRITAMENTE em formato JSON com a estrutura solicitada.
`;

    const aiRes = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 1024,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mnemonic: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["mnemonic", "explanation"],
        },
      },
    });

    let mnemonic = "Gatilho mental: Relacione as palavras-chave do enunciado à resposta.";
    let explanation = "Fixe a conexão lógica entre os conceitos.";

    try {
      const text = aiRes.text || "{}";
      const parsed = JSON.parse(text);
      if (parsed.mnemonic) mnemonic = parsed.mnemonic.trim();
      if (parsed.explanation) explanation = parsed.explanation.trim();
    } catch {
      // Fallback
    }

    const newDetails = card.details
      ? `${card.details}\n\n💡 Mnemônico IA: ${mnemonic}`
      : `💡 Mnemônico IA: ${mnemonic}`;

    await prisma.flashcard.update({
      where: { id: cardId },
      data: { details: newDetails },
    });

    if (card.deckId) {
      revalidatePath(`/flashcards/study/${card.deckId}`);
    }
    revalidatePath("/flashcards");

    return {
      success: true,
      data: {
        cardId,
        mnemonic,
        explanation,
        details: newDetails,
      },
    };
  } catch (error) {
    console.error("Erro em generateFlashcardMnemonicAction:", error);
    return {
      success: false,
      error: "Falha ao gerar mnemônico inteligente.",
    };
  }
}

export interface FlashcardsAnalyticsData {
  totalCards: number;
  dueTodayCount: number;
  averageRetention: number; // % (0 a 100)
  streakDays: number;
  maturity: {
    newCount: number;
    learningCount: number;
    matureCount: number;
    leechCount: number;
  };
}

/**
 * 📊 Computa métricas globais e distribuição de maturidade FSRS dos flashcards do estudante
 */
export async function getFlashcardsAnalyticsAction(): Promise<{
  success: boolean;
  data?: FlashcardsAnalyticsData;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Não autorizado" };
    }

    const now = new Date();

    const [cards, userStats] = await Promise.all([
      prisma.flashcard.findMany({
        where: { deck: { userId } },
        select: {
          id: true,
          stability: true,
          repetitions: true,
          lapses: true,
          nextReviewDate: true,
          lastReviewed: true,
          interval: true,
        },
      }),
      prisma.userStats.findUnique({
        where: { userId },
        select: { streakDays: true },
      }),
    ]);

    const totalCards = cards.length;
    if (totalCards === 0) {
      return {
        success: true,
        data: {
          totalCards: 0,
          dueTodayCount: 0,
          averageRetention: 100,
          streakDays: userStats?.streakDays ?? 0,
          maturity: {
            newCount: 0,
            learningCount: 0,
            matureCount: 0,
            leechCount: 0,
          },
        },
      };
    }

    let sumRetention = 0;
    let dueTodayCount = 0;
    let newCount = 0;
    let learningCount = 0;
    let matureCount = 0;
    let leechCount = 0;

    for (const c of cards) {
      // 1. Retenção de memória FSRS individual
      const retention = calculateMemoryRetention(c.stability ?? 1.0, c.lastReviewed, now);
      sumRetention += retention;

      // 2. Vencimento
      if (!c.nextReviewDate || new Date(c.nextReviewDate) <= now) {
        dueTodayCount++;
      }

      // 3. Maturidade FSRS
      const stage = classifyCardMaturity(c.repetitions ?? 0, c.stability ?? 1.0);
      if (stage === "NEW") newCount++;
      else if (stage === "LEARNING") learningCount++;
      else matureCount++;

      // 4. Detecção de Leech
      if (isLeechCard(c.lapses ?? 0, c.repetitions ?? 0)) {
        leechCount++;
      }
    }

    const averageRetention = Math.round(sumRetention / totalCards);

    return {
      success: true,
      data: {
        totalCards,
        dueTodayCount,
        averageRetention,
        streakDays: userStats?.streakDays ?? 0,
        maturity: {
          newCount,
          learningCount,
          matureCount,
          leechCount,
        },
      },
    };
  } catch (error) {
    console.error("Erro em getFlashcardsAnalyticsAction:", error);
    return {
      success: false,
      error: "Falha ao calcular analytics FSRS dos flashcards.",
    };
  }
}

// ========================================================
// EXTRATOR TURBO DE FLASHCARDS POR IA (LEI SECA / RESUMOS)
// ========================================================

export interface ExtractTurboFlashcardsInput {
  rawText: string;
  targetCount?: number;
  mode?: "CLOZE_AND_CONCEPTS" | "LAW_EXCEPTIONS" | "DEADLINES_AND_NUMBERS";
  deckTitle?: string;
  deckId?: string;
  subjectId?: string;
  topicId?: string;
}

export interface ExtractTurboFlashcardsResult {
  deckId: string;
  deckTitle: string;
  cardsCount: number;
  cards: Array<{
    id: string;
    question: string;
    answer: string;
    details: string | null;
  }>;
}

export interface ExtractTurboFlashcardsResponse {
  success: boolean;
  data?: ExtractTurboFlashcardsResult;
  error?: string;
}

/**
 * Server Action que extrai flashcards de alto rendimento a partir de texto bruto,
 * artigos de lei ou anotações usando Gemini AI com formatação de Cloze Deletion e mnemônicos.
 */
export async function extractTurboFlashcardsAction(
  input: ExtractTurboFlashcardsInput
): Promise<ExtractTurboFlashcardsResponse> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const rawText = input.rawText?.trim();
    if (!rawText || rawText.length < 25) {
      return {
        success: false,
        error: "Insira ao menos 25 caracteres de conteúdo (lei, anotação ou resumo).",
      };
    }

    const count = Math.min(20, Math.max(3, input.targetCount || 10));
    const mode = input.mode || "CLOZE_AND_CONCEPTS";

    let modeInstruction = "";
    if (mode === "LAW_EXCEPTIONS") {
      modeInstruction =
        "FOCO PRINCIPAL: Exceções à regra geral, palavras perigosas de pegadinha ('salvo', 'exceto', 'vedado', 'não se aplica', 'dispensa vs inexigibilidade'). Formule perguntas que testem se o aluno cairia na pegadinha da banca.";
    } else if (mode === "DEADLINES_AND_NUMBERS") {
      modeInstruction =
        "FOCO PRINCIPAL: Prazos processuais/legais (dias úteis vs corridos), quóruns de votação, percentuais, idades e números explícitos da lei. Pergunta direta e resposta pontual com mnemônico para memorização.";
    } else {
      modeInstruction =
        "FOCO PRINCIPAL: Conceitos-chave de alta recorrência em concursos, combinando perguntas diretas com itens em formato Cloze Deletion '[...]' (onde o candidato precisa preencher a palavra crítica).";
    }

    const prompt = `Você é o maior especialista em Engenharia Pedagógica de Concursos Públicos do Brasil (Cebraspe, FGV, FCC, Vunesp).
Sua missão é ler o texto bruto fornecido pelo estudante e extrair exatamente ${count} Flashcards de Altíssimo Rendimento para fixação rápida na memória de longo prazo (algoritmo FSRS/Anki).

${modeInstruction}

DIRETRIZES TÉCNICAS OBRIGATÓRIAS:
1. Pergunta (question): Enxuta, instigante, clara. Use negrito ou lacunas '[...]' quando apropriado.
2. Resposta (answer): Objetiva, sem enrolação. Destaque o gabarito no início e a fundamentação legal curta.
3. Detalhes (details): Forneça um mnemônico rápido (ex: 'LIMPE', 'SOCIDIVAPLU', 'Bizú do Professor') ou a pegadinha clássica da banca sobre esse ponto.
4. Título do Baralho (deckTitle): Crie um título profissional e direto (ex: 'Art. 5º CF - Direitos Fundamentais', 'Lei 8.112 - Regime Disciplinar').

TEXTO BRUTO FORNECIDO:
"""
${rawText.slice(0, 12000)}
"""`;

    const aiRes = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.35,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  details: { type: Type.STRING },
                },
                required: ["question", "answer"],
              },
            },
          },
          required: ["deckTitle", "cards"],
        },
      },
    });

    if (!aiRes || !aiRes.text) {
      throw new Error("A IA não retornou resposta estruturada.");
    }

    const parsed = JSON.parse(aiRes.text) as {
      deckTitle: string;
      cards: Array<{ question: string; answer: string; details?: string }>;
    };

    if (!parsed.cards || parsed.cards.length === 0) {
      throw new Error("Nenhum card foi gerado a partir do texto.");
    }

    // Identifica ou cria o Deck no Prisma
    let targetDeckId = input.deckId;
    let finalTitle = input.deckTitle?.trim() || parsed.deckTitle || "Baralho Turbo IA";

    if (targetDeckId) {
      const existingDeck = await prisma.deck.findUnique({
        where: { id: targetDeckId },
      });
      if (existingDeck) {
        finalTitle = existingDeck.title;
      } else {
        targetDeckId = undefined;
      }
    }

    if (!targetDeckId) {
      const newDeck = await prisma.deck.create({
        data: {
          title: finalTitle,
          color: "bg-indigo-600",
          userId,
          subjectId: input.subjectId || null,
          topicId: input.topicId || null,
        },
      });
      targetDeckId = newDeck.id;
    }

    // Insere os flashcards no banco
    const createdCards = await prisma.$transaction(
      parsed.cards.map((c) =>
        prisma.flashcard.create({
          data: {
            deckId: targetDeckId!,
            question: c.question,
            answer: c.answer,
            details: c.details || null,
            topicId: input.topicId || null,
            stability: 1.0,
            difficulty: 5.0,
            easeFactor: 2.5,
            interval: 1,
            repetitions: 0,
            lapses: 0,
            nextReviewDate: new Date(),
          },
          select: {
            id: true,
            question: true,
            answer: true,
            details: true,
          },
        })
      )
    );

    revalidatePath("/flashcards");
    revalidatePath("/flashcards/decks");
    if (targetDeckId) {
      revalidatePath(`/flashcards/decks/${targetDeckId}`);
    }

    return {
      success: true,
      data: {
        deckId: targetDeckId,
        deckTitle: finalTitle,
        cardsCount: createdCards.length,
        cards: createdCards,
      },
    };
  } catch (error) {
    console.error("Erro em extractTurboFlashcardsAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Falha ao extrair flashcards por inteligência artificial.",
    };
  }
}

