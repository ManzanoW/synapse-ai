// src/types/quiz.ts

export type ErrorClassification =
  | "THEORY_GAP"
  | "CONTENT_GAP"
  | "ATTENTION_LAPSE"
  | "TRICK_QUESTION"
  | "MISINTERPRETATION"
  | "INTERPRETATION"
  | "TIME_PRESSURE"
  | "UNCLASSIFIED";

export interface QuestionAnswerSubmission {
  questionId: string;
  topicId?: string;
  subjectId: string;
  selectedOption: number | string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  errorReason?: ErrorClassification | string;
  questionText?: string;
  options?: Array<{ id: string; texto: string }> | string[];
  correctAnswer?: string;
  explanation?: string;
  isFlaggedForReview?: boolean;
}

export interface SubmitQuizAttemptInput {
  topicId?: string;
  subjectId?: string;
  title: string;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  totalAllocatedSeconds?: number;
  isTimedSimulation?: boolean;
  answers: QuestionAnswerSubmission[];
}

export type TimedQuizPacingMode = "per_question" | "total_block";

export interface TimedQuizConfig {
  pacingMode: TimedQuizPacingMode;
  minutesPerQuestion: number; // default: 3
  totalBlockMinutes: number;  // e.g. 15, 30, 60, 90
  banca: string;
  materia: string;
  topicId?: string;
  topicTitle?: string;
  questionCount: number;
  dificuldade: string;
  strictAntiDistraction: boolean;
}

export interface TimedQuizQuestion {
  id?: string;
  enunciado: string;
  formato: string;
  justificativa: string;
  pegadinhaBanca?: string;
  explicacaoErro?: string;
  alternativas: Array<{ id: string; texto: string }>;
  gabaritoCorreto: string;
  flashcardFrente?: string;
  flashcardVerso?: string;
  subjectId?: string;
  topicId?: string;
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

export interface DrillQuestionOption {
  id: string; // "A", "B", "C", "D"
  texto: string;
}

export interface DrillQuestion {
  enunciado: string;
  alternativas: DrillQuestionOption[];
  gabaritoCorreto: string; // "A" | "B" | "C" | "D"
  justificativa: string;
}

export interface ErrorRemediationData {
  microExplanation: string;
  mnemonicOrRule: string;
  drillQuestion: DrillQuestion;
}

export interface GenerateRemediationInput {
  errorId?: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  errorReason: string;
  subjectName?: string;
  topicTitle?: string;
}

export interface ErrorNotebookItem {
  id: string;
  userId: string;
  subjectId: string | null;
  topicId: string | null;
  quizId: string | null;
  questionText: string;
  options: Array<{ id: string; texto: string }> | null;
  userAnswer: string;
  correctAnswer: string;
  explanation: string | null;
  errorReason: string;
  status: "PENDING" | "MASTERED";
  masteredAt: string | Date | null;
  aiExplanation: string | null;
  mnemonic: string | null;
  drillQuestion: DrillQuestion | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  subject?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  topic?: {
    id: string;
    title: string;
  } | null;
}

export interface ErrorNotebookFilters {
  subjectId?: string;
  errorReason?: string;
  status?: "ALL" | "PENDING" | "MASTERED";
  period?: "7d" | "30d" | "90d" | "all";
  search?: string;
}

export interface ErrorTaxonomyMetric {
  reason: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ErrorNotebookMetrics {
  totalErrors: number;
  pendingErrors: number;
  masteredErrors: number;
  masteryRate: number;
  taxonomyDistribution: ErrorTaxonomyMetric[];
}
