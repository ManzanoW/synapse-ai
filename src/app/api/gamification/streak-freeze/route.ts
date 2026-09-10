import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const FREEZE_COST_XP = 300;

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userStats = await prisma.userStats.findUnique({
      where: { userId },
      select: { streakFreezes: true },
    });

    return NextResponse.json({ streakFreezes: userStats?.streakFreezes ?? 0 });
  } catch (error) {
    console.error("❌ Erro ao buscar Streak Freezes:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar Streak Freezes." },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 1. Busca as estatísticas e saldo de XP do usuário
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
      select: { id: true, totalXp: true, streakFreezes: true },
    });

    if (!userStats) {
      return NextResponse.json(
        { error: "Estatísticas do usuário não encontradas." },
        { status: 404 },
      );
    }

    const currentXp = userStats.totalXp ?? 0;

    // 2. Valida se possui XP suficiente
    if (currentXp < FREEZE_COST_XP) {
      return NextResponse.json(
        {
          error: "XP insuficiente para comprar um Streak Freeze.",
          requiredXp: FREEZE_COST_XP,
          currentXp,
        },
        { status: 400 },
      );
    }

    // 3. Atualiza o XP e incrementa streakFreezes
    const updatedStats = await prisma.userStats.update({
      where: { id: userStats.id },
      data: {
        totalXp: { decrement: FREEZE_COST_XP },
        streakFreezes: { increment: 1 },
      },
      select: {
        totalXp: true,
        streakFreezes: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        remainingXp: updatedStats.totalXp,
        streakFreezes: updatedStats.streakFreezes,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Erro ao comprar Streak Freeze:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a compra do Streak Freeze." },
      { status: 500 },
    );
  }
}
