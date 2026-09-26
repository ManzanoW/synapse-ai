// src/actions/monte-carlo-actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface MonteCarloSubjectRisk {
  subjectName: string;
  weight: number;
  currentAccuracy: number; // 0 a 100%
  questionsCount: number;
  marginalGainPer3Hours: number; // Ex: +4.2 pontos na nota final
  riskLevel: "CRITICO" | "MODERADO" | "ESTAVEL";
  recommendation: string;
}

export interface MonteCarloSimulationResult {
  p10Score: number; // Cenário conservador (10% pior caso)
  p50Score: number; // Cenário mais provável (mediana)
  p90Score: number; // Cenário otimista (10% melhor caso)
  cutoffScore: number; // Nota de corte estimada do concurso
  approvalProbability: number; // 0 a 100%
  iterationsCount: 1000;
  distributionCurve: Array<{
    scoreRange: string;
    scoreMid: number;
    frequency: number; // quantidade de iterações nesta faixa
    isCutoffOrAbove: boolean;
  }>;
  subjectsRisk: MonteCarloSubjectRisk[];
  highestLeverageSubject: string; // Matéria com maior retorno por hora
  executiveSummary: string;
  hasSufficientData: boolean;
}

// Algoritmo Box-Muller para amostragem gaussiana normal estocástica
function generateGaussian(mean: number, stdDev: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + num * stdDev;
}

export async function runMonteCarloSimulationAction(
  cutoffOverride?: number
): Promise<{ success: boolean; data?: MonteCarloSimulationResult; error?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const [subjects, user] = await Promise.all([
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
          targetRole: true,
          careerFocus: true,
        },
      }),
    ]);

    // Estimativa de nota de corte baseada na carreira/cargo do aluno
    let defaultCutoff = 80;
    const roleLower = (user?.targetRole || "").toLowerCase();
    const careerLower = (user?.careerFocus || "").toLowerCase();

    if (roleLower.includes("auditor") || careerLower.includes("fiscal")) {
      defaultCutoff = 84;
    } else if (roleLower.includes("magistratura") || roleLower.includes("promotor") || roleLower.includes("defensor")) {
      defaultCutoff = 82;
    } else if (roleLower.includes("policial") || roleLower.includes("delegado")) {
      defaultCutoff = 78;
    } else if (roleLower.includes("tribunal") || roleLower.includes("analista")) {
      defaultCutoff = 81;
    }

    const cutoffScore = cutoffOverride && cutoffOverride >= 50 && cutoffOverride <= 100
      ? cutoffOverride
      : defaultCutoff;

    // Compilação de estatísticas reais por disciplina
    interface SubjectStat {
      name: string;
      weight: number;
      accuracy: number;
      totalQuestions: number;
    }

    const compiledSubjects: SubjectStat[] = [];
    let totalQuestionsAnsweredAll = 0;

    for (const sub of subjects) {
      const weight = Math.max(0.5, Number(sub.weight ?? (sub.priority ?? 2)));
      let subTotal = 0;
      let subCorrect = 0;

      for (const top of sub.topics) {
        for (const att of top.quizAttempts) {
          subTotal += att.totalCount;
          subCorrect += att.correctCount;
        }
      }

      totalQuestionsAnsweredAll += subTotal;

      let accuracy = 65; // baseline razoável para concurseiro
      if (subTotal > 0) {
        accuracy = Math.round((subCorrect / subTotal) * 100);
      } else {
        // Fallback para performance declarada nos tópicos
        const validTopics = sub.topics.filter((t) => t.performance > 0);
        if (validTopics.length > 0) {
          accuracy = Math.round(validTopics.reduce((a, b) => a + b.performance, 0) / validTopics.length);
        }
      }

      compiledSubjects.push({
        name: sub.name,
        weight,
        accuracy: Math.max(15, Math.min(98, accuracy)),
        totalQuestions: subTotal,
      });
    }

    // Se o usuário não tiver matérias cadastradas, montamos uma grade protótipo de concurso
    if (compiledSubjects.length === 0) {
      compiledSubjects.push(
        { name: "Língua Portuguesa", weight: 2, accuracy: 72, totalQuestions: 40 },
        { name: "Direito Constitucional", weight: 3, accuracy: 68, totalQuestions: 35 },
        { name: "Direito Administrativo", weight: 3, accuracy: 62, totalQuestions: 30 },
        { name: "Raciocínio Lógico & Mat.", weight: 1.5, accuracy: 58, totalQuestions: 20 },
        { name: "Conhecimentos Específicos", weight: 4, accuracy: 64, totalQuestions: 45 }
      );
    }

    const totalWeight = compiledSubjects.reduce((acc, s) => acc + s.weight, 0);

    // ==========================================
    // 1. SIMULAÇÃO DE MONTE CARLO (1.000 iterações)
    // ==========================================
    const iterationsCount = 1000;
    const simulatedScores: number[] = [];

    for (let i = 0; i < iterationsCount; i++) {
      let weightedSum = 0;

      for (const sub of compiledSubjects) {
        // Desvio padrão da disciplina: menor desvio quanto mais questões resolvidas (maior previsibilidade)
        const stdDev = Math.max(4, 14 - Math.min(8, sub.totalQuestions / 15));
        const simulatedSubScore = Math.max(10, Math.min(100, generateGaussian(sub.accuracy, stdDev)));

        weightedSum += simulatedSubScore * sub.weight;
      }

      const finalExamScore = Math.round(weightedSum / totalWeight);
      simulatedScores.push(finalExamScore);
    }

    // Ordenação para cálculo de percentis
    simulatedScores.sort((a, b) => a - b);

    const p10Score = simulatedScores[Math.floor(iterationsCount * 0.1)];
    const p50Score = simulatedScores[Math.floor(iterationsCount * 0.5)];
    const p90Score = simulatedScores[Math.floor(iterationsCount * 0.9)];

    const approvalsCount = simulatedScores.filter((s) => s >= cutoffScore).length;
    const approvalProbability = Math.round((approvalsCount / iterationsCount) * 100);

    // ==========================================
    // 2. CURVA DE DISTRIBUIÇÃO EM SINO (GAUSS)
    // ==========================================
    const minScore = Math.min(...simulatedScores);
    const maxScore = Math.max(...simulatedScores);
    const bucketCount = 12;
    const bucketSize = Math.max(2, Math.ceil((maxScore - minScore + 1) / bucketCount));

    const distributionCurve: MonteCarloSimulationResult["distributionCurve"] = [];

    for (let b = 0; b < bucketCount; b++) {
      const bMin = minScore + b * bucketSize;
      const bMax = bMin + bucketSize - 1;
      const mid = Math.round((bMin + bMax) / 2);
      const count = simulatedScores.filter((s) => s >= bMin && s <= bMax).length;

      distributionCurve.push({
        scoreRange: `${bMin}-${bMax}`,
        scoreMid: mid,
        frequency: count,
        isCutoffOrAbove: mid >= cutoffScore,
      });
    }

    // ==========================================
    // 3. ANÁLISE DE CUSTO DE OPORTUNIDADE & GANHO MARGINAL
    // ==========================================
    const subjectsRisk: MonteCarloSubjectRisk[] = compiledSubjects.map((sub) => {
      // O ganho marginal é maior onde o peso é alto E a acurácia atual é baixa (tem espaço pra crescer)
      const roomToGrow = 95 - sub.accuracy;
      const relativeWeight = sub.weight / totalWeight;
      const marginalGain = Math.round((roomToGrow * 0.22 * relativeWeight) * 10) / 10;

      let riskLevel: MonteCarloSubjectRisk["riskLevel"] = "ESTAVEL";
      let recommendation = "Manter revisões de manutenção FSRS.";

      if (sub.accuracy < 60) {
        riskLevel = "CRITICO";
        recommendation = "Gargalo prioritário: estude tópicos com erros acumulados para evitar eliminação por mínimos.";
      } else if (sub.accuracy < 75) {
        riskLevel = "MODERADO";
        recommendation = "Potencial de alavancagem: resolver baterias de 20 questões por dia para migrar para +80%.";
      }

      return {
        subjectName: sub.name,
        weight: sub.weight,
        currentAccuracy: sub.accuracy,
        questionsCount: sub.totalQuestions,
        marginalGainPer3Hours: marginalGain,
        riskLevel,
        recommendation,
      };
    });

    // Ordena pelo maior ganho marginal
    subjectsRisk.sort((a, b) => b.marginalGainPer3Hours - a.marginalGainPer3Hours);
    const highestLeverageSubject = subjectsRisk[0]?.subjectName || compiledSubjects[0].name;

    // Resumo executivo prescritivo
    let executiveSummary = "";
    if (approvalProbability >= 75) {
      executiveSummary = `Você está na Zona Competitiva Alta com ${approvalProbability}% de probabilidade estimada de aprovação. O ponto focal para consolidar a vaga é proteger seu desempenho em ${highestLeverageSubject}.`;
    } else if (approvalProbability >= 45) {
      executiveSummary = `Probabilidade intermediária de aprovação (${approvalProbability}%). O seu maior custo de oportunidade está em ${highestLeverageSubject}: um ganho de +${subjectsRisk[0]?.marginalGainPer3Hours || 3} pts elevará sua projeção para a margem de corte.`;
    } else {
      executiveSummary = `Alerta de Risco: Projeção de aprovação em ${approvalProbability}%. Seu P10 conservador (${p10Score} pts) está distante do corte (${cutoffScore} pts). Acelere a cobertura e remediação em ${highestLeverageSubject}.`;
    }

    return {
      success: true,
      data: {
        p10Score,
        p50Score,
        p90Score,
        cutoffScore,
        approvalProbability,
        iterationsCount,
        distributionCurve,
        subjectsRisk,
        highestLeverageSubject,
        executiveSummary,
        hasSufficientData: totalQuestionsAnsweredAll > 0 || subjects.length > 0,
      },
    };
  } catch (err) {
    console.error("Erro ao rodar simulação de Monte Carlo:", err);
    return {
      success: false,
      error: "Não foi possível rodar a simulação estatística no momento.",
    };
  }
}
