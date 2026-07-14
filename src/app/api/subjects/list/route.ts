import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: subjects }, { status: 200 });
  } catch (error) {
    console.error("Erro na busca de matérias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar matérias" },
      { status: 500 },
    );
  }
}
