import { describe, it, expect } from "vitest";
import {
  calculateBatchSizes,
  shuffleAlternatives,
  isCorrectAnswerMatch,
  normalizeQuestionData,
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

    it("deve limitar o total entre 1 e 60 por segurança", () => {
      const zeroBatch = calculateBatchSizes(0, 5);
      expect(zeroBatch.reduce((a, b) => a + b, 0)).toBe(1);

      const hugeBatch = calculateBatchSizes(100, 5);
      expect(hugeBatch.reduce((a, b) => a + b, 0)).toBe(60);
    });
  });

  describe("isCorrectAnswerMatch", () => {
    it("deve validar acertos com letras idênticas maiúsculas e minúsculas", () => {
      expect(isCorrectAnswerMatch("A", "A")).toBe(true);
      expect(isCorrectAnswerMatch("a", "A")).toBe(true);
      expect(isCorrectAnswerMatch("B", "b")).toBe(true);
      expect(isCorrectAnswerMatch("A", "B")).toBe(false);
    });

    it("deve tolerar pontuação ou espaços como 'A.' e ' A '", () => {
      expect(isCorrectAnswerMatch("A", "A.")).toBe(true);
      expect(isCorrectAnswerMatch(" B ", "B")).toBe(true);
      expect(isCorrectAnswerMatch("Alternativa C", "C")).toBe(true);
    });

    it("deve normalizar respostas do formato Certo/Errado flexivelmente", () => {
      expect(isCorrectAnswerMatch("Certo", "certo")).toBe(true);
      expect(isCorrectAnswerMatch("Certo", "CERTO")).toBe(true);
      expect(isCorrectAnswerMatch("C", "Certo")).toBe(true);
      expect(isCorrectAnswerMatch("Errado", "errado")).toBe(true);
      expect(isCorrectAnswerMatch("E", "Errado")).toBe(true);
      expect(isCorrectAnswerMatch("Certo", "Errado")).toBe(false);
    });
  });

  describe("normalizeQuestionData", () => {
    it("deve limpar e garantir maiúsculas no gabarito e alternativas de múltipla escolha", () => {
      const raw: QuestaoGerada = {
        enunciado: "Qual a duração do mandato?",
        formato: "multipla",
        justificativa: "Mandato de 4 anos.",
        alternativas: [
          { id: "a", texto: "2 anos" },
          { id: "b", texto: "4 anos" },
        ],
        gabaritoCorreto: "b.",
        flashcardFrente: "Duração?",
        flashcardVerso: "4 anos.",
      };

      const clean = normalizeQuestionData(raw);
      expect(clean.gabaritoCorreto).toBe("B");
      expect(clean.alternativas[0].id).toBe("A");
      expect(clean.alternativas[1].id).toBe("B");
    });

    it("deve padronizar Certo/Errado para 'Certo' ou 'Errado' exatos", () => {
      const rawCerto: QuestaoGerada = {
        enunciado: "A soberania é fundamento da RFB.",
        formato: "certo_errado",
        justificativa: "Art. 1º, I da CF/88.",
        alternativas: [],
        gabaritoCorreto: "CERTO",
        flashcardFrente: "Soberania é fundamento?",
        flashcardVerso: "Sim.",
      };

      expect(normalizeQuestionData(rawCerto).gabaritoCorreto).toBe("Certo");

      const rawErrado: QuestaoGerada = {
        ...rawCerto,
        gabaritoCorreto: "e",
      };
      expect(normalizeQuestionData(rawErrado).gabaritoCorreto).toBe("Errado");
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
      expect(res.alternativas).toEqual([]);
    });
  });
});
