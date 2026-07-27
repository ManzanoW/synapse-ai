import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Ajuste conforme seu arquivo do Prisma
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const { topicId, type } = await req.json();

    if (!topicId) {
      return NextResponse.json(
        { error: "topicId é obrigatório" },
        { status: 400 },
      );
    }

    // Marca o tópico com o último simulado realizado para não reaparecer na Engine Adaptativa
    await prisma.topic.update({
      where: { id: topicId },
      data: {
        lastQuizAt: new Date(),
        // Se você tiver uma flag específica de sugestão consumida, pode usar aqui
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao registrar conclusão da sugestão:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
