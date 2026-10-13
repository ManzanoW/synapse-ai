import { describe, it, expect, vi, beforeEach } from "vitest";
import { deepenMindMapNodeAction } from "@/actions/mindmap-actions";
import { exportDeckToAnkiAction } from "@/actions/anki-export-actions";
import { parseExamPdfAction } from "@/actions/pdf-exam-actions";
import { parsePdfAndExtractTopicsAction } from "@/actions/pdf-flashcard-actions";
import { evaluateOralAnswerAction } from "@/actions/oral-exam-actions";
import { auth } from "@/auth";
import { isUserPro } from "@/lib/subscription";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/subscription", () => ({
  isUserPro: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    flashcardDeck: {
      findUnique: vi.fn(),
    },
    essaySubmission: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/gemini-fallback", () => ({
  generateContentWithFallback: vi.fn(),
}));

describe("Feature Gates & Access Control Security Audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Aprofundamento Neural de Nós em Mapas Mentais", () => {
    it("deve bloquear usuários do plano gratuito com FEATURE_LOCKED_PRO", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "user-free-1", email: "free@synapse.ai" },
      });
      (isUserPro as any).mockResolvedValueOnce(false);

      const result = await deepenMindMapNodeAction({
        nodeLabel: "Artigo 5º da CF",
        topicTitle: "Direito Constitucional",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("FEATURE_LOCKED_PRO");
    });
  });

  describe("2. Exportação de Flashcards para Anki (.apkg)", () => {
    it("deve bloquear exportação nativa para Anki se usuário não for Pro", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "user-free-2", email: "free@synapse.ai" },
      });
      (isUserPro as any).mockResolvedValueOnce(false);

      const result = await exportDeckToAnkiAction("deck-id-123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("FEATURE_LOCKED_PRO");
    });
  });

  describe("3. Importador e Parser de PDF com IA", () => {
    it("deve bloquear upload de provas em PDF com IA para usuários gratuitos", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "user-free-3", email: "free@synapse.ai" },
      });
      (isUserPro as any).mockResolvedValueOnce(false);

      const dummyFormData = new FormData();
      dummyFormData.append("file", new Blob(["fake-pdf"], { type: "application/pdf" }), "prova.pdf");

      const result = await parseExamPdfAction(dummyFormData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("FEATURE_LOCKED_PRO");
    });

    it("deve bloquear extração de tópicos de PDF de flashcards para usuários gratuitos", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "user-free-4", email: "free@synapse.ai" },
      });
      (isUserPro as any).mockResolvedValueOnce(false);

      const dummyFormData = new FormData();
      dummyFormData.append("file", new Blob(["fake-pdf"], { type: "application/pdf" }), "edital.pdf");

      const result = await parsePdfAndExtractTopicsAction(dummyFormData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("FEATURE_LOCKED_PRO");
    });
  });

  describe("4. Avaliação Individual de Prova Oral com IA", () => {
    it("deve bloquear avaliação com espelho nota 10 para usuários gratuitos", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "user-free-5", email: "free@synapse.ai" },
      });
      (isUserPro as any).mockResolvedValueOnce(false);

      const result = await evaluateOralAnswerAction({
        cargo: "Delegado de Polícia",
        disciplina: "Direito Penal",
        questionText: "Disserte sobre a legítima defesa.",
        candidateTranscript: "Legítima defesa é uma excludente de ilicitude...",
        durationSeconds: 60,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("exclusivo do Synapse Pro");
    });
  });
});
