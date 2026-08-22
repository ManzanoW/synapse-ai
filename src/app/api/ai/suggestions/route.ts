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

    // 1. Busca tópicos sem primeiro estudo (Avançar no Edital)
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
        type: "ADVANCE",
        title: `Avançar no Edital: ${unstudiedTopic.title}`,
        description: `Matéria: ${unstudiedTopic.subject?.name || "Geral"}. Você ainda não realizou o primeiro estudo deste tópico.`,
        tag: "SUGERIDO",
        actionUrl: "/edital",
      });
    }

    // 2. Busca tópicos com desempenho crítico (< 60% de acerto)
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
        type: "WARNING",
        title: `Reforço Crítico: ${weakTopic.title}`,
        description: `Matéria: ${weakTopic.subject?.name || "Geral"}. Seu aproveitamento neste tópico está em ${weakTopic.performance}%. Recomendamos criar Flashcards ou resolver mais questões.`,
        tag: "PRIORIDADE",
        actionUrl: `/questions?topicId=${weakTopic.id}`,
      });
    }

    // 3. Recomenda criar Flashcards para matérias sem Decks
    const subjectWithoutDeck = await (prisma.subject as any).findFirst({
      where: {
        userId,
        decks: { none: {} },
      },
    });

    if (subjectWithoutDeck) {
      suggestions.push({
        id: `deck-${subjectWithoutDeck.id}`,
        type: "FLASHCARD",
        title: `Criar Decks de Flashcards`,
        description: `Monte Cards na disciplina "${subjectWithoutDeck.name}" para proteger sua retenção a longo prazo no algoritmo SM-2.`,
        tag: "SUGERIDO",
        actionUrl: "/cards",
      });
    }

    return NextResponse.json({ success: true, data: suggestions });
  } catch (error) {
    console.error("❌ Erro ao gerar sugestões da IA:", error);
    return NextResponse.json(
      { error: "Erro ao gerar sugestões." },
      { status: 500 }
    );
  }
}
