import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCurrentPlanStatusAction } from "@/actions/subscription-actions";
import { PricingView } from "@/components/pricing/PricingView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planos & Assinatura | Synapse AI",
  description:
    "Conheça os planos do Synapse AI. Estude com inteligência artificial ilimitada para concursos públicos.",
};

export default async function PricingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const planStatus = await getCurrentPlanStatusAction();

  return (
    <div className="min-h-full pb-16 px-2 sm:px-4">
      <PricingView
        currentPlanTier={planStatus.planTier}
        role={planStatus.role}
        isUnlimited={planStatus.isUnlimited}
        userEmail={planStatus.userEmail}
      />
    </div>
  );
}
