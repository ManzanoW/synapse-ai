import { describe, it, expect } from "vitest";
import {
  calculateBatchSizes,
  shuffleAlternatives,
  QuestaoGerada,
} from "@/lib/simulado-generator";

describe("Simulado Generator Engine", () => {
  describe("calculateBatchSizes", () => {
    it("deve dividir 20 questões em lotes balanceados de até 5", () => {
      const batches = calculateBatchSizes(20, 5);
      expect(batches).toEqual([5, 5, 5, 5]);
      expect(batches.reduce((a, b) => a + b, 0)).toBe(20);
    });

    it("deve dividir 12 questões em [5, 5, 2]", () => {
      const batches = calculateBatchSizes(12, 5);
      expect(batches).toEqual([5, 5, 2]);
      expect(batches.reduce((a, b) => a + b, 0)).toBe(12);
    });

    it("deve retornar um único lote quando a quantidade for menor ou igual ao tamanho do lote", () => {
      expect(calculateBatchSizes(3, 5)).toEqual([3]);
      expect(calculateBatchSizes(5, 5)).toEqual([5]);
    });

    it("deve limitar o total entre 1 e 30 por segurança", () => {
      const zeroBatch = calculateBatchSizes(0, 5);
      expect(zeroBatch.reduce((a, b) => a + b, 0)).toBe(1);

      const hugeBatch = calculateBatchSizes(100, 5);
      expect(hugeBatch.reduce((a, b) => a + b, 0)).toBe(30);
    });
  });

  describe("shuffleAlternatives", () => {
    it("deve preservar o texto do gabarito correto após o embaralhamento de alternativas", () => {
      const sampleQuestion: QuestaoGerada = {
        enunciado: "Qual é a capital do Brasil?",
        formato: "multipla",
        justificativa: "Brasília é a capital federal.",
        alternativas: [
          { id: "A", texto: "São Paulo" },
          { id: "B", texto: "Rio de Janeiro" },
          { id: "C", texto: "Brasília" },
          { id: "D", texto: "Belo Horizonte" },
        ],
        gabaritoCorreto: "C", // Brasília
        flashcardFrente: "Capital do Brasil?",
        flashcardVerso: "Brasília.",
      };

      const [shuffled] = shuffleAlternatives([sampleQuestion]);

      // Encontra o texto da alternativa apontada pelo novo gabarito
      const matchingAlt = shuffled.alternativas.find(
        (alt) => alt.id === shuffled.gabaritoCorreto,
      );

      // Deve continuar sendo "Brasília", independentemente da nova letra (A, B, C ou D)
      expect(matchingAlt?.texto).toBe("Brasília");
      expect(shuffled.alternativas.length).toBe(4);
    });

    it("não deve alterar questões que não sejam do formato de múltipla escolha", () => {
      const certoErrado: QuestaoGerada = {
        enunciado: "O prazo decadencial não se suspende nem se interrompe.",
        formato: "certo_errado",
        justificativa: "Regra do Código Civil.",
        alternativas: [
          { id: "Certo", texto: "Certo" },
          { id: "Errado", texto: "Errado" },
        ],
        gabaritoCorreto: "Certo",
        flashcardFrente: "Decadência se suspende?",
        flashcardVerso: "Não.",
      };

      const [res] = shuffleAlternatives([certoErrado]);
      expect(res.gabaritoCorreto).toBe("Certo");
      expect(res.alternativas).toEqual(certoErrado.alternativas);
    });
  });
});
