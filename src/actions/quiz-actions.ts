"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  invalidateUserCacheAction,
  recordStudyActivityAction,
} from "@/actions/gamification-actions";
import { trackQuestProgressAction } from "@/actions/quest-actions";
import { revalidatePath } from "next/cache";
import { SubmitQuizAttemptInput, SubjectDomainMetric, MentorGuidance } from "@/types/quiz";
import { generateContentWithFallback } from "@/lib/gemini-fallback";

export async function submitQuizAttemptAction(input: SubmitQuizAttemptInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // Garante que haja um topicId válido (busca o primeiro tópico disponível caso não informado)
    let targetTopicId = input.topicId;

    if (!targetTopicId) {
      const fallbackTopic = await prisma.topic.findFirst({
        where: input.subjectId
          ? { subjectId: input.subjectId, subject: { userId } }
          : { subject: { userId } },
        select: { id: true },
      });
      targetTopicId = fallbackTopic?.id;
    }

    if (!targetTopicId) {
      return {
        success: false,
        error:
          "Nenhum tópico cadastrado no edital para vincular a esta tentativa.",
      };
    }

    const accuracyPercentage = Math.round(
      (input.correctAnswers / Math.max(1, input.totalQuestions)) * 100,
    );

    // XP Base: 20 XP por acerto + bônus de 50 XP para precisão >= 80%
    const baseEarnedXp = input.correctAnswers * 20;
    const accuracyBonusXp = accuracyPercentage >= 80 ? 50 : 0;

    // Bônus de Prova Real / Simulado Cronometrado
    let timedBonusXp = 0;
    const completedWithinTime = input.totalAllocatedSeconds
      ? input.timeSpentSeconds <= input.totalAllocatedSeconds + 5
      : true;

    if (input.isTimedSimulation && completedWithinTime) {
      if (accuracyPercentage >= 80) {
        timedBonusXp = 100; // Alta performance sob pressão
      } else if (accuracyPercentage >= 70) {
        timedBonusXp = 75;  // Rendimento consistente dentro do tempo
      } else if (accuracyPercentage >= 50) {
        timedBonusXp = 40;  // Gestão de tempo completada com êxito
      }
    }

    const earnedXp = baseEarnedXp + accuracyBonusXp + timedBonusXp;

    // 1. Grava a tentativa no banco
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        topicId: targetTopicId,
        totalCount: input.totalQuestions,
        correctCount: input.correctAnswers,
      },
    });

    // 1.1 Atualiza XP, streak e proteção anti-frustração via motor centralizado
    const activityResult = await recordStudyActivityAction(
      userId,
      earnedXp,
      "QUIZ",
    );

    // 2. Atualiza a performance e última data no tópico
    await prisma.topic.update({
      where: { id: targetTopicId },
      data: {
        performance: accuracyPercentage,
        lastQuizAt: new Date(),
      },
    });

    // 3. Atualiza progresso das Missões Diárias
    await trackQuestProgressAction("QUESTIONS_SOLVED", input.totalQuestions);

    // 3.1 📓 Registra os erros das respostas no Caderno de Erros (se detalhadas)
    if (Array.isArray(input.answers)) {
      const incorrectAnswers = input.answers.filter(
        (a) => !a.isCorrect && Boolean(a.questionText)
      );

      const fallbackErrorReason =
        input.isTimedSimulation && !completedWithinTime
          ? "TIME_PRESSURE"
          : "UNCLASSIFIED";

      for (const item of incorrectAnswers) {
        const errorReasonToSave =
          item.errorReason && item.errorReason !== "UNCLASSIFIED"
            ? String(item.errorReason)
            : fallbackErrorReason;

        await prisma.questionError
          .create({
            data: {
              userId,
              subjectId: item.subjectId || input.subjectId || null,
              topicId: item.topicId || targetTopicId || null,
              questionText: item.questionText!,
              options: (item.options as any) || [],
              userAnswer: String(item.selectedOption || "Não informada"),
              correctAnswer: String(item.correctAnswer || "A"),
              explanation: item.explanation || null,
              errorReason: errorReasonToSave,
              status: "PENDING",
            },
          })
          .catch((e: unknown) =>
            console.warn("Erro ao registrar questionError em submitQuizAttemptAction:", e)
          );
      }
    }

    // 4. Revalida caches e rotas
    await invalidateUserCacheAction(userId);
    try {
      revalidatePath("/achievements");
      revalidatePath("/notebook");
      revalidatePath("/performance");
    } catch {
      // Ignora erro fora de contexto HTTP
    }

    return {
      success: true,
      data: {
        attemptId: attempt.id,
        accuracyPercentage,
        earnedXp,
        baseEarnedXp,
        accuracyBonusXp,
        timedBonusXp,
        completedWithinTime,
        totalXp: activityResult.data?.totalXp,
        streakDays: activityResult.data?.streakDays,
        streakProtected: activityResult.data?.streakProtected,
        levelInfo: activityResult.data?.levelInfo,
      },
    };
  } catch (err) {
    console.error("Erro em submitQuizAttemptAction:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao registrar tentativa do simulado.",
    };
  }
}

export async function getSubjectDomainStatsAction(userIdParam?: string) {
  try {
    const session = await auth();
    const userId = userIdParam || session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        topics: {
          include: {
            quizAttempts: true,
          },
        },
      },
    });

    const metrics: SubjectDomainMetric[] = subjects.map((subject: any) => {
      let totalQuestions = 0;
      let totalCorrect = 0;

      subject.topics.forEach((topic: any) => {
        topic.quizAttempts.forEach((attempt: any) => {
          totalQuestions += attempt.totalCount;
          totalCorrect += attempt.correctCount;
        });
      });

      const domainPercentage =
        totalQuestions > 0
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : 0;

      const rawWeight = Number(
        subject.weight ??
          (subject.priority && subject.priority <= 10 ? subject.priority : 5.0),
      );
      const safeWeight = Math.max(1, Math.min(10, isNaN(rawWeight) ? 5.0 : rawWeight));

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        color: subject.color,
        totalAnswered: totalQuestions,
        correctCount: totalCorrect,
        domainPercentage,
        weight: safeWeight,
      };
    });

    return { success: true, data: metrics };
  } catch (err) {
    console.error("Erro em getSubjectDomainStatsAction:", err);
    return {
      success: false,
      error: "Falha ao calcular métricas de domínio.",
    };
  }
}

/**
 * Busca todos os simulados/cadernos salvos estritamente pertencentes ao usuário logado
 */
export async function getSavedQuizzesAction() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const quizzes = await prisma.quiz.findMany({
      where: { userId },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: quizzes };
  } catch (err) {
    console.error("Erro em getSavedQuizzesAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao carregar simulados salvos.",
    };
  }
}

/**
 * Obtém um simulado específico pelo ID, garantindo que pertença ao usuário logado
 */
export async function getSavedQuizByIdAction(quizId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId,
      },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!quiz) {
      return {
        success: false,
        error: "Simulado não encontrado ou não pertence a este usuário.",
      };
    }

    return { success: true, data: quiz };
  } catch (err) {
    console.error("Erro em getSavedQuizByIdAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao buscar simulado.",
    };
  }
}

/**
 * Exclui um simulado salvo garantindo validação estrita de posse pelo userId
 */
export async function deleteSavedQuizAction(quizId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const deleted = await prisma.quiz.deleteMany({
      where: {
        id: quizId,
        userId,
      },
    });

    if (deleted.count === 0) {
      return {
        success: false,
        error: "Simulado não encontrado ou sem permissão para exclusão.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Erro em deleteSavedQuizAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao excluir simulado.",
    };
  }
}

export interface DeepenExplanationInput {
  enunciado: string;
  alternativas?: { id: string; texto: string }[];
  gabaritoCorreto: string;
  selectedAnswer?: string;
  justificativaOriginal?: string;
  banca?: string;
  subject?: string;
}

export interface DeepenExplanationResult {
  overview: string;
  alternativesAnalysis: {
    letter: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  legalBasis?: string;
  mnemonicTip?: string;
}

/**
 * Aprofunda a explicação pedagógica e jurídica de uma questão via IA sob demanda
 */
export async function deepenExplanationAction(input: DeepenExplanationInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const {
      enunciado,
      alternativas = [],
      gabaritoCorreto,
      selectedAnswer,
      justificativaOriginal = "",
      banca = "Geral",
      subject = "Conhecimentos Gerais",
    } = input;

    const altsFormatted = alternativas.length > 0
      ? alternativas.map((a) => `${a.id}) ${a.texto}`).join("\n")
      : "Opções: Certo / Errado";

    const prompt = `Você é o tutor cognitivo de elite do Synapse AI para concursos públicos e exames de alto rendimento.
O candidato solicitou um Aprofundamento Explicativo Detalhado para a seguinte questão:

[CONTEXTO]
Banca: ${banca}
Disciplina: ${subject}
Resposta do candidato: ${selectedAnswer || "Não respondeu ainda"}
Gabarito Oficial: ${gabaritoCorreto}

[ENUNCIADO]
${enunciado}

[ALTERNATIVAS]
${altsFormatted}

[JUSTIFICATIVA BASE DISPONÍVEL]
${justificativaOriginal}

[SUA TAREFA]
Retorne um JSON estrito contendo uma dissecação completa e pedagógica da questão, no seguinte formato exato:
{
  "overview": "Visão geral estratégica de alto nível sobre o tema cobrado, o raciocínio central que o examinador da banca exigiu e o cerne da controvérsia.",
  "alternativesAnalysis": [
    {
      "letter": "Identificador da alternativa (ex: A, B, C, Certo ou Errado)",
      "isCorrect": true ou false,
      "explanation": "Por que esta alternativa está correta ou incorreta, detalhando a pegadinha ou a regra violada."
    }
  ],
  "legalBasis": "Fundamento legal, constitucional, doutrinário, jurisprudencial ou regra normativa exata que fundamenta o tema.",
  "mnemonicTip": "Mnemônico prático, regra de ouro ou gatilho mental para o candidato memorizar e nunca mais cair nessa pegadinha."
}
Responda APENAS com o JSON válido sem blocos markdown adicionais.`;

    const aiRes = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    let parsed: DeepenExplanationResult;
    try {
      const cleaned = aiRes.text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        overview: aiRes.text,
        alternativesAnalysis: [],
        legalBasis: "Fundamentação extraída via análise neural.",
        mnemonicTip: "Revise com atenção as palavras restritivas do comando da questão.",
      };
    }

    return {
      success: true,
      data: parsed,
    };
  } catch (err) {
    console.error("Erro em deepenExplanationAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao aprofundar explicação com IA.",
    };
  }
}

export interface GetMentorGuidanceInput {
  enunciado: string;
  alternativas?: Array<{ id: string; texto: string }>;
  gabaritoCorreto?: string;
  justificativa?: string;
  banca?: string;
  subject?: string;
}

export async function getQuestionMentorGuidanceAction(input: GetMentorGuidanceInput): Promise<{
  success: boolean;
  data?: MentorGuidance;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const {
      enunciado,
      alternativas = [],
      gabaritoCorreto = "",
      justificativa = "",
      banca = "Geral",
      subject = "Conhecimentos Gerais",
    } = input;

    const altsFormatted = alternativas.length > 0
      ? alternativas.map((a) => `${a.id}) ${a.texto}`).join("\n")
      : "Formato: Certo / Errado";

    const prompt = `Você é o Copilot Mentor IA do Synapse AI, um tutor socrático de elite para estudantes e concurseiros de alta performance.
Analise a seguinte questão de prova e produza orientações de raciocínio pedagógico:

[CONTEXTO]
Banca: ${banca}
Disciplina: ${subject}
Gabarito Oficial: ${gabaritoCorreto || "Não revelado"}

[ENUNCIADO]
${enunciado}

[ALTERNATIVAS]
${altsFormatted}

[JUSTIFICATIVA BASE]
${justificativa || "Sem justificativa prévia"}

[SUA TAREFA]
Retorne um JSON estrito contendo os 4 pilares do Mentor IA:
{
  "socraticHint": "Dica socrática cirúrgica (1 a 2 frases) orientando o candidato a pensar e raciocinar por conta própria SEM dar o gabarito ou a letra da resposta de bandeja. Aponte para onde olhar no enunciado ou qual princípio jurídico/lógico aplicar.",
  "simplifiedLaw": "Tradução do conceito ou texto de lei/norma jurídica em linguagem ultra simples e acessível, com uma analogia visual do cotidiano prático que qualquer pessoa entende.",
  "mnemonic": "Um mnemônico memorável, acrônimo, rima ou trocadilho inteligente para fixar essa matéria ou pegadinha na memória de longo prazo.",
  "trapWarning": "Alerta da pegadinha clássica da banca ${banca}: o que a banca costuma inverter, omitir ou confundir nesta matéria para derrubar o estudante."
}
Responda APENAS com o JSON válido sem blocos markdown adicionais.`;

    const aiRes = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    let parsed: MentorGuidance;
    try {
      const cleaned = aiRes.text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        socraticHint: "Analise o comando central da questão e identifique quais elementos qualificam ou restringem a regra geral.",
        simplifiedLaw: "Pense nesta regra como uma chave de segurança: quando a condição se cumpre, o procedimento é obrigatório; se houver exceção, ela deve estar expressa.",
        mnemonic: "Lembre-se da regra de ouro: quem qualifica o ato determina a competência!",
        trapWarning: `A banca ${banca} frequentemente substitui termos como 'sempre' por 'salvo exceção legal' para induzir o candidato desatento ao erro.`,
      };
    }

    return {
      success: true,
      data: parsed,
    };
  } catch (err) {
    console.error("Erro em getQuestionMentorGuidanceAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao consultar o Copilot Mentor IA.",
    };
  }
}


