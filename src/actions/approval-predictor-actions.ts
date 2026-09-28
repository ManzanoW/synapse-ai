"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface SubjectPredictorItem {
  id: string;
  name: string;
  color: string | null;
  weight: number;
  weightPercentage: number;
  totalQuestions: number;
  correctQuestions: number;
  accuracy: number;
  weightedScoreContrib: number;
  leverageScore: number;
}

export interface ApprovalPredictorData {
  subjects: SubjectPredictorItem[];
  totalWeight: number;
  currentWeightedScore: number;
  totalQuestionsAnswered: number;
  totalCorrectQuestions: number;
  totalTopics: number;
  completedTopics: number;
  coveragePercentage: number;
  topLeverageSubjects: Array<{
    id: string;
    name: string;
    color: string | null;
    weight: number;
    accuracy: number;
    gainPotentialPoints: number;
    recommendation: string;
  }>;
}

export async function getApprovalPredictorDataAction(
  userIdParam?: string,
): Promise<{ success: boolean; data?: ApprovalPredictorData; error?: string }> {
  try {
    const session = await auth();
    const userId = userIdParam || session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // Busca matérias, tópicos e tentativas de simulado
    const subjects = await prisma.subject.findMany({
      where: { userId },
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
    });

    if (!subjects || subjects.length === 0) {
      return {
        success: true,
        data: {
          subjects: [],
          totalWeight: 0,
          currentWeightedScore: 0,
          totalQuestionsAnswered: 0,
          totalCorrectQuestions: 0,
          totalTopics: 0,
          completedTopics: 0,
          coveragePercentage: 0,
          topLeverageSubjects: [],
        },
      };
    }

    // Soma total dos pesos do edital
    const totalWeight = subjects.reduce(
      (acc, s) => acc + Math.max(0.5, Number(s.weight ?? 1.0)),
      0,
    );

    let totalTopics = 0;
    let completedTopics = 0;
    let globalQuestionsAnswered = 0;
    let globalQuestionsCorrect = 0;

    const subjectItems: SubjectPredictorItem[] = subjects.map((subject) => {
      const weight = Math.max(0.5, Number(subject.weight ?? 1.0));
      const weightPercentage =
        totalWeight > 0 ? Number(((weight / totalWeight) * 100).toFixed(1)) : 0;

      let subTotal = 0;
      let subCorrect = 0;

      subject.topics.forEach((topic) => {
        totalTopics++;
        if (["Concluido", "Em Revisão"].includes(topic.firstStudy)) {
          completedTopics++;
        }

        topic.quizAttempts.forEach((attempt) => {
          subTotal += attempt.totalCount;
          subCorrect += attempt.correctCount;
        });
      });

      globalQuestionsAnswered += subTotal;
      globalQuestionsCorrect += subCorrect;

      // Se não tiver questões no quizAttempt, verifica se há performance salva nos tópicos
      let accuracy = 0;
      if (subTotal > 0) {
        accuracy = Math.round((subCorrect / subTotal) * 100);
      } else {
        const scoredTopics = subject.topics.filter((t) => t.performance > 0);
        if (scoredTopics.length > 0) {
          accuracy = Math.round(
            scoredTopics.reduce((sum, t) => sum + t.performance, 0) /
              scoredTopics.length,
          );
        }
      }

      // Contribuição líquida ponderada na nota do concurso: accuracy * (weight / totalWeight)
      const weightedScoreContrib =
        totalWeight > 0
          ? Number(((accuracy * weight) / totalWeight).toFixed(2))
          : 0;

      // Potencial de ganho total de pontos caso o aluno atinja 100% nesta matéria:
      // ((100 - accuracy) * weight) / totalWeight
      const leverageScore =
        totalWeight > 0
          ? Number((((100 - accuracy) * weight) / totalWeight).toFixed(2))
          : 0;

      return {
        id: subject.id,
        name: subject.name,
        color: subject.color || null,
        weight,
        weightPercentage,
        totalQuestions: subTotal,
        correctQuestions: subCorrect,
        accuracy,
        weightedScoreContrib,
        leverageScore,
      };
    });

    // Nota Ponderada Global Atual do Estudante
    const currentWeightedScore = Number(
      subjectItems
        .reduce((acc, curr) => acc + curr.weightedScoreContrib, 0)
        .toFixed(1),
    );

    const coveragePercentage =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // Identificação dos pontos de maior alavancagem (Caminho Crítico de Menor Esforço)
    // Ordena pelo potencial de ganho de pontos brutos
    const sortedByLeverage = [...subjectItems]
      .filter((s) => s.accuracy < 90) // Só alavanca matérias onde ainda há margem de melhoria
      .sort((a, b) => b.leverageScore - a.leverageScore)
      .slice(0, 3);

    const topLeverageSubjects = sortedByLeverage.map((item) => {
      // Quanto 10% a mais nesta matéria adiciona diretamente na nota final do concurso:
      const gainPotentialPoints = Number(
        ((10 * item.weight) / Math.max(1, totalWeight)).toFixed(1),
      );

      let recommendation = `Aumentar +10% nesta disciplina soma +${gainPotentialPoints} pts na sua nota final da prova!`;
      if (item.weight >= 6) {
        recommendation = `Disciplina de Peso Alto (${item.weight.toFixed(1)}). Cada acerto aqui vale o dobro das matérias básicas!`;
      } else if (item.accuracy < 50) {
        recommendation = `Zona de crescimento rápido. Subir de ${item.accuracy}% para 75% gerará um salto expressivo na classificação.`;
      }

      return {
        id: item.id,
        name: item.name,
        color: item.color,
        weight: item.weight,
        accuracy: item.accuracy,
        gainPotentialPoints,
        recommendation,
      };
    });

    return {
      success: true,
      data: {
        subjects: subjectItems,
        totalWeight,
        currentWeightedScore,
        totalQuestionsAnswered: globalQuestionsAnswered,
        totalCorrectQuestions: globalQuestionsCorrect,
        totalTopics,
        completedTopics,
        coveragePercentage,
        topLeverageSubjects,
      },
    };
  } catch (err) {
    console.error("[getApprovalPredictorDataAction] Erro:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao calcular dados do preditor de aprovação.",
    };
  }
}
