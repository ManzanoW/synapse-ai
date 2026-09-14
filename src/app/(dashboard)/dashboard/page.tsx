import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import DashboardLoading from "./loading";

export default async function DashboardPage() {
  const session = await auth();

  // Garante validação de sessão rigorosa no servidor
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient user={session.user} />
    </Suspense>
  );
}
