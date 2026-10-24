// tests/unit/share-actions.test.ts
import { describe, it, expect, vi } from "vitest";
import { getPublicDeckAction, clonePublicDeckAction, getPublicMindmapAction } from "@/actions/share-actions";
import { clearSensitiveUserStorage } from "@/lib/privacy/clear-user-storage";

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", email: "test@example.com" },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    deck: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id === "deck-123") {
          return Promise.resolve({
            id: "deck-123",
            title: "Direito Constitucional Foco PF",
            color: "bg-indigo-600",
            createdAt: new Date("2026-01-01"),
            subject: { name: "Direito Constitucional" },
            topic: { title: "Artigo 5º" },
            user: {
              id: "creator-id",
              name: "Professor Silva",
              image: null,
              role: "USER",
              planTier: "PREMIUM",
            },
            flashcards: [
              {
                id: "c1",
                question: "O que são remédios constitucionais?",
                answer: "Ações judiciais voltadas à proteção de direitos fundamentais.",
                details: "HC, HD, MS, MI e AP.",
              },
            ],
          });
        }
        if (where.id === "deck-full-civil-name") {
          return Promise.resolve({
            id: "deck-full-civil-name",
            title: "Direito Penal",
            color: "bg-indigo-600",
            createdAt: new Date("2026-01-01"),
            subject: { name: "Direito Penal" },
            topic: { title: "Teoria do Crime" },
            user: {
              id: "creator-2",
              name: "João Victor Almeida Santos",
              image: null,
              role: "USER",
              planTier: "FREE",
            },
            flashcards: [],
          });
        }
        return Promise.resolve(null);
      }),
      create: vi.fn().mockResolvedValue({
        id: "cloned-deck-456",
        _count: { flashcards: 1 },
      }),
    },
    topic: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

describe("Public Share Actions & Client Storage Hygiene (LGPD)", () => {
  it("deve carregar dados públicos de um baralho sem vazar dados sensíveis do criador", async () => {
    const res = await getPublicDeckAction("deck-123");

    expect(res.success).toBe(true);
    expect(res.data?.id).toBe("deck-123");
    expect(res.data?.title).toBe("Direito Constitucional Foco PF");
    expect(res.data?.totalCards).toBe(1);
    expect(res.data?.author.name).toBe("Professor Silva");
    expect(res.data?.author.isPro).toBe(true);
    // Não expõe id interno, email ou senhas
    expect(res.data?.author).not.toHaveProperty("id");
    expect(res.data?.author).not.toHaveProperty("email");
  });

  it("deve abreviar nomes civis completos (3+ palavras) em links públicos de baralho (Minimização LGPD)", async () => {
    const res = await getPublicDeckAction("deck-full-civil-name");

    expect(res.success).toBe(true);
    expect(res.data?.author.name).toBe("João S.");
  });

  it("deve clonar o baralho com FSRS zerado para o usuário conectado", async () => {
    const res = await clonePublicDeckAction("deck-123");

    expect(res.success).toBe(true);
    expect(res.newDeckId).toBe("cloned-deck-456");
    expect(res.cardsCloned).toBe(1);
  });

  it("deve retornar mapa mental pré-configurado a partir dos presets", async () => {
    const res = await getPublicMindmapAction("mm-controle-const");

    expect(res.success).toBe(true);
    expect(res.data?.title).toBe("Controle de Constitucionalidade");
    expect(res.data?.subject).toBe("Direito Constitucional");
    expect(res.data?.rootNode).toBeDefined();
  });

  it("deve limpar todas as chaves sensíveis do localStorage no Logout mantendo apenas tema e consentimento", () => {
    const store: Record<string, string> = {
      synapse_quick_scratchpad: "Minhas notas secretas",
      synapse_offline_sync_queue_v1: '[{"id":"1"}]',
      synapse_study_room_notes: "Resumo privado",
      synapse_recent_commands: '["edital-top-1"]',
      "synapse-theme": "dark",
      synapse_lgpd_consent_v1: "accepted",
    };

    const mockStorage = {
      get length() {
        return Object.keys(store).length;
      },
      key: (idx: number) => Object.keys(store)[idx] ?? null,
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
    };

    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", mockStorage);
    vi.stubGlobal("sessionStorage", { removeItem: vi.fn(), clear: vi.fn() });

    clearSensitiveUserStorage();

    expect(store["synapse_quick_scratchpad"]).toBeUndefined();
    expect(store["synapse_offline_sync_queue_v1"]).toBeUndefined();
    expect(store["synapse_study_room_notes"]).toBeUndefined();
    expect(store["synapse_recent_commands"]).toBeUndefined();
    expect(store["synapse-theme"]).toBe("dark");
    expect(store["synapse_lgpd_consent_v1"]).toBe("accepted");

    vi.unstubAllGlobals();
  });
});
