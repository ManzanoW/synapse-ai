import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserAchievementsProgress } from "@/lib/achievements-engine";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { Prisma } from "@prisma/client";

interface UserStatsWithAchievements {
  claimedAchievements?: string;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const progress = await getUserAchievementsProgress(session.user.id);
    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Erro ao buscar conquistas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { achievementId } = await req.json();
    const userId = session.user.id;

    const badge = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!badge) {
      return NextResponse.json(
        { error: "Conquista inválida" },
        { status: 400 },
      );
    }

    const progressList = await getUserAchievementsProgress(userId);
    const userBadgeProgress = progressList.find(
      (p) => p.achievementId === achievementId,
    );

    if (!userBadgeProgress || !userBadgeProgress.isUnlocked) {
      return NextResponse.json(
        { error: "Conquista ainda não desbloqueada" },
        { status: 400 },
      );
    }

    if (userBadgeProgress.isClaimed) {
      return NextResponse.json(
        { error: "XP já foi resgatado para esta conquista" },
        { status: 400 },
      );
    }

    const userStats = (await prisma.userStats.findUnique({
      where: { userId },
    })) as UserStatsWithAchievements | null;

    const currentClaimedRaw = userStats?.claimedAchievements || "";
    const currentClaimed = currentClaimedRaw
      ? currentClaimedRaw.split(",").map((id: string) => id.trim())
      : [];

    if (!currentClaimed.includes(achievementId)) {
      currentClaimed.push(achievementId);
    }

    const updatedClaimedString = currentClaimed.filter(Boolean).join(",");

    // Objetos tipados explicitamente via Prisma
    const updateData: Prisma.UserStatsUpdateInput = {
      totalXp: { increment: badge.xpReward },
      claimedAchievements: updatedClaimedString,
    };

    const createData: Prisma.UserStatsCreateInput = {
      user: { connect: { id: userId } },
      totalXp: badge.xpReward,
      claimedAchievements: updatedClaimedString,
    };

    await prisma.userStats.upsert({
      where: { userId },
      update: updateData,
      create: createData,
    });

    return NextResponse.json({ success: true, xpEarned: badge.xpReward });
  } catch (error) {
    console.error("Erro ao resgatar XP:", error);
    return NextResponse.json(
      { error: "Erro ao processar resgate" },
      { status: 500 },
    );
  }
}
