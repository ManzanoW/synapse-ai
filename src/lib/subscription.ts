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

