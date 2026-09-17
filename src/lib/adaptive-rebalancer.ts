import {
  AdaptiveAdjustment,
  RebalanceParams,
} from "@/types/adaptive";

export function calculateAdaptiveRebalance(
  params: RebalanceParams,
): AdaptiveAdjustment[] {
  const adjustments: AdaptiveAdjustment[] = [];

  params.performances.forEach((subject) => {
    let newMinutes = subject.targetWeeklyMinutes;
    let reason = "Carga regular mantida pelo ciclo.";
    let type: AdaptiveAdjustment["type"] = "REBALANCE";

    // Análise de Desempenho (Reforço vs Redução)
    if (subject.accuracyPercentage < 65 && subject.totalQuestionsSolved >= 3) {
      newMinutes = Math.round(subject.targetWeeklyMinutes * 1.25);
      reason = `Desempenho em ${subject.accuracyPercentage}% (${subject.totalQuestionsSolved} questões resolvidas). Bloco de Reforço Ativo (+25%).`;
      type = "REINFORCEMENT";
    } else if (
      subject.accuracyPercentage > 85 &&
      subject.totalQuestionsSolved >= 5
    ) {
      newMinutes = Math.round(subject.targetWeeklyMinutes * 0.85);
      reason = `Domínio alto (${subject.accuracyPercentage}% em ${subject.totalQuestionsSolved} questões). Tempo otimizado (-15%).`;
      type = "REDUCTION";
    }

    adjustments.push({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      originalMinutes: subject.targetWeeklyMinutes,
      adjustedMinutes: newMinutes,
      targetWeeklyMinutes: newMinutes,
      adjustedWeeklyMinutes: newMinutes,
      reason,
      type,
    });
  });

  return adjustments;
}
