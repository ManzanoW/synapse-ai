import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login", // Para onde o usuário será enviado se não estiver logado
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // Verifica se a rota atual é do dashboard
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Retornar false aciona o redirecionamento para /login
      }

      // Se o usuário já está logado e tenta ir para a página de login, manda pro dashboard
      if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  providers: [], // Providers com adapters ficam no src/auth.ts
} satisfies NextAuthConfig;
