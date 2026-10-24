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

    if (date === "overdue") {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const startOfToday = new Date(`${todayStr}T00:00:00Z`);

      const overdueTopics = await prisma.topic.findMany({
        where: {
          nextRev: {
            lt: startOfToday,
          },
          firstStudy: {
            not: "Pendente",
          },
          subject: { userId: userId },
        },
        orderBy: { nextRev: "asc" },
        include: { subject: { select: { id: true, name: true } } },
      });

      return NextResponse.json({ data: overdueTopics });
    }

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
      include: { subject: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ data: topics });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar detalhes" },
      { status: 500 },
    );
  }
}
