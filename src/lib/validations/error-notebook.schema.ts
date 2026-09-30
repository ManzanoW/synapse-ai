import { z } from "zod";

export const ConvertErrorToFlashcardSchema = z.object({
  errorId: z.string().min(1, "ID do erro é obrigatório"),
});

export const SaveWrongQuestionItemSchema = z.object({
  questionText: z.string().min(1, "Texto da questão é obrigatório"),
  options: z.any().optional(),
  userAnswer: z.string().min(1),
  correctAnswer: z.string().min(1),
  explanation: z.string().nullable().optional(),
  errorReason: z.string().optional(),
  subjectId: z.string().nullable().optional(),
  topicId: z.string().nullable().optional(),
});

export const SaveWrongQuestionsSchema = z.object({
  quizId: z.string().nullable().optional(),
  subjectId: z.string().nullable().optional(),
  topicId: z.string().nullable().optional(),
  questions: z.array(SaveWrongQuestionItemSchema).min(1, "Nenhuma questão fornecida"),
});

export type ValidatedConvertErrorToFlashcardInput = z.infer<typeof ConvertErrorToFlashcardSchema>;
export type ValidatedSaveWrongQuestionsInput = z.infer<typeof SaveWrongQuestionsSchema>;
