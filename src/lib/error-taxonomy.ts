// src/lib/error-taxonomy.ts

export const TAXONOMY_METADATA: Record<
  string,
  { label: string; color: string; desc: string }
> = {
  CONTENT_GAP: {
    label: "Lacuna Teórica",
    color: "#8B5CF6", // Violeta
    desc: "Desconhecimento ou esquecimento do conceito teórico.",
  },
  TRICK_QUESTION: {
    label: "Falta de Atenção / Pegadinha",
    color: "#F59E0B", // Âmbar
    desc: "Atenção desviada por detalhe ou pegadinha da banca.",
  },
  INTERPRETATION: {
    label: "Erro de Interpretação",
    color: "#06B6D4", // Ciano
    desc: "Compreensão equivocada do comando ou enunciado.",
  },
  TIME_PRESSURE: {
    label: "Pressão de Tempo",
    color: "#F43F5E", // Carmesim / Rose
    desc: "Pressa ou falta de tempo para raciocinar com calma.",
  },
  UNCLASSIFIED: {
    label: "Geral / Não Classificado",
    color: "#64748B", // Slate
    desc: "Erro registrado sem categoria taxonômica específica.",
  },
};

// Normalizador unificado de taxonomia
export function normalizeTaxonomy(reason?: string | null): string {
  if (!reason) return "UNCLASSIFIED";
  const r = reason.toUpperCase().trim();
  if (r === "THEORY_GAP" || r === "CONTENT_GAP" || r === "LACUNA TEÓRICA") {
    return "CONTENT_GAP";
  }
  if (r === "ATTENTION_LAPSE" || r === "TRICK_QUESTION" || r === "FALTA DE ATENÇÃO") {
    return "TRICK_QUESTION";
  }
  if (r === "MISINTERPRETATION" || r === "INTERPRETATION" || r === "ERRO DE INTERPRETAÇÃO") {
    return "INTERPRETATION";
  }
  if (r === "TIME_PRESSURE" || r === "PRESSÃO DE TEMPO") {
    return "TIME_PRESSURE";
  }
  return "UNCLASSIFIED";
}
