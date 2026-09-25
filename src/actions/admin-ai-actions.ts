"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getGeminiPoolStatus,
  testGeminiPoolKeys,
} from "@/lib/gemini-fallback";

export interface AdminAiMetrics {
  todayDate: string;
  totalRequestsToday: number;
  totalPoolCapacity: number;
  percentUsed: number;
  byFeature: Record<string, number>;
  topUsersToday: Array<{
    userId: string;
    name: string | null;
    email: string | null;
    planTier: string;
    totalCount: number;
  }>;
  poolStatus: ReturnType<typeof getGeminiPoolStatus>;
}

function getTodayKey(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const brDate = new Date(utc - 3 * 3600000);
  return brDate.toISOString().slice(0, 10);
}

/**
 * Valida se o usuário atual autenticado tem permissão de Administrador.
 */
async function verifyAdminAuth(): Promise<{ isAuthorized: boolean; userId?: string }> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { isAuthorized: false };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });

  const isAdmin =
    user?.role === "ADMIN" ||
    Boolean(
      user?.email &&
        process.env.ADMIN_EMAIL &&
        user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
    );

  return { isAuthorized: Boolean(isAdmin), userId };
}

/**
 * Obtém o panorama completo de consumo de IA e a saúde das chaves.
 */
export async function getAdminAiMetricsAction(): Promise<{
  success: boolean;
  data?: AdminAiMetrics;
  error?: string;
}> {
  try {
    const { isAuthorized } = await verifyAdminAuth();
    if (!isAuthorized) {
      return { success: false, error: "Acesso restrito a administradores." };
    }

    const todayDate = getTodayKey();

    // 1. Busca todos os registros de consumo de hoje
    const todayUsages = await prisma.aiDailyUsage.findMany({
      where: { date: todayDate },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            planTier: true,
          },
        },
      },
    });

    // 2. Agregação por ferramenta
    const byFeature: Record<string, number> = {
      SIMULADO: 0,
      ESSAY: 0,
      OCR_ESSAY: 0,
      OCR_QUESTION: 0,
      MINDMAP: 0,
      FLASHCARD: 0,
      REMEDIATION: 0,
      EDITAL: 0,
    };

    let totalRequestsToday = 0;
    const userTotalsMap = new Map<
      string,
      {
        userId: string;
        name: string | null;
        email: string | null;
        planTier: string;
        totalCount: number;
      }
    >();

    for (const record of todayUsages) {
      // Ignora o somatório geral "ALL" para evitar contagem dupla
      if (record.feature === "ALL") continue;

      const count = record.count || 0;
      byFeature[record.feature] = (byFeature[record.feature] || 0) + count;
      totalRequestsToday += count;

      if (record.user) {
        const existing = userTotalsMap.get(record.userId) || {
          userId: record.userId,
          name: record.user.name,
          email: record.user.email,
          planTier: record.user.planTier || "FREE",
          totalCount: 0,
        };
        existing.totalCount += count;
        userTotalsMap.set(record.userId, existing);
      }
    }

    // 3. Ordena os usuários mais ativos do dia
    const topUsersToday = Array.from(userTotalsMap.values())
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 15);

    // 4. Status atual do pool de chaves
    const poolStatus = getGeminiPoolStatus();
    const totalPoolCapacity = poolStatus.totalKeys * 1500;
    const percentUsed =
      totalPoolCapacity > 0
        ? Math.min(100, Math.round((totalRequestsToday / totalPoolCapacity) * 100))
        : 0;

    return {
      success: true,
      data: {
        todayDate,
        totalRequestsToday,
        totalPoolCapacity,
        percentUsed,
        byFeature,
        topUsersToday,
        poolStatus,
      },
    };
  } catch (error) {
    console.error("[getAdminAiMetricsAction] Erro:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao carregar métricas de IA",
    };
  }
}

/**
 * Dispara teste ativo de conectividade (ping) em cada chave do pool.
 */
export async function pingAdminAiKeysAction(): Promise<{
  success: boolean;
  data?: Awaited<ReturnType<typeof testGeminiPoolKeys>>;
  error?: string;
}> {
  try {
    const { isAuthorized } = await verifyAdminAuth();
    if (!isAuthorized) {
      return { success: false, error: "Acesso restrito a administradores." };
    }

    const results = await testGeminiPoolKeys();
    return { success: true, data: results };
  } catch (error) {
    console.error("[pingAdminAiKeysAction] Erro:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao testar chaves de IA",
    };
  }
}
