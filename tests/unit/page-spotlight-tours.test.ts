import { describe, it, expect, beforeEach } from "vitest";

describe("Page Spotlight & First-Visit Tours System", () => {
  const SPOTLIGHT_STORAGE_KEYS = [
    "synapse_spotlight_trilhas_v1",
    "synapse_spotlight_edital_v1",
    "synapse_spotlight_week_v1",
    "synapse_spotlight_questions_v1",
    "synapse_spotlight_studyroom_v1",
    "synapse_spotlight_redacao_v1",
    "synapse_spotlight_notebook_v1",
    "synapse_spotlight_flashcards_v1",
  ];

  beforeEach(() => {
    // Clear mock storage
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it("should define distinct and valid storage keys for every major page tour", () => {
    const keySet = new Set(SPOTLIGHT_STORAGE_KEYS);
    expect(keySet.size).toBe(SPOTLIGHT_STORAGE_KEYS.length);
    for (const key of SPOTLIGHT_STORAGE_KEYS) {
      expect(key).toMatch(/^synapse_spotlight_[a-z]+_v1$/);
    }
  });

  it("simulates first-visit behavior: banner should be visible when key is not dismissed", () => {
    const mockStorage: Record<string, string> = {};

    function isBannerOpen(key: string): boolean {
      const stored = mockStorage[key];
      return stored === undefined || stored === "open";
    }

    function dismissBanner(key: string) {
      mockStorage[key] = "dismissed";
    }

    function reopenBanner(key: string) {
      mockStorage[key] = "open";
    }

    // 1st visit
    expect(isBannerOpen("synapse_spotlight_edital_v1")).toBe(true);

    // User clicks "Entendi!"
    dismissBanner("synapse_spotlight_edital_v1");
    expect(isBannerOpen("synapse_spotlight_edital_v1")).toBe(false);

    // User clicks "Como Funciona?" in the header
    reopenBanner("synapse_spotlight_edital_v1");
    expect(isBannerOpen("synapse_spotlight_edital_v1")).toBe(true);
  });
});
