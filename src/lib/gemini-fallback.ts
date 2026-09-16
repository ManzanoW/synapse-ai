// src/lib/gemini-fallback.ts

import { GoogleGenAI, GenerateContentConfig } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Chave GEMINI_API_KEY não configurada. Configure a variável no ambiente ou em .env.",
      );
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Modelos Gemini suportados pelo SDK @google/genai
const MODELS_CASCADE = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
];

export interface GeminiFallbackOptions {
  prompt: string;
  config?: GenerateContentConfig;
  timeoutMs?: number;
}

/**
 * Executa chamadas com fallback transparente entre todos os modelos Gemini disponíveis.
 * Se o limite de cota diário (RPD) ou por minuto (RPM) for atingido, comuta no milissegundo seguinte.
 */
export async function generateContentWithFallback(
  options: GeminiFallbackOptions,
): Promise<{ text: string; usedModel: string }> {
  const { prompt, config, timeoutMs = 90000 } = options;
  let lastError: unknown;

  const ai = getAIClient();

  for (const modelName of MODELS_CASCADE) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const result = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 2048,
          temperature: 0.7,
          ...config,
        },
      });

      clearTimeout(timeoutId);

      const responseText = result.text || "";
      if (!responseText) {
        throw new Error(`Modelo ${modelName} retornou conteúdo vazio.`);
      }

      return {
        text: responseText,
        usedModel: modelName,
      };
    } catch (err: unknown) {
      lastError = err;
      const errorString = String(err);

      // Detecta erro 429, esgotamento de quota ou sobrecarga temporária 503
      const isQuotaOrRateLimit =
        errorString.includes("429") ||
        errorString.includes("503") ||
        errorString.includes("RESOURCE_EXHAUSTED") ||
        errorString.includes("quota") ||
        errorString.includes("rate limit") ||
        errorString.includes("not found"); // Caso algum modelo específico não esteja ativado na conta

      if (isQuotaOrRateLimit) {
        console.warn(
          `[Gemini Fallback] ${modelName} indisponível ou limite atingido. Tentando o próximo modelo...`,
        );
        // Pequena pausa para evitar rajada em conexões instáveis
        await new Promise((res) => setTimeout(res, 300));
        continue;
      }

      // Erros críticos de validação/segurança não relacionados à cota interrompem imediatamente
      throw err;
    }
  }

  throw new Error(
    `Todos os ${MODELS_CASCADE.length} modelos Gemini da cadeia de fallback falharam ou atingiram o limite diário: ${lastError}`,
  );
}
