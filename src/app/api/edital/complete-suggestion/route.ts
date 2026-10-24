import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { topicId, type } = await req.json();

    if (!topicId) {
      return NextResponse.json(
        { error: "topicId é obrigatório" },
        { status: 400 }
      );
    }

    // 🛡️ Prevenção de IDOR: Verifica se o tópico pertence a uma matéria do usuário autenticado
    const ownedTopic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        subject: { userId: session.user.id },
      },
      select: { id: true },
    });

    if (!ownedTopic) {
      return NextResponse.json(
        { error: "Tópico não encontrado ou sem permissão" },
        { status: 404 }
      );
    }

    // Atualiza a data do último quiz do tópico
    await prisma.topic.update({
      where: { id: ownedTopic.id },
      data: {
        lastQuizAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao registrar conclusão da sugestão:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
