"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek } from "date-fns";

export interface ApprovalOddsData {
  overallOdds: number; // 0 a 100
  status: "FASE_INICIAL" | "EM_CONSTRUCAO" | "COMPETITIVO" | "ZONA_DE_APROVACAO";
  statusLabel: string;
  statusDescription: string;
  hasEnoughData: boolean;
  pillars: {
    coverage: {
      score: number; // 0 a 100%
      completedTopics: number;
      totalTopics: number;
      weightPercentage: 40;
    };
    domain: {
      score: number; // 0 a 100%
      totalQuestions: number;
      correctQuestions: number;
      weightPercentage: 40;
    };
    constancy: {
      score: number; // 0 a 100%
      streakDays: number;
      weeklyMinutes: number;
      weeklyTargetMinutes: number;
      weightPercentage: 20;
    };
  };
}

export async function getApprovalOddsAction(
  userIdParam?: string,
): Promise<{ success: boolean; data?: ApprovalOddsData; error?: string }> {
  try {
    const session = await auth();
    const userId = userIdParam || session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // 1. Busca matérias, tópicos e tentativas de simulado
    const [subjects, user, weeklySessions] = await Promise.all([
      prisma.subject.findMany({
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
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          weeklyGoalHours: true,
          userStats: {
            select: {
              streakDays: true,
            },
          },
        },
      }),
      prisma.studySession.findMany({
        where: {
          userId,
          date: { gte: weekStart, lte: weekEnd },
        },
        select: {
          durationMinutes: true,
        },
      }),
    ]);

    // 2. Pilar 1: Cobertura do Edital (40%)
    let totalTopics = 0;
    let completedTopics = 0;

    subjects.forEach((s) => {
      s.topics.forEach((t) => {
        totalTopics++;
        if (["Concluido", "Em Revisão"].includes(t.firstStudy)) {
          completedTopics++;
        }
      });
    });

    const coverageScore =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // 3. Pilar 2: Retenção Ponderada em Simulados (40%)
    let totalWeightedSum = 0;
    let totalWeights = 0;
    let totalQuestionsAnswered = 0;
    let totalQuestionsCorrect = 0;

    subjects.forEach((subject) => {
      const weight = Math.max(1, Number(subject.priority || 1));
      let subTotal = 0;
      let subCorrect = 0;

      subject.topics.forEach((topic) => {
        topic.quizAttempts.forEach((attempt) => {
          subTotal += attempt.totalCount;
          subCorrect += attempt.correctCount;
        });
      });

      totalQuestionsAnswered += subTotal;
      totalQuestionsCorrect += subCorrect;

      if (subTotal > 0) {
        const subAccuracy = (subCorrect / subTotal) * 100;
        totalWeightedSum += subAccuracy * weight;
        totalWeights += weight;
      } else {
        // Fallback para tópicos com performance anotada
        const scoredTopics = subject.topics.filter((t) => t.performance > 0);
        if (scoredTopics.length > 0) {
          const avgPerf =
            scoredTopics.reduce((sum, t) => sum + t.performance, 0) /
            scoredTopics.length;
          totalWeightedSum += avgPerf * weight;
          totalWeights += weight;
        } else if (subjects.length > 0) {
          totalWeights += weight;
        }
      }
    });

    const domainScore =
      totalWeights > 0 ? Math.round(totalWeightedSum / totalWeights) : 0;

    // 4. Pilar 3: Constância Semanal (20%)
    const streakDays = user?.userStats?.streakDays || 0;
    const streakFactor = Math.min(
      100,
      streakDays >= 7 ? 100 : streakDays > 0 ? Math.round(streakDays * 14.3) : 0,
    );

    const weeklyTargetMinutes = Math.max(
      60,
      (user?.weeklyGoalHours || 10) * 60,
    );
    const weeklyMinutes = weeklySessions.reduce(
      (acc, s) => acc + (s.durationMinutes || 0),
      0,
    );
    const weeklyProgressFactor = Math.min(
      100,
      Math.round((weeklyMinutes / weeklyTargetMinutes) * 100),
    );

    const constancyScore = Math.min(
      100,
      Math.round(streakFactor * 0.5 + weeklyProgressFactor * 0.5),
    );

    // 5. Avaliação de Suficiência de Dados
    const hasEnoughData =
      totalTopics > 0 &&
      (totalQuestionsAnswered > 0 || completedTopics > 0 || streakDays > 0);

    // 6. Cálculo do Índice Geral (0 a 100%)
    const overallOdds = hasEnoughData
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              coverageScore * 0.4 + domainScore * 0.4 + constancyScore * 0.2,
            ),
          ),
        )
      : 0;

    // 7. Qualificação Dinâmica
    let status: ApprovalOddsData["status"] = "FASE_INICIAL";
    let statusLabel = "Fase Inicial";
    let statusDescription =
      "Inicie simulados e avance nos tópicos para calibrar sua projeção estatística.";

    if (overallOdds >= 75) {
      status = "ZONA_DE_APROVACAO";
      statusLabel = "Zona de Aprovação";
      statusDescription =
        "Probabilidade estatística elevada. Mantenha o ritmo de revisões e aprofunde simulados!";
    } else if (overallOdds >= 50) {
      status = "COMPETITIVO";
      statusLabel = "Competitivo";
      statusDescription =
        "Desempenho sólido e competitivo. Foque nos pontos fracos para cruzar a nota de corte.";
    } else if (overallOdds >= 25) {
      status = "EM_CONSTRUCAO";
      statusLabel = "Em Construção";
      statusDescription =
        "Base em evolução. Aumente o volume de simulados e conclua mais tópicos do edital.";
    }

    return {
      success: true,
      data: {
        overallOdds,
        status,
        statusLabel,
        statusDescription,
        hasEnoughData,
        pillars: {
          coverage: {
            score: coverageScore,
            completedTopics,
            totalTopics,
            weightPercentage: 40,
          },
          domain: {
            score: domainScore,
            totalQuestions: totalQuestionsAnswered,
            correctQuestions: totalQuestionsCorrect,
            weightPercentage: 40,
          },
          constancy: {
            score: constancyScore,
            streakDays,
            weeklyMinutes,
            weeklyTargetMinutes,
            weightPercentage: 20,
          },
        },
      },
    };
  } catch (err) {
    console.error("Erro em getApprovalOddsAction:", err);
    return {
      success: false,
      error: "Falha ao calcular chance de aprovação.",
    };
  }
}
