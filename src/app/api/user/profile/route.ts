// src/app/api/user/profile/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { cookies } from "next/headers";

/**
 * 📋 GET /api/user/profile
 * Implementa o Direito de Acesso e Portabilidade de Dados Pessoais (Art. 18, II e V da LGPD - Lei nº 13.709/2018).
 * Retorna em formato estruturado e interoperável (JSON) todos os dados cadastrais, pedagógicos e cognitivos
 * do titular armazenados em nuvem (PostgreSQL), excluindo segredos de infraestrutura (tokens OAuth internos).
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const whereCondition = session.user.id
      ? { id: session.user.id }
      : { email: session.user.email! };

    const userRecord = await prisma.user.findUnique({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        targetExamDate: true,
        careerFocus: true,
        targetRole: true,
        studyMode: true,
        weeklyGoalHours: true,
        activeDaysPerWeek: true,
        cycleCurrentIndex: true,
        cycleLap: true,
        role: true,
        planTier: true,
        streakFreezes: true,
        createdAt: true,
        updatedAt: true,
        userStats: true,
        subjects: {
          include: {
            topics: {
              include: {
                reviewHistories: true,
                quizAttempts: true,
              },
            },
          },
        },
        decks: {
          include: {
            flashcards: true,
          },
        },
        quizzes: true,
        questionErrors: true,
        essays: true,
        studySessions: true,
        studyTrails: {
          include: {
            lessons: true,
          },
        },
        externalCourses: {
          include: {
            items: true,
          },
        },
        dailyQuests: true,
        feedbacks: true,
      },
    });

    if (!userRecord) {
      return NextResponse.json({ error: "Titular não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      lgpdCompliance: {
        law: "Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD)",
        articles: ["Art. 18, II (Acesso aos dados)", "Art. 18, V (Portabilidade dos dados)"],
        exportedAt: new Date().toISOString(),
        controller: "Synapse AI Concursos",
      },
      profile: userRecord,
    });
  } catch (error) {
    console.error("Erro no endpoint GET /api/user/profile (LGPD Export):", error);
    return NextResponse.json(
      { error: "Erro interno ao exportar dados do titular" },
      { status: 500 },
    );
  }
}

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

    const updateData: Record<string, unknown> = {};
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

/**
 * 🗑️ DELETE /api/user/profile
 * Implementa o Direito à Eliminação dos Dados Pessoais e Esquecimento (Art. 18, IV e VI da LGPD).
 * Executa uma transação atômica que remove integralmente todos os registros vinculados ao titular
 * no banco de dados e invalida cookies de sessão.
 */
export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Protege a conta pública de demonstração contra exclusão acidental em ambiente compartilhado
    if (userId === "demo-user-id" || session.user.email === "visitante@synapse.ai") {
      return NextResponse.json(
        {
          error:
            "A conta pública de demonstração não pode ser excluída. Para testar a exclusão completa, utilize uma conta pessoal autenticada.",
        },
        { status: 403 },
      );
    }

    let body: { confirmation?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Body inválido ou vazio
    }

    if (body?.confirmation !== "EXCLUIR") {
      return NextResponse.json(
        {
          error:
            'Confirmação explícita obrigatória. Envie { "confirmation": "EXCLUIR" } para confirmar a eliminação definitiva da conta.',
        },
        { status: 400 },
      );
    }

    // Executa limpeza transacional ordenada respeitando todas as constraints relacionais
    await prisma.$transaction([
      prisma.userAchievementProgress.deleteMany({ where: { userId } }),
      prisma.quizAttempt.deleteMany({ where: { userId } }),
      prisma.questionError.deleteMany({ where: { userId } }),
      prisma.essaySubmission.deleteMany({ where: { userId } }),
      prisma.aiDailyUsage.deleteMany({ where: { userId } }),
      prisma.userFeedback.deleteMany({ where: { userId } }),
      prisma.dailyQuest.deleteMany({ where: { userId } }),
      prisma.studySession.deleteMany({ where: { userId } }),
      prisma.externalCourse.deleteMany({ where: { userId } }),
      prisma.studyTrail.deleteMany({ where: { userId } }),
      prisma.quiz.deleteMany({ where: { userId } }),
      prisma.deck.deleteMany({ where: { userId } }),
      prisma.subject.deleteMany({ where: { userId } }),
      prisma.userStats.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    try {
      const cookieStore = await cookies();
      cookieStore.delete("synapse_demo_tier");
    } catch {
      // Ignora em contextos de teste sem cookieStore ativo
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Conta e todos os dados pessoais e pedagógicos foram eliminados permanentemente em conformidade com o Art. 18, VI da LGPD.",
      },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
          "Clear-Site-Data": '"cookies", "storage"',
        },
      },
    );
  } catch (error) {
    console.error("Erro no endpoint DELETE /api/user/profile (LGPD Erasure):", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a exclusão definitiva da conta." },
      { status: 500 },
    );
  }
}
