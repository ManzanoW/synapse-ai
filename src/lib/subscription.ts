// src/lib/subscription.ts
import { prisma } from "@/lib/prisma";

export type PlanTier = "FREE" | "PREMIUM" | "ELITE";

/**
 * 🛡️ Verifica no banco de dados se o usuário possui status Pro/Premium ou Elite ativo.
 * Considera:
 * 1. Role ADMIN ou email correspondente a process.env.ADMIN_EMAIL (vitalício/irrestrito)
 * 2. planTier === "PREMIUM" ou planTier === "ELITE" COM data de vigência válida (planExpiresAt)
 */
export async function isUserPro(userId?: string | null): Promise<boolean> {
  if (!userId) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, planTier: true, email: true, planExpiresAt: true },
    });

    if (!user) return false;

    const isAdmin =
      user.role === "ADMIN" ||
      Boolean(
        user.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
      );

    if (isAdmin) return true;

    const isTierPro = user.planTier === "PREMIUM" || user.planTier === "ELITE";
    if (!isTierPro) return false;

    // Se tiver data de expiração cadastrada, verifica se ainda está dentro do prazo
    if (user.planExpiresAt) {
      const isExpired = user.planExpiresAt.getTime() <= Date.now();
      if (isExpired) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("[isUserPro] Erro ao verificar status Pro do usuário:", error);
    return false;
  }
}

/**
 * 👑 Verifica se o usuário possui o plano Synapse Elite (Mentor IA & Piloto Automático) ou Admin ativo.
 */
export async function isUserElite(userId?: string | null): Promise<boolean> {
  if (!userId) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, planTier: true, email: true, planExpiresAt: true },
    });

    if (!user) return false;

    const isAdmin =
      user.role === "ADMIN" ||
      Boolean(
        user.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
      );

    if (isAdmin) return true;

    if (user.planTier !== "ELITE") return false;

    // Se tiver data de expiração cadastrada, verifica se ainda está dentro do prazo
    if (user.planExpiresAt) {
      const isExpired = user.planExpiresAt.getTime() <= Date.now();
      if (isExpired) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("[isUserElite] Erro ao verificar status Elite do usuário:", error);
    return false;
  }
}

/**
 * 🛡️ Ativa ou prorroga a assinatura Pro/Elite do concurseiro de forma ESTRITAMENTE IDEMPOTENTE.
 * Executado exclusivamente no backend (sem exposição como Server Action pública).
 * Garante que um mesmo pedido (orderId) NUNCA renove o plano mais de uma vez.
 */
export async function activateUserPlan(
  userId: string,
  planTier: string,
  billingCycle: string,
  orderId?: string,
): Promise<{ success: boolean; activated: boolean; planExpiresAt?: Date }> {
  const durationDays = billingCycle === "ANNUAL" ? 365 : 30;

  // Se um orderId for fornecido, executa uma transação atômica com trava condicional
  if (orderId) {
    return await prisma.$transaction(async (tx) => {
      // 🔒 TRAVA ATÔMICA: Atualiza apenas pedidos que ainda NÃO estão aprovados
      const updateResult = await tx.paymentOrder.updateMany({
        where: {
          id: orderId,
          status: { not: "APPROVED" },
        },
        data: {
          status: "APPROVED",
          paidAt: new Date(),
        },
      });

      // Se count === 0, o pedido já foi aprovado por outro webhook/thread concorrente. Idempotência garantida!
      if (updateResult.count === 0) {
        console.log(`[Idempotency Guard] 🛡️ Pedido ${orderId} já foi processado anteriormente. Ignorando re-ativação duplicada.`);
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { planExpiresAt: true },
        });
        return { success: true, activated: false, planExpiresAt: user?.planExpiresAt || undefined };
      }

      // Pedido era PENDING e acabou de ser aprovado com exclusividade atômica
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { planTier: true, planExpiresAt: true },
      });

      const now = new Date();
      const currentExpiry = user?.planExpiresAt && user.planExpiresAt > now ? user.planExpiresAt : now;
      const newExpiresAt = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);

      await tx.user.update({
        where: { id: userId },
        data: {
          planTier,
          planExpiresAt: newExpiresAt,
        },
      });

      console.log(`[Idempotency Guard] ✅ Pedido ${orderId} ativado com sucesso! Validade estendida até ${newExpiresAt.toISOString()}`);
      return { success: true, activated: true, planExpiresAt: newExpiresAt };
    });
  }

  // Caso fallback (sem orderId, ex: ativação administrativa):
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planTier: true, planExpiresAt: true },
  });

  if (!user) return { success: false, activated: false };

  const now = new Date();
  const currentExpiry = user.planExpiresAt && user.planExpiresAt > now ? user.planExpiresAt : now;
  const newExpiresAt = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      planTier,
      planExpiresAt: newExpiresAt,
    },
  });

  return { success: true, activated: true, planExpiresAt: newExpiresAt };
}

