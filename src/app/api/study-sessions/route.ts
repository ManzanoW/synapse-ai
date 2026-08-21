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
    const { subjectId, durationMinutes, topicsCompleted } = body;

    if (!subjectId || !durationMinutes) {
      return NextResponse.json(
        { error: "Dados incompletos para registrar sessão." },
        { status: 400 }
      );
    }

    // Registra a sessão conectando as relações de User e Subject no Prisma
    const studySession = await prisma.studySession.create({
      data: {
        user: { connect: { id: userId } },
        subject: { connect: { id: subjectId } },
        durationMinutes,
        completedAt: new Date(),
        topicsCount: topicsCompleted?.length || 0,
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
