import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import DashboardLoading from "./loading";
import { getApprovalOddsAction } from "@/actions/analytics-actions";
import { getDailyFlowRecommendationAction } from "@/actions/daily-flow-actions";

export default async function DashboardPage() {
  const session = await auth();

  // Garante validação de sessão rigorosa no servidor
  if (!session?.user) {
    redirect("/login");
  }

  // Pré-carrega no servidor as chances de aprovação e fluxo diário recomendado
  const [approvalOddsRes, dailyFlowRes] = await Promise.all([
    session.user.id
      ? getApprovalOddsAction(session.user.id).catch(() => null)
      : null,
    getDailyFlowRecommendationAction().catch(() => null),
  ]);

  const initialApprovalOdds = approvalOddsRes?.success
    ? approvalOddsRes.data
    : null;
  const initialDailyFlow = dailyFlowRes?.success
    ? dailyFlowRes.data
    : null;

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient
        user={session.user}
        initialApprovalOdds={initialApprovalOdds}
        initialDailyFlow={initialDailyFlow}
      />
    </Suspense>
  );
}
