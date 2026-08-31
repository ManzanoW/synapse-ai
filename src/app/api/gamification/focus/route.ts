import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { invalidateUserCacheAction } from "@/actions/gamification-actions";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const durationMinutes = Number(body.durationMinutes) || 0;
    const notes = body.notes ? String(body.notes) : "Sessão Modo Zen";

    if (durationMinutes < 1) {
      return NextResponse.json(
        { error: "A duração mínima é de 1 minuto" },
        { status: 400 },
      );
    }

    // Regra: 2 XP por minuto de foco contínuo concluído
    const xpGained = durationMinutes * 2;

    // Executa em transação atômica: cria a sessão de estudo e incrementa o totalXp
    const [studySession, updatedStats] = await prisma.$transaction([
      prisma.studySession.create({
        data: {
          userId,
          durationMinutes,
          status: "COMPLETED",
          notes,
          date: new Date(),
        },
      }),
      prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          totalXp: xpGained,
          lastStudyDate: new Date(),
        },
        update: {
          totalXp: { increment: xpGained },
          lastStudyDate: new Date(),
        },
      }),
    ]);

    await invalidateUserCacheAction(userId);

    return NextResponse.json({
      success: true,
      sessionId: studySession.id,
      xpGained,
      totalXp: updatedStats.totalXp,
    });
  } catch (error) {
    console.error("Erro ao registrar sessão de foco:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
