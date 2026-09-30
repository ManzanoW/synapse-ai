import { z } from "zod";

export const QuestionAnswerSubmissionSchema = z.object({
  questionId: z.string().min(1, "ID da questão é obrigatório"),
  topicId: z.string().optional(),
  subjectId: z.string().optional().default(""),
  selectedOption: z.union([z.number(), z.string()]),
  isCorrect: z.boolean(),
  timeSpentSeconds: z.number().int().min(0).default(0),
  errorReason: z.string().optional(),
  questionText: z.string().optional(),
  options: z.any().optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  isFlaggedForReview: z.boolean().optional(),
});

export const SubmitQuizAttemptSchema = z
  .object({
    topicId: z.string().optional(),
    subjectId: z.string().optional(),
    title: z.string().max(255).default("Simulado"),
    totalQuestions: z
      .number()
      .int()
      .positive("O total de questões deve ser maior que zero")
      .max(200, "O simulado não pode exceder 200 questões"),
    correctAnswers: z
      .number()
      .int()
      .min(0, "O número de acertos não pode ser negativo"),
    timeSpentSeconds: z
      .number()
      .int()
      .min(0, "Tempo de prova inválido"),
    totalAllocatedSeconds: z.number().int().min(0).optional(),
    isTimedSimulation: z.boolean().optional(),
    answers: z.array(QuestionAnswerSubmissionSchema).default([]),
  })
  .refine((data) => data.correctAnswers <= data.totalQuestions, {
    message: "O número de respostas corretas não pode exceder o total de questões.",
    path: ["correctAnswers"],
  });

export type ValidatedSubmitQuizAttemptInput = z.infer<typeof SubmitQuizAttemptSchema>;
