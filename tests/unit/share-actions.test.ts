// tests/unit/share-actions.test.ts
import { describe, it, expect, vi } from "vitest";
import { getPublicDeckAction, clonePublicDeckAction, getPublicMindmapAction } from "@/actions/share-actions";

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

describe("Public Share Actions (Viral Deck & Mindmap Sharing)", () => {
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
});
