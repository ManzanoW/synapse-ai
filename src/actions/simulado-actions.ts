"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteBatchSimuladosAction(simuladoIds: string[]) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Não autorizado." };
    }

    if (!simuladoIds || !Array.isArray(simuladoIds) || simuladoIds.length === 0) {
      return {
        success: false,
        error: "Nenhum simulado selecionado para exclusão.",
      };
    }

    // Suporta tanto prisma.simulado (se definido/estendido) quanto prisma.quiz (modelo Prisma padrão)
    const delegate = (prisma as any).simulado ?? prisma.quiz;

    const result = await delegate.deleteMany({
      where: {
        id: { in: simuladoIds },
        userId,
      },
    });

    revalidatePath("/questions");

    return { success: true, count: result.count };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro na Server Action deleteBatchSimuladosAction:", error);
    return {
      success: false,
      error: "Falha ao excluir simulados.",
      details: errorMessage,
    };
  }
}
