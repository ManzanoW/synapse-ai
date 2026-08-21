import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
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

    // Registra a sessão de estudo no banco
    const studySession = await prisma.studySession.create({
      data: {
        userId: session.user.id,
        subjectId,
        durationMinutes,
        completedAt: new Date(),
        topicsCount: topicsCompleted?.length || 0,
      },
    });

    return NextResponse.json({ success: true, data: studySession });
  } catch (error) {
    console.error("❌ Erro ao salvar sessão de estudo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao salvar sessão." },
      { status: 500 }
    );
  }
}
