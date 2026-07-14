import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Topic } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // Esperado: 'YYYY-MM-DD'

    if (!date)
      return NextResponse.json({ error: "Data necessária" }, { status: 400 });

    // Criamos um range para o dia selecionado (de 00:00 até 23:59)
    const startOfDay = new Date(`${date}T00:00:00Z`);
    const endOfDay = new Date(`${date}T23:59:59Z`);

    const topics = await prisma.topic.findMany({
      where: {
        nextRev: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { subject: { select: { name: true } } },
    });

    console.log("Buscando tópicos para a data:", date);
    console.log("Range:", startOfDay, endOfDay);
    console.log("Tópicos encontrados:", topics.length);

    return NextResponse.json({ data: topics });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar detalhes" },
      { status: 500 },
    );
  }
}
