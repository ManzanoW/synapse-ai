import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Mapeamento auxiliar de dias em português para o índice numérico (0 = Domingo, 1 = Segunda, ...)
const DAY_NAME_TO_INDEX: Record<string, number> = {
  Domingo: 0,
  "Segunda-feira": 1,
  "Terça-feira": 2,
  "Quarta-feira": 3,
  "Quinta-feira": 4,
  "Sexta-feira": 5,
  Sábado: 6,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, action, missedDayName } = body;

    console.log("📥 Payload recebido em /api/week/reschedule:", {
      userId,
      action,
      missedDayName,
    });

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Parâmetros 'userId' e 'action' são obrigatórios." },
        { status: 400 },
      );
    }

    const now = new Date();
    const todayDayIndex = now.getDay(); // Retorna 0 (Domingo) a 6 (Sábado)

    // AÇÃO 1: MARCAR COMO FOLGA
    if (action === "OFF_DAY") {
      // Atualiza o updatedAt de todas as matérias para HOJE, sinalizando que a pendência foi resolvida
      await prisma.subject.updateMany({
        where: { userId },
        data: { updatedAt: now },
      });

      return NextResponse.json({
        success: true,
        message: "Dia marcado como folga com sucesso!",
      });
    }

    // AÇÃO 2: EMPURRAR MATÉRIAS PARA HOJE
    if (action === "PUSH_TODAY") {
      // Se soubermos qual foi o dia perdido (ex: "Domingo"), movemos as matérias desse dia específico para hoje
      if (missedDayName && DAY_NAME_TO_INDEX[missedDayName] !== undefined) {
        const missedDayIndex = DAY_NAME_TO_INDEX[missedDayName];

        // Transfere o assignedDay do dia perdido para o dia de hoje
        await prisma.subject.updateMany({
          where: {
            userId,
            assignedDay: missedDayIndex,
          },
          data: {
            assignedDay: todayDayIndex,
            updatedAt: now,
          },
        });
      }

      // Atualiza as demais matérias para resetar o cálculo do banner
      await prisma.subject.updateMany({
        where: { userId },
        data: { updatedAt: now },
      });

      return NextResponse.json({
        success: true,
        message: "Matérias rebalanceadas e empurradas para hoje com sucesso!",
      });
    }

    // AÇÃO 3: PULAR E VER NO PRÓXIMO CICLO
    if (action === "SKIP_CYCLE") {
      // Apenas reseta o flag de dia perdido mantendo a distribuição atual nos dias da semana
      await prisma.subject.updateMany({
        where: { userId },
        data: { updatedAt: now },
      });

      return NextResponse.json({
        success: true,
        message: "Ciclo mantido e pendência ignorada com sucesso!",
      });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error: unknown) {
    console.error("❌ ERRO em /api/week/reschedule:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao reagendar." },
      { status: 500 },
    );
  }
}
