import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { firstStudy, performance } = body;

    const now = new Date();
    const isCompleted = firstStudy === "Em Revisão" || firstStudy === "Concluido";

    // Data de revisão em 1 dia
    const nextRevisionAt = new Date(now);
    nextRevisionAt.setDate(nextRevisionAt.getDate() + 1);

    const updatedTopic = await (prisma.topic as any).update({
      where: { id },
      data: {
        ...(firstStudy !== undefined && { firstStudy }),
        ...(performance !== undefined && { performance }),
        lastRev: now,
        ...(isCompleted && {
          lastStudiedAt: now,
          nextRevisionAt,
        }),
      },
    });

    return NextResponse.json({ data: updatedTopic });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ ERRO AO ATUALIZAR TÓPICO:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}
