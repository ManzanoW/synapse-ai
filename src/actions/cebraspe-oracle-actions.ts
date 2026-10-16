// src/actions/cebraspe-oracle-actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isUserPro } from "@/lib/subscription";

export interface CebraspeSimulationInput {
  totalQuestions: number; // Ex: 120
  targetCutoffScore: number; // Ex: 76
  sureCount: number; // Ex: 75 questões que o aluno tem convicção
  sureAccuracy: number; // Ex: 92% (0.92)
  doubtCount: number; // Ex: 30 questões onde está em dúvida
  doubtAccuracy: number; // Ex: 55% (0.55)
  blankCount: number; // Ex: 15 deixadas em branco intencionalmente
  usePersonalHistoricalData?: boolean;
}

export interface StrategyResult {
  name: string;
  expectedNetScore: number;
  minNetScoreP10: number;
  maxNetScoreP90: number;
  probabilityOfPassing: number; // 0 - 100%
  catastropheRisk: number; // Chance de perder mais de 8 pontos com chutes
  blanksRecommended: number;
  summary: string;
}

export interface CebraspeSimulationResult {
  success: boolean;
  isUserPro: boolean;
  personalDataUsed?: boolean;
  strategies: {
    conservative: StrategyResult;
    aggressive: StrategyResult;
    optimal: StrategyResult;
  };
  examinerRecommendation: string;
  tacticalTip: string;
  error?: string;
}

/**
 * 🎯 Simula cenários probabilísticos para provas no modelo Cebraspe (1 errada anula 1 certa)
 * Utiliza o Teorema do Ponto de Indiferença e Simulação de Monte Carlo com 2.000 iterações.
 */
export async function runCebraspeOracleSimulationAction(
  input: CebraspeSimulationInput,
): Promise<CebraspeSimulationResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const isPro = userId ? await isUserPro(userId) : false;

    let sureAccuracy = Math.min(0.99, Math.max(0.6, input.sureAccuracy));
    let doubtAccuracy = Math.min(0.85, Math.max(0.4, input.doubtAccuracy));
    let personalDataUsed = false;

    // Se o usuário for PRO e requisitar dados históricos reais do Caderno de Erros
    if (isPro && userId && input.usePersonalHistoricalData) {
      const errorStats = await prisma.questionError.groupBy({
        by: ["errorReason"],
        where: { userId },
        _count: { id: true },
      });

      const totalErrors = errorStats.reduce((acc, curr) => acc + curr._count.id, 0);
      if (totalErrors > 5) {
        // Calibra a taxa de dúvida baseada em erros por falta de atenção vs interpretação
        const trickErrors =
          errorStats.find((s) => s.errorReason === "ATTENTION_LAPSE")?._count.id || 0;
        const interpretationErrors =
          errorStats.find((s) => s.errorReason === "MISINTERPRETATION")?._count.id || 0;

        const penalty = (trickErrors + interpretationErrors) / totalErrors;
        doubtAccuracy = Math.max(0.45, 0.60 - penalty * 0.15);
        personalDataUsed = true;
      }
    }

    const { totalQuestions, targetCutoffScore, sureCount, doubtCount } = input;
    const ITERATIONS = 2000;

    // Função de simulação Monte Carlo
    const simulateScenario = (
      sures: number,
      pSure: number,
      doubtsToGuess: number,
      pDoubt: number,
      blanks: number,
    ) => {
      let passCount = 0;
      let catastropheCount = 0;
      const scores: number[] = [];

      for (let i = 0; i < ITERATIONS; i++) {
        let correct = 0;
        let incorrect = 0;

        // Questões com certeza
        for (let s = 0; s < sures; s++) {
          if (Math.random() < pSure) correct++;
          else incorrect++;
        }

        // Questões com dúvida chutadas
        let doubtCorrect = 0;
        let doubtIncorrect = 0;
        for (let d = 0; d < doubtsToGuess; d++) {
          if (Math.random() < pDoubt) doubtCorrect++;
          else doubtIncorrect++;
        }

        correct += doubtCorrect;
        incorrect += doubtIncorrect;

        // Nota líquida Cebraspe: C - E
        const netScore = correct - incorrect;
        scores.push(netScore);

        if (netScore >= targetCutoffScore) {
          passCount++;
        }

        // Catástrofe: o chute nas dúvidas destruiu mais de 6 pontos líquidos
        if (doubtIncorrect - doubtCorrect >= 6) {
          catastropheCount++;
        }
      }

      scores.sort((a, b) => a - b);
      const avgNet = scores.reduce((a, b) => a + b, 0) / ITERATIONS;
      const p10 = scores[Math.floor(ITERATIONS * 0.1)];
      const p90 = scores[Math.floor(ITERATIONS * 0.9)];
      const passProb = (passCount / ITERATIONS) * 100;
      const catastProb = (catastropheCount / ITERATIONS) * 100;

      return {
        avgNet: Math.round(avgNet * 10) / 10,
        p10: Math.round(p10),
        p90: Math.round(p90),
        passProb: Math.round(passProb * 10) / 10,
        catastProb: Math.round(catastProb * 10) / 10,
      };
    };

    // 1. Cenário Conservador: Chuta 0 dúvidas (deixa todas em branco)
    const conservativeSim = simulateScenario(sureCount, sureAccuracy, 0, doubtAccuracy, doubtCount + (totalQuestions - sureCount - doubtCount));

    // 2. Cenário Agressivo: Chuta 100% das dúvidas
    const aggressiveSim = simulateScenario(sureCount, sureAccuracy, doubtCount, doubtAccuracy, totalQuestions - sureCount - doubtCount);

    // 3. Cenário Ótimo: Busca o equilíbrio ideal de chutes
    let bestDoubtsToGuess = 0;
    let bestPassProb = -1;
    let optimalSim = conservativeSim;

    // Testa faixas de chute (0%, 25%, 50%, 75%, 100%)
    const steps = [0, 0.25, 0.5, 0.75, 1.0];
    for (const step of steps) {
      const toGuess = Math.round(doubtCount * step);
      const blanks = totalQuestions - sureCount - toGuess;
      const sim = simulateScenario(sureCount, sureAccuracy, toGuess, doubtAccuracy, blanks);
      if (sim.passProb > bestPassProb) {
        bestPassProb = sim.passProb;
        bestDoubtsToGuess = toGuess;
        optimalSim = sim;
      }
    }

    const optimalBlanks = totalQuestions - sureCount - bestDoubtsToGuess;

    // Monta parecer tático inteligente do examinador
    let examinerRecommendation = "";
    let tacticalTip = "";

    if (conservativeSim.avgNet >= targetCutoffScore + 4) {
      examinerRecommendation = `Você já possui gordura suficiente nas suas certezas (Média Líquida: ${conservativeSim.avgNet} pts vs Corte: ${targetCutoffScore} pts). A recomendação tática é CONSERVADORA: deixe as dúvidas em branco para não arriscar anulações desnecessárias.`;
      tacticalTip = `Deixar cerca de ${optimalBlanks} itens em branco garante ${conservativeSim.passProb}% de probabilidade de passar com volatilidade quase nula.`;
    } else if (bestDoubtsToGuess > 0 && optimalSim.passProb > conservativeSim.passProb + 5) {
      examinerRecommendation = `Suas certezas isoladas somam cerca de ${conservativeSim.avgNet} pts, abaixo ou no limiar do corte (${targetCutoffScore} pts). Chutar moderadamente ${bestDoubtsToGuess} itens com probabilidade favorável aumenta sua chance de aprovação de ${conservativeSim.passProb}% para ${optimalSim.passProb}%.`;
      tacticalTip = `Não chute às cegas! Selecione apenas os ${bestDoubtsToGuess} itens onde você eliminou com convicção pelo menos 1 alternativa absurda.`;
    } else {
      examinerRecommendation = `Sua precisão nas dúvidas está muito próxima de 50%, onde o valor esperado do chute é zero ($E[X]=0$) mas a variância destrói o resultado. Blindar sua prova deixando ${optimalBlanks} em branco é a melhor blindagem matemática.`;
      tacticalTip = `Cada item errado anula um item certo. Menos é mais no modelo Cebraspe.`;
    }

    return {
      success: true,
      isUserPro: isPro,
      personalDataUsed,
      strategies: {
        conservative: {
          name: "Estratégia Conservadora",
          expectedNetScore: conservativeSim.avgNet,
          minNetScoreP10: conservativeSim.p10,
          maxNetScoreP90: conservativeSim.p90,
          probabilityOfPassing: conservativeSim.passProb,
          catastropheRisk: conservativeSim.catastProb,
          blanksRecommended: totalQuestions - sureCount,
          summary: "Zero chutes nas dúvidas. Garante que nenhuma questão certa seja anulada.",
        },
        aggressive: {
          name: "Estratégia Agressiva",
          expectedNetScore: aggressiveSim.avgNet,
          minNetScoreP10: aggressiveSim.p10,
          maxNetScoreP90: aggressiveSim.p90,
          probabilityOfPassing: aggressiveSim.passProb,
          catastropheRisk: aggressiveSim.catastProb,
          blanksRecommended: totalQuestions - sureCount - doubtCount,
          summary: "Chuta todas as dúvidas. Ganho potencial alto, porém risco severo de anulação.",
        },
        optimal: {
          name: "Ponto de Equilíbrio Ótimo",
          expectedNetScore: optimalSim.avgNet,
          minNetScoreP10: optimalSim.p10,
          maxNetScoreP90: optimalSim.p90,
          probabilityOfPassing: optimalSim.passProb,
          catastropheRisk: optimalSim.catastProb,
          blanksRecommended: optimalBlanks,
          summary: `Chutar seletivamente ${bestDoubtsToGuess} itens e deixar ${optimalBlanks} em branco para maximizar a aprovação.`,
        },
      },
      examinerRecommendation,
      tacticalTip,
    };
  } catch (error) {
    console.error("Erro em runCebraspeOracleSimulationAction:", error);
    return {
      success: false,
      isUserPro: false,
      strategies: {} as any,
      examinerRecommendation: "",
      tacticalTip: "",
      error: "Falha ao processar simulação do oráculo.",
    };
  }
}
