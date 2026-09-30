import { z } from "zod";

export const ReviewFlashcardSchema = z.object({
  cardId: z.string().min(1, "ID do card é obrigatório"),
  rating: z.union([z.number().int().min(1).max(4), z.string()]).optional(),
  grade: z.union([z.number().int().min(1).max(4), z.string()]).optional(),
  responseTimeMs: z
    .number()
    .int()
    .min(0, "Tempo de resposta não pode ser negativo")
    .max(600000, "Tempo de resposta não pode exceder 10 minutos")
    .optional(),
});

export const CreateFlashcardSchema = z.object({
  deckId: z.string().min(1, "ID do baralho é obrigatório"),
  topicId: z.string().optional().nullable(),
  question: z.string().min(1, "A pergunta é obrigatória").max(10000),
  answer: z.string().min(1, "A resposta é obrigatória").max(10000),
  details: z.string().max(4000).optional().nullable(),
});

export type ValidatedReviewFlashcardInput = z.infer<typeof ReviewFlashcardSchema>;
export type ValidatedCreateFlashcardInput = z.infer<typeof CreateFlashcardSchema>;
