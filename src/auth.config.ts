import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export function getBaseUrl(): string {
  // 1. Se houver AUTH_URL explícita (padrão Auth.js v5)
  if (process.env.AUTH_URL && !process.env.AUTH_URL.includes("localhost")) {
    return process.env.AUTH_URL;
  }
  // 2. Se houver NEXTAUTH_URL explícita
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")) {
    return process.env.NEXTAUTH_URL;
  }
  // 3. Domínio de produção principal da Vercel
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  // 4. URL da Vercel para este deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // 5. URL de branch na Vercel
  if (process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`;
  }
  // 6. Desenvolvimento local
  return "http://localhost:3000";
}

const host = getBaseUrl();
if (!process.env.AUTH_URL) {
  process.env.AUTH_URL = host;
}
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = host;
}
process.env.AUTH_TRUST_HOST = "true";

export const baseUrl = host;

function getRequestBaseUrl(request: { headers: Headers; nextUrl?: { host?: string; protocol?: string; origin?: string } }): string {
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ||
    (request.nextUrl?.protocol ? request.nextUrl.protocol.replace(":", "") : "https");
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return request.nextUrl?.origin || baseUrl;
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET || "synapse-ai-default-auth-secret-key-2026",
  trustHost: true,
  // -------------------------------------------------------------
  // Força o comportamento correto do Cookie para localhost vs prod
  // -------------------------------------------------------------
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async redirect({ url, baseUrl: _baseUrl }) {
      const host = getBaseUrl();
      if (url.startsWith("/")) return `${host}${url}`;
      try {
        if (new URL(url).origin === new URL(host).origin) return url;
      } catch {
        // Fallback se a URL for inválida
      }
      return host;
    },
    authorized({ auth, request }) {
      const { nextUrl, cookies, headers } = request;
      const isRSC =
        headers.has("RSC") ||
        headers.get("next-router-prefetch") === "1" ||
        nextUrl.searchParams.has("_rsc");

      const isLoginPage = nextUrl.pathname === "/login";
      const isDemoCookie =
        cookies.get("synapse_demo_active")?.value === "true" ||
        cookies.get("synapse-demo-session")?.value === "true";
      const isDemoParam = nextUrl.searchParams.get("demo") === "true";
      const referer = headers.get("referer") || "";
      // Em /login nunca considerar referer ou header residual como demo
      const isDemoReferer = !isLoginPage && referer.includes("demo=true");
      const isDemoHeader = !isLoginPage && headers.get("x-synapse-demo") === "true";
      const isDemo = isDemoCookie || isDemoParam || isDemoReferer || isDemoHeader;
      const isLoggedIn = !!auth?.user || isDemo;

      const isProtectedRoute =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/flashcards") ||
        nextUrl.pathname.startsWith("/quiz") ||
        nextUrl.pathname.startsWith("/questions") ||
        nextUrl.pathname.startsWith("/week") ||
        nextUrl.pathname.startsWith("/performance") ||
        nextUrl.pathname.startsWith("/edital") ||
        nextUrl.pathname.startsWith("/profile") ||
        nextUrl.pathname.startsWith("/achievements") ||
        nextUrl.pathname.startsWith("/calendar") ||
        nextUrl.pathname.startsWith("/notebook");

      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        // Não redireciona chamadas internas de RSC/prefetch para evitar erro de CORS
        if (isRSC) return true;
        const baseUrl = getRequestBaseUrl(request);
        return Response.redirect(new URL("/login", baseUrl));
      }

      if (isLoggedIn && nextUrl.pathname === "/login") {
        if (isRSC) return true;
        const baseUrl = getRequestBaseUrl(request);
        return Response.redirect(new URL("/dashboard?demo=true", baseUrl));
      }

      return true;
    },
  },
  providers: [Google, GitHub],
} satisfies NextAuthConfig;

export const authOptions = authConfig;
