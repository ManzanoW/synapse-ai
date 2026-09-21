import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

interface TopicInput {
  name: string;
}

interface SubjectInput {
  name: string;
  cor?: string;
  color?: string;
  weight?: number;
  topics?: TopicInput[];
}

// Mapeador automático inteligente de cor
function inferSubjectColor(name: string, rawColor?: string): string {
  if (rawColor && rawColor.startsWith("#")) {
    return rawColor;
  }

  const normalized = (name || "").toLowerCase();

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
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawMaterias: SubjectInput[] = Array.isArray(body?.materias)
      ? body.materias
      : [];

    if (!rawMaterias || rawMaterias.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma matéria enviada para importação." },
        { status: 400 },
      );
    }

    // Filtra e normaliza as matérias
    const validMaterias = rawMaterias.filter(
      (m) => m && typeof m.name === "string" && m.name.trim().length > 0,
    );

    if (validMaterias.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma matéria válida encontrada no envio." },
        { status: 400 },
      );
    }

    let createdSubjects: any[] = [];

    // Tenta primeiro em lote via $transaction
    try {
      if (typeof prisma.$transaction === "function") {
        const batch = await prisma.$transaction(
          validMaterias.map((materia) => {
            const finalColor = inferSubjectColor(
              materia.name,
              materia.cor || materia.color,
            );

            const finalWeight =
              typeof materia.weight === "number" && !isNaN(materia.weight)
                ? Math.min(10, Math.max(1, materia.weight))
                : 5.0;

            const topicsList = Array.isArray(materia.topics)
              ? materia.topics
              : [];

            return prisma.subject.create({
              data: {
                userId,
                name: materia.name.trim(),
                color: finalColor,
                importance:
                  finalWeight >= 8.0
                    ? "Alta"
                    : finalWeight >= 6.5
                      ? "Média"
                      : "Baixa",
                priority: 6.3,
                weight: finalWeight,
                topics: {
                  create: topicsList.map((topic) => ({
                    title:
                      typeof topic?.name === "string" && topic.name.trim()
                        ? topic.name.trim()
                        : "Tópico Geral",
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

        if (Array.isArray(batch)) {
          createdSubjects = batch;
        }
      }
    } catch (batchError) {
      console.warn(
        "Aviso: criação em lote ($transaction) falhou, recorrendo à criação sequencial:",
        batchError,
      );
    }

    // Se $transaction falhou ou retornou vazio, tenta sequencialmente
    if (createdSubjects.length === 0) {
      for (const materia of validMaterias) {
        try {
          const finalColor = inferSubjectColor(
            materia.name,
            materia.cor || materia.color,
          );

          const finalWeight =
            typeof materia.weight === "number" && !isNaN(materia.weight)
              ? Math.min(10, Math.max(1, materia.weight))
              : 5.0;

          const topicsList = Array.isArray(materia.topics) ? materia.topics : [];

          const sub = await prisma.subject.create({
            data: {
              userId,
              name: materia.name.trim(),
              color: finalColor,
              importance:
                finalWeight >= 8.0
                  ? "Alta"
                  : finalWeight >= 6.5
                    ? "Média"
                    : "Baixa",
              priority: 6.3,
              weight: finalWeight,
              topics: {
                create: topicsList.map((topic) => ({
                  title:
                    typeof topic?.name === "string" && topic.name.trim()
                      ? topic.name.trim()
                      : "Tópico Geral",
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

          if (sub) {
            createdSubjects.push(sub);
          }
        } catch (singleErr) {
          console.error(
            `Erro ao criar matéria individual "${materia.name}":`,
            singleErr,
          );
        }
      }
    }

    try {
      revalidatePath("/edital");
      revalidatePath("/questions");
      revalidatePath("/flashcards");
      revalidatePath("/dashboard");
      revalidatePath("/week");
    } catch {
      // Ignora erro fora de contexto
    }

    return NextResponse.json(
      {
        message: "Edital importado com sucesso!",
        count: createdSubjects?.length || 0,
        subjects: createdSubjects || [],
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Erro ao salvar edital no banco:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao salvar as matérias no Planner.",
      },
      { status: 500 },
    );
  }
}
