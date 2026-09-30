import { describe, it, expect } from "vitest";

interface RawQuizQuestion {
  id?: string;
  enunciado?: string;
  formato?: string;
  alternativas?: Array<{ id: string; texto: string } | string>;
  gabaritoCorreto?: string;
  justificativa?: string;
}

/**
 * Normaliza questões brutas armazenadas no banco de dados para a estrutura de impressão A4
 */
export function normalizeQuizForPrint(rawQuestions: RawQuizQuestion[], defaultSubject = "Conhecimentos Gerais") {
  return rawQuestions.map((q, idx) => {
    const isCertoErrado = q.formato === "certo_errado";
    const options = Array.isArray(q.alternativas)
      ? q.alternativas.map((a) => (typeof a === "string" ? a : a?.texto || ""))
      : [];

    return {
      id: q.id || `q-${idx}`,
      number: idx + 1,
      statement: q.enunciado || "",
      options,
      correctOption: q.gabaritoCorreto || "",
      subjectName: defaultSubject,
      format: isCertoErrado ? "certo_errado" : "multipla",
      justification: q.justificativa || "Gabarito oficial.",
    };
  });
}

describe("Quiz Print Normalization & Layout Formatting", () => {
  it("deve normalizar corretamente questões de múltipla escolha para modo papel/A4", () => {
    const rawQuestions: RawQuizQuestion[] = [
      {
        id: "q-1",
        enunciado: "De acordo com a CF/88, são poderes da União:",
        formato: "multipla",
        alternativas: [
          { id: "A", texto: "Executivo, Legislativo e Judiciário" },
          { id: "B", texto: "Executivo, Moderador e Judiciário" },
        ],
        gabaritoCorreto: "A",
        justificativa: "Artigo 2º da CF/88.",
      },
    ];

    const normalized = normalizeQuizForPrint(rawQuestions, "Direito Constitucional");
    expect(normalized).toHaveLength(1);
    expect(normalized[0].number).toBe(1);
    expect(normalized[0].subjectName).toBe("Direito Constitucional");
    expect(normalized[0].options).toEqual([
      "Executivo, Legislativo e Judiciário",
      "Executivo, Moderador e Judiciário",
    ]);
    expect(normalized[0].correctOption).toBe("A");
    expect(normalized[0].format).toBe("multipla");
  });

  it("deve lidar com questões no formato Certo/Errado (CEBRASPE)", () => {
    const rawQuestions: RawQuizQuestion[] = [
      {
        id: "q-ce-1",
        enunciado: "A soberania popular será exercida pelo sufrágio universal.",
        formato: "certo_errado",
        gabaritoCorreto: "C",
        justificativa: "Artigo 14 da CF/88.",
      },
    ];

    const normalized = normalizeQuizForPrint(rawQuestions);
    expect(normalized[0].format).toBe("certo_errado");
    expect(normalized[0].correctOption).toBe("C");
    expect(normalized[0].statement).toContain("soberania popular");
  });

  it("deve tolerar alternativas em formato de string plana sem falhar", () => {
    const rawQuestions: RawQuizQuestion[] = [
      {
        enunciado: "Questão com strings planas",
        alternativas: ["Opção 1", "Opção 2", "Opção 3"],
        gabaritoCorreto: "B",
      },
    ];

    const normalized = normalizeQuizForPrint(rawQuestions);
    expect(normalized[0].options).toEqual(["Opção 1", "Opção 2", "Opção 3"]);
    expect(normalized[0].number).toBe(1);
    expect(normalized[0].id).toBe("q-0");
  });
});
