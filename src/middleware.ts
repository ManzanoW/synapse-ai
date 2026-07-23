import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// Exportação padrão (default) envolvida explicitamente pela função 'auth'
export default auth((req) => {});

export const config = {
  // Aplica o middleware em todas as rotas, exceto estáticos e imagens
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
