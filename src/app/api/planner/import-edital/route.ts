import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface TopicInput {
  name: string;
}

interface SubjectInput {
  name: string;
  topics: TopicInput[];
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
      materias.map((materia) =>
        prisma.subject.create({
          data: {
            userId,
            name: materia.name,
            importance: "Média", // Valor padrão padrão para o algoritmo de prioridade
            priority: 6.3,
            topics: {
              create: materia.topics.map((topic) => ({
                title: topic.name,
                relevance: "Média", // Valor padrão
                firstStudy: "Pendente", // Estado inicial no Planner
                performance: 0,
              })),
            },
          },
          include: {
            topics: true, // Retorna os tópicos criados junto
          },
        }),
      ),
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
