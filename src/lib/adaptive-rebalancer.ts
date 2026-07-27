import {
  SubjectPerformance,
  AdaptiveAdjustment,
  RebalanceParams,
} from "@/types/adaptive";

export function calculateAdaptiveRebalance(
  params: RebalanceParams,
): AdaptiveAdjustment[] {
  const adjustments: AdaptiveAdjustment[] = [];

  // 1. Fator Anti-Acúmulo: Ajuste pelo número de dias perdidos
  const totalWeeklyMinutes = params.weeklyGoalHours * 60;
  const remainingDays = Math.max(
    1,
    params.activeDaysPerWeek - params.daysMissedThisWeek,
  );
  const rebalancedDailyGoalMinutes =
    totalWeeklyMinutes / params.activeDaysPerWeek;

  params.performances.forEach((subject) => {
    let newMinutes = subject.targetWeeklyMinutes;
    let reason = "Carga regular mantida pelo ciclo.";
    let type: AdaptiveAdjustment["type"] = "REBALANCE";

    // 2. Análise de Desempenho (Reforço vs Redução)
    if (subject.accuracyPercentage < 65 && subject.totalQuestionsSolved >= 10) {
      // Inserção/Aumento de Reforço Ativo (+25% de tempo)
      newMinutes = Math.round(subject.targetWeeklyMinutes * 1.25);
      reason = `Desempenho em ${subject.accuracyPercentage}% (Abaixo do alvo de 70%). Bloco de Reforço Ativo inserido.`;
      type = "REINFORCEMENT";
    } else if (
      subject.accuracyPercentage > 85 &&
      subject.totalQuestionsSolved >= 15
    ) {
      // Redução de carga em matérias dominadas (-15% de tempo)
      newMinutes = Math.round(subject.targetWeeklyMinutes * 0.85);
      reason = `Domínio alto (${subject.accuracyPercentage}% de acertos). Tempo otimizado para matérias críticas.`;
      type = "REDUCTIONS" as any;
    }

    adjustments.push({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      originalMinutes: subject.targetWeeklyMinutes,
      adjustedMinutes: newMinutes,
      reason,
      type,
    });
  });

  return adjustments;
}
