"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { invalidateUserCacheAction } from "@/actions/gamification-actions";
import { revalidatePath } from "next/cache";

export interface QuestItem {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  claimed: boolean;
}

// Templates determinísticos de missões rotativas diárias
const QUEST_TEMPLATES = [
  {
    title: "Mente Focada",
    description: "Resolva 10 questões em qualquer simulado hoje.",
    targetCount: 10,
    xpReward: 60,
  },
  {
    title: "Memória Ativa",
    description: "Revise 15 flashcards pendentes no seu acervo.",
    targetCount: 15,
    xpReward: 50,
  },
  {
    title: "Precisão Cirúrgica",
    description: "Acerte pelo menos 8 questões no mesmo simulado.",
    targetCount: 8,
    xpReward: 80,
  },
  {
    title: "Ritmo Ininterrupto",
    description: "Complete 1 sessão de estudo de no mínimo 30 minutos.",
    targetCount: 1,
    xpReward: 40,
  },
  {
    title: "Diagnóstico de Pontos Cegos",
    description: "Gere 1 baralho de reforço com IA a partir de um erro.",
    targetCount: 1,
    xpReward: 70,
  },
];

/**
 * Obtém as missões do dia para o usuário logado (gerando automaticamente se não existirem para hoje)
 */
export async function getDailyQuestsAction(): Promise<{
  success: boolean;
  data?: QuestItem[];
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Busca missões existentes do dia
    let quests = await prisma.dailyQuest.findMany({
      where: {
        userId,
        questDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Se não houver missões para hoje, seleciona 3 templates com base no dia do ano
    if (quests.length === 0) {
      const dayOfYear = Math.floor(
        (todayStart.getTime() - new Date(todayStart.getFullYear(), 0, 0).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const selectedTemplates = [
        QUEST_TEMPLATES[dayOfYear % QUEST_TEMPLATES.length],
        QUEST_TEMPLATES[(dayOfYear + 1) % QUEST_TEMPLATES.length],
        QUEST_TEMPLATES[(dayOfYear + 2) % QUEST_TEMPLATES.length],
      ];

      await prisma.$transaction(
        selectedTemplates.map((t) =>
          prisma.dailyQuest.create({
            data: {
              userId,
              title: t.title,
              description: t.description,
              xpReward: t.xpReward,
              targetCount: t.targetCount,
              currentCount: 0,
              completed: false,
              claimed: false,
              questDate: todayStart,
            },
          })
        )
      );

      quests = await prisma.dailyQuest.findMany({
        where: {
          userId,
          questDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }

    return { success: true, data: quests };
  } catch (err) {
    console.error("Erro em getDailyQuestsAction:", err);
    return { success: false, error: "Falha ao carregar missões diárias." };
  }
}

/**
 * Atualiza o progresso de missões compatíveis com uma ação realizada
 */
export async function trackQuestProgressAction(
  type: "QUESTIONS_SOLVED" | "FLASHCARDS_REVIEWED" | "SESSION_COMPLETED" | "AI_DECK_CREATED",
  incrementValue: number = 1
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const activeQuests = await prisma.dailyQuest.findMany({
      where: {
        userId,
        questDate: { gte: todayStart },
        completed: false,
      },
    });

    for (const quest of activeQuests) {
      let shouldIncrement = false;

      if (type === "QUESTIONS_SOLVED" && quest.title.includes("Mente Focada")) {
        shouldIncrement = true;
      } else if (type === "FLASHCARDS_REVIEWED" && quest.title.includes("Memória Ativa")) {
        shouldIncrement = true;
      } else if (type === "SESSION_COMPLETED" && quest.title.includes("Ritmo Ininterrupto")) {
        shouldIncrement = true;
      } else if (type === "AI_DECK_CREATED" && quest.title.includes("Diagnóstico")) {
        shouldIncrement = true;
      }

      if (shouldIncrement) {
        const nextCount = quest.currentCount + incrementValue;
        const isCompleted = nextCount >= quest.targetCount;

        await prisma.dailyQuest.update({
          where: { id: quest.id },
          data: {
            currentCount: Math.min(nextCount, quest.targetCount),
            completed: isCompleted,
          },
        });
      }
    }
  } catch (err) {
    console.warn("Aviso ao atualizar progresso de DailyQuest:", err);
  }
}

/**
 * Resgata o XP de uma missão concluída
 */
export async function claimQuestRewardAction(questId: string): Promise<{
  success: boolean;
  earnedXp?: number;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const quest = await prisma.dailyQuest.findFirst({
      where: { id: questId, userId },
    });

    if (!quest) {
      return { success: false, error: "Missão não encontrada." };
    }

    if (!quest.completed) {
      return { success: false, error: "Esta missão ainda não foi concluída." };
    }

    if (quest.claimed) {
      return { success: false, error: "Recompensa já resgatada." };
    }

    // Transação atômica: marca resgatada e credita XP em UserStats
    await prisma.$transaction([
      prisma.dailyQuest.update({
        where: { id: questId },
        data: { claimed: true },
      }),
      prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          totalXp: quest.xpReward,
          lastStudyDate: new Date(),
        },
        update: {
          totalXp: { increment: quest.xpReward },
          lastStudyDate: new Date(),
        },
      }),
    ]);

    await invalidateUserCacheAction(userId);
    revalidatePath("/dashboard");

    return { success: true, earnedXp: quest.xpReward };
  } catch (err) {
    console.error("Erro em claimQuestRewardAction:", err);
    return { success: false, error: "Falha ao resgatar recompensa." };
  }
}
