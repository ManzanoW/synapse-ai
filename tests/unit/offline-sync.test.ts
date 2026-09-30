import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPendingOfflineReviews,
  enqueueOfflineReview,
  cacheOfflineDeck,
  getCachedOfflineDeck,
} from "@/lib/offline-sync";

describe("Offline Sync & Local Storage Layer", () => {
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

  it("deve acumular múltiplas revisões na fila preservando a ordem", () => {
    enqueueOfflineReview({ cardId: "card-1", grade: 1 });
    enqueueOfflineReview({ cardId: "card-2", grade: 4 });

    const pending = getPendingOfflineReviews();
    expect(pending.length).toBe(2);
    expect(pending[0].cardId).toBe("card-1");
    expect(pending[1].cardId).toBe("card-2");
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
});
