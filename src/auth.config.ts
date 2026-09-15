import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

function getRequestBaseUrl(request: { headers: Headers; nextUrl?: { host?: string; protocol?: string; origin?: string } }): string {
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ||
    (request.nextUrl?.protocol ? request.nextUrl.protocol.replace(":", "") : "https");
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return request.nextUrl?.origin || "http://localhost:3000";
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
    authorized({ auth, request }) {
      const { nextUrl, cookies, headers } = request;
      const isRSC =
        headers.has("RSC") ||
        headers.get("next-router-prefetch") === "1" ||
        nextUrl.searchParams.has("_rsc");

      const isDemoCookie = cookies.get("synapse_demo_active")?.value === "true";
      const isDemoParam = nextUrl.searchParams.get("demo") === "true";
      const referer = headers.get("referer") || "";
      const isDemoReferer = referer.includes("demo=true");
      const isDemoHeader = headers.get("x-synapse-demo") === "true";
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
