import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export function normalizeUrl(raw?: string): string {
  if (!raw) return "https://synapseconcursos.vercel.app";
  let url = raw.trim();
  if (!url) return "https://synapseconcursos.vercel.app";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/$/, "");
}

// 🔒 Garante sanitização antecipada de todas as variáveis de ambiente usadas pelo NextAuth
if (process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = normalizeUrl(process.env.NEXTAUTH_URL);
}
if (process.env.AUTH_URL) {
  process.env.AUTH_URL = normalizeUrl(process.env.AUTH_URL);
}
if (process.env.VERCEL_URL) {
  process.env.VERCEL_URL = normalizeUrl(process.env.VERCEL_URL);
}
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  process.env.VERCEL_PROJECT_PRODUCTION_URL = normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
}
if (process.env.NEXT_PUBLIC_APP_URL) {
  process.env.NEXT_PUBLIC_APP_URL = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
}

export function getBaseUrl(): string {
  let url = "";
  if (process.env.AUTH_URL && !process.env.AUTH_URL.includes("localhost")) {
    url = process.env.AUTH_URL;
  } else if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")) {
    url = process.env.NEXTAUTH_URL;
  } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    url = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  } else if (process.env.VERCEL_URL) {
    url = process.env.VERCEL_URL;
  } else if (process.env.VERCEL_BRANCH_URL) {
    url = process.env.VERCEL_BRANCH_URL;
  } else {
    return "http://localhost:3000";
  }

  return normalizeUrl(url);
}

const host = getBaseUrl();
// Força sempre protocolo completo válido para o NextAuth interno
process.env.AUTH_URL = host;
process.env.NEXTAUTH_URL = host;
process.env.AUTH_TRUST_HOST = "true";

export const baseUrl = host;

function getRequestBaseUrl(request: { headers: Headers; nextUrl?: { host?: string; protocol?: string; origin?: string } }): string {
  try {
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const forwardedProto =
      request.headers.get("x-forwarded-proto") ||
      (request.nextUrl?.protocol ? request.nextUrl.protocol.replace(":", "") : "https");
    if (forwardedHost) {
      const cleanHost = forwardedHost.split(",")[0].trim();
      const proto = forwardedProto.split(",")[0].trim().replace(":", "");
      return `${proto}://${cleanHost}`;
    }
    if (request.nextUrl?.origin && request.nextUrl.origin !== "null") {
      return request.nextUrl.origin;
    }
  } catch {
    // Fallback silencioso
  }
  return baseUrl;
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
        const reqBaseUrl = getRequestBaseUrl(request);
        try {
          return Response.redirect(new URL("/login", reqBaseUrl));
        } catch {
          return Response.redirect(new URL("/login", baseUrl));
        }
      }

      if (isLoggedIn && nextUrl.pathname === "/login") {
        if (isRSC) return true;
        const reqBaseUrl = getRequestBaseUrl(request);
        try {
          return Response.redirect(new URL("/dashboard?demo=true", reqBaseUrl));
        } catch {
          return Response.redirect(new URL("/dashboard?demo=true", baseUrl));
        }
      }

      return true;
    },
  },
  providers: [Google, GitHub],
} satisfies NextAuthConfig;

export const authOptions = authConfig;
