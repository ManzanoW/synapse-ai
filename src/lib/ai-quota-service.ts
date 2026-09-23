// src/lib/ai-quota-service.ts

import { prisma } from "@/lib/prisma";

export type AiFeatureType =
  | "SIMULADO"
  | "ESSAY"
  | "FLASHCARD"
  | "MINDMAP"
  | "REMEDIATION"
  | "EDITAL";

// Limites diários para usuários em fase de teste / plano gratuito
export const AI_QUOTA_LIMITS: Record<AiFeatureType, { label: string; dailyLimit: number }> = {
  SIMULADO: { label: "Simulados com IA", dailyLimit: 10 },
  ESSAY: { label: "Correções de Redação", dailyLimit: 5 },
  FLASHCARD: { label: "Baralhos de Flashcards", dailyLimit: 10 },
  MINDMAP: { label: "Mapas Mentais", dailyLimit: 8 },
  REMEDIATION: { label: "Remediação e Mnemônicos", dailyLimit: 15 },
  EDITAL: { label: "Personalização de Edital", dailyLimit: 5 },
};

// Teto global diário para somatório de todas as requisições de IA
export const GLOBAL_DAILY_AI_LIMIT = 25;

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  isUnlimited: boolean;
  message?: string;
  resetsAt: string;
}

export interface UserQuotaStatus {
  isUnlimited: boolean;
  role: string;
  planTier: string;
  globalUsed: number;
  globalLimit: number;
  globalRemaining: number;
  features: Record<
    AiFeatureType,
    {
      label: string;
      used: number;
      limit: number;
      remaining: number;
    }
  >;
}

function getTodayKey(): string {
  // Retorna YYYY-MM-DD com base no horário de Brasília (UTC-3)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const brDate = new Date(utc - 3 * 3600000);
  return brDate.toISOString().slice(0, 10);
}

/**
 * Verifica se o usuário possui cota disponível para consumir uma funcionalidade com IA hoje.
 */
export async function checkAiQuota(
  userId: string,
  feature: AiFeatureType,
): Promise<QuotaCheckResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, planTier: true, email: true },
    });

    // Administradores e assinantes Premium possuem acesso ilimitado
    const isUnlimited =
      user?.role === "ADMIN" ||
      user?.planTier === "PREMIUM" ||
      Boolean(
        user?.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
      );

    if (isUnlimited) {
      return {
        allowed: true,
        remaining: 9999,
        limit: 9999,
        used: 0,
        isUnlimited: true,
        resetsAt: "Ilimitado (Admin/Premium)",
      };
    }

    const today = getTodayKey();
    const featureConfig = AI_QUOTA_LIMITS[feature] || {
      label: feature,
      dailyLimit: 10,
    };

    // Busca o consumo de hoje para esta funcionalidade e o total global
    const [featureUsage, globalUsage] = await Promise.all([
      prisma.aiDailyUsage.findUnique({
        where: {
          userId_date_feature: {
            userId,
            date: today,
            feature,
          },
        },
        select: { count: true },
      }),
      prisma.aiDailyUsage.findUnique({
        where: {
          userId_date_feature: {
            userId,
            date: today,
            feature: "ALL",
          },
        },
        select: { count: true },
      }),
    ]);

    const usedFeature = featureUsage?.count ?? 0;
    const usedGlobal = globalUsage?.count ?? 0;

    // 1. Checa limite global
    if (usedGlobal >= GLOBAL_DAILY_AI_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        limit: GLOBAL_DAILY_AI_LIMIT,
        used: usedGlobal,
        isUnlimited: false,
        message: `Você atingiu seu limite diário geral de testes de IA (${usedGlobal}/${GLOBAL_DAILY_AI_LIMIT}). Sua cota será renovada à meia-noite.`,
        resetsAt: "à meia-noite",
      };
    }

    // 2. Checa limite da funcionalidade específica
    if (usedFeature >= featureConfig.dailyLimit) {
      return {
        allowed: false,
        remaining: 0,
        limit: featureConfig.dailyLimit,
        used: usedFeature,
        isUnlimited: false,
        message: `Você atingiu a cota diária de ${featureConfig.label} (${usedFeature}/${featureConfig.dailyLimit}). Sua cota será renovada à meia-noite.`,
        resetsAt: "à meia-noite",
      };
    }

    const remainingFeature = featureConfig.dailyLimit - usedFeature;
    const remainingGlobal = GLOBAL_DAILY_AI_LIMIT - usedGlobal;
    const effectiveRemaining = Math.min(remainingFeature, remainingGlobal);

    return {
      allowed: true,
      remaining: effectiveRemaining,
      limit: featureConfig.dailyLimit,
      used: usedFeature,
      isUnlimited: false,
      resetsAt: "à meia-noite",
    };
  } catch (err) {
    console.warn("[checkAiQuota] Erro ao verificar cota (liberando em fallback):", err);
    // Em caso de falha transitória, permite a requisição para não travar o aluno
    return {
      allowed: true,
      remaining: 5,
      limit: 10,
      used: 0,
      isUnlimited: false,
      resetsAt: "à meia-noite",
    };
  }
}

/**
 * Incrementa o contador de consumo após uma chamada com IA bem-sucedida.
 */
export async function consumeAiQuota(
  userId: string,
  feature: AiFeatureType,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, planTier: true, email: true },
    });

    const isUnlimited =
      user?.role === "ADMIN" ||
      user?.planTier === "PREMIUM" ||
      Boolean(
        user?.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
      );

    if (isUnlimited) {
      return; // Admins não consomem cota
    }

    const today = getTodayKey();

    // Incrementa na feature específica e no total ALL
    await prisma.$transaction([
      prisma.aiDailyUsage.upsert({
        where: {
          userId_date_feature: {
            userId,
            date: today,
            feature,
          },
        },
        create: {
          userId,
          date: today,
          feature,
          count: 1,
        },
        update: {
          count: { increment: 1 },
        },
      }),
      prisma.aiDailyUsage.upsert({
        where: {
          userId_date_feature: {
            userId,
            date: today,
            feature: "ALL",
          },
        },
        create: {
          userId,
          date: today,
          feature: "ALL",
          count: 1,
        },
        update: {
          count: { increment: 1 },
        },
      }),
    ]);
  } catch (err) {
    console.warn("[consumeAiQuota] Erro ao registrar consumo de cota:", err);
  }
}

/**
 * Retorna o panorama completo de consumo de IA do usuário para hoje.
 */
export async function getUserQuotaStatus(userId: string): Promise<UserQuotaStatus> {
  const defaultStatus: UserQuotaStatus = {
    isUnlimited: false,
    role: "USER",
    planTier: "FREE",
    globalUsed: 0,
    globalLimit: GLOBAL_DAILY_AI_LIMIT,
    globalRemaining: GLOBAL_DAILY_AI_LIMIT,
    features: {
      SIMULADO: { label: AI_QUOTA_LIMITS.SIMULADO.label, used: 0, limit: AI_QUOTA_LIMITS.SIMULADO.dailyLimit, remaining: AI_QUOTA_LIMITS.SIMULADO.dailyLimit },
      ESSAY: { label: AI_QUOTA_LIMITS.ESSAY.label, used: 0, limit: AI_QUOTA_LIMITS.ESSAY.dailyLimit, remaining: AI_QUOTA_LIMITS.ESSAY.dailyLimit },
      FLASHCARD: { label: AI_QUOTA_LIMITS.FLASHCARD.label, used: 0, limit: AI_QUOTA_LIMITS.FLASHCARD.dailyLimit, remaining: AI_QUOTA_LIMITS.FLASHCARD.dailyLimit },
      MINDMAP: { label: AI_QUOTA_LIMITS.MINDMAP.label, used: 0, limit: AI_QUOTA_LIMITS.MINDMAP.dailyLimit, remaining: AI_QUOTA_LIMITS.MINDMAP.dailyLimit },
      REMEDIATION: { label: AI_QUOTA_LIMITS.REMEDIATION.label, used: 0, limit: AI_QUOTA_LIMITS.REMEDIATION.dailyLimit, remaining: AI_QUOTA_LIMITS.REMEDIATION.dailyLimit },
      EDITAL: { label: AI_QUOTA_LIMITS.EDITAL.label, used: 0, limit: AI_QUOTA_LIMITS.EDITAL.dailyLimit, remaining: AI_QUOTA_LIMITS.EDITAL.dailyLimit },
    },
  };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, planTier: true, email: true },
    });

    if (!user) return defaultStatus;

    const isUnlimited =
      user.role === "ADMIN" ||
      user.planTier === "PREMIUM" ||
      Boolean(
        user.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
      );

    defaultStatus.role = user.role;
    defaultStatus.planTier = user.planTier;
    defaultStatus.isUnlimited = Boolean(isUnlimited);

    if (isUnlimited) {
      defaultStatus.globalRemaining = 9999;
      defaultStatus.globalLimit = 9999;
      return defaultStatus;
    }

    const today = getTodayKey();
    const usages = await prisma.aiDailyUsage.findMany({
      where: { userId, date: today },
    });

    const usageMap = new Map<string, number>();
    for (const u of usages) {
      usageMap.set(u.feature, u.count);
    }

    const globalUsed = usageMap.get("ALL") ?? 0;
    defaultStatus.globalUsed = globalUsed;
    defaultStatus.globalRemaining = Math.max(0, GLOBAL_DAILY_AI_LIMIT - globalUsed);

    (Object.keys(AI_QUOTA_LIMITS) as AiFeatureType[]).forEach((feature) => {
      const used = usageMap.get(feature) ?? 0;
      const limit = AI_QUOTA_LIMITS[feature].dailyLimit;
      defaultStatus.features[feature] = {
        label: AI_QUOTA_LIMITS[feature].label,
        used,
        limit,
        remaining: Math.max(0, limit - used),
      };
    });

    return defaultStatus;
  } catch (err) {
    console.warn("[getUserQuotaStatus] Erro ao obter status de cota:", err);
    return defaultStatus;
  }
}
