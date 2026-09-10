import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

const hasRealDb = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("mock");

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: hasRealDb ? PrismaAdapter(prisma) : undefined,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "credentials",
      name: "Modo Demonstração",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        return {
          id: "demo-user-id",
          name: "Estudante Synapse",
          email: (credentials?.email as string) || "estudante@synapse.ai",
          image: null,
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID || "placeholder-google-id",
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET || "placeholder-google-secret",
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_CLIENT_ID || "placeholder-github-id",
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET || "placeholder-github-secret",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) || "demo-user-id";
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
});
