// src/app/api/user/profile/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { targetExamDate, careerFocus, targetRole } = body;

    // Converte a string YYYY-MM-DD para Date ou null
    let parsedDate: Date | null = null;
    if (targetExamDate) {
      parsedDate = new Date(targetExamDate);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Data inválida" }, { status: 400 });
      }
    }

    // Identificador para a cláusula WHERE
    const whereCondition = session.user.id
      ? { id: session.user.id }
      : { email: session.user.email! };

    const updateData: any = {};
    if (targetExamDate !== undefined) updateData.targetExamDate = parsedDate;
    if (careerFocus !== undefined) updateData.careerFocus = careerFocus;
    if (targetRole !== undefined) updateData.targetRole = targetRole;

    const updatedUser = await prisma.user.update({
      where: whereCondition,
      data: updateData,
      select: {
        id: true,
        email: true,
        targetExamDate: true,
        careerFocus: true,
        targetRole: true,
      },
    });

    return NextResponse.json({
      message: "Perfil atualizado com sucesso!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erro no endpoint PATCH /api/user/profile:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar perfil" },
      { status: 500 },
    );
  }
}
