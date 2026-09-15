import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

// Prioriza ambiente de preview da Vercel configurando variáveis dinâmicas se presentes
if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
  const previewUrl = process.env.VERCEL_URL.startsWith("http")
    ? process.env.VERCEL_URL
    : `https://${process.env.VERCEL_URL}`;
  process.env.AUTH_URL = previewUrl;
  process.env.NEXTAUTH_URL = previewUrl;
}

process.env.AUTH_TRUST_HOST = "true";

export const baseUrl =
  (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL)
    ? (process.env.VERCEL_URL.startsWith("http") ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`)
    : (process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"));

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
    async redirect({ url, baseUrl: fallbackBaseUrl }) {
      const currentBaseUrl =
        (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL)
          ? (process.env.VERCEL_URL.startsWith("http") ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`)
          : (process.env.NEXTAUTH_URL ||
            (process.env.VERCEL_URL
              ? (process.env.VERCEL_URL.startsWith("http") ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`)
              : fallbackBaseUrl || "http://localhost:3000"));

      // URLs relativas: garantir retorno para a mesma origem do deploy atual
      if (url.startsWith("/")) {
        return `${currentBaseUrl}${url}`;
      }

      // Permite redirecionamento se a URL pertencer à mesma origem
      try {
        const candidateUrl = new URL(url);
        const originUrl = new URL(currentBaseUrl);
        if (candidateUrl.origin === originUrl.origin) {
          return url;
        }

        // Se estiver em preview da Vercel e a URL redirecionar para a mesma aplicação com outro host (ex: domínio de prod)
        if (process.env.VERCEL_ENV === "preview" && candidateUrl.pathname) {
          return `${currentBaseUrl}${candidateUrl.pathname}${candidateUrl.search}${candidateUrl.hash}`;
        }
      } catch {
        // Fallback seguro se a URL for inválida
      }

      return currentBaseUrl;
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
