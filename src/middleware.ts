import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// Exporta explicitamente como a função de middleware que o Next.js exige
export default auth((req) => {
  // A lógica de autorização já é tratada dentro do authConfig (callback authorized)
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
