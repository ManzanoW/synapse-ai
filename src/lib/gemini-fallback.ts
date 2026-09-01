// src/lib/gemini-fallback.ts

import { GoogleGenAI, GenerateContentConfig } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// 🔗 Lista completa ordenada por prioridade estratégica (Cota alta primeiro, modelos menores depois)
const MODELS_CASCADE = [
  // Camada 1: Grande Volume (1.000 requisições/dia somadas)
  "gemini-3.7-flash-lite", // 500 RPD | 15 RPM
  "gemini-3.5-flash-lite", // 500 RPD | 15 RPM
  "gemini-3.1-flash-lite", // 500 RPD | 15 RPM

  // Camada 2: Modelos Flash Modernos (+60 requisições/dia)
  "gemini-3.7-flash", // 20 RPD  | 5 RPM
  "gemini-3.6-flash", // 20 RPD  | 5 RPM
  "gemini-3.5-flash", // 20 RPD  | 5 RPM

  // Camada 3: Modelos de Suporte e Emergência (+40 requisições/dia)
  "gemini-3-flash", // 20 RPD  | 5 RPM
  "gemini-2.5-flash-lite", // 20 RPD  | 10 RPM
  "gemini-2.5-flash", // 20 RPD  | 5 RPM
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

  for (const modelName of MODELS_CASCADE) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const result = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.3,
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
    `Todos os 8 modelos Gemini da cadeia de fallback falharam ou atingiram o limite diário: ${lastError}`,
  );
}
