// src/lib/srs-algorithm.ts
import { convertLabelToGrade, calculateSM2 } from "@/lib/sm2";

export const calculateNextReview = (
  performance: "bom" | "dificil" | "errei",
  currentInterval: number,
) => {
  const grade = convertLabelToGrade(performance);
  const result = calculateSM2({
    interval: currentInterval,
    easiness: 2.5,
    repetitions: 1,
    grade,
  });

  return result.nextInterval;
};
