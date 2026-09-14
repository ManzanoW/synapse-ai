import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

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
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl, cookies, headers } = request;
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
        nextUrl.pathname.startsWith("/profile");

      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        return false;
      }

      if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/dashboard?demo=true", nextUrl));
      }

      return true;
    },
  },
  providers: [Google, GitHub],
} satisfies NextAuthConfig;
