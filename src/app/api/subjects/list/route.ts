import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const subjects = await prisma.subject.findMany({
      where: { userId }, // 🔒 Filtra matérias por usuário
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
