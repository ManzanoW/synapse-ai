import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth();

  // Se o usuário não está logado, vai para a tela de login
  if (!session) {
    redirect("/login");
  }

  // Se está logado, vai direto para o dashboard
  redirect("/dashboard");
}
