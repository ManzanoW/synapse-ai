"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type PlanTierType = "FREE" | "PREMIUM" | "ELITE";

export interface PlanStatusResult {
  success: boolean;
  planTier: PlanTierType;
  role: string;
  isUnlimited: boolean;
  userEmail?: string | null;
  userName?: string | null;
  error?: string;
}

/**
 * Consulta o status atual de plano do usuário autenticado.
 */
export async function getCurrentPlanStatusAction(): Promise<PlanStatusResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        planTier: "FREE",
        role: "USER",
        isUnlimited: false,
        error: "Usuário não autenticado.",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        planTier: true,
        role: true,
        email: true,
        name: true,
      },
    });

    const isUnlimited =
      user?.role === "ADMIN" ||
      user?.planTier === "PREMIUM" ||
      user?.planTier === "ELITE" ||
      Boolean(
        user?.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
      );

    return {
      success: true,
      planTier: (user?.planTier as PlanTierType) || "FREE",
      role: user?.role || "USER",
      isUnlimited,
      userEmail: user?.email,
      userName: user?.name,
    };
  } catch (err) {
    console.error("[getCurrentPlanStatusAction] Erro:", err);
    return {
      success: false,
      planTier: "FREE",
      role: "USER",
      isUnlimited: false,
      error: "Falha ao verificar status do plano.",
    };
  }
}

/**
 * Permite alternar o plano do usuário entre FREE -> PREMIUM -> ELITE -> FREE
 * (ou definir diretamente um plano específico) para fins de teste no ambiente de desenvolvimento/beta.
 */
export async function toggleDemoPlanTierAction(
  explicitTier?: PlanTierType,
): Promise<{
  success: boolean;
  newPlanTier: PlanTierType;
  message: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        newPlanTier: "FREE",
        message: "Usuário não autenticado.",
      };
    }

    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { planTier: true, role: true, email: true },
    });

    const isAdmin =
      current?.role === "ADMIN" ||
      Boolean(
        current?.email &&
          process.env.ADMIN_EMAIL &&
          current.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
      );

    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_DEMO_PLAN_TOGGLE === "false" &&
      !isAdmin
    ) {
      return {
        success: false,
        newPlanTier: (current?.planTier as PlanTierType) || "FREE",
        message: "Alternância de plano de demonstração desativada em produção.",
      };
    }

    let targetTier: PlanTierType;
    if (explicitTier) {
      targetTier = explicitTier;
    } else if (current?.planTier === "FREE") {
      targetTier = "PREMIUM";
    } else if (current?.planTier === "PREMIUM") {
      targetTier = "ELITE";
    } else {
      targetTier = "FREE";
    }

    await prisma.user.update({
      where: { id: userId },
      data: { planTier: targetTier },
    });

    revalidatePath("/pricing");
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/trilhas");

    return {
      success: true,
      newPlanTier: targetTier,
      message:
        targetTier === "ELITE"
          ? "👑 Plano SYNAPSE ELITE ativado! Você agora tem 120 Ajudas com IA/dia, Mentor IA, Trilhas e Áudio-Aulas Ilimitadas."
          : targetTier === "PREMIUM"
          ? "🎉 Plano SYNAPSE PRO ativado com sucesso! Você agora tem 60 Ajudas com IA/dia e acesso Pro total."
          : "Plano FREE ativado. As cotas diárias de 10 Ajudas com IA/dia voltam a valer.",
    };
  } catch (err) {
    console.error("[toggleDemoPlanTierAction] Erro ao alternar plano:", err);
    return {
      success: false,
      newPlanTier: "FREE",
      message: "Falha ao alternar plano de teste.",
    };
  }
}

/**
 * Registra a intenção de compra ou ativação de teste do usuário para o plano Pro ou Synapse Elite.
 * Coleta o interesse de compra (Lead qualificado) e concede o upgrade imediato para teste.
 */
export async function submitSubscriptionLeadAction(input: {
  plan: string;
  targetTier?: "PREMIUM" | "ELITE";
  billingCycle: "MONTHLY" | "ANNUAL";
  phoneOrWhatsapp?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  newPlanTier?: PlanTierType;
  message: string;
  activatedTrial: boolean;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        message: "Faça login para assinar ou testar o Synapse.",
        activatedTrial: false,
      };
    }

    const isEliteSelected =
      input.targetTier === "ELITE" ||
      input.plan.toLowerCase().includes("elite");

    const assignedTier: PlanTierType = isEliteSelected ? "ELITE" : "PREMIUM";
    const cycleLabel = isEliteSelected
      ? input.billingCycle === "ANNUAL"
        ? "Anual Elite (R$ 49,90/mês)"
        : "Mensal Elite (R$ 64,90/mês)"
      : input.billingCycle === "ANNUAL"
      ? "Anual Pro (R$ 29,90/mês)"
      : "Mensal Pro (R$ 39,90/mês)";

    const leadMessage = `[INTERESSE EM ASSINATURA] Plano: ${input.plan} (${assignedTier}) | Ciclo: ${cycleLabel} | Contato: ${
      input.phoneOrWhatsapp || "Não informado"
    } | Observações: ${input.notes || "Sem notas"}`;

    // Registra como feedback interno categorizado
    await prisma.userFeedback.create({
      data: {
        userId,
        type: "OTHER",
        category: "ASSINATURA",
        message: leadMessage,
        rating: 5,
        pageUrl: "/pricing",
        status: "NEW",
      },
    });

    // Concede ativação imediata do plano escolhido (PREMIUM ou ELITE)
    await prisma.user.update({
      where: { id: userId },
      data: { planTier: assignedTier },
    });

    revalidatePath("/pricing");
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/trilhas");

    return {
      success: true,
      newPlanTier: assignedTier,
      message: isEliteSelected
        ? "👑 Parabéns! Seu Acesso VIP Synapse Elite (120 Ajudas com IA/dia + Trilhas Profundas & Áudio-Aulas) foi ativado!"
        : "🎉 Parabéns! Seu Acesso VIP Synapse Pro (60 Ajudas com IA/dia) foi ativado com sucesso!",
      activatedTrial: true,
    };
  } catch (err) {
    console.error("[submitSubscriptionLeadAction] Erro:", err);
    return {
      success: false,
      message: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
      activatedTrial: false,
    };
  }
}
