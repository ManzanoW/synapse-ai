/**
 * Utilitários para higienização e calibração de texto transcrito de redações manuscritas (OCR).
 */

/**
 * Higieniza o texto transcrito da caligrafia, corrigindo desvios paleográficos comuns
 * do português brasileiro (ex: 's' cursivo com laço ascendente confundido com 'k' em clíticos/mesóclises).
 */
export function sanitizeOcrTranscription(rawText: string): string {
  if (!rawText) return "";

  let text = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trimEnd();

  // 1. Corrige mesóclises com 'k' no lugar de 'se': ex: poder-k-á -> poder-se-á, far-k-á -> far-se-á
  text = text.replace(/\b([a-zA-Zá-úÁ-Ú]+)-[kK]-([a-zá-ú]+)\b/g, "$1-se-$2");

  // 2. Corrige ênclises com 'k' no lugar de 'se': ex: configura-k -> configura-se, ob-serva-k -> ob-serva-se, encaixa-k -> encaixa-se
  text = text.replace(/\b([a-zA-Zá-úÁ-Ú]+)-[kK]\b/g, "$1-se");

  // 3. Corrige o pronome/conjunção 'se' isolado que foi lido como 'k':
  // Ex: "uma vez que, k um indivíduo" -> "uma vez que, se um indivíduo"
  text = text.replace(
    /\b([kK])\s+(um|uma|o|a|os|as|não|se|ele|ela|eles|elas|alguém|qualquer|todos|todas|muitos|poucos|esse|essa|este|esta|aquele|aquela|for|tiver|houver|puder|quiser)\b/gi,
    "se $2"
  );

  // 4. Casos pontuais conhecidos de desvio de caligrafia
  text = text.replace(/\bkja\b/gi, "seja");
  text = text.replace(/\bexercercromptend\b/gi, "exercer");
  text = text.replace(/\bde surdas matriculados\b/gi, "de surdos matriculados");
  text = text.replace(/\bencaixa-se no teoria\b/gi, "encaixa-se na teoria");

  return text;
}
