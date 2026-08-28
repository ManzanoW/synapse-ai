import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const VALID_FIRST_STUDY = [
  "Pendente",
  "Em Estudo",
  "Concluido",
  "Em Revisão",
] as const;
type ValidFirstStudy = (typeof VALID_FIRST_STUDY)[number];

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
    if (!id) {
      return NextResponse.json(
        { error: "ID do tópico é obrigatório" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { firstStudy, performance } = body;

    if (
      firstStudy !== undefined &&
      !VALID_FIRST_STUDY.includes(firstStudy as ValidFirstStudy)
    ) {
      return NextResponse.json(
        {
          error: "Valor inválido para firstStudy",
          validValues: VALID_FIRST_STUDY,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const isCompleted =
      firstStudy === "Em Revisão" || firstStudy === "Concluido";

    // Data de revisão em 1 dia se concluído
    const nextRevisionAt = new Date(now);
    nextRevisionAt.setDate(nextRevisionAt.getDate() + 1);

    const updateData: {
      firstStudy?: string;
      performance?: number;
      lastRev?: Date | null;
      nextRev?: Date | null;
    } = {};

    if (firstStudy !== undefined) {
      updateData.firstStudy = firstStudy;
    }

    if (performance !== undefined) {
      updateData.performance =
        typeof performance === "number"
          ? Math.round(performance)
          : Number(performance) || 0;
    }

    if (isCompleted) {
      updateData.lastRev = now;
      updateData.nextRev = nextRevisionAt;
    } else if (firstStudy === "Pendente") {
      updateData.lastRev = null;
      updateData.nextRev = now;
    }

    const updatedTopic = await prisma.topic.update({
      where: { id },
      data: updateData,
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

