// src/types/quiz.ts

export type ErrorClassification =
  | "THEORY_GAP"
  | "ATTENTION_LAPSE"
  | "MISINTERPRETATION"
  | "TIME_PRESSURE"
  | "UNCLASSIFIED";

export interface QuestionAnswerSubmission {
  questionId: string;
  topicId?: string;
  subjectId: string;
  selectedOption: number | string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  errorReason?: ErrorClassification;
}

export interface SubmitQuizAttemptInput {
  topicId?: string;
  subjectId?: string;
  title: string;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  answers: QuestionAnswerSubmission[];
}

export interface SubjectDomainMetric {
  subjectId: string;
  subjectName: string;
  color?: string | null;
  totalAnswered: number;
  correctCount: number;
  domainPercentage: number;
  weight: number;
  topErrorReason?: ErrorClassification;
}
