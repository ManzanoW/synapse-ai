import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isDemoParam = req.nextUrl.searchParams.get("demo") === "true";
  const isDemoCookie = req.cookies.get("synapse_demo_active")?.value === "true";
  const referer = req.headers.get("referer") || "";
  const isDemoReferer = referer.includes("demo=true");
  const isDemoHeader = req.headers.get("x-synapse-demo") === "true";
  const isDemo = isDemoParam || isDemoCookie || isDemoReferer || isDemoHeader;

  if (isDemo) {
    const isApi = req.nextUrl.pathname.startsWith("/api");
    const isStatic = req.nextUrl.pathname.startsWith("/_next");
    const isLogin = req.nextUrl.pathname === "/login";

    // Se é uma navegação de página protegida e o parâmetro demo=true se perdeu, redireciona para mantê-lo
    if (!isApi && !isStatic && !isLogin && !isDemoParam) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.searchParams.set("demo", "true");
      const redirectResponse = NextResponse.redirect(redirectUrl);
      redirectResponse.cookies.set("synapse_demo_active", "true", {
        path: "/",
        sameSite: "none",
        secure: true,
        maxAge: 60 * 60 * 24 * 30,
      });
      return redirectResponse;
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-synapse-demo", "true");

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.cookies.set("synapse_demo_active", "true", {
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


