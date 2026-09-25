// src/lib/ai-quota-service.ts

import { prisma } from "@/lib/prisma";
import type {
  AiFeatureType,
  QuotaCheckResult,
  UserQuotaStatus,
} from "@/types/quota";

export type { AiFeatureType, QuotaCheckResult, UserQuotaStatus };

// Limites diários para usuários no plano gratuito (Freemium estratégico de alta conversão)
export const AI_QUOTA_LIMITS: Record<
  AiFeatureType,
  { label: string; dailyLimit: number; isWeekly?: boolean }
> = {
  SIMULADO: { label: "Simulados com IA", dailyLimit: 2 },
  ESSAY: { label: "Correções de Redação", dailyLimit: 1 },
  FLASHCARD: { label: "Baralhos de Flashcards", dailyLimit: 2 },
  MINDMAP: { label: "Mapas Mentais", dailyLimit: 1 },
  REMEDIATION: { label: "Remediação e Mnemônicos", dailyLimit: 1 },
  EDITAL: { label: "Personalização de Edital", dailyLimit: 1 },
  OCR_ESSAY: { label: "OCR de Foto Manuscrita", dailyLimit: 1, isWeekly: true },
  OCR_QUESTION: { label: "Scanner OCR de Questões", dailyLimit: 3 },
};

// Limites diários de Uso Justo (Fair Use) para assinantes do plano Pro.
// Valores generosos que garantem liberdade total para concurseiros humanos reais,
// mas bloqueiam scripts, bots, loops e compartilhamento abusivo de contas.
export const PRO_FAIR_USE_LIMITS: Record<
  AiFeatureType,
  { label: string; dailyLimit: number; isWeekly?: boolean }
> = {
  SIMULADO: { label: "Simulados com IA", dailyLimit: 30 },
  ESSAY: { label: "Correções de Redação", dailyLimit: 6 },
  FLASHCARD: { label: "Baralhos de Flashcards", dailyLimit: 30 },
  MINDMAP: { label: "Mapas Mentais", dailyLimit: 20 },
  REMEDIATION: { label: "Remediação e Mnemônicos", dailyLimit: 30 },
  EDITAL: { label: "Personalização de Edital", dailyLimit: 10 },
  OCR_ESSAY: { label: "OCR de Foto Manuscrita", dailyLimit: 10 },
  OCR_QUESTION: { label: "Scanner OCR de Questões", dailyLimit: 30 },
};

// Teto global diário para somatório de todas as requisições de IA no plano gratuito
export const GLOBAL_DAILY_AI_LIMIT = 7;

// Teto global diário para somatório de requisições de IA no plano Pro (Fair Use)
export const GLOBAL_DAILY_PRO_AI_LIMIT = 100;

// Trava anti-loop e anti-bot por minuto por usuário
export const MAX_REQUESTS_PER_MINUTE_PER_USER = 10;

// Máximo de anúncios de vídeo recompensados permitidos por dia por usuário
export const MAX_DAILY_REWARDED_ADS = 2;

// Rate limiter em memória por usuário (janela deslizante de 60 segundos)
const userRequestTimestamps = new Map<string, number[]>();

export function checkRateLimitPerMinute(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const timestamps = userRequestTimestamps.get(userId) || [];

  // Remove timestamps mais antigos que 60 segundos
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= MAX_REQUESTS_PER_MINUTE_PER_USER) {
    userRequestTimestamps.set(userId, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  userRequestTimestamps.set(userId, validTimestamps);

  // Limpeza preventiva se o Map exceder 5000 entradas
  if (userRequestTimestamps.size > 5000) {
    for (const [uid, tsList] of userRequestTimestamps.entries()) {
      const filtered = tsList.filter((t) => now - t < windowMs);
      if (filtered.length === 0) {
        userRequestTimestamps.delete(uid);
      } else {
        userRequestTimestamps.set(uid, filtered);
      }
    }
  }

  return true;
}

function getTodayKey(): string {
  // Retorna YYYY-MM-DD com base no horário de Brasília (UTC-3)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const brDate = new Date(utc - 3 * 3600000);
  return brDate.toISOString().slice(0, 10);
}

function getUsagePeriodKey(feature: AiFeatureType): string {
  if (AI_QUOTA_LIMITS[feature]?.isWeekly) {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const brDate = new Date(utc - 3 * 3600000);
    const oneJan = new Date(brDate.getFullYear(), 0, 1);
    const numberOfDays = Math.floor(
      (brDate.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000)
    );
    const weekNumber = Math.ceil((brDate.getDay() + 1 + numberOfDays) / 7);
    return `${brDate.getFullYear()}-W${weekNumber}`;
  }
  return getTodayKey();
}

/**
 * Verifica se o usuário possui cota disponível para consumir uma funcionalidade com IA hoje.
 * Leva em consideração bônus diários desbloqueados via vídeos patrocinados (Rewarded Ads)
 * e aplica a Política de Uso Justo (Fair Use) e Rate Limiting para assinantes Pro.
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

    const isAdmin =
      user?.role === "ADMIN" ||
      Boolean(
        user?.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
      );

    // Administradores possuem acesso 100% irrestrito
    if (isAdmin) {
      return {
        allowed: true,
        remaining: 9999,
        limit: 9999,
        used: 0,
        isUnlimited: true,
        resetsAt: "Ilimitado (Admin)",
        canWatchRewardedAd: false,
      };
    }

    // 1. Checagem de Rate Limit por minuto (proteção anti-loop e anti-bot)
    if (!checkRateLimitPerMinute(userId)) {
      return {
        allowed: false,
        remaining: 0,
        limit: MAX_REQUESTS_PER_MINUTE_PER_USER,
        used: MAX_REQUESTS_PER_MINUTE_PER_USER,
        isUnlimited: user?.planTier === "PREMIUM",
        resetsAt: "em 1 minuto",
        message:
          "Muitas requisições em sequência. Aguarde alguns segundos antes de solicitar uma nova geração de IA.",
        canWatchRewardedAd: false,
      };
    }

    // 2. Assinantes Pro: Política de Uso Justo (Fair Use)
    const isPro = user?.planTier === "PREMIUM";
    if (isPro) {
      const today = getTodayKey();
      const proFeatureConfig = PRO_FAIR_USE_LIMITS[feature] || {
        label: feature,
        dailyLimit: 30,
      };

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

      // Checa teto global do Pro (100 chamadas/dia)
      if (usedGlobal >= GLOBAL_DAILY_PRO_AI_LIMIT) {
        return {
          allowed: false,
          remaining: 0,
          limit: GLOBAL_DAILY_PRO_AI_LIMIT,
          used: usedGlobal,
          isUnlimited: true,
          resetsAt: "à meia-noite",
          message:
            "Você atingiu o teto diário de uso justo da sua conta Pro (100 gerações/dia). Seu limite será renovado automaticamente à meia-noite.",
          canWatchRewardedAd: false,
        };
      }

      // Checa teto da funcionalidade específica no Pro
      if (usedFeature >= proFeatureConfig.dailyLimit) {
        return {
          allowed: false,
          remaining: 0,
          limit: proFeatureConfig.dailyLimit,
          used: usedFeature,
          isUnlimited: true,
          resetsAt: "à meia-noite",
          message: `Você atingiu o teto diário de uso justo para ${proFeatureConfig.label} (${proFeatureConfig.dailyLimit}/dia). Seu limite será renovado à meia-noite.`,
          canWatchRewardedAd: false,
        };
      }

      const remaining = Math.max(0, proFeatureConfig.dailyLimit - usedFeature);
      return {
        allowed: true,
        remaining,
        limit: proFeatureConfig.dailyLimit,
        used: usedFeature,
        isUnlimited: true,
        resetsAt: "Ilimitado (Uso Pessoal)",
        canWatchRewardedAd: false,
      };
    }

    const today = getTodayKey();
    const featureDate = getUsagePeriodKey(feature);
    const featureConfig = AI_QUOTA_LIMITS[feature] || {
      label: feature,
      dailyLimit: 10,
    };
    const resetsAt = featureConfig.isWeekly
      ? "na próxima segunda-feira às 00:00"
      : "à meia-noite";

    const bonusFeatureKey = `BONUS_${feature}`;

    // Busca consumo e bônus recebidos
    const [featureUsage, globalUsage, featureBonus, globalBonus] =
      await Promise.all([
        prisma.aiDailyUsage.findUnique({
          where: {
            userId_date_feature: {
              userId,
              date: featureDate,
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
        prisma.aiDailyUsage.findUnique({
          where: {
            userId_date_feature: {
              userId,
              date: featureDate,
              feature: bonusFeatureKey,
            },
          },
          select: { count: true },
        }),
        prisma.aiDailyUsage.findUnique({
          where: {
            userId_date_feature: {
              userId,
              date: today,
              feature: "BONUS_ALL",
            },
          },
          select: { count: true },
        }),
      ]);

    const usedFeature = featureUsage?.count ?? 0;
    const usedGlobal = globalUsage?.count ?? 0;
    const bonusCount = featureBonus?.count ?? 0;
    const bonusGlobalCount = globalBonus?.count ?? 0;

    const effectiveFeatureLimit = featureConfig.dailyLimit + bonusCount;
    const effectiveGlobalLimit = GLOBAL_DAILY_AI_LIMIT + bonusGlobalCount;
    const canWatchRewardedAd = bonusCount < MAX_DAILY_REWARDED_ADS;

    // 1. Checa limite global
    if (usedGlobal >= effectiveGlobalLimit) {
      return {
        allowed: false,
        remaining: 0,
        limit: effectiveGlobalLimit,
        used: usedGlobal,
        isUnlimited: false,
        message: `Você atingiu seu limite diário gratuito de IA (${usedGlobal}/${effectiveGlobalLimit}). Desbloqueie o Synapse Premium para ter IA ilimitada.`,
        resetsAt: "à meia-noite",
        canWatchRewardedAd,
      };
    }

    // 2. Checa limite da funcionalidade específica
    if (usedFeature >= effectiveFeatureLimit) {
      return {
        allowed: false,
        remaining: 0,
        limit: effectiveFeatureLimit,
        used: usedFeature,
        isUnlimited: false,
        message: featureConfig.isWeekly
          ? `Você atingiu seu limite gratuito semanal de ${featureConfig.label} (${usedFeature}/${effectiveFeatureLimit}). Desbloqueie com anúncio ou vire Synapse Pro.`
          : `Você atingiu sua cota diária gratuita de ${featureConfig.label} (${usedFeature}/${effectiveFeatureLimit}). Desbloqueie o Synapse Premium para ter acesso ilimitado.`,
        resetsAt,
        canWatchRewardedAd,
      };
    }


    const remainingFeature = effectiveFeatureLimit - usedFeature;
    const remainingGlobal = effectiveGlobalLimit - usedGlobal;
    const effectiveRemaining = Math.min(remainingFeature, remainingGlobal);

    return {
      allowed: true,
      remaining: effectiveRemaining,
      limit: effectiveFeatureLimit,
      used: usedFeature,
      isUnlimited: false,
      resetsAt: "à meia-noite",
      canWatchRewardedAd,
    };
  } catch (err) {
    console.warn("[checkAiQuota] Erro ao verificar cota (liberando em fallback):", err);
    return {
      allowed: true,
      remaining: 5,
      limit: 10,
      used: 0,
      isUnlimited: false,
      resetsAt: "à meia-noite",
      canWatchRewardedAd: false,
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

    const isAdmin =
      user?.role === "ADMIN" ||
      Boolean(
        user?.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
      );

    if (isAdmin) {
      return; // Admins não consomem cota
    }

    const today = getTodayKey();
    const featureDate = getUsagePeriodKey(feature);

    // Incrementa na feature específica e no total ALL
    await prisma.$transaction([
      prisma.aiDailyUsage.upsert({
        where: {
          userId_date_feature: {
            userId,
            date: featureDate,
            feature,
          },
        },
        create: {
          userId,
          date: featureDate,
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
export async function getUserQuotaStatus(
  userId: string,
): Promise<UserQuotaStatus> {
  const defaultStatus: UserQuotaStatus = {
    isUnlimited: false,
    role: "USER",
    planTier: "FREE",
    globalUsed: 0,
    globalLimit: GLOBAL_DAILY_AI_LIMIT,
    globalRemaining: GLOBAL_DAILY_AI_LIMIT,
    rewardedBonusToday: 0,
    canWatchRewardedAd: true,
    features: {
      SIMULADO: {
        label: AI_QUOTA_LIMITS.SIMULADO.label,
        used: 0,
        limit: AI_QUOTA_LIMITS.SIMULADO.dailyLimit,
        remaining: AI_QUOTA_LIMITS.SIMULADO.dailyLimit,
        bonusEarned: 0,
      },
      ESSAY: {
        label: AI_QUOTA_LIMITS.ESSAY.label,
        used: 0,
        limit: AI_QUOTA_LIMITS.ESSAY.dailyLimit,
        remaining: AI_QUOTA_LIMITS.ESSAY.dailyLimit,
        bonusEarned: 0,
      },
      FLASHCARD: {
        label: AI_QUOTA_LIMITS.FLASHCARD.label,
        used: 0,
        limit: AI_QUOTA_LIMITS.FLASHCARD.dailyLimit,
        remaining: AI_QUOTA_LIMITS.FLASHCARD.dailyLimit,
        bonusEarned: 0,
      },
      MINDMAP: {
        label: AI_QUOTA_LIMITS.MINDMAP.label,
        used: 0,
        limit: AI_QUOTA_LIMITS.MINDMAP.dailyLimit,
        remaining: AI_QUOTA_LIMITS.MINDMAP.dailyLimit,
        bonusEarned: 0,
      },
      REMEDIATION: {
        label: AI_QUOTA_LIMITS.REMEDIATION.label,
        used: 0,
        limit: AI_QUOTA_LIMITS.REMEDIATION.dailyLimit,
        remaining: AI_QUOTA_LIMITS.REMEDIATION.dailyLimit,
        bonusEarned: 0,
      },
      EDITAL: {
        label: AI_QUOTA_LIMITS.EDITAL.label,
        used: 0,
        limit: AI_QUOTA_LIMITS.EDITAL.dailyLimit,
        remaining: AI_QUOTA_LIMITS.EDITAL.dailyLimit,
        bonusEarned: 0,
      },
      OCR_ESSAY: {
        label: AI_QUOTA_LIMITS.OCR_ESSAY.label,
        used: 0,
        limit: AI_QUOTA_LIMITS.OCR_ESSAY.dailyLimit,
        remaining: AI_QUOTA_LIMITS.OCR_ESSAY.dailyLimit,
        bonusEarned: 0,
      },
      OCR_QUESTION: {
        label: AI_QUOTA_LIMITS.OCR_QUESTION.label,
        used: 0,
        limit: AI_QUOTA_LIMITS.OCR_QUESTION.dailyLimit,
        remaining: AI_QUOTA_LIMITS.OCR_QUESTION.dailyLimit,
        bonusEarned: 0,
      },
    },
  };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, planTier: true, email: true },
    });

    if (!user) return defaultStatus;

    const isAdmin =
      user.role === "ADMIN" ||
      Boolean(
        user.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
      );

    defaultStatus.role = user.role;
    defaultStatus.planTier = user.planTier;
    defaultStatus.isUnlimited = Boolean(isAdmin || user.planTier === "PREMIUM");

    if (isAdmin) {
      defaultStatus.globalRemaining = 9999;
      defaultStatus.globalLimit = 9999;
      defaultStatus.canWatchRewardedAd = false;
      return defaultStatus;
    }

    // Assinantes Pro: exibe status ilimitado com teto de uso justo nos bastidores
    const isPro = user.planTier === "PREMIUM";
    if (isPro) {
      defaultStatus.globalLimit = GLOBAL_DAILY_PRO_AI_LIMIT;
      defaultStatus.canWatchRewardedAd = false;

      const today = getTodayKey();
      const usages = await prisma.aiDailyUsage.findMany({
        where: {
          userId,
          date: today,
        },
      });

      const usageMap = new Map<string, number>();
      for (const u of usages) {
        usageMap.set(u.feature, u.count);
      }

      const globalUsed = usageMap.get("ALL") ?? 0;
      defaultStatus.globalUsed = globalUsed;
      defaultStatus.globalRemaining = Math.max(0, GLOBAL_DAILY_PRO_AI_LIMIT - globalUsed);

      (Object.keys(PRO_FAIR_USE_LIMITS) as AiFeatureType[]).forEach((feature) => {
        const used = usageMap.get(feature) ?? 0;
        const limit = PRO_FAIR_USE_LIMITS[feature].dailyLimit;

        defaultStatus.features[feature] = {
          label: PRO_FAIR_USE_LIMITS[feature].label,
          used,
          limit,
          remaining: Math.max(0, limit - used),
          bonusEarned: 0,
        };
      });

      return defaultStatus;
    }

    const today = getTodayKey();
    const currentWeek = getUsagePeriodKey("OCR_ESSAY");
    const usages = await prisma.aiDailyUsage.findMany({
      where: {
        userId,
        date: { in: [today, currentWeek] },
      },
    });

    const usageMap = new Map<string, number>();
    const bonusMap = new Map<string, number>();

    for (const u of usages) {
      if (u.feature.startsWith("BONUS_")) {
        bonusMap.set(u.feature, u.count);
      } else {
        usageMap.set(u.feature, u.count);
      }
    }

    const globalUsed = usageMap.get("ALL") ?? 0;
    const globalBonus = bonusMap.get("BONUS_ALL") ?? 0;
    const effectiveGlobalLimit = GLOBAL_DAILY_AI_LIMIT + globalBonus;

    defaultStatus.globalUsed = globalUsed;
    defaultStatus.globalLimit = effectiveGlobalLimit;
    defaultStatus.globalRemaining = Math.max(0, effectiveGlobalLimit - globalUsed);
    defaultStatus.rewardedBonusToday = globalBonus;

    const simuladoBonus = bonusMap.get("BONUS_SIMULADO") ?? 0;
    defaultStatus.canWatchRewardedAd = simuladoBonus < MAX_DAILY_REWARDED_ADS;

    (Object.keys(AI_QUOTA_LIMITS) as AiFeatureType[]).forEach((feature) => {
      const used = usageMap.get(feature) ?? 0;
      const bonusEarned = bonusMap.get(`BONUS_${feature}`) ?? 0;
      const limit = AI_QUOTA_LIMITS[feature].dailyLimit + bonusEarned;

      defaultStatus.features[feature] = {
        label: AI_QUOTA_LIMITS[feature].label,
        used,
        limit,
        remaining: Math.max(0, limit - used),
        bonusEarned,
      };
    });

    return defaultStatus;
  } catch (err) {
    console.warn("[getUserQuotaStatus] Erro ao obter status de cota:", err);
    return defaultStatus;
  }
}

/**
 * Concede +1 bônus de cota diária ao usuário após assistir a um anúncio em vídeo patrocinado.
 */
export async function addRewardedAdBonus(
  userId: string,
  feature: AiFeatureType = "SIMULADO",
): Promise<{ success: boolean; newLimit?: number; message?: string }> {
  try {
    const today = getTodayKey();
    const dateKey = getUsagePeriodKey(feature);
    const bonusFeatureKey = `BONUS_${feature}`;

    const currentBonus = await prisma.aiDailyUsage.findUnique({
      where: {
        userId_date_feature: {
          userId,
          date: dateKey,
          feature: bonusFeatureKey,
        },
      },
      select: { count: true },
    });

    const count = currentBonus?.count ?? 0;
    if (count >= MAX_DAILY_REWARDED_ADS) {
      return {
        success: false,
        message: `Você já atingiu o limite de ${MAX_DAILY_REWARDED_ADS} recompensas diárias por vídeo hoje.`,
      };
    }

    await prisma.$transaction([
      prisma.aiDailyUsage.upsert({
        where: {
          userId_date_feature: {
            userId,
            date: dateKey,
            feature: bonusFeatureKey,
          },
        },
        create: {
          userId,
          date: dateKey,
          feature: bonusFeatureKey,
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
            feature: "BONUS_ALL",
          },
        },
        create: {
          userId,
          date: today,
          feature: "BONUS_ALL",
          count: 1,
        },
        update: {
          count: { increment: 1 },
        },
      }),
    ]);


    const baseLimit = AI_QUOTA_LIMITS[feature]?.dailyLimit ?? 2;
    const newLimit = baseLimit + count + 1;

    return {
      success: true,
      newLimit,
      message: `Parabéns! +1 ${AI_QUOTA_LIMITS[feature]?.label || "Cota"} liberado com sucesso para hoje!`,
    };
  } catch (err) {
    console.error("[addRewardedAdBonus] Erro ao conceder bônus de anúncio:", err);
    return {
      success: false,
      message: "Falha ao processar recompensa do vídeo patrocinado.",
    };
  }
}

