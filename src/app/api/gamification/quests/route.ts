import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const DEFAULT_QUESTS = [
  {
    title: "Resolver 10 Questões",
    description: "Pratique com questões no banco de simulados",
    xpReward: 50,
    targetCount: 10,
    type: "QUIZ",
  },
  {
    title: "Revisar 15 Flashcards",
    description: "Mantenha seu algoritmo SRS de repetição ativo",
    xpReward: 40,
    targetCount: 15,
    type: "CARDS",
  },
  {
    title: "Avançar no Edital",
    description: "Complete pelo menos 1 sessão de estudo de um tópico",
    xpReward: 60,
    targetCount: 1,
    type: "SESSION",
  },
];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Busca missões existentes de hoje
    let quests = await prisma.dailyQuest.findMany({
      where: {
        userId,
        questDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. 🔒 Criação segura e atômica contra requisições concorrentes
    if (quests.length === 0) {
      await prisma.$transaction(async (tx) => {
        const count = await tx.dailyQuest.count({
          where: {
            userId,
            questDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        if (count === 0) {
          await tx.dailyQuest.createMany({
            data: DEFAULT_QUESTS.map((q) => ({
              userId,
              title: q.title,
              description: q.description,
              xpReward: q.xpReward,
              targetCount: q.targetCount,
              currentCount: 0,
              completed: false,
              claimed: false,
              questDate: startOfDay,
            })),
          });
        }
      });

      quests = await prisma.dailyQuest.findMany({
        where: {
          userId,
          questDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }

    // 3. Contagem em tempo real do progresso de hoje
    const [quizAttemptsToday, reviewsToday, sessionsToday] = await Promise.all([
      prisma.quizAttempt.aggregate({
        where: {
          userId,
          completedAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { totalCount: true },
      }),
      prisma.reviewHistory.count({
        where: {
          reviewedAt: { gte: startOfDay, lte: endOfDay },
          topic: { subject: { userId } },
        },
      }),
      prisma.studySession.count({
        where: {
          userId,
          date: { gte: startOfDay, lte: endOfDay },
          status: "COMPLETED",
        },
      }),
    ]);

    const questionsCount = quizAttemptsToday._sum.totalCount ?? 0;
    const flashcardsCount = reviewsToday;
    const sessionsCount = sessionsToday;

    // 4. Sincroniza o progresso das missões
    const updatedQuests = await Promise.all(
      quests.map(async (quest) => {
        let currentCount = quest.currentCount;

        if (quest.title.includes("Questões")) {
          currentCount = questionsCount;
        } else if (quest.title.includes("Flashcards")) {
          currentCount = flashcardsCount;
        } else if (quest.title.includes("Edital")) {
          currentCount = sessionsCount;
        }

        const completed = currentCount >= quest.targetCount;

        if (
          quest.currentCount !== currentCount ||
          quest.completed !== completed
        ) {
          return await prisma.dailyQuest.update({
            where: { id: quest.id },
            data: { currentCount, completed },
          });
        }
        return quest;
      }),
    );

    return NextResponse.json({ quests: updatedQuests });
  } catch (error) {
    console.error("Erro ao buscar Daily Quests:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { questId } = await req.json();
    if (!questId) {
      return NextResponse.json(
        { error: "questId é obrigatório" },
        { status: 400 },
      );
    }

    // 🔒 Transação interativa para evitar resgate duplo concorrente
    const result = await prisma.$transaction(async (tx) => {
      const quest = await tx.dailyQuest.findFirst({
        where: { id: questId, userId: session.user.id },
      });

      if (!quest) {
        throw new Error("NOT_FOUND");
      }

      if (!quest.completed) {
        throw new Error("NOT_COMPLETED");
      }

      if (quest.claimed) {
        throw new Error("ALREADY_CLAIMED");
      }

      await tx.dailyQuest.update({
        where: { id: quest.id },
        data: { claimed: true },
      });

      const updatedStats = await tx.userStats.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          totalXp: quest.xpReward,
        },
        update: {
          totalXp: { increment: quest.xpReward },
        },
      });

      return {
        claimedXp: quest.xpReward,
        totalXp: updatedStats.totalXp,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Missão não encontrada" },
        { status: 404 },
      );
    }
    if (error?.message === "NOT_COMPLETED") {
      return NextResponse.json(
        { error: "A missão ainda não foi concluída" },
        { status: 400 },
      );
    }
    if (error?.message === "ALREADY_CLAIMED") {
      return NextResponse.json(
        { error: "Recompensa já resgatada" },
        { status: 400 },
      );
    }

    console.error("Erro ao resgatar recompensa da quest:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
