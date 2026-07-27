import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { firstStudy, performance } = body;

    // Atualiza o tópico no banco de dados
    const updatedTopic = await prisma.topic.update({
      where: { id },
      data: {
        ...(firstStudy !== undefined && { firstStudy }),
        ...(performance !== undefined && { performance }),
        lastRev: new Date(),
      },
    });

    return NextResponse.json({ data: updatedTopic });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ ERRO AO ATUALIZAR TÓPICO:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}
