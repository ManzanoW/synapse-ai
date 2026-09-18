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

// Modelos Gemini suportados pelo SDK @google/genai com base nas cotas ativas da conta
const MODELS_CASCADE = [
  "gemini-3.5-flash-lite", // 500 RPD, 15 RPM - altíssima cota diária e velocidade
  "gemini-3.1-flash-lite", // 500 RPD, 15 RPM - excelente alternativa com 500 requisições/dia
  "gemini-3.6-flash",      // Modelo oficial recomendado pelo Google AI Studio
  "gemini-3.7-flash",      // Modelo de alta precisão
  "gemini-3.8-flash",      // Modelo avançado
  "gemini-3.5-flash",      // Fallback
  "gemini-3-flash",        // Fallback
  "gemini-2.5-flash-lite", // Fallback legado
];

export interface GeminiFallbackOptions {
  prompt?: string;
  contents?: unknown;
  config?: GenerateContentConfig;
  timeoutMs?: number;
}

/**
 * Executa chamadas com fallback transparente entre todos os modelos Gemini disponíveis.
 * Se o limite de cota diário (RPD), por minuto (RPM) ou modelo descontinuado (404) for atingido, comuta automaticamente.
 */
export async function generateContentWithFallback(
  options: GeminiFallbackOptions,
): Promise<{ text: string; usedModel: string }> {
  const { prompt, contents, config, timeoutMs = 90000 } = options;
  let lastError: unknown;

  const ai = getAIClient();

  for (const modelName of MODELS_CASCADE) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const requestContents = (contents ?? prompt ?? "") as any;

      const result = await ai.models.generateContent({
        model: modelName,
        contents: requestContents,
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
      const errorString = String(err).toLowerCase();
      const errObj = err as Record<string, unknown> | null | undefined;
      const status =
        (errObj?.status as number | string | undefined) ||
        (errObj?.code as number | string | undefined) ||
        ((errObj?.error as Record<string, unknown> | undefined)?.code as number | string | undefined);

      // Detecta erro 404 (modelo descontinuado/não encontrado), 429 (quota), 503 (sobrecarga), etc.
      const isUnavailableOrQuota =
        status === 404 ||
        status === "404" ||
        status === 429 ||
        status === "429" ||
        status === 503 ||
        status === "503" ||
        errorString.includes("404") ||
        errorString.includes("not_found") ||
        errorString.includes("not found") ||
        errorString.includes("no longer available") ||
        errorString.includes("unsupported") ||
        errorString.includes("is not supported") ||
        errorString.includes("does not exist") ||
        errorString.includes("429") ||
        errorString.includes("503") ||
        errorString.includes("resource_exhausted") ||
        errorString.includes("quota") ||
        errorString.includes("rate limit") ||
        errorString.includes("overloaded");

      if (isUnavailableOrQuota) {
        console.warn(
          `[Gemini Fallback] ${modelName} indisponível ou limite atingido (${status || "descontinuado/cota"}). Comutando para o próximo modelo...`,
        );
        // Pequena pausa para evitar rajada em conexões instáveis
        await new Promise((res) => setTimeout(res, 200));
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
