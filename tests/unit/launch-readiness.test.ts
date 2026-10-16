import { describe, it, expect, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { GET as healthGet } from "@/app/api/health/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  },
}));

describe("Launch Readiness & Infrastructure Audit", () => {
  describe("1. SEO & Indexing (robots.ts)", () => {
    it("deve permitir rotas públicas e bloquear rotas de API e áreas privadas", () => {
      const robotsConfig = robots();
      expect(robotsConfig.rules).toBeDefined();

      const rule = Array.isArray(robotsConfig.rules)
        ? robotsConfig.rules[0]
        : robotsConfig.rules;

      expect(rule.allow).toContain("/");
      expect(rule.allow).toContain("/pricing");
      expect(rule.allow).toContain("/terms");
      expect(rule.allow).toContain("/privacy");

      expect(rule.disallow).toContain("/api/");
      expect(rule.disallow).toContain("/admin/");
      expect(rule.disallow).toContain("/dashboard");

      expect(robotsConfig.sitemap).toBeDefined();
    });
  });

  describe("2. Sitemap Generation (sitemap.ts)", () => {
    it("deve conter as páginas institucionais com prioridades corretas", () => {
      const sitemapEntries = sitemap();
      expect(Array.isArray(sitemapEntries)).toBe(true);

      const urls = sitemapEntries.map((e) => e.url);

      expect(urls.some((u) => u.endsWith("/pricing"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/terms"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/privacy"))).toBe(true);

      const homeEntry = sitemapEntries.find((e) => !e.url.includes("/pricing") && !e.url.includes("/terms") && !e.url.includes("/privacy") && !e.url.includes("/login") && !e.url.includes("/share"));
      expect(homeEntry?.priority).toBe(1.0);
    });
  });

  describe("3. Healthcheck Endpoint (/api/health)", () => {
    it("deve responder com 200 OK e status healthy quando o banco está ativo", async () => {
      const res = await healthGet();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe("healthy");
      expect(json.services.database.status).toBe("up");
      expect(json.services.app.status).toBe("up");
      expect(typeof json.uptimeSeconds).toBe("number");
    });
  });
});
