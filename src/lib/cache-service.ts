import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserAchievementsProgress } from "@/lib/achievements-engine";

/**
 * Cache para busca das estatísticas do usuário (XP, Nível, Streak)
 */
export const getCachedUserStats = (userId: string) =>
  unstable_cache(
    async () => {
      return await prisma.userStats.findUnique({
        where: { userId },
      });
    },
    [`user-stats-${userId}`],
    {
      tags: [`user-stats-${userId}`],
      revalidate: 300, // Revalida automaticamente a cada 5 minutos
    },
  )();

/**
 * Cache para o progresso de conquistas do usuário
 */
export const getCachedAchievementsProgress = (userId: string) =>
  unstable_cache(
    async () => {
      return await getUserAchievementsProgress(userId);
    },
    [`user-achievements-${userId}`],
    {
      tags: [`user-achievements-${userId}`],
      revalidate: 300,
    },
  )();

/**
 * Cache reativo para as métricas do dashboard do usuário
 * Consulta dados do usuário (weeklyGoalHours, targetExamDate), contagem de studySession e flashcard.
 * Tag: user-dashboard-${userId}, TTL: 120s
 */
export const getCachedDashboardMetrics = (userId: string) =>
  unstable_cache(
    async () => {
      const [user, studySessionCount, flashcardCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            weeklyGoalHours: true,
            targetExamDate: true,
          },
        }),
        prisma.studySession.count({
          where: { userId },
        }),
        prisma.flashcard.count({
          where: { deck: { userId } },
        }),
      ]);

      return {
        user,
        studySessionCount,
        flashcardCount,
      };
    },
    [`user-dashboard-${userId}`],
    {
      tags: [`user-dashboard-${userId}`],
      revalidate: 120, // Revalida automaticamente a cada 120 segundos
    },
  )();

/**
 * Cache reativo para as configurações de cronograma e ciclo do usuário
 * Tag: user-schedule-${userId}, TTL: 120s
 */
export const getCachedUserScheduleConfig = (userId: string) =>
  unstable_cache(
    async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          weeklyGoalHours: true,
          activeDaysPerWeek: true,
          studyMode: true,
          cycleCurrentIndex: true,
          cycleLap: true,
          targetRole: true,
          careerFocus: true,
        },
      });
    },
    [`user-schedule-${userId}`],
    {
      tags: [`user-schedule-${userId}`],
      revalidate: 120,
    },
  )();

/**
 * Invalida todos os caches relacionados ao dashboard e progresso do usuário
 */
export function invalidateUserDashboardCache(userId: string) {
  try {
    (revalidateTag as any)(`user-dashboard-${userId}`);
    (revalidateTag as any)(`user-stats-${userId}`);
    (revalidateTag as any)(`user-achievements-${userId}`);
    (revalidateTag as any)(`user-schedule-${userId}`);
    (revalidateTag as any)(`user-edital-${userId}`);
  } catch (err) {
    console.warn("Aviso ao invalidar tags de cache do dashboard:", err);
  }
}

