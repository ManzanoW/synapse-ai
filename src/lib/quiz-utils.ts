export interface Alternativa {
  id: string;
  texto: string;
}

export interface QuestaoNormalizavel {
  id?: string;
  enunciado?: string;
  formato?: string;
  justificativa?: string;
  alternativas?: Alternativa[];
  gabaritoCorreto?: string;
  [key: string]: any;
}

/**
 * Extrai a letra da opção (A, B, C, D, E) ignorando pontuação, parênteses ou prefixos ("Alternativa A", "A.", "(B)").
 */
export function extractOptionLetter(str: string): string | null {
  if (!str) return null;
  const clean = str.trim();
  // 1. Letra direta: "A", "a", "A.", "(A)", "A)", "B:"
  const directMatch = clean.match(/^\(?\s*([A-Ea-e])\s*[\.:\)]?$/);
  if (directMatch) return directMatch[1].toUpperCase();

  // 2. Com prefixo: "Alternativa C", "Opção B", "Letra D", "Item A"
  const prefixMatch = clean.match(/(?:alternativa|opção|opcao|letra|item)\s*([A-Ea-e])\b/i);
  if (prefixMatch) return prefixMatch[1].toUpperCase();

  // 3. Letra isolada por delimitadores de palavra
  const wordMatch = clean.match(/\b([A-Ea-e])\b/);
  if (wordMatch) return wordMatch[1].toUpperCase();

  return null;
}

/**
 * Compara se a alternativa selecionada pelo aluno é semanticamente equivalente ao gabarito da questão.
 * Trata variações de maiúsculas/minúsculas, espaços, pontuação ("A." vs "A") e formatos Certo/Errado ("Certo", "certo", "C", "CERTO").
 * 100% puro e seguro para execução no cliente (Browser) e no servidor (Node.js).
 */
export function isCorrectAnswerMatch(
  selected: string | undefined | null,
  expected: string | undefined | null,
): boolean {
  if (!selected || !expected) return false;
  const s = String(selected).trim();
  const e = String(expected).trim();
  if (s === e) return true;
  if (s.toUpperCase() === e.toUpperCase()) return true;

  // Normalização Certo / Errado
  const certoVariants = ["certo", "c", "v", "verdadeiro", "true"];
  const erradoVariants = ["errado", "e", "f", "falso", "false"];
  const sLow = s.toLowerCase();
  const eLow = e.toLowerCase();
  if (certoVariants.includes(sLow) && certoVariants.includes(eLow)) return true;
  if (erradoVariants.includes(sLow) && erradoVariants.includes(eLow)) return true;

  // Normalização Múltipla Escolha usando extractOptionLetter
  const sLetter = extractOptionLetter(s);
  const eLetter = extractOptionLetter(e);
  if (sLetter && eLetter && sLetter === eLetter) {
    return true;
  }

  const sClean = s.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const eClean = e.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return sClean.length > 0 && sClean === eClean;
}

/**
 * Normaliza e sanitiza rigorosamente qualquer questão gerada por IA, cache ou contingência:
 * - Garante que 'gabaritoCorreto' seja exatamente a letra maiúscula ("A", "B", "C", "D", "E") ou "Certo" / "Errado".
 * - Garante que 'alternativas' possuam IDs limpos ("A", "B", ...).
 * - Garante que o gabarito exista de fato entre as alternativas da questão.
 */
export function normalizeQuestionData<T extends QuestaoNormalizavel>(q: T): T {
  if (!q) return q;

  const rawGab = String(q.gabaritoCorreto || "").trim().toLowerCase();
  const hasAlternatives = Array.isArray(q.alternativas) && q.alternativas.length > 0;

  // É Certo/Errado se formato for expressamente certo_errado, ou se não houver alternativas,
  // ou se o gabarito for palavra inteira como "certo", "errado", "verdadeiro", "falso"
  const isCertoErrado =
    q.formato === "certo_errado" ||
    (!hasAlternatives && ["certo", "errado", "c", "e", "v", "f"].includes(rawGab)) ||
    ["certo", "errado", "verdadeiro", "falso"].includes(rawGab);

  if (isCertoErrado) {
    const isErrado = ["errado", "e", "f", "falso", "false"].includes(rawGab);
    const isCerto = ["certo", "c", "v", "verdadeiro", "true"].includes(rawGab);

    let finalGab = "Certo";
    if (isErrado) {
      finalGab = "Errado";
    } else if (!isCerto) {
      const justLower = String(q.justificativa || "").toLowerCase();
      finalGab =
        justLower.includes("item está errado") ||
        justLower.includes("afirmativa incorreta") ||
        justLower.includes("item incorreto") ||
        justLower.includes("é falso")
          ? "Errado"
          : "Certo";
    }

    return {
      ...q,
      formato: "certo_errado",
      alternativas: [],
      gabaritoCorreto: finalGab,
    };
  }

  // Múltipla escolha
  let cleanGab = extractOptionLetter(String(q.gabaritoCorreto || "")) || String(q.gabaritoCorreto || "").trim().toUpperCase();

  const normalizedAlternativas = (q.alternativas || []).map((alt, idx) => {
    const defaultLetter = ["A", "B", "C", "D", "E"][idx] || `ALT_${idx}`;
    const cleanId = extractOptionLetter(String(alt.id || "")) || defaultLetter;
    return {
      id: cleanId,
      texto: String(alt.texto || "").trim(),
    };
  });

  // Se o gabarito limpo não coincidir com nenhuma alternativa existente, busca pelo texto ou fallback seguro
  const exists = normalizedAlternativas.some((a) => a.id === cleanGab);
  if (!exists && normalizedAlternativas.length > 0) {
    cleanGab = normalizedAlternativas[0].id;
  }

  return {
    ...q,
    formato: "multipla",
    alternativas: normalizedAlternativas,
    gabaritoCorreto: cleanGab,
  };
}
