import { describe, it, expect } from "vitest";
import { calculateJitterDelay } from "@/lib/gemini-fallback";

describe("Gemini AI Pool Resilience & Full Jitter Backoff", () => {
  describe("calculateJitterDelay (Full Jitter Exponential Backoff)", () => {
    it("deve calcular exponencialmente com jitter determinístico (randomFn = 0.5)", () => {
      const mockRandom = () => 0.5;

      // Tentativa 0: 400 * 2^0 = 400 -> 0.5 * 400 = 200ms
      expect(calculateJitterDelay(0, 400, 8000, mockRandom)).toBe(200);

      // Tentativa 1: 400 * 2^1 = 800 -> 0.5 * 800 = 400ms
      expect(calculateJitterDelay(1, 400, 8000, mockRandom)).toBe(400);

      // Tentativa 2: 400 * 2^2 = 1600 -> 0.5 * 1600 = 800ms
      expect(calculateJitterDelay(2, 400, 8000, mockRandom)).toBe(800);

      // Tentativa 3: 400 * 2^3 = 3200 -> 0.5 * 3200 = 1600ms
      expect(calculateJitterDelay(3, 400, 8000, mockRandom)).toBe(1600);

      // Tentativa 4: 400 * 2^4 = 6400 -> 0.5 * 6400 = 3200ms
      expect(calculateJitterDelay(4, 400, 8000, mockRandom)).toBe(3200);
    });

    it("deve respeitar o teto absoluto maxDelayMs mesmo em tentativas elevadas", () => {
      const mockRandom = () => 1.0;
      const maxCap = 5000;

      // Mesmo com tentativa 8 (que geraria 400 * 256 = 102.400ms), não ultrapassa maxDelayMs
      const delay = calculateJitterDelay(8, 400, maxCap, mockRandom);
      expect(delay).toBeLessThanOrEqual(maxCap);
      expect(delay).toBe(maxCap);
    });

    it("deve garantir piso mínimo de 100ms para evitar spin-loops de 0ms", () => {
      const mockZeroRandom = () => 0;

      const delay = calculateJitterDelay(0, 400, 8000, mockZeroRandom);
      expect(delay).toBe(100);
    });

    it("deve tolerar valores negativos de tentativa protegendo contra índices inválidos", () => {
      const mockRandom = () => 0.5;

      const delay = calculateJitterDelay(-3, 400, 8000, mockRandom);
      expect(delay).toBe(200); // Tratado como attempt = 0
    });

    it("deve gerar dispersão estatística de jitter entre 100ms e o teto máximo", () => {
      const samples: number[] = [];
      for (let i = 0; i < 50; i++) {
        samples.push(calculateJitterDelay(2, 400, 4000));
      }

      // Todos os valores devem estar dentro dos limites operacionais
      for (const sample of samples) {
        expect(sample).toBeGreaterThanOrEqual(100);
        expect(sample).toBeLessThanOrEqual(4000);
      }

      // Deve existir variância (provar que não são todos valores idênticos)
      const uniqueValues = new Set(samples);
      expect(uniqueValues.size).toBeGreaterThan(15);
    });
  });
});
