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

    const suggestions = [];

    // 1. Tópico crítico por baixo desempenho (< 60% de acerto)
    const weakTopic = await (prisma.topic as any).findFirst({
      where: {
        subject: { userId },
        performance: { lte: 60, gt: 0 },
      },
      include: { subject: { select: { name: true } } },
    });

    if (weakTopic) {
      suggestions.push({
        id: `weak-${weakTopic.id}`,
        topicId: weakTopic.id,
        type: "CRITICAL",
        icon: "brain",
        title: `Atenção no Edital: ${weakTopic.title}`,
        description: `Matéria: ${weakTopic.subject?.name || "Geral"}. O aproveitamento neste tópico está em ${weakTopic.performance}%. Recomendamos criar Flashcards ou resolver questões.`,
        actionUrl: `/questions?topicId=${weakTopic.id}`,
      });
    }

    // 2. Avançar no Edital (tópicos não estudados)
    const unstudiedTopic = await (prisma.topic as any).findFirst({
      where: {
        subject: { userId },
        firstStudy: { in: [null, "NaoIniciado", "Não Iniciado"] },
      },
      include: { subject: { select: { name: true } } },
    });

    if (unstudiedTopic) {
      suggestions.push({
        id: `advance-${unstudiedTopic.id}`,
        topicId: unstudiedTopic.id,
        type: "SUGERIDO",
        icon: "list",
        title: `Avançar no Edital: ${unstudiedTopic.title}`,
        description: `Matéria: ${unstudiedTopic.subject?.name || "Geral"}. Você ainda não realizou o primeiro estudo deste tópico.`,
        actionUrl: "/edital",
      });
    }

    // 3. Criar Decks para disciplinas sem Flashcards
    const subjectWithoutDeck = await (prisma.subject as any).findFirst({
      where: {
        userId,
        decks: { none: {} },
      },
    });

    if (subjectWithoutDeck) {
      suggestions.push({
        id: `deck-${subjectWithoutDeck.id}`,
        type: "SUGERIDO",
        icon: "brain",
        title: "Criar Decks de Flashcards",
        description: `Monte Cards de "${subjectWithoutDeck.name}" para proteger sua retenção a longo prazo.`,
        actionUrl: "/cards",
      });
    }

    return NextResponse.json({ success: true, data: suggestions });
  } catch (error) {
    console.error("❌ Erro ao gerar sugestões:", error);
    return NextResponse.json(
      { error: "Erro ao carregar sugestões." },
      { status: 500 }
    );
  }
}
