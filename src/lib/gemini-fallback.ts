// src/lib/gemini-fallback.ts

import { GoogleGenAI, GenerateContentConfig } from "@google/genai";

interface ApiKeySlot {
  key: string;
  maskedKey: string;
  client: GoogleGenAI;
  cooldownUntil: number;
}

let keySlots: ApiKeySlot[] = [];
let currentSlotIndex = 0;

/**
 * Inicializa e gerencia o pool de múltiplas chaves de API do Google Gemini.
 * Suporta:
 * 1. GEMINI_API_KEYS (lista separada por vírgula no .env: key1,key2,key3)
 * 2. GEMINI_API_KEY (chave única padrão)
 * 3. GEMINI_API_KEY_1 até GEMINI_API_KEY_10 (chaves indexadas)
 */
function initializeKeySlots(): ApiKeySlot[] {
  if (keySlots.length > 0) return keySlots;

  const rawKeys: string[] = [];

  // 1. Suporte a lista separada por vírgula
  if (process.env.GEMINI_API_KEYS) {
    const split = process.env.GEMINI_API_KEYS.split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    rawKeys.push(...split);
  }

  // 2. Suporte a chave padrão
  if (process.env.GEMINI_API_KEY) {
    rawKeys.push(process.env.GEMINI_API_KEY.trim());
  }

  // 3. Suporte a chaves numeradas
  for (let i = 1; i <= 10; i++) {
    const indexedKey = process.env[`GEMINI_API_KEY_${i}`];
    if (indexedKey) {
      rawKeys.push(indexedKey.trim());
    }
  }

  // Remove duplicatas e strings vazias
  const uniqueKeys = Array.from(new Set(rawKeys.filter(Boolean)));

  if (uniqueKeys.length === 0) {
    throw new Error(
      "Nenhuma chave GEMINI_API_KEY configurada. Configure GEMINI_API_KEY ou GEMINI_API_KEYS no ambiente ou em .env.",
    );
  }

  keySlots = uniqueKeys.map((key) => {
    const maskedKey =
      key.length > 8
        ? `${key.slice(0, 4)}...${key.slice(-4)}`
        : "***";

    return {
      key,
      maskedKey,
      client: new GoogleGenAI({ apiKey: key }),
      cooldownUntil: 0,
    };
  });

  return keySlots;
}

/**
 * Retorna os slots de chaves ordenados por rodízio (Round-Robin),
 * priorizando chaves que não estejam em cooldown temporário por 429/cota.
 */
function getOrderedKeySlots(): ApiKeySlot[] {
  const slots = initializeKeySlots();
  const now = Date.now();

  const available = slots.filter((s) => s.cooldownUntil <= now);
  const poolToUse = available.length > 0 ? available : slots;

  const ordered: ApiKeySlot[] = [];
  for (let i = 0; i < poolToUse.length; i++) {
    const idx = (currentSlotIndex + i) % poolToUse.length;
    ordered.push(poolToUse[idx]);
  }

  currentSlotIndex = (currentSlotIndex + 1) % poolToUse.length;
  return ordered;
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
  preferredModels?: string[];
}

/**
 * Executa chamadas com tolerância a falhas bidimensional:
 * 1. Rodízio e comutação automática entre múltiplas chaves de API (Multi-Key Pool).
 * 2. Cascata e fallback automático entre modelos Gemini caso uma cota esgote.
 */
export async function generateContentWithFallback(
  options: GeminiFallbackOptions,
): Promise<{ text: string; usedModel: string }> {
  const { prompt, contents, config, timeoutMs = 90000, preferredModels } = options;
  let lastError: unknown;

  const modelsToTry = preferredModels && preferredModels.length > 0
    ? Array.from(new Set([...preferredModels, ...MODELS_CASCADE]))
    : MODELS_CASCADE;

  const slots = getOrderedKeySlots();

  for (const modelName of modelsToTry) {
    for (const slot of slots) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const requestContents = (contents ?? prompt ?? "") as any;

        const result = await slot.client.models.generateContent({
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
          throw new Error(`Modelo ${modelName} retornou conteúdo vazio na chave ${slot.maskedKey}.`);
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

        // Detecta erro de cota / rate limit (429, resource_exhausted, etc.)
        const isQuotaOrRateLimit =
          status === 429 ||
          status === "429" ||
          errorString.includes("429") ||
          errorString.includes("resource_exhausted") ||
          errorString.includes("quota") ||
          errorString.includes("rate limit") ||
          errorString.includes("overloaded");

        if (isQuotaOrRateLimit) {
          // Penaliza temporariamente esta chave com 60s de cooldown e comuta para a próxima
          slot.cooldownUntil = Date.now() + 60 * 1000;
          console.warn(
            `[Gemini Multi-Key Pool] Chave ${slot.maskedKey} atingiu limite temporário no modelo ${modelName}. Comutando chave...`,
          );
          await new Promise((res) => setTimeout(res, 100));
          continue; // Tenta o mesmo modelo na próxima chave disponível
        }

        // Detecta modelo descontinuado ou 404 (passa para o próximo modelo da cascata)
        const isModelUnavailable =
          status === 404 ||
          status === "404" ||
          status === 503 ||
          status === "503" ||
          errorString.includes("404") ||
          errorString.includes("not_found") ||
          errorString.includes("not found") ||
          errorString.includes("no longer available") ||
          errorString.includes("unsupported") ||
          errorString.includes("is not supported") ||
          errorString.includes("does not exist");

        if (isModelUnavailable) {
          console.warn(
            `[Gemini Multi-Key Pool] Modelo ${modelName} indisponível (${status || "404"}). Comutando para próximo modelo...`,
          );
          break; // Sai do loop de chaves para tentar o próximo modelo
        }

        // Se for outro erro (ex: validação de formato), comuta de chave para tentar novamente
        console.warn(`[Gemini Fallback] Erro na chave ${slot.maskedKey} (${modelName}):`, err);
        continue;
      }
    }
  }

  throw new Error(
    `Todos os ${MODELS_CASCADE.length} modelos Gemini e ${slots.length} chaves de API falharam ou atingiram o limite: ${lastError}`,
  );
}
