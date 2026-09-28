import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reseta o status de estudo semanal de todos os tópicos das matérias do usuário
    const result = await prisma.topic.updateMany({
      where: {
        subject: {
          userId,
        },
      },
      data: {
        firstStudy: "Pendente",
        performance: 0,
        lastRev: null,
      },
    });

    revalidatePath("/week");

    return NextResponse.json({
      success: true,
      message: "Cronograma semanal resetado com sucesso!",
      count: result.count,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ ERRO NO POST /api/week/reset:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}
