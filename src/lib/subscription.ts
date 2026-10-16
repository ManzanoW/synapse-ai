// src/lib/subscription.ts
import { prisma } from "@/lib/prisma";

/**
 * 🛡️ Verifica no banco de dados se o usuário possui status Pro/Premium ativo.
 * Considera:
 * 1. Role ADMIN ou email correspondente a process.env.ADMIN_EMAIL
 * 2. planTier === "PREMIUM"
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

    return isAdmin || user.planTier === "PREMIUM";
  } catch (error) {
    console.error("[isUserPro] Erro ao verificar status Pro do usuário:", error);
    return false;
  }
}
