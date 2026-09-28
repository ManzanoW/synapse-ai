"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface PlanStatusResult {
  success: boolean;
  planTier: "FREE" | "PREMIUM";
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
      Boolean(
        user?.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
      );

    return {
      success: true,
      planTier: (user?.planTier as "FREE" | "PREMIUM") || "FREE",
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
 * Permite alternar o plano do usuário entre FREE e PREMIUM para fins de teste no ambiente de desenvolvimento/beta.
 */
export async function toggleDemoPlanTierAction(): Promise<{
  success: boolean;
  newPlanTier: "FREE" | "PREMIUM";
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
      select: { planTier: true },
    });

    const targetTier: "FREE" | "PREMIUM" =
      current?.planTier === "PREMIUM" ? "FREE" : "PREMIUM";

    await prisma.user.update({
      where: { id: userId },
      data: { planTier: targetTier },
    });

    revalidatePath("/pricing");
    revalidatePath("/profile");
    revalidatePath("/dashboard");

    return {
      success: true,
      newPlanTier: targetTier,
      message:
        targetTier === "PREMIUM"
          ? "🎉 Plano PREMIUM ativado com sucesso! Você agora tem IA ilimitada."
          : "Plano FREE ativado. As cotas diárias de 7 requisições/dia voltam a valer.",
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
 * Registra a intenção de compra ou ativação de teste do usuário para o plano Pro.
 * Coleta o interesse de compra (Lead qualificado) e concede o upgrade imediato para teste.
 */
export async function submitSubscriptionLeadAction(input: {
  plan: string;
  billingCycle: "MONTHLY" | "ANNUAL";
  phoneOrWhatsapp?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  message: string;
  activatedTrial: boolean;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        message: "Faça login para assinar ou testar o Synapse Pro.",
        activatedTrial: false,
      };
    }

    const cycleLabel = input.billingCycle === "ANNUAL" ? "Anual (R$ 29,90/mês)" : "Mensal (R$ 39,90/mês)";
    const leadMessage = `[INTERESSE EM ASSINATURA] Plano: ${input.plan} | Ciclo: ${cycleLabel} | Contato: ${
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

    // Concede ativação imediata do Premium como cortesia de lançamento / early-adopter trial
    await prisma.user.update({
      where: { id: userId },
      data: { planTier: "PREMIUM" },
    });

    revalidatePath("/pricing");
    revalidatePath("/profile");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "🎉 Parabéns! Seu Acesso VIP Synapse Pro foi ativado com sucesso. Aproveite a IA ilimitada!",
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
