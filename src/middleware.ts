import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // Apenas invocar req.auth/auth injeta a checagem do callback `authorized`
});

export const config = {
  // Garante que o middleware rode em todas as rotas protegidas
  matcher: [
    "/dashboard/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
