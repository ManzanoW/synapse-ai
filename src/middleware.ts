import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // O Auth.js gerencia a autenticação aqui usando as regras do authConfig
});

export const config = {
  // Aplica o middleware a todas as rotas exceto arquivos estáticos, imagens, etc.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
