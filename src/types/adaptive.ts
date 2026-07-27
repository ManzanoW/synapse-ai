// src/types/adaptive.ts

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  accuracyPercentage: number; // Ex: 58 (%)
  totalQuestionsSolved: number;
  lastStudiedAt: Date;
  targetWeeklyMinutes: number;
}

export interface RebalanceParams {
  studyMode: "WEEKLY" | "CYCLE";
  weeklyGoalHours: number;
  activeDaysPerWeek: number;
  daysMissedThisWeek: number;
  performances: SubjectPerformance[];
}

export interface AdaptiveAdjustment {
  subjectId: string;
  subjectName: string;
  originalMinutes: number;
  adjustedMinutes: number;
  reason: string;
  type: "REINFORCEMENT" | "REDUCTION" | "REBALANCE";
}
