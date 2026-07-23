import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface TopicInput {
  name: string;
}

interface SubjectInput {
  name: string;
  cor?: string;
  color?: string;
  topics: TopicInput[];
}

// 🟢 Mapeador automático inteligente para garantir a cor caso a IA não mande
function inferSubjectColor(name: string, rawColor?: string): string {
  // Se veio uma cor válida do frontend/IA, usa ela!
  if (rawColor && rawColor.startsWith("#")) {
    return rawColor;
  }

  const normalized = name.toLowerCase();

  // Testes & QA (Emerald)
  if (
    normalized.includes("teste") ||
    normalized.includes("qualidade") ||
    normalized.includes("automação")
  ) {
    return "#10B981";
  }

  // Metodologias Ágeis / Processos / Requisitos (Purple)
  if (
    normalized.includes("metodologia") ||
    normalized.includes("ágil") ||
    normalized.includes("agil") ||
    normalized.includes("requisito") ||
    normalized.includes("processo") ||
    normalized.includes("gestão")
  ) {
    return "#8B5CF6";
  }

  // Frontend & UX / IA (Amber)
  if (
    normalized.includes("frontend") ||
    normalized.includes("ux") ||
    normalized.includes("conteúdo") ||
    normalized.includes("ia")
  ) {
    return "#F59E0B";
  }

  // Segurança & Protocolos (Pink)
  if (
    normalized.includes("segurança") ||
    normalized.includes("protocolo") ||
    normalized.includes("redes") ||
    normalized.includes("criptografia")
  ) {
    return "#EC4899";
  }

  // Dev & Arquitetura (Blue - Padrão)
  return "#3B82F6";
}

export async function POST(request: Request) {
  try {
    const { userId, materias }: { userId: string; materias: SubjectInput[] } =
      await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não identificado." },
        { status: 400 },
      );
    }

    if (!materias || materias.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma matéria enviada para importação." },
        { status: 400 },
      );
    }

    // Executa a criação em Lote/Transação no Prisma
    const createdSubjects = await prisma.$transaction(
      materias.map((materia) => {
        // 🟢 Atribuição garantida de cor
        const finalColor = inferSubjectColor(
          materia.name,
          materia.cor || materia.color,
        );

        return prisma.subject.create({
          data: {
            userId,
            name: materia.name,
            color: finalColor, // Hex dinâmico calculado
            importance: "Média",
            priority: 6.3,
            topics: {
              create: materia.topics.map((topic) => ({
                title: topic.name,
                relevance: "Média",
                firstStudy: "Pendente",
                performance: 0,
              })),
            },
          },
          include: {
            topics: true,
          },
        });
      }),
    );

    return NextResponse.json(
      {
        message: "Edital importado com sucesso!",
        count: createdSubjects.length,
        subjects: createdSubjects,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Erro ao salvar edital no banco:", error);
    return NextResponse.json(
      { error: "Erro ao salvar as matérias no Planner." },
      { status: 500 },
    );
  }
}
