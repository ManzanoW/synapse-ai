import { describe, it, expect } from "vitest";
import {
  calculateNextReview,
  normalizeGrade,
  isLeechCard,
  classifyCardMaturity,
  EvaluationRating,
} from "@/lib/spaced-repetition";

describe("Spaced Repetition Engine (FSRS / SM-2)", () => {
  describe("normalizeGrade", () => {
    it("deve normalizar corretamente valores numéricos de 1 a 4", () => {
      expect(normalizeGrade(1)).toBe(1);
      expect(normalizeGrade(2)).toBe(2);
      expect(normalizeGrade(3)).toBe(3);
      expect(normalizeGrade(4)).toBe(4);
    });

    it("deve normalizar strings de avaliação para os números correspondentes", () => {
      expect(normalizeGrade("AGAIN")).toBe(1);
      expect(normalizeGrade("HARD")).toBe(2);
      expect(normalizeGrade("GOOD")).toBe(3);
      expect(normalizeGrade("EASY")).toBe(4);
      expect(normalizeGrade("errei")).toBe(1);
      expect(normalizeGrade("dificil")).toBe(2);
      expect(normalizeGrade("facil")).toBe(4);
    });

    it("deve fazer fallback para 3 (GOOD) caso receba string desconhecida", () => {
      expect(normalizeGrade("INVALID_GRADE")).toBe(3);
      expect(normalizeGrade("desconhecido")).toBe(3);
    });
  });

  describe("calculateNextReview", () => {
    it("deve reiniciar o intervalo para 1 dia e reduzir estabilidade quando o aluno erra (grade 1 / AGAIN)", () => {
      const result = calculateNextReview({
        grade: EvaluationRating.AGAIN,
        repetitions: 5,
        previousInterval: 14,
        stability: 8.0,
        difficulty: 5.0,
      });

      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
      expect(result.stability).toBeLessThan(8.0);
      expect(result.nextReviewDate.getTime()).toBeGreaterThan(Date.now() - 1000);
    });

    it("deve aumentar o intervalo proporcionalmente quando o aluno acha fácil (grade 4 / EASY)", () => {
      const result = calculateNextReview({
        grade: EvaluationRating.EASY,
        repetitions: 2,
        previousInterval: 4,
        stability: 4.0,
        difficulty: 4.0,
      });

      expect(result.interval).toBeGreaterThan(4);
      expect(result.repetitions).toBe(3);
      expect(result.stability).toBeGreaterThan(4.0);
    });

    it("deve aplicar penalidade de retenção quando a matéria está abaixo da média crítica", () => {
      const regularResult = calculateNextReview({
        grade: EvaluationRating.GOOD,
        repetitions: 2,
        previousInterval: 3,
        stability: 3.0,
        difficulty: 5.0,
        subjectAccuracy: 85, // Alta precisão
      });

      const penalizedResult = calculateNextReview({
        grade: EvaluationRating.GOOD,
        repetitions: 2,
        previousInterval: 3,
        stability: 3.0,
        difficulty: 5.0,
        subjectAccuracy: 40, // Precisão crítica (< 65%)
      });

      expect(penalizedResult.isSubjectCriticalDeficit).toBe(true);
      expect(penalizedResult.interval).toBeLessThanOrEqual(regularResult.interval);
    });
  });

  describe("isLeechCard", () => {
    it("deve identificar um card como sanguessuga (leech) se tiver 3 ou mais lapsos e poucas repetições", () => {
      expect(isLeechCard(4, 1)).toBe(true);
      expect(isLeechCard(3, 2)).toBe(true);
      expect(isLeechCard(1, 5)).toBe(false);
    });
  });

  describe("classifyCardMaturity", () => {
    it("deve classificar corretamente cada estágio de maturidade (NEW, LEARNING, MATURE)", () => {
      expect(classifyCardMaturity(0, 1.0)).toBe("NEW");
      expect(classifyCardMaturity(2, 5.0)).toBe("LEARNING");
      expect(classifyCardMaturity(5, 25.0)).toBe("MATURE");
    });
  });
});
