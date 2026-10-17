// src/lib/subscription.ts
import { prisma } from "@/lib/prisma";

export type PlanTier = "FREE" | "PREMIUM" | "ELITE";

/**
 * 🛡️ Verifica no banco de dados se o usuário possui status Pro/Premium ou Elite ativo.
 * Considera:
 * 1. Role ADMIN ou email correspondente a process.env.ADMIN_EMAIL
 * 2. planTier === "PREMIUM" ou planTier === "ELITE"
 */
export async function isUserPro(userId?: string | null): Promise<boolean> {
  if (!userId) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, planTier: true, email: true },
    });

    if (!user) return false;

    const isAdmin =
      user.role === "ADMIN" ||
      Boolean(
        user.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
      );

    return isAdmin || user.planTier === "PREMIUM" || user.planTier === "ELITE";
  } catch (error) {
    console.error("[isUserPro] Erro ao verificar status Pro do usuário:", error);
    return false;
  }
}

/**
 * 👑 Verifica se o usuário possui o plano Synapse Elite (Mentor IA & Piloto Automático) ou Admin.
 */
export async function isUserElite(userId?: string | null): Promise<boolean> {
  if (!userId) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, planTier: true, email: true },
    });

    if (!user) return false;

    const isAdmin =
      user.role === "ADMIN" ||
      Boolean(
        user.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
      );

    return isAdmin || user.planTier === "ELITE";
  } catch (error) {
    console.error("[isUserElite] Erro ao verificar status Elite do usuário:", error);
    return false;
  }
}

