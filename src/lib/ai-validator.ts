import { z } from "zod";

export interface AIValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Limpa a string da IA, realiza o parse JSON e valida contra um schema Zod.
 */
export async function parseAndValidateAIResponse<T>(
  rawResponse: string,
  schema: z.ZodSchema<T>,
): Promise<AIValidationResult<T>> {
  try {
    // Sanitize: remove blocos de código markdown
    const cleanedJson = rawResponse
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleanedJson);
    const validatedData = schema.parse(parsed);

    return { success: true, data: validatedData };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = err.issues
        .map((i) => `${i.path.join(".") || "raiz"}: ${i.message}`)
        .join("; ");
      return {
        success: false,
        error: `Estrutura gerada pela IA é inválida: ${issues}`,
      };
    }

    if (err instanceof SyntaxError) {
      return {
        success: false,
        error: "A resposta fornecida pela IA não é um JSON válido.",
      };
    }

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao processar resposta da IA.",
    };
  }
}

// --- SCHEMAS PADRÃO DO APP ---

export const generatedFlashcardSchema = z.object({
  front: z.string().min(1, "A pergunta é obrigatória"),
  back: z.string().min(1, "A resposta é obrigatória"),
  details: z.string().optional().nullable(),
});

export const generatedDeckResponseSchema = z.object({
  title: z.string().min(1, "O título do baralho é obrigatório"),
  cards: z
    .array(generatedFlashcardSchema)
    .min(5, "Deve ser gerado ao menos 5 flashcards"),
});

export type GeneratedFlashcard = z.infer<typeof generatedFlashcardSchema>;
export type GeneratedDeckResponse = z.infer<typeof generatedDeckResponseSchema>;
