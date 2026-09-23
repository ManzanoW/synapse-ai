"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordStudyActivityAction } from "@/actions/gamification-actions";

export interface SubmitFeedbackInput {
  type: "SUGGESTION" | "BUG" | "PRAISE" | "OTHER";
  category?: string;
  message: string;
  rating?: number;
  pageUrl?: string;
}

export async function submitUserFeedbackAction(input: SubmitFeedbackInput): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  earnedXp?: number;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const cleanMessage = input.message?.trim();
    if (!cleanMessage || cleanMessage.length < 5) {
      return {
        success: false,
        error: "Por favor, escreva uma mensagem com pelo menos 5 caracteres.",
      };
    }

    const rating =
      typeof input.rating === "number" && input.rating >= 1 && input.rating <= 5
        ? input.rating
        : null;

    // Grava o feedback no banco de dados
    await prisma.userFeedback.create({
      data: {
        userId,
        type: input.type || "SUGGESTION",
        category: input.category || "GERAL",
        message: cleanMessage,
        rating,
        pageUrl: input.pageUrl || null,
        status: "NEW",
      },
    });

    let earnedXp = 0;
    // Bônus pedagógico de gamificação: +15 XP por contribuir com a evolução da plataforma
    if (userId) {
      try {
        earnedXp = 15;
        await recordStudyActivityAction(userId, earnedXp, "FOCUS");
      } catch (xpErr) {
        console.warn("[submitUserFeedbackAction] Aviso ao conceder XP:", xpErr);
      }
    }

    return {
      success: true,
      message: "Feedback recebido com sucesso! Sua opinião é fundamental para aprimorarmos a Synapse AI.",
      earnedXp,
    };
  } catch (err) {
    console.error("[submitUserFeedbackAction] Erro ao registrar feedback:", err);
    return {
      success: false,
      error: "Ocorreu um erro ao enviar seu feedback. Tente novamente mais tarde.",
    };
  }
}
