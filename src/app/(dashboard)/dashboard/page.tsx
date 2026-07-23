import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();

  // Garante validação de sessão rigorosa no servidor
  if (!session?.user) {
    redirect("/login");
  }

  return <DashboardClient user={session.user} />;
}
