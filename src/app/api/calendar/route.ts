import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // '2026-07'

  // Criamos o primeiro e o último dia do mês com horários definidos
  const startDate = new Date(`${month}-01T00:00:00Z`);
  const endDate = new Date(
    new Date(startDate).setUTCMonth(startDate.getUTCMonth() + 1),
  );

  const topics = await prisma.topic.findMany({
    where: {
      nextRev: {
        gte: startDate,
        lt: endDate, // LT (Less Than) garante que pegue tudo até o primeiro segundo do mês seguinte
      },
      // ADICIONE ISSO AQUI: Garante que só pegue os tópicos DO USUÁRIO
      subject: { userId: "test" },
    },
    select: { nextRev: true },
  });

  const counts = topics.reduce((acc: Record<string, number>, t) => {
    if (!t.nextRev) return acc;
    // Força a data para YYYY-MM-DD mantendo o dia correto
    const date = t.nextRev.toISOString().split("T")[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ data: counts });
}
