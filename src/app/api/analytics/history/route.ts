import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const history = await prisma.reviewHistory.findMany({
      where: {
        reviewedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: { reviewedAt: true },
    });

    // Agrupa por data (YYYY-MM-DD)
    const counts: Record<string, number> = {};
    history.forEach((h) => {
      const date = h.reviewedAt.toISOString().split("T")[0];
      counts[date] = (counts[date] || 0) + 1;
    });

    return NextResponse.json({ data: counts });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao buscar histórico" },
      { status: 500 },
    );
  }
}
