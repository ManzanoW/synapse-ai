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
      orderBy: { priority: "desc" },
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

    return NextResponse.json({
      data: {
        studyMode: user.studyMode ?? "WEEKLY", // "WEEKLY" ou "CYCLE"
        weeklyGoalHours: user.weeklyGoalHours ?? 10,
        activeDaysPerWeek: user.activeDaysPerWeek ?? 5,
        cycleCurrentIndex: user.cycleCurrentIndex ?? 0,
        cycleLap: user.cycleLap ?? 1,
        // Dados do Cronograma Semanal
        scheduleByDay,
        subjectOverview,
        // Dados do Ciclo de Estudos
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

// PATCH: Atualiza metas, altera modo de estudo (WEEKLY/CYCLE) e gerencia o progresso do ciclo
export async function PATCH(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      weeklyGoalHours,
      activeDaysPerWeek,
      studyMode,
      cycleAction, // "NEXT_BLOCK" | "PREV_BLOCK" | "RESET_LAP"
    } = body;

    // Busca o usuário atual para manipular ponteiros do ciclo
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        weeklyGoalHours: true,
        activeDaysPerWeek: true,
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

    // Lógica para avançar/voltar o ciclo de estudos
    if (cycleAction === "NEXT_BLOCK") {
      newIndex += 1;
    } else if (cycleAction === "PREV_BLOCK" && newIndex > 0) {
      newIndex -= 1;
    } else if (cycleAction === "RESET_LAP") {
      newIndex = 0;
      newLap += 1;
    }

    // 1. Atualiza dados no banco
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

    // 2. Busca matérias para recalcular ambas as visões
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
      orderBy: { priority: "desc" },
    });

    // 3. Recalcula ambos os módulos
    const { scheduleByDay, subjectOverview } = buildWeeklySchedule(
      rawSubjects,
      updatedUser.weeklyGoalHours,
      updatedUser.activeDaysPerWeek,
    );

    const cycleData = buildStudyCycleBlocks(
      rawSubjects,
      updatedUser.weeklyGoalHours,
      updatedUser.cycleCurrentIndex,
      HIGH_CONTRAST_PALETTE,
    );

    return NextResponse.json({
      message: "Configurações e planejamento atualizados com sucesso!",
      data: {
        studyMode: updatedUser.studyMode,
        weeklyGoalHours: updatedUser.weeklyGoalHours,
        activeDaysPerWeek: updatedUser.activeDaysPerWeek,
        cycleCurrentIndex: updatedUser.cycleCurrentIndex,
        cycleLap: updatedUser.cycleLap,
        scheduleByDay,
        subjectOverview,
        cycle: cycleData,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ ERRO NO PATCH /api/week:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}
