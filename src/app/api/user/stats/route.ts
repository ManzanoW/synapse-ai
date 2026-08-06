import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { calculateLevel } from "@/lib/gamification";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 1. Busca ou cria atomicamente as estatísticas do usuário
    const userStats = await prisma.userStats.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        totalXp: 0,
        streakDays: 0,
      },
    });

    // 2. Calcula as métricas de nível e progresso a partir do XP acumulado
    const levelInfo = calculateLevel(userStats.totalXp);

    // 3. Resgata os dias de ofensiva com fallback seguro
    const currentDays = (userStats as { streakDays?: number })?.streakDays || 0;

    return NextResponse.json(
      {
        gamification: {
          totalXp: userStats.totalXp,
          ...levelInfo,
        },
        streak: {
          currentDays,
          weekDays: [
            { dayLabel: "Seg", active: true },
            { dayLabel: "Ter", active: true },
            { dayLabel: "Qua", active: true },
            { dayLabel: "Qui", active: false },
            { dayLabel: "Sex", active: false },
            { dayLabel: "Sáb", active: false },
            { dayLabel: "Dom", active: false },
          ],
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Erro ao buscar stats do usuário:", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar estatísticas do usuário" },
      { status: 500 },
    );
  }
}
