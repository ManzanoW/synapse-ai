import { describe, it, expect, vi, beforeEach } from "vitest";
import nextConfig from "../../next.config";
import { GET, POST } from "@/app/api/guest-login/route";
import { GET as adminAiHealthGet } from "@/app/api/admin/ai-health/route";
import { POST as ttsPost } from "@/app/api/tts/route";
import { POST as simuladosGeneratePost } from "@/app/api/simulados/generate/route";
import { POST as reviewPost } from "@/app/api/review/route";
import { POST as completeSuggestionPost } from "@/app/api/edital/complete-suggestion/route";
import { GET as profileLgpdGet, DELETE as profileLgpdDelete } from "@/app/api/user/profile/route";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isUserPro } from "@/lib/subscription";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    delete: vi.fn(),
    get: vi.fn(),
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn().mockResolvedValue([]),
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    topic: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    userAchievementProgress: { deleteMany: vi.fn() },
    quizAttempt: { deleteMany: vi.fn() },
    questionError: { deleteMany: vi.fn() },
    essaySubmission: { deleteMany: vi.fn() },
    aiDailyUsage: { deleteMany: vi.fn() },
    userFeedback: { deleteMany: vi.fn() },
    dailyQuest: { deleteMany: vi.fn() },
    studySession: { deleteMany: vi.fn() },
    externalCourse: { deleteMany: vi.fn() },
    studyTrail: { deleteMany: vi.fn() },
    quiz: { deleteMany: vi.fn() },
    deck: { deleteMany: vi.fn() },
    subject: { deleteMany: vi.fn() },
    userStats: { deleteMany: vi.fn() },
    session: { deleteMany: vi.fn() },
    account: { deleteMany: vi.fn() },
  },
}));

vi.mock("@/lib/subscription", () => ({
  isUserPro: vi.fn(),
}));

vi.mock("@/lib/gemini-fallback", () => ({
  getGeminiPoolStatus: vi.fn().mockReturnValue({ totalKeys: 3, activeKeys: 3 }),
  testGeminiPoolKeys: vi.fn().mockResolvedValue([{ keyIndex: 0, status: "OK", latencyMs: 120 }]),
}));

describe("Security Audit & LGPD Compliance Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("HTTP Security Headers (next.config.ts)", () => {
    it("deve conter todos os headers de segurança essenciais do OWASP", async () => {
      expect(nextConfig.headers).toBeDefined();
      if (!nextConfig.headers) return;

      const headersConfig = await nextConfig.headers();
      const globalRule = headersConfig.find((r) => r.source === "/:path*");
      expect(globalRule).toBeDefined();

      const headersMap = new Map(
        globalRule?.headers.map((h) => [h.key, h.value])
      );

      // 1. HSTS
      expect(headersMap.get("Strict-Transport-Security")).toContain("max-age=63072000");
      // 2. Clickjacking protection
      expect(headersMap.get("X-Frame-Options")).toBe("SAMEORIGIN");
      // 3. MIME Sniffing protection
      expect(headersMap.get("X-Content-Type-Options")).toBe("nosniff");
      // 4. Referrer Policy
      expect(headersMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      // 5. Permissions Policy
      expect(headersMap.get("Permissions-Policy")).toBeDefined();
      // 6. Cross Domain Policies
      expect(headersMap.get("X-Permitted-Cross-Domain-Policies")).toBe("none");
    });
  });

  describe("Guest Login Rate Limiting (guest-login/route.ts)", () => {
    it("deve permitir requisições normais e retornar cookies de autenticação demo", async () => {
      const req = new NextRequest("http://localhost:3000/api/guest-login", {
        method: "POST",
        headers: {
          "x-forwarded-for": "192.168.1.100",
        },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.redirectUrl).toBe("/dashboard?demo=true");
      expect(res.headers.get("x-ratelimit-limit")).toBeDefined();
    });

    it("deve bloquear com 429 após rajadas excessivas vindas do mesmo IP", async () => {
      const ip = "10.0.0.99";
      let lastRes;

      // Consome os 10 tokens de burst + 1 excedente
      for (let i = 0; i < 12; i++) {
        const req = new NextRequest("http://localhost:3000/api/guest-login", {
          method: "POST",
          headers: {
            "x-forwarded-for": ip,
          },
        });
        lastRes = await POST(req);
      }

      expect(lastRes).toBeDefined();
      expect(lastRes?.status).toBe(429);
      expect(lastRes?.headers.get("Retry-After")).toBeDefined();
    });

    it("deve suportar requisição GET com redirecionamento 302", async () => {
      const req = new NextRequest("http://localhost:3000/api/guest-login", {
        method: "GET",
        headers: {
          "x-forwarded-for": "192.168.1.200",
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/dashboard?demo=true");
    });
  });

  describe("Admin AI Health Route Authorization (/api/admin/ai-health)", () => {
    it("deve bloquear requisição anônima com status 401", async () => {
      (auth as any).mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/admin/ai-health");
      const res = await adminAiHealthGet(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Não autorizado.");
    });

    it("deve bloquear usuário não-administrador com status 403", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "user-regular-1", email: "aluno@gmail.com" },
      });
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        role: "USER",
        email: "aluno@gmail.com",
      });

      const req = new Request("http://localhost:3000/api/admin/ai-health");
      const res = await adminAiHealthGet(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Acesso restrito a administradores.");
    });

    it("deve autorizar usuário com role ADMIN", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "admin-user-1", email: "admin@synapse.ai" },
      });
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        role: "ADMIN",
        email: "admin@synapse.ai",
      });

      const req = new Request("http://localhost:3000/api/admin/ai-health");
      const res = await adminAiHealthGet(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.pool).toBeDefined();
    });
  });

  describe("TTS DoS Prevention (/api/tts)", () => {
    it("deve rejeitar payloads de texto com mais de 2500 caracteres com 413 Payload Too Large", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "pro-user-1", email: "pro@synapse.ai" },
      });
      (isUserPro as any).mockResolvedValueOnce(true);

      const hugeText = "A".repeat(2501);
      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        body: JSON.stringify({ text: hugeText }),
      });

      const res = await ttsPost(req);
      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toBe("PAYLOAD_TOO_LARGE");
    });
  });

  describe("OWASP A01 - Broken Object Level Authorization (IDOR) & Auth Checks", () => {
    it("deve bloquear chamadas anônimas em POST /api/simulados/generate com 401 (prevenção de drenagem de cota IA)", async () => {
      (auth as any).mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/simulados/generate", {
        method: "POST",
        body: JSON.stringify({ banca: "CEBRASPE", subject: "Direito Constitucional" }),
      });

      const res = await simuladosGeneratePost(req);
      expect(res.status).toBe(401);
    });

    it("deve impedir IDOR em POST /api/review validando vínculo subject.userId", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "attacker-user-id", email: "attacker@test.com" },
      });
      (prisma.topic.findFirst as any).mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/review", {
        method: "POST",
        body: JSON.stringify({ topicId: "victim-topic-id", grade: "FACIL" }),
      });

      const res = await reviewPost(req);
      expect(res.status).toBe(404);
      expect(prisma.topic.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "victim-topic-id",
            subject: { userId: "attacker-user-id" },
          },
        }),
      );
    });

    it("deve impedir IDOR em POST /api/edital/complete-suggestion validando vínculo subject.userId", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "attacker-user-id", email: "attacker@test.com" },
      });
      (prisma.topic.findFirst as any).mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/edital/complete-suggestion", {
        method: "POST",
        body: JSON.stringify({ topicId: "victim-topic-id", accuracy: 85 }),
      });

      const res = await completeSuggestionPost(req);
      expect(res.status).toBe(404);
      expect(prisma.topic.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "victim-topic-id",
            subject: { userId: "attacker-user-id" },
          },
        }),
      );
    });
  });

  describe("LGPD Compliance (Lei nº 13.709/2018 - Art. 18 Portabilidade e Eliminação)", () => {
    it("GET /api/user/profile deve exportar todos os dados do titular autenticado em formato JSON estruturado", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "user-lgpd-1", email: "titular@synapse.ai" },
      });
      (prisma.user.findUnique as any).mockResolvedValueOnce({
        id: "user-lgpd-1",
        name: "Titular LGPD",
        email: "titular@synapse.ai",
        subjects: [],
        decks: [],
      });

      const res = await profileLgpdGet();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.lgpdCompliance).toBeDefined();
      expect(json.lgpdCompliance.law).toContain("13.709/2018");
      expect(json.profile.email).toBe("titular@synapse.ai");
    });

    it("DELETE /api/user/profile deve exigir confirmação explícita 'EXCLUIR' antes de apagar dados", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "user-lgpd-1", email: "titular@synapse.ai" },
      });

      const req = new Request("http://localhost:3000/api/user/profile", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "errado" }),
      });

      const res = await profileLgpdDelete(req);
      expect(res.status).toBe(400);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("DELETE /api/user/profile deve executar transação atômica de eliminação completa quando confirmado com 'EXCLUIR'", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "user-lgpd-1", email: "titular@synapse.ai" },
      });

      const req = new Request("http://localhost:3000/api/user/profile", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "EXCLUIR" }),
      });

      const res = await profileLgpdDelete(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
