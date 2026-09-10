import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { buildWeeklySchedule, buildStudyCycleBlocks } from "@/lib/study-cycle";

export const dynamic = "force-dynamic";

// Paleta Neon de fallback para o Ciclo de Estudos
const HIGH_CONTRAST_PALETTE = [
  "#f43f5e", // Rose
  "#06b6d4", // Cyan
  "#a855f7", // Purple Neon
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#3b82f6", // Vivid Blue
  "#ec4899", // Pink Hot
  "#14b8a6", // Teal
  "#84cc16", // Lime
  "#6366f1", // Indigo
  "#f97316", // Orange
  "#00f5d4", // Mint
];

async function getAuthenticatedUserId() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.id;
}

import { checkMissedDay } from "@/lib/missed-day";

export { checkMissedDay };

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Busca configurações do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        weeklyGoalHours: true,
        activeDaysPerWeek: true,
        studyMode: true,
        cycleCurrentIndex: true,
        cycleLap: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    // 2. Busca matérias e tópicos
    const rawSubjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        topics: {
          select: {
            id: true,
            title: true,
            firstStudy: true,
            relevance: true,
            performance: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    // 3. Calcula Cronograma Semanal
    const { scheduleByDay, subjectOverview } = buildWeeklySchedule(
      rawSubjects,
      user.weeklyGoalHours ?? 10,
      user.activeDaysPerWeek ?? 5,
    );

    // 4. Calcula Blocos do Ciclo de Estudos
    const cycleData = buildStudyCycleBlocks(
      rawSubjects,
      user.weeklyGoalHours ?? 10,
      user.cycleCurrentIndex ?? 0,
      HIGH_CONTRAST_PALETTE,
    );

    // 5. Verifica se há algum dia ignorado/perdido
    const missedDayName = await checkMissedDay(userId);

    return NextResponse.json({
      data: {
        userId,
        studyMode: user.studyMode ?? "WEEKLY",
        weeklyGoalHours: user.weeklyGoalHours ?? 10,
        activeDaysPerWeek: user.activeDaysPerWeek ?? 5,
        cycleCurrentIndex: user.cycleCurrentIndex ?? 0,
        cycleLap: user.cycleLap ?? 1,
        missedDayName,
        scheduleByDay,
        subjectOverview,
        cycle: cycleData,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ ERRO NO GET /api/week:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    let userId: string | null = null;
    try {
      userId = await getAuthenticatedUserId();
    } catch (authErr) {
      console.error("❌ Erro de autenticação:", authErr);
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      weeklyGoalHours,
      activeDaysPerWeek,
      studyMode,
      cycleAction, // "NEXT_BLOCK" | "PREV_BLOCK" | "RESET_LAP" | "SWAP_BLOCK"
      blockNumber,
      currentSubjectId,
      targetSubjectId,
    } = body;

    // Busca o usuário atual
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        weeklyGoalHours: true,
        activeDaysPerWeek: true,
        studyMode: true,
        cycleCurrentIndex: true,
        cycleLap: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    let newIndex = currentUser.cycleCurrentIndex ?? 0;
    let newLap = currentUser.cycleLap ?? 1;

    // Lógica de avanço do ciclo
    if (cycleAction === "NEXT_BLOCK") {
      newIndex += 1;
    } else if (cycleAction === "PREV_BLOCK" && newIndex > 0) {
      newIndex -= 1;
    } else if (cycleAction === "RESET_LAP") {
      newIndex = 0;
      newLap += 1;
    }

    // TRATAMENTO DE SWAP UNIFICADO (Atende tanto CycleView quanto WeekView)
    if (cycleAction === "SWAP_BLOCK" && targetSubjectId) {
      const rawSubjects = await prisma.subject.findMany({
        where: { userId },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      });

      let currentSubject = null;
      const targetSubject = rawSubjects.find((s) => s.id === targetSubjectId);

      // CASO A: Swap vindo do CycleView (passa blockNumber)
      if (blockNumber !== undefined) {
        const currentCycleData = buildStudyCycleBlocks(
          rawSubjects,
          currentUser.weeklyGoalHours ?? 10,
          currentUser.cycleCurrentIndex ?? 0,
          HIGH_CONTRAST_PALETTE,
        );

        const targetBlock = currentCycleData.blocks.find(
          (b) => b.blockNumber === blockNumber,
        );

        if (targetBlock) {
          currentSubject = rawSubjects.find(
            (s) => s.name === targetBlock.subjectName,
          );
        }
      }
      // CASO B: Swap vindo do WeekView ou ID direto
      else if (currentSubjectId) {
        currentSubject = rawSubjects.find((s) => s.id === currentSubjectId);
      }

      // Executa a troca de prioridades entre as duas matérias
      if (
        currentSubject &&
        targetSubject &&
        currentSubject.id !== targetSubject.id
      ) {
        let p1 = targetSubject.priority;
        const p2 = currentSubject.priority;

        if (p1 === p2) {
          p1 += 0.01;
        }

        await prisma.$transaction([
          prisma.subject.update({
            where: { id: currentSubject.id },
            data: { priority: p1 },
          }),
          prisma.subject.update({
            where: { id: targetSubject.id },
            data: { priority: p2 },
          }),
        ]);
      }
    }

    // 1. Atualiza dados do usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(weeklyGoalHours !== undefined && { weeklyGoalHours }),
        ...(activeDaysPerWeek !== undefined && { activeDaysPerWeek }),
        ...(studyMode !== undefined && { studyMode }),
        cycleCurrentIndex: newIndex,
        cycleLap: newLap,
      },
      select: {
        weeklyGoalHours: true,
        activeDaysPerWeek: true,
        studyMode: true,
        cycleCurrentIndex: true,
        cycleLap: true,
      },
    });

    // 2. Busca matérias atualizadas para recalcular ambas as visões
    const rawSubjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        topics: {
          select: {
            id: true,
            title: true,
            firstStudy: true,
            relevance: true,
            performance: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    // 3. Recalcula ambos os módulos de forma sincronizada
    const { scheduleByDay, subjectOverview } = buildWeeklySchedule(
      rawSubjects,
      updatedUser.weeklyGoalHours ?? 10,
      updatedUser.activeDaysPerWeek ?? 5,
    );

    const cycleData = buildStudyCycleBlocks(
      rawSubjects,
      updatedUser.weeklyGoalHours ?? 10,
      updatedUser.cycleCurrentIndex ?? 0,
      HIGH_CONTRAST_PALETTE,
    );

    const missedDayName = await checkMissedDay(userId);

    return NextResponse.json({
      message: "Configurações e ciclo atualizados com sucesso!",
      data: {
        userId,
        studyMode: updatedUser.studyMode ?? "WEEKLY",
        weeklyGoalHours: updatedUser.weeklyGoalHours ?? 10,
        activeDaysPerWeek: updatedUser.activeDaysPerWeek ?? 5,
        cycleCurrentIndex: updatedUser.cycleCurrentIndex ?? 0,
        cycleLap: updatedUser.cycleLap ?? 1,
        missedDayName,
        scheduleByDay,
        subjectOverview,
        cycle: cycleData,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ ERRO GRAVE NO PATCH /api/week:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}
