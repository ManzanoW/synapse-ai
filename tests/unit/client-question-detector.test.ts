import { describe, it, expect } from "vitest";
import { validateImageForQuestion } from "@/lib/client-question-detector";

describe("Client Question Detector Layer (Barreira Óptica de Questão)", () => {
  it("deve rejeitar arquivos corrompidos ou excessivamente pequenos (< 4KB)", async () => {
    // Simula um arquivo de 500 bytes (ex: pixel transparente ou ícone vazio)
    const smallFile = new File([new Uint8Array(500)], "tiny-logo.png", {
      type: "image/png",
    });

    const result = await validateImageForQuestion(smallFile);
    expect(result.isValid).toBe(false);
    expect(result.textConfidenceScore).toBeLessThan(20);
    expect(result.message).toContain("muito pequena");
  });

  it("deve permitir fallback para arquivos PDF que exigem renderização no servidor", async () => {
    const pdfFile = new File([new Uint8Array(10000)], "prova.pdf", {
      type: "application/pdf",
    });

    const result = await validateImageForQuestion(pdfFile);
    expect(result.isValid).toBe(true);
    expect(result.confidenceLevel).toBe("moderate");
  });
});
