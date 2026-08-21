import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { durationMinutes, topicsCompleted } = body;

    const duration = Number(durationMinutes) || 1;

    // Registra a sessão com os campos garantidos do modelo StudySession
    const studySession = await prisma.studySession.create({
      data: {
        userId,
        durationMinutes: duration,
        completedAt: new Date(),
        topicsCount: Array.isArray(topicsCompleted) ? topicsCompleted.length : 0,
      },
    });

    return NextResponse.json({ success: true, data: studySession }, { status: 201 });
  } catch (error) {
    console.error("❌ Erro ao salvar sessão de estudo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao salvar sessão." },
      { status: 500 }
    );
  }
}
