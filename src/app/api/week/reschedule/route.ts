import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  DAY_NAME_TO_INDEX,
  recordMissedDayResolution,
} from "@/lib/missed-day";
import { buildWeeklySchedule } from "@/lib/study-cycle";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId: bodyUserId, action, missedDayName } = body;

    const session = await auth().catch(() => null);
    const userId = bodyUserId || session?.user?.id;

    console.log("📥 Payload recebido em /api/week/reschedule:", {
      userId,
      action,
      missedDayName,
    });

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Parâmetros 'userId' e 'action' são obrigatórios." },
        { status: 400 },
      );
    }

    const now = new Date();
    const todayDayIndex = now.getDay(); // 0 (Domingo) a 6 (Sábado)

    // AÇÃO 1: MARCAR COMO FOLGA (MARK_REST ou OFF_DAY)
    if (action === "MARK_REST" || action === "OFF_DAY") {
      await recordMissedDayResolution(userId, "MARK_REST", missedDayName);

      // Invalidação de Cache
      revalidatePath("/dashboard");
      revalidatePath("/week");

      return NextResponse.json({
        success: true,
        message: "Dia marcado como folga com sucesso!",
      });
    }

    // AÇÃO 2: EMPURRAR MATÉRIAS PARA HOJE (PUSH_TODAY)
    if (action === "PUSH_TODAY") {
      let missedSubjectIds: string[] = [];

      // 1. Busca dados do usuário e matérias
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          weeklyGoalHours: true,
          activeDaysPerWeek: true,
          cycleCurrentIndex: true,
        },
      });

      const allSubjects = await prisma.subject.findMany({
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

      // 2. Identifica quais matérias pertencem ao dia perdido
      if (missedDayName && DAY_NAME_TO_INDEX[missedDayName] !== undefined) {
        const missedDayIndex = DAY_NAME_TO_INDEX[missedDayName];

        const directlyAssigned = allSubjects.filter(
          (s) => s.assignedDay === missedDayIndex,
        );

        if (directlyAssigned.length > 0) {
          missedSubjectIds = directlyAssigned.map((s) => s.id);
        } else {
          // Se as matérias não tinham assignedDay explícito, extrai do cronograma dinâmico
          const { scheduleByDay } = buildWeeklySchedule(
            allSubjects,
            user?.weeklyGoalHours ?? 10,
            user?.activeDaysPerWeek ?? 5,
          );

          const scheduledDay = scheduleByDay.find(
            (d) =>
              d.dayIndex === missedDayIndex ||
              d.dayName
                .toLowerCase()
                .startsWith(missedDayName.toLowerCase().slice(0, 3)),
          );

          if (scheduledDay) {
            missedSubjectIds = scheduledDay.subjects.map((s) => s.id);
          }
        }
      }

      // 3. Move as matérias do dia perdido para o dia de hoje
      if (missedSubjectIds.length > 0) {
        await prisma.subject.updateMany({
          where: {
            userId,
            id: { in: missedSubjectIds },
          },
          data: {
            assignedDay: todayDayIndex,
            updatedAt: now,
          },
        });

        // 4. Injeção prioritária no ciclo: ajusta prioridade das matérias pendentes
        // para que fiquem no topo da fila após o CURRENT sem duplicar blocos CURRENT
        const currentMaxPriority = Math.max(
          ...allSubjects.map((s) => s.priority || 0),
          10,
        );

        for (let i = 0; i < missedSubjectIds.length; i++) {
          await prisma.subject.update({
            where: { id: missedSubjectIds[i] },
            data: {
              priority: currentMaxPriority + (missedSubjectIds.length - i) * 0.2,
              updatedAt: now,
            },
          });
        }
      }

      // 5. Registra a resolução no banco e memória
      await recordMissedDayResolution(userId, "PUSH_TODAY", missedDayName);

      // 6. Invalidação de Cache
      revalidatePath("/dashboard");
      revalidatePath("/week");

      return NextResponse.json({
        success: true,
        message: "Matérias rebalanceadas e empurradas para hoje com sucesso!",
        missedSubjectIds,
      });
    }

    // AÇÃO 3: PULAR E VER NO PRÓXIMO CICLO (SKIP_CYCLE)
    if (action === "SKIP_CYCLE") {
      await recordMissedDayResolution(userId, "SKIP_CYCLE", missedDayName);

      // Invalidação de Cache
      revalidatePath("/dashboard");
      revalidatePath("/week");

      return NextResponse.json({
        success: true,
        message: "Ciclo mantido e pendência ignorada com sucesso!",
      });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error: unknown) {
    console.error("❌ ERRO em /api/week/reschedule:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao reagendar." },
      { status: 500 },
    );
  }
}
