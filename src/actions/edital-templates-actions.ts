"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { STARTER_EDITAL_TEMPLATES } from "@/lib/edital-templates";

export async function importStarterEditalAction(templateKey: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const template = STARTER_EDITAL_TEMPLATES[templateKey];
    if (!template) {
      return { success: false, error: "Modelo de edital não encontrado." };
    }

    let createdCount = 0;
    let topicsCount = 0;

    // Tenta transação atômica primeiro
    try {
      if (typeof prisma.$transaction === "function") {
        const created = await prisma.$transaction(
          template.materias.map((m) =>
            prisma.subject.create({
              data: {
                userId,
                name: m.name,
                color: m.color,
                weight: m.weight,
                importance: m.weight >= 8.0 ? "Alta" : m.weight >= 6.5 ? "Média" : "Baixa",
                priority: 6.3,
                topics: {
                  create: m.topics.map((t) => ({
                    title: t.name,
                    firstStudy: "Pendente",
                    performance: 0,
                    relevance: "5/10",
                  })),
                },
              },
              include: {
                topics: true,
              },
            })
          )
        );
        createdCount = created?.length || 0;
        topicsCount = created?.reduce((acc: number, sub: any) => acc + (sub.topics?.length || 0), 0) || 0;
      } else {
        throw new Error("Transação não suportada no driver atual.");
      }
    } catch (txError) {
      console.warn("Transação falhou, criando matérias sequencialmente:", txError);
      // Fallback sequencial resiliente
      for (const m of template.materias) {
        const sub = await prisma.subject.create({
          data: {
            userId,
            name: m.name,
            color: m.color,
            weight: m.weight,
            importance: m.weight >= 8.0 ? "Alta" : m.weight >= 6.5 ? "Média" : "Baixa",
            priority: 6.3,
            topics: {
              create: m.topics.map((t) => ({
                title: t.name,
                firstStudy: "Pendente",
                performance: 0,
                relevance: "5/10",
              })),
            },
          },
          include: {
            topics: true,
          },
        });
        if (sub) {
          createdCount++;
          topicsCount += sub.topics?.length || 0;
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

    return {
      success: true,
      data: {
        templateTitle: template.title,
        subjectsCount: createdCount,
        topicsCount,
      },
    };
  } catch (error) {
    console.error("Erro ao importar edital base:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha ao carregar edital inicial.",
    };
  }
}
