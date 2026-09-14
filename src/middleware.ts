import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // Ignora assets estáticos e rotas públicas
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg"
  ) {
    return NextResponse.next();
  }

  const isDemoParam = req.nextUrl.searchParams.get("demo") === "true";
  const isDemoCookie = req.cookies.get("synapse_demo_active")?.value === "true";
  const referer = req.headers.get("referer") || "";
  const isDemoReferer = referer.includes("demo=true");
  const isDemoHeader = req.headers.get("x-synapse-demo") === "true";
  const isDemo = isDemoParam || isDemoCookie || isDemoReferer || isDemoHeader;

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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


