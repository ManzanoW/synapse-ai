import { authConfig, normalizeUrl, getBaseUrl } from "./auth.config";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

// 🔒 Garante sanitização de URLs no runtime de edge/middleware
if (process.env.NEXTAUTH_URL) process.env.NEXTAUTH_URL = normalizeUrl(process.env.NEXTAUTH_URL);
if (process.env.AUTH_URL) process.env.AUTH_URL = normalizeUrl(process.env.AUTH_URL);
if (process.env.VERCEL_URL) process.env.VERCEL_URL = normalizeUrl(process.env.VERCEL_URL);
process.env.AUTH_TRUST_HOST = "true";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const pathname = req.nextUrl.pathname;

  // Ignora assets estáticos, webhooks externos e rotas públicas
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg"
  ) {
    return NextResponse.next();
  }

  const isLoginPage = pathname === "/login";
  const isDemoParam = req.nextUrl.searchParams.get("demo") === "true";
  const isDemoCookie =
    req.cookies.get("synapse_demo_active")?.value === "true" ||
    req.cookies.get("synapse-demo-session")?.value === "true";
  const referer = req.headers.get("referer") || "";
  // Em /login nunca ativar demo via referer ou header residual (previne loop de logout)
  const isDemoReferer = !isLoginPage && referer.includes("demo=true");
  const isDemoHeader = !isLoginPage && req.headers.get("x-synapse-demo") === "true";
  const isDemo = isDemoParam || isDemoCookie || isDemoReferer || isDemoHeader;

  // Se o usuário está em /login e não possui cookie nem parâmetro explícito demo=true,
  // permite a navegação normal sem adicionar cookies de demo
  if (isLoginPage && !isDemoCookie && !isDemoParam) {
    return NextResponse.next();
  }

  if (isDemo) {
    // NUNCA emite redirect em navegações internas ou prefetchs (_rsc)
    // O cookie synapse_demo_active=true já garante autenticação de demo em toda a aplicação
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-synapse-demo", "true");

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.cookies.set("synapse_demo_active", "true", {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  }

  return NextResponse.next();
});

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
