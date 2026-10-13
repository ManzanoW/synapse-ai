"use server";

import { auth } from "@/auth";
import {
  getUserQuotaStatus,
  addRewardedAdBonus,
  addStudyMeritBonus,
  getAiValueMetrics,
  type UserQuotaStatus,
  type AiFeatureType,
  type AiValueMetrics,
} from "@/lib/ai-quota-service";

export async function getAiQuotaStatusAction(): Promise<{
  success: boolean;
  data?: UserQuotaStatus;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const data = await getUserQuotaStatus(userId);
    return { success: true, data };
  } catch (err) {
    console.error("[getAiQuotaStatusAction] Erro:", err);
    return { success: false, error: "Falha ao consultar status de cota de IA." };
  }
}

export async function claimRewardedAdBonusAction(
  feature: AiFeatureType = "SIMULADO",
): Promise<{
  success: boolean;
  newLimit?: number;
  message?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, message: "Usuário não autenticado." };
    }

    const result = await addRewardedAdBonus(userId, feature);
    return result;
  } catch (err) {
    console.error("[claimRewardedAdBonusAction] Erro:", err);
    return {
      success: false,
      message: "Erro ao processar recompensa por anúncio.",
    };
  }
}

/**
 * Concede +1⚡ de Energia Sináptica por Mérito de Estudo
 */
export async function awardStudyMeritAction(
  reason: "POMODORO_FOCUS" | "FSRS_STREAK",
): Promise<{
  success: boolean;
  earnedEnergy?: number;
  message?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, message: "Usuário não autenticado." };
    }

    const result = await addStudyMeritBonus(userId, reason);
    return result;
  } catch (err) {
    console.error("[awardStudyMeritAction] Erro:", err);
    return {
      success: false,
      message: "Erro ao creditar recarga por mérito de estudo.",
    };
  }
}

/**
 * Retorna o relatório semanal de ROI de tempo e valor gerado pela IA
 */
export async function getAiValueReportAction(): Promise<{
  success: boolean;
  data?: AiValueMetrics;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const data = await getAiValueMetrics(userId);
    return { success: true, data };
  } catch (err) {
    console.error("[getAiValueReportAction] Erro:", err);
    return { success: false, error: "Falha ao obter relatório de valor gerado." };
  }
}

