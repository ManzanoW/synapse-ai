import { describe, it, expect, vi } from "vitest";
import nextConfig from "../../next.config";
import { GET, POST } from "@/app/api/guest-login/route";
import { NextRequest } from "next/server";

describe("Security Audit & Hardening", () => {
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
});
