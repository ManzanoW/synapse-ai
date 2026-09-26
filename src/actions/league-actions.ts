"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  LeagueTier,
  LEAGUE_TIERS,
  getWeeklyCycleBounds,
  determineUserLeague,
  buildLeagueLeaderboard,
  WeeklyChallengeItem,
  WeeklyChestStatus,
  LeaderboardMember,
} from "@/lib/gamification/leagues";

export interface UserLeagueData {
  tier: LeagueTier;
  config: (typeof LEAGUE_TIERS)[LeagueTier];
  cycleKey: string;
  endOfWeekIso: string;
  currentUserRank: number;
  currentUserZone: "PROMOTION" | "MAINTENANCE" | "DEMOTION";
  weeklyXp: number;
  totalXp: number;
  streakDays: number;
  leaderboard: LeaderboardMember[];
  stats: {
    questionsCorrect: number;
    flashcardsReviewed: number;
    essaysCompleted: number;
    focusMinutes: number;
  };
}

/**
 * Busca dados completos da Liga Semanal para o usuário autenticado
 */
export async function getUserLeagueDataAction(): Promise<{
  success: boolean;
  data?: UserLeagueData;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const { startOfWeek, endOfWeek, cycleKey } = getWeeklyCycleBounds();

    // 1. Dados de Gamificação e Perfil do Usuário
    const [user, userStats] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          image: true,
          targetRole: true,
          careerFocus: true,
        },
      }),
      prisma.userStats.findUnique({
        where: { userId },
      }),
    ]);

    const totalXp = userStats?.totalXp ?? 0;
    const prestige = (userStats as { prestige?: number })?.prestige ?? 0;
    const streakDays = userStats?.streakDays ?? 0;

    // 2. Agregação em Tempo Real das Atividades da Semana
    const [quizAttempts, reviewCount, essayCount, studySessions, claimedQuests] =
      await Promise.all([
        prisma.quizAttempt.findMany({
          where: {
            userId,
            completedAt: { gte: startOfWeek },
          },
          select: {
            correctCount: true,
            totalCount: true,
          },
        }),
        prisma.reviewHistory.count({
          where: {
            topic: {
              subject: { userId },
            },
            reviewedAt: { gte: startOfWeek },
          },
        }),
        prisma.essaySubmission.count({
          where: {
            userId,
            createdAt: { gte: startOfWeek },
          },
        }),
        prisma.studySession.findMany({
          where: {
            userId,
            date: { gte: startOfWeek },
          },
          select: {
            durationMinutes: true,
          },
        }),
        prisma.dailyQuest.findMany({
          where: {
            userId,
            claimed: true,
            updatedAt: { gte: startOfWeek },
          },
          select: {
            xpReward: true,
          },
        }),
      ]);

    // Cálculo dos agregados
    let totalQuestionsCorrect = 0;
    let quizXp = 0;
    quizAttempts.forEach((attempt) => {
      totalQuestionsCorrect += attempt.correctCount;
      quizXp += attempt.correctCount * 10;
      if (attempt.totalCount >= 5) {
        quizXp += 20; // Bônus por concluir simulado estruturado
      }
    });

    const flashcardsXp = reviewCount * 15;
    const essaysXp = essayCount * 250;

    let totalFocusMinutes = 0;
    studySessions.forEach((s) => {
      totalFocusMinutes += s.durationMinutes || 0;
    });
    const focusXp = Math.floor(totalFocusMinutes * 2);

    let questsXp = 0;
    claimedQuests.forEach((q) => {
      questsXp += q.xpReward || 50;
    });

    // XP Semanal total da soma das atividades
    const computedWeeklyXp = quizXp + flashcardsXp + essaysXp + focusXp + questsXp;
    // Garante que o XP semanal não exceda o XP total acumulado do usuário
    const weeklyXp = Math.min(totalXp, Math.max(0, computedWeeklyXp));

    // 3. Determina a Liga
    const tier = determineUserLeague(totalXp, prestige);
    const config = LEAGUE_TIERS[tier];

    // 4. Monta o Leaderboard da chave de 20 concurseiros
    const leaderboard = buildLeagueLeaderboard(tier, {
      id: userId,
      name: user?.name || "Você (Concurseiro)",
      avatar: user?.image,
      targetRole: user?.targetRole || user?.careerFocus || "Concurso Público",
      weeklyXp,
      streakDays,
    });

    const currentMember = leaderboard.find((m) => m.isCurrentUser);
    const currentUserRank = currentMember?.rank || 1;
    const currentUserZone = currentMember?.zone || "MAINTENANCE";

    return {
      success: true,
      data: {
        tier,
        config,
        cycleKey,
        endOfWeekIso: endOfWeek.toISOString(),
        currentUserRank,
        currentUserZone,
        weeklyXp,
        totalXp,
        streakDays,
        leaderboard,
        stats: {
          questionsCorrect: totalQuestionsCorrect,
          flashcardsReviewed: reviewCount,
          essaysCompleted: essayCount,
          focusMinutes: totalFocusMinutes,
        },
      },
    };
  } catch (err) {
    console.error("Erro em getUserLeagueDataAction:", err);
    return {
      success: false,
      error: "Não foi possível carregar os dados da liga semanal.",
    };
  }
}

/**
 * Retorna os 4 Desafios da Semana e o status do Grande Baú Semanal
 */
export async function getWeeklyChallengesAction(): Promise<{
  success: boolean;
  challenges?: WeeklyChallengeItem[];
  chestStatus?: WeeklyChestStatus;
  cycleKey?: string;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const { startOfWeek, cycleKey } = getWeeklyCycleBounds();

    // 1. Coleta atividades da semana
    const [quizAttempts, reviewCount, essayCount, studySessions, claimedRecords] =
      await Promise.all([
        prisma.quizAttempt.findMany({
          where: {
            userId,
            completedAt: { gte: startOfWeek },
          },
          select: { totalCount: true, correctCount: true },
        }),
        prisma.reviewHistory.count({
          where: {
            topic: { subject: { userId } },
            reviewedAt: { gte: startOfWeek },
          },
        }),
        prisma.essaySubmission.count({
          where: {
            userId,
            createdAt: { gte: startOfWeek },
          },
        }),
        prisma.studySession.findMany({
          where: {
            userId,
            date: { gte: startOfWeek },
          },
          select: { durationMinutes: true },
        }),
        prisma.userAchievementProgress.findMany({
          where: {
            userId,
            achievementId: { startsWith: `weekly_` },
          },
        }),
      ]);

    const claimedMap = new Set(
      claimedRecords.filter((r) => r.isClaimed).map((r) => r.achievementId)
    );

    let totalQuestionsAttempted = 0;
    quizAttempts.forEach((a) => {
      totalQuestionsAttempted += a.totalCount;
    });

    let totalFocusMinutes = 0;
    studySessions.forEach((s) => {
      totalFocusMinutes += s.durationMinutes || 0;
    });

    // 2. Os 4 Desafios Semanais
    const challenges: WeeklyChallengeItem[] = [
      {
        id: "weekly_quiz_30",
        title: "Centurião dos Simulados",
        description: "Resolva 30 questões de concurso nos simulados adaptativos.",
        iconName: "FileStack",
        currentCount: Math.min(30, totalQuestionsAttempted),
        targetCount: 30,
        xpReward: 250,
        completed: totalQuestionsAttempted >= 30,
        claimed: claimedMap.has(`weekly_quiz_30_${cycleKey}`),
        unit: "questões",
      },
      {
        id: "weekly_flashcards_40",
        title: "Retenção de Aço FSRS",
        description: "Revise 40 flashcards ativos para fixar a memória de longo prazo.",
        iconName: "Layers",
        currentCount: Math.min(40, reviewCount),
        targetCount: 40,
        xpReward: 200,
        completed: reviewCount >= 40,
        claimed: claimedMap.has(`weekly_flashcards_40_${cycleKey}`),
        unit: "cards",
      },
      {
        id: "weekly_essay_1",
        title: "Mestre Discursivo",
        description: "Envie 1 redação oficial com espelho calibrado da banca.",
        iconName: "PenTool",
        currentCount: Math.min(1, essayCount),
        targetCount: 1,
        xpReward: 350,
        completed: essayCount >= 1,
        claimed: claimedMap.has(`weekly_essay_1_${cycleKey}`),
        unit: "redação",
      },
      {
        id: "weekly_focus_90",
        title: "Foco Inabalável",
        description: "Acumule 90 minutos de estudo imersivo na Sala de Foco.",
        iconName: "Headphones",
        currentCount: Math.min(90, totalFocusMinutes),
        targetCount: 90,
        xpReward: 300,
        completed: totalFocusMinutes >= 90,
        claimed: claimedMap.has(`weekly_focus_90_${cycleKey}`),
        unit: "minutos",
      },
    ];

    const completedChallenges = challenges.filter((c) => c.completed).length;
    const isChestUnlocked = completedChallenges === challenges.length;
    const isChestClaimed = claimedMap.has(`weekly_chest_${cycleKey}`);

    const chestStatus: WeeklyChestStatus = {
      totalChallenges: challenges.length,
      completedChallenges,
      isUnlocked: isChestUnlocked,
      isClaimed: isChestClaimed,
      xpReward: 500,
      streakFreezeReward: 1,
    };

    return {
      success: true,
      challenges,
      chestStatus,
      cycleKey,
    };
  } catch (err) {
    console.error("Erro em getWeeklyChallengesAction:", err);
    return {
      success: false,
      error: "Não foi possível carregar os desafios da semana.",
    };
  }
}

/**
 * Resgata o prêmio de XP de um desafio semanal específico
 */
export async function claimWeeklyChallengeAction(challengeId: string): Promise<{
  success: boolean;
  xpAwarded?: number;
  newTotalXp?: number;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const { cycleKey } = getWeeklyCycleBounds();
    const achievementKey = `${challengeId}_${cycleKey}`;

    // Obtém desafios para validar conclusão e valor do XP
    const challengesRes = await getWeeklyChallengesAction();
    if (!challengesRes.success || !challengesRes.challenges) {
      return { success: false, error: "Falha ao validar desafio." };
    }

    const challenge = challengesRes.challenges.find((c) => c.id === challengeId);
    if (!challenge) {
      return { success: false, error: "Desafio não encontrado." };
    }

    if (!challenge.completed) {
      return { success: false, error: "Este desafio ainda não foi completado." };
    }

    if (challenge.claimed) {
      return { success: false, error: "Esta recompensa já foi resgatada." };
    }

    const xpToAward = challenge.xpReward;

    // Transação atômica: salva progresso resgatado e credita XP no UserStats
    const [_, updatedStats] = await prisma.$transaction([
      prisma.userAchievementProgress.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievementKey,
          },
        },
        create: {
          userId,
          achievementId: achievementKey,
          currentValue: challenge.targetCount,
          isUnlocked: true,
          unlockedAt: new Date(),
          isClaimed: true,
        },
        update: {
          currentValue: challenge.targetCount,
          isUnlocked: true,
          isClaimed: true,
        },
      }),
      prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          totalXp: xpToAward,
        },
        update: {
          totalXp: { increment: xpToAward },
        },
      }),
    ]);

    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");
    revalidatePath("/achievements");

    return {
      success: true,
      xpAwarded: xpToAward,
      newTotalXp: updatedStats.totalXp,
    };
  } catch (err) {
    console.error("Erro em claimWeeklyChallengeAction:", err);
    return {
      success: false,
      error: "Não foi possível resgatar o prêmio do desafio.",
    };
  }
}

/**
 * Resgata o Baú Semanal Épico (+500 XP + 1 Streak Freeze)
 */
export async function claimWeeklyChestAction(): Promise<{
  success: boolean;
  xpAwarded?: number;
  streakFreezeAwarded?: number;
  newTotalXp?: number;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const { cycleKey } = getWeeklyCycleBounds();
    const chestKey = `weekly_chest_${cycleKey}`;

    const challengesRes = await getWeeklyChallengesAction();
    if (!challengesRes.success || !challengesRes.chestStatus) {
      return { success: false, error: "Falha ao validar baú semanal." };
    }

    const { isUnlocked, isClaimed, xpReward, streakFreezeReward } =
      challengesRes.chestStatus;

    if (!isUnlocked) {
      return {
        success: false,
        error: "Complete todos os 4 desafios da semana para abrir o Baú Épico!",
      };
    }

    if (isClaimed) {
      return {
        success: false,
        error: "O Baú Épico desta semana já foi resgatado!",
      };
    }

    // Transação atômica
    const [_, updatedStats] = await prisma.$transaction([
      prisma.userAchievementProgress.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: chestKey,
          },
        },
        create: {
          userId,
          achievementId: chestKey,
          currentValue: 4,
          isUnlocked: true,
          unlockedAt: new Date(),
          isClaimed: true,
        },
        update: {
          isUnlocked: true,
          isClaimed: true,
        },
      }),
      prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          totalXp: xpReward,
          streakFreezes: streakFreezeReward,
        },
        update: {
          totalXp: { increment: xpReward },
          streakFreezes: { increment: streakFreezeReward },
        },
      }),
    ]);

    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");
    revalidatePath("/achievements");

    return {
      success: true,
      xpAwarded: xpReward,
      streakFreezeAwarded: streakFreezeReward,
      newTotalXp: updatedStats.totalXp,
    };
  } catch (err) {
    console.error("Erro em claimWeeklyChestAction:", err);
    return {
      success: false,
      error: "Não foi possível resgatar o Baú Semanal.",
    };
  }
}
