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
    authorized({ auth, request: { nextUrl, cookies } }) {
      const isDemoCookie = cookies.get("synapse_demo_active")?.value === "true";
      const isLoggedIn = !!auth?.user || isDemoCookie;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }

      if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  providers: [Google, GitHub],
} satisfies NextAuthConfig;
