import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Busca tópicos com informações de matérias e contagem de quizzes/flashcards
    const topics = await prisma.topic.findMany({
      where: {
        subject: { userId: userId },
      },
      include: {
        subject: true,
        flashcards: true,
        questions: true,
      },
      orderBy: [
        { performance: "asc" }, // Prioriza os de menor desempenho
      ],
    });

    const suggestions: Array<{
      id: string;
      title: string;
      description: string;
      type: "CRITICAL" | "SUGGESTED";
      icon: "brain" | "clipboard";
      actionUrl?: string; // Opcional para redirecionar
    }> = [];

    // 1. REVISÃO CRÍTICA: Tópicos já estudados com desempenho baixo (<70%)
    const criticalTopics = topics.filter(
      (t) => t.firstStudy !== "Pendente" && t.performance < 70,
    );

    for (const topic of criticalTopics) {
      suggestions.push({
        id: `crit-${topic.id}`,
        title: `Revisão Crítica: ${topic.title}`,
        description: `Sua retenção em ${topic.subject.name} caiu para ${topic.performance}%. Faça uma sessão de fixação urgente.`,
        type: "CRITICAL",
        icon: "brain",
      });
    }

    // 2. AVANÇO DE EDITAL: Tópicos ainda não estudados (Pendente)
    const pendingTopics = topics.filter((t) => t.firstStudy === "Pendente");
    if (pendingTopics.length > 0) {
      const nextTopic = pendingTopics[0];
      suggestions.push({
        id: `pend-${nextTopic.id}`,
        title: `Avançar no Edital: ${nextTopic.title}`,
        description: `Matéria: ${nextTopic.subject.name}. Você ainda não realizou o primeiro estudo deste tópico.`,
        type: "SUGGESTED",
        icon: "clipboard",
      });
    }

    // 3. REFORÇO / PRÁTICA: Tópicos dominados (>=80%)
    const masteredTopics = topics.filter(
      (t) => t.firstStudy !== "Pendente" && t.performance >= 80,
    );

    for (const topTopic of masteredTopics) {
      // 🟢 Só sugere criar Quiz se ele tiver 0 Quizzes gerados para esse tópico
      if (topTopic.questions.length === 0) {
        suggestions.push({
          id: `quiz-${topTopic.id}`,
          title: `Gerar Simulado: ${topTopic.subject.name}`,
          description: `Você atingiu ${topTopic.performance}% em "${topTopic.title}". Teste seus conhecimentos com um Quiz da banca!`,
          type: "SUGGESTED",
          icon: "brain",
          actionUrl: `/quizzes/new?topicId=${topTopic.id}`, // Link direto pra criar
        });
        break; // Encontra a primeira pendência de prática e para
      }

      // 🟢 Só sugere criar Flashcard se tiver 0 Flashcards vinculados a esse tópico
      if (topTopic.flashcards.length === 0) {
        suggestions.push({
          id: `fc-${topTopic.id}`,
          title: `Criar Decks de Flashcards`,
          description: `Monte Anki/Cards de "${topTopic.title}" para proteger sua retenção a longo prazo.`,
          type: "SUGGESTED",
          icon: "clipboard",
          actionUrl: `/flashcards/new?topicId=${topTopic.id}`,
        });
        break;
      }
    }

    // 4. FALLBACK: Se tudo estiver ok ou sem dados
    if (suggestions.length === 0) {
      suggestions.push({
        id: "default-ok-1",
        title: "Ciclo Perfeitamente Otimizado",
        description:
          "Seu ritmo e desempenho em todas as matérias estão excelentes. Continue acompanhando o cronograma!",
        type: "SUGGESTED",
        icon: "clipboard",
      });
    }

    // ⚡ REGRA DE OURO: Retorna no máximo 3 sugestões prioritárias
    const limitedSuggestions = suggestions.slice(0, 3);

    return NextResponse.json({
      success: true,
      suggestions: limitedSuggestions,
    });
  } catch (error) {
    console.error("Erro na otimização com IA:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar rebalanceamento" },
      { status: 500 },
    );
  }
}
