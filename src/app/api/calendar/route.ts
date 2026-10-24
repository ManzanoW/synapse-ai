import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month) {
    return NextResponse.json({ error: "Mês não informado" }, { status: 400 });
  }

  const startDate = new Date(`${month}-01T00:00:00Z`);
  const endDate = new Date(
    new Date(startDate).setUTCMonth(startDate.getUTCMonth() + 1),
  );

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const startOfToday = new Date(`${todayStr}T00:00:00Z`);

  const [topics, overdueCount] = await Promise.all([
    prisma.topic.findMany({
      where: {
        nextRev: {
          gte: startDate,
          lt: endDate,
        },
        subject: { userId: userId }, // 🔒 Utiliza a sessão do usuário
      },
      select: { nextRev: true },
    }),
    prisma.topic.count({
      where: {
        nextRev: {
          lt: startOfToday,
        },
        firstStudy: {
          not: "Pendente",
        },
        subject: { userId: userId },
      },
    }),
  ]);

  const counts = topics.reduce((acc: Record<string, number>, t) => {
    if (!t.nextRev) return acc;
    const date = t.nextRev.toISOString().split("T")[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ data: counts, overdueCount });
}
