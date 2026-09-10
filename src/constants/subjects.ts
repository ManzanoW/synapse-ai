export interface SubjectTheme {
  name: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const SUBJECT_PALETTE: Record<string, SubjectTheme> = {
  DESENVOLVIMENTO: {
    name: "Desenvolvimento / Arquitetura",
    hex: "#3B82F6",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/20",
  },
  TESTES: {
    name: "Testes / Qualidade",
    hex: "#10B981",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/20",
  },
  METODOLOGIAS: {
    name: "Metodologias / Requisitos",
    hex: "#8B5CF6",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-400",
    borderClass: "border-purple-500/20",
  },
  FRONTEND: {
    name: "Frontend / UX",
    hex: "#F59E0B",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/20",
  },
  SEGURANCA: {
    name: "Redes / Segurança",
    hex: "#EC4899",
    bgClass: "bg-pink-500/10",
    textClass: "text-pink-400",
    borderClass: "border-pink-500/20",
  },
};

// Array simples de Hex para o Prompt/Schema da IA utilizar no cadastro
export const PRESET_HEX_COLORS = Object.values(SUBJECT_PALETTE).map(
  (item) => item.hex,
);
