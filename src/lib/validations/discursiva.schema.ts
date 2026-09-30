import { z } from "zod";

export const EvaluateDiscursivaSchema = z.object({
  themeTitle: z
    .string()
    .min(3, "O tema da redação deve ter pelo menos 3 caracteres.")
    .max(300, "O tema não pode exceder 300 caracteres."),
  banca: z.string().optional().default("CEBRASPE"),
  subjectArea: z.string().optional().default("Geral"),
  motivatingText: z.string().optional().default(""),
  expectedPoints: z.string().optional().default(""),
  content: z
    .string()
    .min(50, "A redação deve ter no mínimo 50 caracteres para avaliação técnica.")
    .max(15000, "A redação excede o limite máximo permitido de 15.000 caracteres."),
  lineCount: z
    .number()
    .int()
    .min(0, "A contagem de linhas não pode ser negativa.")
    .default(0),
  wordCount: z
    .number()
    .int()
    .min(0, "A contagem de palavras não pode ser negativa.")
    .default(0),
  durationSeconds: z
    .number()
    .int()
    .min(0, "O tempo de prova não pode ser negativo.")
    .default(0),
});

export type ValidatedEvaluateDiscursivaInput = z.infer<typeof EvaluateDiscursivaSchema>;
