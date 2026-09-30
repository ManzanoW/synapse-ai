import { describe, it, expect } from "vitest";
import { calculateBancaScore } from "@/lib/discursiva-evaluator";
import { EvaluateDiscursivaSchema } from "@/lib/validations/discursiva.schema";

describe("Discursiva Evaluator & Banca Scoring Formulas", () => {
  describe("calculateBancaScore - CEBRASPE Formula", () => {
    it("deve calcular pontuação exata pela fórmula NF = NC - 2*(NE/TL)", () => {
      // NC = 90, NE = 3, TL = 30 -> Desconto = 2 * (3 / 30) = 0.20 -> NF = 89.80
      const result = calculateBancaScore({
        banca: "CEBRASPE",
        notaConteudo: 90,
        numeroErros: 3,
        actualLineCount: 30,
      });

      expect(result.finalScore).toBe(89.8);
      expect(result.descontoFormal).toBe(0.2);
      expect(result.isApproved).toBe(true);
      expect(result.formulaName).toContain("CEBRASPE");
    });

    it("deve proteger contra divisão por zero se actualLineCount for zero", () => {
      const result = calculateBancaScore({
        banca: "CESPE/UnB",
        notaConteudo: 80,
        numeroErros: 2,
        actualLineCount: 0,
      });

      expect(Number.isFinite(result.finalScore)).toBe(true);
      expect(Number.isNaN(result.finalScore)).toBe(false);
      expect(result.descontoFormal).toBe(4); // 2 * 2 / 1 = 4
      expect(result.finalScore).toBe(76);
    });

    it("não deve permitir nota final negativa mesmo com excesso de erros formais", () => {
      const result = calculateBancaScore({
        banca: "CEBRASPE",
        notaConteudo: 20,
        numeroErros: 50,
        actualLineCount: 20,
      });

      expect(result.finalScore).toBeGreaterThanOrEqual(0);
      expect(result.isApproved).toBe(false);
    });
  });

  describe("calculateBancaScore - FGV Formula", () => {
    it("deve pontuar no modelo Parte I (Conteúdo/60) + Parte II (Expressão/40 com -1.0 por erro)", () => {
      // NC = 100 -> Conteúdo = 60; NE = 4 -> Expressão = 40 - 4 = 36; NF = 96
      const result = calculateBancaScore({
        banca: "FGV",
        notaConteudo: 100,
        numeroErros: 4,
        actualLineCount: 28,
      });

      expect(result.finalScore).toBe(96);
      expect(result.descontoFormal).toBe(4);
      expect(result.formulaName).toContain("FGV");
      expect(result.isApproved).toBe(true);
    });

    it("deve limitar a nota de expressão no mínimo zero na FGV", () => {
      // NE = 60 -> Desconto = 60, mas Parte II tem base 40 -> Expressão = 0; Conteúdo (80% de 60 = 48) -> NF = 48
      const result = calculateBancaScore({
        banca: "FGV Projetos",
        notaConteudo: 80,
        numeroErros: 60,
        actualLineCount: 30,
      });

      expect(result.finalScore).toBe(48);
      expect(result.isApproved).toBe(false);
    });
  });

  describe("calculateBancaScore - FCC Formula", () => {
    it("deve aplicar critério tripartite FCC: Conteúdo(40) + Estrutura(30) + Expressão(30 com -0.75/erro)", () => {
      // NC = 100 -> Conteúdo = 40; Estrutura = 30; NE = 4 -> Desconto = 3.0 -> Expressão = 27; NF = 97
      const result = calculateBancaScore({
        banca: "Fundação Carlos Chagas (FCC)",
        notaConteudo: 100,
        numeroErros: 4,
        actualLineCount: 30,
      });

      expect(result.finalScore).toBe(97);
      expect(result.descontoFormal).toBe(3);
      expect(result.formulaName).toContain("FCC");
    });
  });

  describe("calculateBancaScore - Banca Geral / VUNESP", () => {
    it("deve aplicar fórmula padrão ponderada 70% tema e 30% gramática", () => {
      const result = calculateBancaScore({
        banca: "VUNESP",
        notaConteudo: 90,
        numeroErros: 2,
        actualLineCount: 25,
      });

      // 90 * 70% = 63; 30 - 2 = 28; NF = 91
      expect(result.finalScore).toBe(91);
      expect(result.descontoFormal).toBe(2);
      expect(result.formulaName).toContain("VUNESP");
    });
  });

  describe("EvaluateDiscursivaSchema Zod Validation", () => {
    it("deve aceitar payload discursivo completo e válido", () => {
      const validPayload = {
        themeTitle: "O Impacto da Inteligência Artificial no Processo Judicial",
        banca: "CEBRASPE",
        subjectArea: "Direito Processual Civil",
        content: "A inteligência artificial tem promovido mudanças paradigmáticas no Poder Judiciário brasileiro. ".repeat(3),
        lineCount: 30,
        wordCount: 250,
      };

      const parsed = EvaluateDiscursivaSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.banca).toBe("CEBRASPE");
        expect(parsed.data.subjectArea).toBe("Direito Processual Civil");
      }
    });

    it("deve rejeitar redações com menos de 50 caracteres", () => {
      const tooShortPayload = {
        themeTitle: "Tema Válido Qualquer",
        content: "Texto com poucas palavras.",
      };

      const parsed = EvaluateDiscursivaSchema.safeParse(tooShortPayload);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain("no mínimo 50 caracteres");
      }
    });

    it("deve rejeitar tema muito curto (< 3 caracteres)", () => {
      const invalidTheme = {
        themeTitle: "AI",
        content: "Texto longo o suficiente para passar no teste de contagem mínima de caracteres da redação.",
      };

      const parsed = EvaluateDiscursivaSchema.safeParse(invalidTheme);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain("pelo menos 3 caracteres");
      }
    });
  });
});
