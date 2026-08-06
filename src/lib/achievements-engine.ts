// src/lib/achievements-engine.ts
import { prisma } from "@/lib/prisma";

export async function checkAndAwardAchievements(userId: string) {
  // 1. Busca estatísticas e histórico do usuário
  const userStats = await prisma.userStats.findUnique({
    where: { userId },
  });

  const reviewCount = await prisma.reviewHistory.count({
    where: { topic: { subject: { userId } } },
  });

  const unlockedBadges: string[] = [];

  // 2. Regras de verificação
  if (reviewCount >= 1) {
    unlockedBadges.push("first_step");
  }
  if (reviewCount >= 100) {
    unlockedBadges.push("card_master");
  }
  if ((userStats?.totalXp ?? 0) >= 1000) {
    unlockedBadges.push("xp_rookie");
  }

  // Retorna os IDs das conquistas desbloqueadas
  return unlockedBadges;
}
