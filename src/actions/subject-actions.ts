"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface UpdateSubjectInput {
  subjectId: string;
  name: string;
  color?: string | null;
  weight: number; // 1.0 a 10.0
}

export async function updateSubjectAction(input: UpdateSubjectInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const { subjectId, name, color, weight } = input;

    if (!subjectId || !name?.trim()) {
      return { success: false, error: "ID e Nome da matéria são obrigatórios." };
    }

    // Garante que o peso esteja estritamente entre 1.0 e 10.0
    const clampedWeight = Math.max(1.0, Math.min(10.0, Number(weight) || 5.0));

    // Valida se a matéria pertence ao usuário
    const existingSubject = await prisma.subject.findFirst({
      where: { id: subjectId, userId },
    });

    if (!existingSubject) {
      return {
        success: false,
        error: "Matéria não encontrada ou não pertence a este usuário.",
      };
    }

    const updated = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: name.trim(),
        color: color || existingSubject.color,
        weight: clampedWeight,
      },
    });

    try {
      revalidatePath("/edital");
      revalidatePath("/dashboard");
      revalidatePath("/performance");
      revalidatePath("/questions");
    } catch {
      // Ignora erro fora de contexto HTTP
    }

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Erro em updateSubjectAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha ao atualizar matéria.",
    };
  }
}

export interface BulkSubjectWeightItem {
  subjectId: string;
  weight: number;
}

export async function bulkUpdateSubjectWeightsAction(items: BulkSubjectWeightItem[]) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, error: "Nenhum item informado para atualização." };
    }

    // Busca apenas as matérias que de fato pertencem a este usuário
    const userSubjectIds = new Set(
      (
        await prisma.subject.findMany({
          where: { userId },
          select: { id: true },
        })
      ).map((s) => s.id)
    );

    const validUpdates = items.filter((item) => userSubjectIds.has(item.subjectId));

    if (validUpdates.length === 0) {
      return { success: false, error: "Nenhuma matéria válida encontrada para este usuário." };
    }

    // Executa as atualizações em transação única
    await prisma.$transaction(
      validUpdates.map((item) => {
        const clampedWeight = Math.max(1.0, Math.min(10.0, Number(item.weight) || 5.0));
        return prisma.subject.update({
          where: { id: item.subjectId },
          data: { weight: clampedWeight },
        });
      })
    );

    try {
      revalidatePath("/edital");
      revalidatePath("/dashboard");
      revalidatePath("/performance");
      revalidatePath("/questions");
    } catch {
      // Ignora fora de contexto HTTP
    }

    return {
      success: true,
      updatedCount: validUpdates.length,
    };
  } catch (error) {
    console.error("Erro em bulkUpdateSubjectWeightsAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha ao atualizar pesos das matérias.",
    };
  }
}

