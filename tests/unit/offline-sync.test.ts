import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPendingOfflineReviews,
  enqueueOfflineReview,
  cacheOfflineDeck,
  getCachedOfflineDeck,
} from "@/lib/offline-sync";
import {
  isValidPdfSignature,
  isValidImageOrPdfSignature,
  sanitizeActionErrorMessage,
} from "@/lib/security/file-signature";

describe("Offline Sync & File Upload Security Layer", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k in store) delete store[k];
      },
    };

    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.stubGlobal("window", {
      localStorage: mockLocalStorage,
      indexedDB: undefined,
    });
    vi.stubGlobal("navigator", {
      onLine: true,
    });
  });

  it("deve iniciar com a fila de revisões offline vazia", () => {
    expect(getPendingOfflineReviews()).toEqual([]);
  });

  it("deve enfileirar revisões pendentes com timestamp e dados FSRS corretos", () => {
    enqueueOfflineReview({
      cardId: "card-abc",
      rating: 3,
      grade: 3,
      responseTimeMs: 2500,
    });

    const pending = getPendingOfflineReviews();
    expect(pending.length).toBe(1);
    expect(pending[0].cardId).toBe("card-abc");
    expect(pending[0].grade).toBe(3);
    expect(pending[0].responseTimeMs).toBe(2500);
    expect(pending[0].timestamp).toBeGreaterThan(0);
  });

  it("deve acumular múltiplas revisões na fila preservando a ordem e isolando por userId", () => {
    enqueueOfflineReview({ cardId: "card-1", grade: 1, userId: "user-a" });
    enqueueOfflineReview({ cardId: "card-2", grade: 4, userId: "user-b" });

    const allPending = getPendingOfflineReviews();
    expect(allPending.length).toBe(2);

    const userAPending = getPendingOfflineReviews("user-a");
    expect(userAPending.length).toBe(1);
    expect(userAPending[0].cardId).toBe("card-1");
  });

  it("deve armazenar e recuperar baralhos offline por deckId", () => {
    const mockDeck = [
      { id: "c1", question: "O que é dolo?", answer: "Vontade livre e consciente." },
      { id: "c2", question: "O que é culpa?", answer: "Negligência, imprudência ou imperícia." },
    ];

    cacheOfflineDeck("deck-direito-penal", mockDeck);

    const cached = getCachedOfflineDeck<typeof mockDeck>("deck-direito-penal");
    expect(cached).not.toBeNull();
    expect(cached?.cards.length).toBe(2);
    expect(cached?.cards[0].question).toBe("O que é dolo?");
  });

  it("deve validar Magic Bytes reais de PDF e imagens e bloquear executáveis disfarçados", () => {
    const validPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // %PDF-1.7
    const validPng = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const validJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const fakeExeAsPdf = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]); // MZ header (.exe)

    expect(isValidPdfSignature(validPdf)).toBe(true);
    expect(isValidPdfSignature(fakeExeAsPdf)).toBe(false);

    expect(isValidImageOrPdfSignature(validPng)).toBe(true);
    expect(isValidImageOrPdfSignature(validJpeg)).toBe(true);
    expect(isValidImageOrPdfSignature(validPdf)).toBe(true);
    expect(isValidImageOrPdfSignature(fakeExeAsPdf)).toBe(false);
  });

  it("deve sanitizar erros internos do Prisma/SQL em Server Actions", () => {
    const dbError = new Error(
      "Invalid `prisma.user.findUnique()` invocation: Can't reach database server at `ep-cool-neon.tech:5432`"
    );
    const safeError = new Error("A imagem enviada está ilegível.");

    expect(sanitizeActionErrorMessage(dbError, "Falha ao processar solicitação.")).toBe(
      "Falha ao processar solicitação."
    );
    expect(sanitizeActionErrorMessage(safeError, "Falha ao processar solicitação.")).toBe(
      "A imagem enviada está ilegível."
    );
  });
});
