import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AnalyticsClient from "./performance-client";

export default async function PerformancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#02050e] text-slate-100 flex items-center justify-center">
          <div className="text-xs font-mono text-slate-400">Carregando painel de performance...</div>
        </div>
      }
    >
      <AnalyticsClient user={session.user} />
    </Suspense>
  );
}
