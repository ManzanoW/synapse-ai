import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import DashboardLoading from "./loading";
import { getApprovalOddsAction } from "@/actions/analytics-actions";

export default async function DashboardPage() {
  const session = await auth();

  // Garante validação de sessão rigorosa no servidor
  if (!session?.user) {
    redirect("/login");
  }

  // Pré-carrega no servidor as chances de aprovação para eliminar loading pulsante
  const approvalOddsRes = session.user.id
    ? await getApprovalOddsAction(session.user.id).catch(() => null)
    : null;
  const initialApprovalOdds = approvalOddsRes?.success
    ? approvalOddsRes.data
    : null;

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient
        user={session.user}
        initialApprovalOdds={initialApprovalOdds}
      />
    </Suspense>
  );
}
