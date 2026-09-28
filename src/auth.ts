import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authConfig, getBaseUrl, baseUrl } from "./auth.config";
import { cookies, headers } from "next/headers";

export { getBaseUrl, baseUrl };

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

export const authOptions: NextAuthConfig = {
  ...authConfig,
  trustHost: true,
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
};

const nextAuthInstance = NextAuth(authOptions);

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
    const nextUrl = headersList.get("next-url") || headersList.get("x-url") || "";
    const isLoginPage = nextUrl.includes("/login");

    const hasDemoHeader = !isLoginPage && headersList.get("x-synapse-demo") === "true";
    const referer = headersList.get("referer") || "";
    const hasDemoReferer = !isLoginPage && referer.includes("demo=true");
    const hasDemoUrl = !isLoginPage && nextUrl.includes("demo=true");

    const cookieStore = await cookies();
    const hasDemoCookie =
      cookieStore.get("synapse_demo_active")?.value === "true" ||
      cookieStore.get("synapse-demo-session")?.value === "true";

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
