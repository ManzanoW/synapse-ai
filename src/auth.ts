import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { cookies, headers } from "next/headers";

const hasRealDb = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("mock");

function getAdapter() {
  if (!hasRealDb) return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaAdapter } = require("@auth/prisma-adapter");
    return PrismaAdapter(prisma);
  } catch (err) {
    console.warn("Could not load PrismaAdapter:", err);
    return undefined;
  }
}

const nextAuthInstance = NextAuth({
  ...authConfig,
  adapter: getAdapter(),
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
      clientId: process.env.AUTH_GOOGLE_ID || process.env.AUTH_GOOGLE_CLIENT_ID || "placeholder-google-id",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.AUTH_GOOGLE_CLIENT_SECRET || "placeholder-google-secret",
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || process.env.AUTH_GITHUB_CLIENT_ID || "placeholder-github-id",
      clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.AUTH_GITHUB_CLIENT_SECRET || "placeholder-github-secret",
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

export const handlers = nextAuthInstance.handlers;
export const signIn = nextAuthInstance.signIn;
export const signOut = nextAuthInstance.signOut;

export async function auth(...args: any[]) {
  const session = await (nextAuthInstance.auth as any)(...args);
  if (session?.user) {
    return session;
  }

  // Fallback demo session if guest cookie or demo header/referer is present
  try {
    const headersList = await headers();
    const hasDemoHeader = headersList.get("x-synapse-demo") === "true";
    const referer = headersList.get("referer") || "";
    const hasDemoReferer = referer.includes("demo=true");
    const nextUrl = headersList.get("next-url") || headersList.get("x-url") || "";
    const hasDemoUrl = nextUrl.includes("demo=true");

    const cookieStore = await cookies();
    const hasDemoCookie = cookieStore.get("synapse_demo_active")?.value === "true";

    let hasReqDemo = false;
    if (args.length > 0 && args[0]) {
      const firstArg = args[0];
      if (typeof firstArg?.url === "string" && firstArg.url.includes("demo=true")) {
        hasReqDemo = true;
      }
      if (typeof firstArg?.headers?.get === "function" && firstArg.headers.get("x-synapse-demo") === "true") {
        hasReqDemo = true;
      }
    }

    if (hasDemoHeader || hasDemoCookie || hasDemoReferer || hasDemoUrl || hasReqDemo) {
      return {
        user: {
          id: "demo-user-id",
          name: "Estudante Synapse",
          email: "estudante@synapse.ai",
          image: null,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
  } catch {
    // In contexts where cookies() or headers() is not available
  }

  return null;
}
