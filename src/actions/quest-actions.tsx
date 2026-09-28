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
  actionUrl?: string;
  actionLabel?: string;
  iconType?: "cards" | "questions" | "notebook" | "focus";
}

export interface DailyChestStatus {
  unlocked: boolean;
  claimed: boolean;
  xpReward: number;
  completedQuests: number;
  totalQuests: number;
}

// Templates determinísticos de missões rotativas diárias
const QUEST_TEMPLATES = [
  {
    title: "Mente Focada",
    description: "Resolva 10 questões em qualquer simulado hoje.",
    targetCount: 10,
    xpReward: 60,
    actionUrl: "/questions",
    actionLabel: "Fazer Simulado",
    iconType: "questions" as const,
  },
  {
    title: "Memória Ativa",
    description: "Revise 15 flashcards pendentes no seu acervo.",
    targetCount: 15,
    xpReward: 50,
    actionUrl: "/flashcards",
    actionLabel: "Praticar Cards",
    iconType: "cards" as const,
  },
  {
    title: "Precisão Cirúrgica",
    description: "Acerte pelo menos 8 questões no mesmo simulado.",
    targetCount: 8,
    xpReward: 80,
    actionUrl: "/questions",
    actionLabel: "Fazer Simulado",
    iconType: "questions" as const,
  },
  {
    title: "Ritmo Ininterrupto",
    description: "Complete 1 sessão de estudo de no mínimo 30 minutos.",
    targetCount: 1,
    xpReward: 40,
    actionUrl: "/study-room",
    actionLabel: "Sala de Foco",
    iconType: "focus" as const,
  },
  {
    title: "Diagnóstico de Pontos Cegos",
    description: "Gere 1 baralho de reforço com IA a partir de um erro.",
    targetCount: 1,
    xpReward: 70,
    actionUrl: "/notebook",
    actionLabel: "Caderno de Erros",
    iconType: "notebook" as const,
  },
];

function enrichQuest(q: any): QuestItem {
  const match = QUEST_TEMPLATES.find(
    (t) => q.title.includes(t.title) || t.title.includes(q.title),
  );
  return {
    id: q.id,
    title: q.title,
    description: q.description,
    xpReward: q.xpReward,
    targetCount: q.targetCount,
    currentCount: q.currentCount,
    completed: q.completed,
    claimed: q.claimed,
    actionUrl:
      match?.actionUrl ||
      (q.title.includes("flashcard") || q.title.includes("Memória")
        ? "/flashcards"
        : "/questions"),
    actionLabel: match?.actionLabel || "Acessar",
    iconType: match?.iconType || "questions",
  };
}

/**
 * Obtém as missões do dia para o usuário logado (gerando automaticamente se não existirem para hoje)
 */
export async function getDailyQuestsAction(): Promise<{
  success: boolean;
  data?: QuestItem[];
  dailyChest?: DailyChestStatus;
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

    // 1. Busca missões existentes do dia (excluindo o baú)
    let quests = await prisma.dailyQuest.findMany({
      where: {
        userId,
        questDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        NOT: { title: "Baú de Maestria Diária" },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Se houver missões duplicadas para o mesmo dia (ex: race condition ou chamadas concorrentes),
    // agrupa por título, preserva a com maior progresso/conclusão e limpa as excedentes do banco.
    if (quests.length > 0) {
      const uniqueMap = new Map<string, (typeof quests)[0]>();
      const duplicateIdsToDelete: string[] = [];

      for (const q of quests) {
        const existing = uniqueMap.get(q.title);
        if (!existing) {
          uniqueMap.set(q.title, q);
        } else {
          const existingScore =
            (existing.claimed ? 1000 : 0) +
            (existing.completed ? 100 : 0) +
            existing.currentCount;
          const currentScore =
            (q.claimed ? 1000 : 0) +
            (q.completed ? 100 : 0) +
            q.currentCount;

          if (currentScore > existingScore) {
            duplicateIdsToDelete.push(existing.id);
            uniqueMap.set(q.title, q);
          } else {
            duplicateIdsToDelete.push(q.id);
          }
        }
      }

      if (duplicateIdsToDelete.length > 0) {
        try {
          await prisma.dailyQuest.deleteMany({
            where: { id: { in: duplicateIdsToDelete } },
          });
        } catch (delErr) {
          console.warn("Aviso ao limpar missões diárias duplicadas:", delErr);
        }
      }

      quests = Array.from(uniqueMap.values()).slice(0, 3);
    }

    // 3. Se não houver missões para hoje, seleciona 3 templates com base no dia do ano
    if (quests.length === 0) {
      const dayOfYear = Math.floor(
        (todayStart.getTime() -
          new Date(todayStart.getFullYear(), 0, 0).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const selectedTemplates = [
        QUEST_TEMPLATES[dayOfYear % QUEST_TEMPLATES.length],
        QUEST_TEMPLATES[(dayOfYear + 1) % QUEST_TEMPLATES.length],
        QUEST_TEMPLATES[(dayOfYear + 2) % QUEST_TEMPLATES.length],
      ];

      // Proteção atômica contra concorrência
      const countCheck = await prisma.dailyQuest.count({
        where: {
          userId,
          questDate: { gte: todayStart, lte: todayEnd },
          NOT: { title: "Baú de Maestria Diária" },
        },
      });

      if (countCheck === 0) {
        await prisma.$transaction(
          selectedTemplates.map((t: any) =>
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
            }),
          ),
        );
      }

      const reloaded = await prisma.dailyQuest.findMany({
        where: {
          userId,
          questDate: {
            gte: todayStart,
            lte: todayEnd,
          },
          NOT: { title: "Baú de Maestria Diária" },
        },
        orderBy: { createdAt: "asc" },
      });

      const uniqueReloaded = new Map<string, (typeof reloaded)[0]>();
      for (const q of reloaded) {
        if (!uniqueReloaded.has(q.title)) {
          uniqueReloaded.set(q.title, q);
        }
      }
      quests = Array.from(uniqueReloaded.values()).slice(0, 3);
    }

    // 4. Verifica status do Baú de Maestria Diária
    const chestRecord = await prisma.dailyQuest.findFirst({
      where: {
        userId,
        title: "Baú de Maestria Diária",
        questDate: { gte: todayStart, lte: todayEnd },
      },
    });

    const enrichedQuests = quests.map(enrichQuest);
    const completedCount = enrichedQuests.filter((q) => q.completed).length;
    const allCompleted =
      enrichedQuests.length > 0 && completedCount === enrichedQuests.length;

    const dailyChest: DailyChestStatus = {
      unlocked: allCompleted,
      claimed: Boolean(chestRecord?.claimed),
      xpReward: 100,
      completedQuests: completedCount,
      totalQuests: enrichedQuests.length,
    };

    return { success: true, data: enrichedQuests, dailyChest };
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

/**
 * Resgata o Baú de Maestria Diária (Bônus por completar todas as missões de hoje)
 */
export async function claimDailyChestAction(): Promise<{
  success: boolean;
  earnedXp?: number;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Não autorizado." };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Verifica se todas as missões regulares de hoje foram concluídas
    const regularQuests = await prisma.dailyQuest.findMany({
      where: {
        userId,
        questDate: { gte: todayStart, lte: todayEnd },
        NOT: { title: "Baú de Maestria Diária" },
      },
    });

    const uniqueQuests = Array.from(
      new Map(regularQuests.map((q) => [q.title, q])).values(),
    );

    if (uniqueQuests.length === 0 || uniqueQuests.some((q) => !q.completed)) {
      return {
        success: false,
        error: "Complete todas as 3 missões de hoje para desbloquear o Baú.",
      };
    }

    // 2. Verifica se já foi resgatado hoje
    const existingChest = await prisma.dailyQuest.findFirst({
      where: {
        userId,
        title: "Baú de Maestria Diária",
        questDate: { gte: todayStart, lte: todayEnd },
      },
    });

    if (existingChest && existingChest.claimed) {
      return {
        success: false,
        error: "O Baú Diário de hoje já foi resgatado.",
      };
    }

    const CHEST_XP = 100;

    await prisma.$transaction([
      existingChest
        ? prisma.dailyQuest.update({
            where: { id: existingChest.id },
            data: { claimed: true, completed: true },
          })
        : prisma.dailyQuest.create({
            data: {
              userId,
              title: "Baú de Maestria Diária",
              description:
                "Bônus por completar todas as 3 missões diárias com maestria.",
              xpReward: CHEST_XP,
              targetCount: 1,
              currentCount: 1,
              completed: true,
              claimed: true,
              questDate: todayStart,
            },
          }),
      prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          totalXp: CHEST_XP,
          lastStudyDate: new Date(),
        },
        update: {
          totalXp: { increment: CHEST_XP },
          lastStudyDate: new Date(),
        },
      }),
    ]);

    await invalidateUserCacheAction(userId);
    revalidatePath("/dashboard");

    return { success: true, earnedXp: CHEST_XP };
  } catch (err) {
    console.error("Erro em claimDailyChestAction:", err);
    return { success: false, error: "Falha ao resgatar Baú Diário." };
  }
}
