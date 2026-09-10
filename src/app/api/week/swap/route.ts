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

    // 1. Busca todas as matérias ordenadas para garantir o reordenamento global
    const allSubjects = await prisma.subject.findMany({
      where: { userId },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    const subA = allSubjects.find((s) => s.id === currentSubjectId);
    const subB = allSubjects.find((s) => s.id === targetSubjectId);

    if (!subA || !subB) {
      return NextResponse.json(
        { error: "Matérias não encontradas." },
        { status: 404 },
      );
    }

    // Determina os dias no semanal (preserva o dia atual caso não seja passado um novo índice)
    const newDayForA =
      targetDayIndex !== undefined
        ? targetDayIndex
        : (subB.assignedDay ?? subA.assignedDay);
    const newDayForB =
      currentDayIndex !== undefined
        ? currentDayIndex
        : (subA.assignedDay ?? subB.assignedDay);

    // 2. Inverte as posições no array de prioridades
    const updatedList = [...allSubjects];
    const indexA = updatedList.findIndex((s) => s.id === currentSubjectId);
    const indexB = updatedList.findIndex((s) => s.id === targetSubjectId);

    if (indexA !== -1 && indexB !== -1) {
      const temp = updatedList[indexA];
      updatedList[indexA] = updatedList[indexB];
      updatedList[indexB] = temp;
    }

    // 3. Monta as queries de atualização com prioridades calculadas em ordem estritamente decrescente
    const transactionQueries = updatedList.map((subject, idx) => {
      const calculatedPriority = Number((10 - idx * 0.1).toFixed(2));

      if (subject.id === currentSubjectId) {
        return prisma.subject.update({
          where: { id: currentSubjectId },
          data: {
            assignedDay: newDayForA,
            priority: calculatedPriority,
          },
        });
      }

      if (subject.id === targetSubjectId) {
        return prisma.subject.update({
          where: { id: targetSubjectId },
          data: {
            assignedDay: newDayForB,
            priority: calculatedPriority,
            lastReviewed: new Date(),
          },
        });
      }

      return prisma.subject.update({
        where: { id: subject.id },
        data: { priority: calculatedPriority },
      });
    });

    // Executa a transação no Prisma
    await prisma.$transaction(transactionQueries);

    // 4. Busca os dados atualizados do usuário e recarrega os blocos
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
