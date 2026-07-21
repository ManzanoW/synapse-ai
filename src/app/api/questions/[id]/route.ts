import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Aguarda o unwrapping de params (obrigatório nas versões atuais do Next.js)
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do simulado não fornecido." },
        { status: 400 },
      );
    }

    await prisma.quiz.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Simulado excluído com sucesso." },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Prisma Error ao deletar:", error);
    return NextResponse.json(
      { error: "Falha ao excluir o simulado.", details: errorMessage },
      { status: 500 },
    );
  }
}
