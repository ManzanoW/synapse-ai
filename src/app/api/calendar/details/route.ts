import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date)
      return NextResponse.json({ error: "Data necessária" }, { status: 400 });

    const startOfDay = new Date(`${date}T00:00:00Z`);
    const endOfDay = new Date(`${date}T23:59:59Z`);

    const topics = await prisma.topic.findMany({
      where: {
        nextRev: {
          gte: startOfDay,
          lte: endOfDay,
        },
        subject: { userId: userId }, // 🔒 Isola tópicos do usuário
      },
      include: { subject: { select: { name: true } } },
    });

    return NextResponse.json({ data: topics });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar detalhes" },
      { status: 500 },
    );
  }
}
