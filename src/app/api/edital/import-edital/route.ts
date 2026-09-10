import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth"; // 1. Import do Auth.js v5

interface TopicInput {
  name: string;
}

interface SubjectInput {
  name: string;
  cor?: string;
  color?: string;
  topics: TopicInput[];
}

// Mapeador automático inteligente de cor
function inferSubjectColor(name: string, rawColor?: string): string {
  if (rawColor && rawColor.startsWith("#")) {
    return rawColor;
  }

  const normalized = name.toLowerCase();

  if (
    normalized.includes("teste") ||
    normalized.includes("qualidade") ||
    normalized.includes("automação")
  ) {
    return "#10B981";
  }

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

  if (
    normalized.includes("frontend") ||
    normalized.includes("ux") ||
    normalized.includes("conteúdo") ||
    normalized.includes("ia")
  ) {
    return "#F59E0B";
  }

  if (
    normalized.includes("segurança") ||
    normalized.includes("protocolo") ||
    normalized.includes("redes") ||
    normalized.includes("criptografia")
  ) {
    return "#EC4899";
  }

  return "#3B82F6";
}

export async function POST(request: Request) {
  try {
    // 🔒 2. Autenticação e extração segura do userId via Sessão
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 },
      );
    }

    const { materias }: { materias: SubjectInput[] } = await request.json();

    if (!materias || materias.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma matéria enviada para importação." },
        { status: 400 },
      );
    }

    // Executa a criação em Lote/Transação no Prisma
    const createdSubjects = await prisma.$transaction(
      materias.map((materia) => {
        const finalColor = inferSubjectColor(
          materia.name,
          materia.cor || materia.color,
        );

        return prisma.subject.create({
          data: {
            userId, // 🔒 Injeta o ID verificado da sessão
            name: materia.name,
            color: finalColor,
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
