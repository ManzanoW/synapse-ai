import { describe, it, expect } from "vitest";
import { LEI_SECA_ARTIGOS } from "@/lib/lei-seca-data";
import { POCKET_SUMMARY_DATA } from "@/lib/pocket-summary-data";
import { PRECEDENT_DUELS } from "@/lib/precedent-duel-data";

describe("Usability & High-Yield Features", () => {
  describe("Feature 1: Lei Seca Interativa (Active Recall)", () => {
    it("deve conter artigos cadastrados com termos ocultáveis em múltiplos níveis", () => {
      expect(LEI_SECA_ARTIGOS.length).toBeGreaterThan(0);
      for (const article of LEI_SECA_ARTIGOS) {
        expect(article.id).toBeDefined();
        expect(article.lei).toBeDefined();
        expect(article.artigoNumero).toBeDefined();
        expect(article.caput.length).toBeGreaterThan(10);
        expect(article.termosOcultaveis.length).toBeGreaterThan(0);
        expect(article.termosOcultaveis[0].nivel).toBeGreaterThanOrEqual(1);
        expect(article.termosOcultaveis[0].nivel).toBeLessThanOrEqual(4);
      }
    });

    it("deve conter pegadinhas de banca e mnemônicos mapeados para os artigos", () => {
      const withBankTrap = LEI_SECA_ARTIGOS.filter((a) => a.pegadinhaBanca);
      expect(withBankTrap.length).toBeGreaterThan(0);
      const withMnemonics = LEI_SECA_ARTIGOS.filter((a) => a.mnemonico);
      expect(withMnemonics.length).toBeGreaterThan(0);
    });
  });

  describe("Feature 3: Folha de Véspera em PDF de Bolso", () => {
    it("deve fornecer itens de resumo categorizados em prazos, mnemônicos e pegadinhas", () => {
      expect(POCKET_SUMMARY_DATA.length).toBeGreaterThan(0);
      const categories = new Set(POCKET_SUMMARY_DATA.map((item) => item.category));
      expect(categories.has("prazos")).toBe(true);
      expect(categories.has("mnemonicos")).toBe(true);
      expect(categories.has("sumulas")).toBe(true);
      expect(categories.has("pegadinhas")).toBe(true);
    });

    it("cada item deve possuir título, destaque e descrição claros", () => {
      for (const item of POCKET_SUMMARY_DATA) {
        expect(item.id).toBeDefined();
        expect(item.title.length).toBeGreaterThan(0);
        expect(item.highlight.length).toBeGreaterThan(0);
        expect(item.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Feature 5: Duelo de Precedentes STF/STJ", () => {
    it("deve conter casos práticos com fundamentação oficial e apenas uma opção correta", () => {
      expect(PRECEDENT_DUELS.length).toBeGreaterThan(0);
      for (const duel of PRECEDENT_DUELS) {
        expect(["STF", "STJ", "STF/STJ"]).toContain(duel.tribunal);
        expect(duel.scenario.length).toBeGreaterThan(20);
        expect(duel.question.length).toBeGreaterThan(5);
        expect(duel.rationale.length).toBeGreaterThan(20);
        expect(duel.citation.length).toBeGreaterThan(5);
        // Exatamente uma opção deve ser correta
        const correctCount =
          (duel.optionA.isCorrect ? 1 : 0) + (duel.optionB.isCorrect ? 1 : 0);
        expect(correctCount).toBe(1);
      }
    });
  });
});
