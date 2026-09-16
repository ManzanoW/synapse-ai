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

    // Busca matérias do usuário com seus pesos e tópicos
    const userSubjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        topics: {
          select: {
            id: true,
            title: true,
            performance: true,
            firstStudy: true,
            nextRev: true,
          },
        },
      },
      orderBy: { weight: "desc" },
    });

    // 1. Ponto Cego no Radar: Disciplina de Maior Peso com Baixo Desempenho ou Tópicos Críticos
    const highWeightSubject = userSubjects.find(
      (s) => (s.weight ?? 5.0) >= 6.0 && s.topics.length > 0,
    ) || userSubjects[0];

    if (highWeightSubject && highWeightSubject.topics.length > 0) {
      const weakestTopicInHighWeight = [...highWeightSubject.topics].sort(
        (a, b) => (a.performance || 0) - (b.performance || 0),
      )[0];

      if (weakestTopicInHighWeight) {
        suggestions.push({
          id: `blindspot-${highWeightSubject.id}`,
          topicId: weakestTopicInHighWeight.id,
          subjectId: highWeightSubject.id,
          type: "CRITICAL",
          icon: "brain",
          title: `Ponto Cego no Radar: ${highWeightSubject.name}`,
          description: `Esta disciplina tem Peso ${Number(highWeightSubject.weight ?? 5.0).toFixed(1)} no seu edital. O tópico "${weakestTopicInHighWeight.title}" requer atenção prioritária para alavancar suas chances de aprovação.`,
          actionUrl: `/questions?topicId=${weakestTopicInHighWeight.id}&subjectId=${highWeightSubject.id}`,
        });
      }
    }

    // 2. Tópico crítico geral por baixo aproveitamento em questões (< 60%)
    const weakTopic = await prisma.topic.findFirst({
      where: {
        subject: { userId },
        performance: { lte: 60, gt: 0 },
      },
      include: { subject: { select: { id: true, name: true, weight: true } } },
      orderBy: { performance: "asc" },
    });

    if (weakTopic && !suggestions.some((s) => s.topicId === weakTopic.id)) {
      suggestions.push({
        id: `weak-${weakTopic.id}`,
        topicId: weakTopic.id,
        subjectId: weakTopic.subjectId,
        type: "CRITICAL",
        icon: "brain",
        title: `Atenção no Edital: ${weakTopic.title}`,
        description: `Matéria: ${weakTopic.subject?.name || "Geral"}. O aproveitamento neste tópico está em ${weakTopic.performance}%. Recomendamos gerar questões direcionadas para dominar a banca.`,
        actionUrl: `/questions?topicId=${weakTopic.id}&subjectId=${weakTopic.subjectId}`,
      });
    }

    // 3. Revisão Pendente SM-2 (Curva de Esquecimento)
    const overdueTopic = await prisma.topic.findFirst({
      where: {
        subject: { userId },
        nextRev: { lte: new Date() },
      },
      include: { subject: { select: { id: true, name: true } } },
      orderBy: { nextRev: "asc" },
    });

    if (overdueTopic && !suggestions.some((s) => s.topicId === overdueTopic.id)) {
      suggestions.push({
        id: `overdue-${overdueTopic.id}`,
        topicId: overdueTopic.id,
        subjectId: overdueTopic.subjectId,
        type: "CRITICAL",
        icon: "clock",
        title: `Revisão no Prazo: ${overdueTopic.title}`,
        description: `Matéria: ${overdueTopic.subject?.name || "Geral"}. O algoritmo SM-2 identificou que sua retenção pode decair se não revisar este conteúdo hoje.`,
        actionUrl: `/questions?topicId=${overdueTopic.id}&subjectId=${overdueTopic.subjectId}`,
      });
    }

    // 4. Avançar no Edital (tópicos de maior peso ainda não estudados)
    const unstudiedTopic = await prisma.topic.findFirst({
      where: {
        subject: { userId },
        firstStudy: { in: ["Pendente"] },
      },
      include: { subject: { select: { id: true, name: true, weight: true } } },
      orderBy: { subject: { weight: "desc" } },
    });

    if (
      unstudiedTopic &&
      !suggestions.some((s) => s.topicId === unstudiedTopic.id)
    ) {
      suggestions.push({
        id: `advance-${unstudiedTopic.id}`,
        topicId: unstudiedTopic.id,
        subjectId: unstudiedTopic.subjectId,
        type: "SUGERIDO",
        icon: "list",
        title: `Avançar no Edital: ${unstudiedTopic.title}`,
        description: `Matéria: ${unstudiedTopic.subject?.name || "Geral"} (Peso ${Number(unstudiedTopic.subject?.weight ?? 5.0).toFixed(1)}). Você ainda não realizou o primeiro estudo deste tópico prioritário.`,
        actionUrl: `/edital?subjectId=${unstudiedTopic.subjectId}`,
      });
    }

    // 5. Criar Decks para disciplinas sem Flashcards
    const subjectWithoutDeck = await prisma.subject.findFirst({
      where: {
        userId,
        decks: { none: {} },
      },
    });

    if (
      subjectWithoutDeck &&
      !suggestions.some((s) => s.subjectId === subjectWithoutDeck.id)
    ) {
      suggestions.push({
        id: `deck-${subjectWithoutDeck.id}`,
        subjectId: subjectWithoutDeck.id,
        type: "SUGERIDO",
        icon: "brain",
        title: "Criar Decks de Flashcards",
        description: `Monte Cards de "${subjectWithoutDeck.name}" para blindar sua memorização de longo prazo.`,
        actionUrl: `/flashcards?subjectId=${subjectWithoutDeck.id}`,
      });
    }

    return NextResponse.json({ success: true, data: suggestions });
  } catch (error) {
    console.error("❌ Erro ao gerar sugestões:", error);
    return NextResponse.json(
      { error: "Erro ao carregar sugestões." },
      { status: 500 },
    );
  }
}
