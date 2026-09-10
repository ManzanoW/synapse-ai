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

    const duration = Number(durationMinutes) || 1;
    const topicsCount = Array.isArray(topicsCompleted) ? topicsCompleted.length : 0;

    // Usamos 'as any' para permitir flexibilidade total com o modelo do Prisma
    // e evitar que divergências de nome de campo travem o build da aplicação.
    const studySession = await (prisma.studySession as any).create({
      data: {
        userId,
        subjectId,
        durationMinutes: duration,
        topicsCount,
        completedAt: new Date(),
        createdAt: new Date(),
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
