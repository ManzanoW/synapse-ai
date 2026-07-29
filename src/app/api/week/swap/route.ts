import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { buildWeeklySchedule, buildStudyCycleBlocks } from "@/lib/study-cycle";

const HIGH_CONTRAST_PALETTE = [
  "#f43f5e",
  "#06b6d4",
  "#a855f7",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#84cc16",
  "#6366f1",
];

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const {
      currentSubjectId,
      targetSubjectId,
      currentDayIndex,
      targetDayIndex,
    } = await request.json();

    if (!currentSubjectId || !targetSubjectId) {
      return NextResponse.json(
        { error: "IDs das matérias são obrigatórios." },
        { status: 400 },
      );
    }

    // 1. Busca as duas matérias no banco
    const [subA, subB] = await Promise.all([
      prisma.subject.findUnique({ where: { id: currentSubjectId, userId } }),
      prisma.subject.findUnique({ where: { id: targetSubjectId, userId } }),
    ]);

    if (!subA || !subB) {
      return NextResponse.json(
        { error: "Matérias não encontradas." },
        { status: 404 },
      );
    }

    // Determina os índices de dias para a troca atômica
    const newDayForA =
      targetDayIndex !== undefined ? targetDayIndex : (subB.assignedDay ?? 1);
    const newDayForB =
      currentDayIndex !== undefined ? currentDayIndex : (subA.assignedDay ?? 0);

    // 2. Transação Atômica: Troca os assignedDays e ajusta datas para atualização do SM-2
    await prisma.$transaction([
      prisma.subject.update({
        where: { id: currentSubjectId },
        data: {
          assignedDay: newDayForA,
        },
      }),
      prisma.subject.update({
        where: { id: targetSubjectId },
        data: {
          assignedDay: newDayForB,
          lastReviewed: new Date(), // Sinaliza que a matéria puxada entrou na grade ativa de hoje
        },
      }),
    ]);

    // 3. Busca usuário e recalcula o cronograma atualizado
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

    const { scheduleByDay, subjectOverview } = buildWeeklySchedule(
      rawSubjects,
      user?.weeklyGoalHours ?? 10,
      user?.activeDaysPerWeek ?? 5,
    );

    const cycleData = buildStudyCycleBlocks(
      rawSubjects,
      user?.weeklyGoalHours ?? 10,
      user?.cycleCurrentIndex ?? 0,
      HIGH_CONTRAST_PALETTE,
    );

    return NextResponse.json({
      message: "Matérias reorganizadas com sucesso!",
      data: {
        studyMode: user?.studyMode ?? "WEEKLY",
        weeklyGoalHours: user?.weeklyGoalHours ?? 10,
        activeDaysPerWeek: user?.activeDaysPerWeek ?? 5,
        cycleCurrentIndex: user?.cycleCurrentIndex ?? 0,
        cycleLap: user?.cycleLap ?? 1,
        scheduleByDay,
        subjectOverview,
        cycle: cycleData,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ ERRO NO POST /api/week/swap:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}
