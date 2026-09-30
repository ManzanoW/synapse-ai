import { describe, it, expect } from "vitest";
import {
  SubmitQuizAttemptSchema,
  ReviewFlashcardSchema,
  ConvertErrorToFlashcardSchema,
  RecordStudyActivitySchema,
} from "@/lib/validations";

describe("Runtime Zod Validation Schemas", () => {
  describe("SubmitQuizAttemptSchema", () => {
    it("deve aceitar um payload de simulado válido", () => {
      const validPayload = {
        title: "Simulado Constitucional",
        totalQuestions: 10,
        correctAnswers: 8,
        timeSpentSeconds: 300,
        answers: [],
      };

      const result = SubmitQuizAttemptSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("deve rejeitar se o número de acertos for maior que o total de questões", () => {
      const invalidPayload = {
        title: "Simulado Inválido",
        totalQuestions: 5,
        correctAnswers: 10, // Impossível
        timeSpentSeconds: 120,
        answers: [],
      };

      const result = SubmitQuizAttemptSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "respostas corretas não pode exceder o total de questões",
        );
      }
    });

    it("deve rejeitar se o total de questões for zero ou negativo", () => {
      const zeroQuestions = {
        totalQuestions: 0,
        correctAnswers: 0,
        timeSpentSeconds: 10,
      };

      expect(SubmitQuizAttemptSchema.safeParse(zeroQuestions).success).toBe(false);
    });
  });

  describe("ReviewFlashcardSchema", () => {
    it("deve validar ratings e grades numéricos entre 1 e 4", () => {
      expect(
        ReviewFlashcardSchema.safeParse({ cardId: "card-123", rating: 3 }).success,
      ).toBe(true);
      expect(
        ReviewFlashcardSchema.safeParse({ cardId: "card-123", rating: 5 }).success,
      ).toBe(false);
    });

    it("deve rejeitar cardId vazio", () => {
      expect(ReviewFlashcardSchema.safeParse({ cardId: "" }).success).toBe(false);
    });

    it("deve rejeitar tempo de resposta negativo ou superior a 10 minutos", () => {
      expect(
        ReviewFlashcardSchema.safeParse({
          cardId: "c1",
          responseTimeMs: -10,
        }).success,
      ).toBe(false);

      expect(
        ReviewFlashcardSchema.safeParse({
          cardId: "c1",
          responseTimeMs: 700000, // > 600000ms
        }).success,
      ).toBe(false);
    });
  });

  describe("ConvertErrorToFlashcardSchema", () => {
    it("deve validar errorId não vazio", () => {
      expect(
        ConvertErrorToFlashcardSchema.safeParse({ errorId: "err-1" }).success,
      ).toBe(true);
      expect(
        ConvertErrorToFlashcardSchema.safeParse({ errorId: "" }).success,
      ).toBe(false);
    });
  });

  describe("RecordStudyActivitySchema", () => {
    it("deve validar atividade de estudo dentro dos limites seguros de XP", () => {
      expect(
        RecordStudyActivitySchema.safeParse({
          userId: "user-1",
          earnedXp: 50,
          activityType: "QUIZ",
          durationMinutes: 15,
        }).success,
      ).toBe(true);

      // Rejeita injeção de XP exorbitante (> 1000)
      expect(
        RecordStudyActivitySchema.safeParse({
          userId: "user-1",
          earnedXp: 999999,
          activityType: "QUIZ",
        }).success,
      ).toBe(false);

      // Rejeita XP negativo
      expect(
        RecordStudyActivitySchema.safeParse({
          userId: "user-1",
          earnedXp: -50,
        }).success,
      ).toBe(false);
    });
  });
});
