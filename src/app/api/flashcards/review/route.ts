import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { calculateEarnedXp, calculateLevel } from "@/lib/gamification";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { cardId, grade, streakDays = 0 } = await request.json();

    if (!cardId || !grade) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (cardId, grade)" },
        { status: 400 },
      );
    }

    // 1. Sua função calcula o XP aplicando a nota e o multiplicador de streak
    const earnedXp = calculateEarnedXp(grade, streakDays);

    // 2. Atualiza ou cria as estatísticas de XP do usuário
    const updatedStats = await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalXp: { increment: earnedXp },
      },
      create: {
        userId,
        totalXp: earnedXp,
      },
    });

    // 3. Calcula o novo nível e título
    const levelInfo = calculateLevel(updatedStats.totalXp);

    // 4. Atualiza o timestamp no flashcard (se existir no banco)
    if (cardId) {
      await prisma.flashcard
        .update({
          where: { id: String(cardId) },
          data: { updatedAt: new Date() },
        })
        .catch(() => {
          // Ignora caso seja um card em memória/mock sem ID persistido
        });
    }

    return NextResponse.json(
      {
        success: true,
        earnedXp,
        totalXp: updatedStats.totalXp,
        levelInfo,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Erro ao registrar revisão de flashcard:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar XP do flashcard" },
      { status: 500 },
    );
  }
}
