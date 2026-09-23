"use server";

import { auth } from "@/auth";
import { getUserQuotaStatus, UserQuotaStatus } from "@/lib/ai-quota-service";

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
