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
