// src/lib/error-taxonomy.ts

export const TAXONOMY_METADATA: Record<
  string,
  { label: string; color: string; desc: string }
> = {
  CONTENT_GAP: {
    label: "Teoria / Matéria Nova",
    color: "#8B5CF6", // Violeta
    desc: "Você ainda não viu essa matéria ou não se lembrou do conceito teórico.",
  },
  TRICK_QUESTION: {
    label: "Atenção / Pegadinha",
    color: "#F59E0B", // Âmbar
    desc: "Você sabia a matéria, mas caiu em um detalhe ou pegadinha da banca.",
  },
  INTERPRETATION: {
    label: "Interpretação do Enunciado",
    color: "#06B6D4", // Ciano
    desc: "Compreensão equivocada do que o comando da questão estava pedindo.",
  },
  TIME_PRESSURE: {
    label: "Falta de Tempo / Pressa",
    color: "#F43F5E", // Carmesim / Rose
    desc: "Marcou na correria por causa do relógio ou faltou tempo para pensar.",
  },
  UNCLASSIFIED: {
    label: "Outro Motivo",
    color: "#64748B", // Slate
    desc: "Erro registrado sem categoria específica selecionada.",
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
