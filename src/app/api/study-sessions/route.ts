import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { recordStudyActivityAction } from "@/actions/gamification-actions";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { subjectId, durationMinutes, topicsCompleted } = body;

    const duration = Math.max(1, Number(durationMinutes) || 1);
    const xpReward = Math.max(25, Math.round(duration * 2));

    // Conecta com o motor unificado de gamificação (cria StudySession, calcula XP e ofensiva)
    const recordResult = await recordStudyActivityAction(
      userId,
      xpReward,
      "FOCUS",
      duration,
    );

    // Marca tópicos concluídos nesta sessão
    if (Array.isArray(topicsCompleted) && topicsCompleted.length > 0) {
      await prisma.topic.updateMany({
        where: { id: { in: topicsCompleted }, subject: { userId } },
        data: {
          firstStudy: "Concluido",
          lastRev: new Date(),
        },
      });
    }

    // Invalida os caches das telas dependentes
    revalidatePath("/dashboard");
    revalidatePath("/week");
    revalidatePath("/study-room");

    return NextResponse.json({ success: true, data: recordResult.data }, { status: 201 });
  } catch (error) {
    console.error("❌ Erro ao salvar sessão de estudo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao salvar sessão." },
      { status: 500 }
    );
  }
}
