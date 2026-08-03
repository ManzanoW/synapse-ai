import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { subDays, format } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 35 dias para casar exatamente com os 35 blocos (5x7) do componente Heatmap
    const thirtyFiveDaysAgo = subDays(new Date(), 34);

    // 🔒 Busca estritamente as revisões do usuário logado
    const history = await prisma.reviewHistory.findMany({
      where: {
        topic: {
          subject: {
            userId: userId, // Filtro de isolamento multitenant
          },
        },
        reviewedAt: {
          gte: thirtyFiveDaysAgo,
        },
      },
      select: { 
        reviewedAt: true 
      },
    });

    // Agrupa por data no formato YYYY-MM-DD usando date-fns para preservar fuso local
    const counts: Record<string, number> = {};
    history.forEach((h) => {
      const dateKey = format(h.reviewedAt, "yyyy-MM-dd");
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });

    return NextResponse.json({ data: counts });
  } catch (error) {
    console.error("❌ Erro ao buscar histórico de analytics:", error);
    return NextResponse.json(
      { error: "Falha ao buscar histórico" },
      { status: 500 },
    );
  }
}
