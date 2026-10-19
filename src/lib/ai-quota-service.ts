// src/lib/ai-quota-service.ts

import { prisma } from "@/lib/prisma";
import type {
  AiFeatureType,
  QuotaCheckResult,
  UserQuotaStatus,
} from "@/types/quota";

export type { AiFeatureType, QuotaCheckResult, UserQuotaStatus };

import { isUserPro, isUserElite } from "@/lib/subscription";
export { isUserPro, isUserElite };

// Limites diários para usuários no plano gratuito (Freemium estratégico de alta conversão)
export const AI_QUOTA_LIMITS: Record<
  AiFeatureType,
  { label: string; dailyLimit: number; isWeekly?: boolean; isFreeUnlimited?: boolean }
> = {
  SIMULADO: { label: "Simulados com IA", dailyLimit: 1 },
  ESSAY: { label: "Correções de Redação", dailyLimit: 1, isWeekly: true },
  FLASHCARD: { label: "Baralhos de Flashcards", dailyLimit: 9999, isFreeUnlimited: true },
  MINDMAP: { label: "Mapas Mentais", dailyLimit: 1, isWeekly: true },
  REMEDIATION: { label: "Remediações no Caderno de Erros", dailyLimit: 2 },
  EDITAL: { label: "Personalização de Edital", dailyLimit: 9999, isFreeUnlimited: true },
  OCR_ESSAY: { label: "OCR de Foto Manuscrita", dailyLimit: 1 },
  OCR_QUESTION: { label: "Scanner OCR de Questões", dailyLimit: 2 },
};

// Limites diários de Uso Justo (Fair Use) para assinantes do plano Pro.
// Franquia generosa de alta capacidade para concurseiros de alta performance,
// prevenindo abusos, loops e compartilhamento excessivo de contas.
export const PRO_FAIR_USE_LIMITS: Record<
  AiFeatureType,
  { label: string; dailyLimit: number; isWeekly?: boolean; isUnlimited?: boolean }
> = {
  SIMULADO: { label: "Simulados com IA", dailyLimit: 5 },
  ESSAY: { label: "Correções de Redação", dailyLimit: 3 },
  FLASHCARD: { label: "Baralhos de Flashcards", dailyLimit: 9999, isUnlimited: true },
  MINDMAP: { label: "Mapas Mentais", dailyLimit: 5 },
  REMEDIATION: { label: "Remediação e Mnemônicos", dailyLimit: 30 },
  EDITAL: { label: "Personalização de Edital", dailyLimit: 9999, isUnlimited: true },
  OCR_ESSAY: { label: "OCR de Foto Manuscrita", dailyLimit: 2 },
  OCR_QUESTION: { label: "Scanner OCR de Questões", dailyLimit: 10 },
};

// Limites diários de Uso Justo para assinantes do plano Synapse Elite 👑 (120 Sinapses/dia + Prioridade Máxima)
export const ELITE_FAIR_USE_LIMITS: Record<
  AiFeatureType,
  { label: string; dailyLimit: number; isWeekly?: boolean; isUnlimited?: boolean }
> = {
  SIMULADO: { label: "Simulados com IA", dailyLimit: 15 },
  ESSAY: { label: "Correções de Redação", dailyLimit: 6 },
  FLASHCARD: { label: "Baralhos de Flashcards", dailyLimit: 9999, isUnlimited: true },
  MINDMAP: { label: "Mapas Mentais", dailyLimit: 15 },
  REMEDIATION: { label: "Remediação e Mnemônicos", dailyLimit: 60 },
  EDITAL: { label: "Personalização de Edital", dailyLimit: 9999, isUnlimited: true },
  OCR_ESSAY: { label: "OCR de Foto Manuscrita", dailyLimit: 5 },
  OCR_QUESTION: { label: "Scanner OCR de Questões", dailyLimit: 25 },
};

// Limites adicionais Pro / Elite
export const PRO_AUDIO_MINUTES_DAILY = 120; // Flashcards em Áudio Neural Hands-Free (até 2h diárias)
export const ELITE_AUDIO_MINUTES_DAILY = 360; // Áudio-Aulas & Flashcards Hands-Free no Elite (até 6h diárias)

// Teto global diário para somatório de todas as requisições de IA no plano gratuito (10 Sinapses)
export const GLOBAL_DAILY_AI_LIMIT = 10;

// Teto global diário para somatório de requisições de IA no plano Pro (Fair Use)
export const GLOBAL_DAILY_PRO_AI_LIMIT = 60;

// Teto global diário para somatório de requisições de IA no plano Synapse Elite 👑 (120 Sinapses/dia)
export const GLOBAL_DAILY_ELITE_AI_LIMIT = 120;

// Trava anti-loop e anti-bot por minuto por usuário
export const MAX_REQUESTS_PER_MINUTE_PER_USER = 10;

// Máximo de anúncios de vídeo recompensados permitidos por dia por usuário (total global)
export const MAX_DAILY_REWARDED_ADS = 2;

// Máximo de bônus por anúncio para a mesma funcionalidade por dia
export const MAX_REWARDED_BONUS_PER_FEATURE = 1;

// Máximo de recargas diárias de Energia Sináptica por Mérito de Estudo (+1⚡ cada)
export const MAX_DAILY_MERIT_BONUS = 2;

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

export function getTodayKey(): string {
  // Retorna YYYY-MM-DD com base no horário de Brasília (UTC-3)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const brDate = new Date(utc - 3 * 3600000);
  return brDate.toISOString().slice(0, 10);
}

export function getUsagePeriodKey(feature: AiFeatureType): string {
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
    const isPaidTier = user?.planTier === "PREMIUM" || user?.planTier === "ELITE";
    if (!checkRateLimitPerMinute(userId)) {
      return {
        allowed: false,
        remaining: 0,
        limit: MAX_REQUESTS_PER_MINUTE_PER_USER,
        used: MAX_REQUESTS_PER_MINUTE_PER_USER,
        isUnlimited: isPaidTier,
        resetsAt: "em 1 minuto",
        message:
          "Muitas requisições em sequência. Aguarde alguns segundos antes de solicitar uma nova geração de IA.",
        canWatchRewardedAd: false,
      };
    }

    // 2. Assinantes Pro (PREMIUM) ou Synapse Elite (ELITE): Política de Uso Justo
    if (isPaidTier) {
      const isElite = user?.planTier === "ELITE";
      const today = getTodayKey();
      const activeLimitsTable = isElite ? ELITE_FAIR_USE_LIMITS : PRO_FAIR_USE_LIMITS;
      const globalDailyCap = isElite ? GLOBAL_DAILY_ELITE_AI_LIMIT : GLOBAL_DAILY_PRO_AI_LIMIT;
      const planLabel = isElite ? "Synapse Elite 👑" : "Synapse Pro";

      const proFeatureConfig = activeLimitsTable[feature] || {
        label: feature,
        dailyLimit: isElite ? 60 : 30,
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

      // Checa teto global do Pro (60/dia) ou Elite (120/dia)
      if (usedGlobal >= globalDailyCap) {
        return {
          allowed: false,
          remaining: 0,
          limit: globalDailyCap,
          used: usedGlobal,
          isUnlimited: true,
          resetsAt: "à meia-noite",
          message: `Você atingiu a franquia diária de alto rendimento do ${planLabel} (${globalDailyCap} requisições/dia). Seu limite será renovado à meia-noite.`,
          canWatchRewardedAd: false,
        };
      }

      // Checa teto da funcionalidade específica no Pro / Elite
      if (!proFeatureConfig.isUnlimited && usedFeature >= proFeatureConfig.dailyLimit) {
        return {
          allowed: false,
          remaining: 0,
          limit: proFeatureConfig.dailyLimit,
          used: usedFeature,
          isUnlimited: true,
          resetsAt: "à meia-noite",
          message: `Você atingiu o limite diário de uso justo para ${proFeatureConfig.label} (${proFeatureConfig.dailyLimit}/dia no ${planLabel}). Seu limite será renovado à meia-noite.`,
          canWatchRewardedAd: false,
        };
      }

      const remaining = proFeatureConfig.isUnlimited
        ? 9999
        : Math.max(0, proFeatureConfig.dailyLimit - usedFeature);
      return {
        allowed: true,
        remaining,
        limit: proFeatureConfig.dailyLimit,
        used: usedFeature,
        isUnlimited: true,
        resetsAt: isElite ? "Capacidade Máxima Elite (120/dia)" : "Alta Capacidade (Uso Justo)",
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
    const canWatchRewardedAd =
      bonusCount < MAX_REWARDED_BONUS_PER_FEATURE &&
      bonusGlobalCount < MAX_DAILY_REWARDED_ADS;

    // 1. Checa limite global
    if (usedGlobal >= effectiveGlobalLimit) {
      return {
        allowed: false,
        remaining: 0,
        limit: effectiveGlobalLimit,
        used: usedGlobal,
        isUnlimited: false,
        message: `Você atingiu seu limite diário gratuito de IA (${usedGlobal}/${effectiveGlobalLimit}). Conheça o Synapse Pro para ter alta capacidade diária.`,
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
          ? `Você atingiu seu limite gratuito semanal de ${featureConfig.label} (${usedFeature}/${effectiveFeatureLimit}). Desbloqueie com anúncio ou assine o Synapse Pro.`
          : `Você atingiu sua cota diária gratuita de ${featureConfig.label} (${usedFeature}/${effectiveFeatureLimit}). Conheça o Synapse Pro para alta capacidade diária.`,
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
    const isPaidTier = user.planTier === "PREMIUM" || user.planTier === "ELITE";
    defaultStatus.isUnlimited = Boolean(isAdmin || isPaidTier);

    if (isAdmin) {
      defaultStatus.globalRemaining = 9999;
      defaultStatus.globalLimit = 9999;
      defaultStatus.canWatchRewardedAd = false;
      return defaultStatus;
    }

    // Assinantes Pro (60/dia) ou Elite (120/dia): exibe status ilimitado com teto de uso justo nos bastidores
    if (isPaidTier) {
      const isElite = user.planTier === "ELITE";
      const globalDailyCap = isElite ? GLOBAL_DAILY_ELITE_AI_LIMIT : GLOBAL_DAILY_PRO_AI_LIMIT;
      const activeLimitsTable = isElite ? ELITE_FAIR_USE_LIMITS : PRO_FAIR_USE_LIMITS;

      defaultStatus.globalLimit = globalDailyCap;
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
      defaultStatus.globalRemaining = Math.max(0, globalDailyCap - globalUsed);

      (Object.keys(activeLimitsTable) as AiFeatureType[]).forEach((feature) => {
        const used = usageMap.get(feature) ?? 0;
        const limit = activeLimitsTable[feature].dailyLimit;

        defaultStatus.features[feature] = {
          label: activeLimitsTable[feature].label,
          used,
          limit,
          remaining: Math.max(0, limit - used),
          bonusEarned: 0,
        };
      });

      return defaultStatus;
    }

    const today = getTodayKey();
    const essayWeek = getUsagePeriodKey("ESSAY");
    const mindmapWeek = getUsagePeriodKey("MINDMAP");
    const datesToQuery = Array.from(new Set([today, essayWeek, mindmapWeek]));

    const usages = await prisma.aiDailyUsage.findMany({
      where: {
        userId,
        date: { in: datesToQuery },
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
    const meritBonusToday = bonusMap.get("BONUS_MERIT") ?? 0;
    const effectiveGlobalLimit = GLOBAL_DAILY_AI_LIMIT + globalBonus;

    defaultStatus.globalUsed = globalUsed;
    defaultStatus.globalLimit = effectiveGlobalLimit;
    defaultStatus.globalRemaining = Math.max(0, effectiveGlobalLimit - globalUsed);
    defaultStatus.rewardedBonusToday = Math.max(0, globalBonus - meritBonusToday);
    defaultStatus.meritBonusToday = meritBonusToday;
    defaultStatus.canEarnMeritBonus = meritBonusToday < MAX_DAILY_MERIT_BONUS;
    defaultStatus.canWatchRewardedAd = defaultStatus.rewardedBonusToday < MAX_DAILY_REWARDED_ADS;

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

    const [currentBonus, currentGlobalBonus] = await Promise.all([
      prisma.aiDailyUsage.findUnique({
        where: {
          userId_date_feature: {
            userId,
            date: dateKey,
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

    const count = currentBonus?.count ?? 0;
    const globalCount = currentGlobalBonus?.count ?? 0;

    if (count >= MAX_REWARDED_BONUS_PER_FEATURE) {
      return {
        success: false,
        message: `Você já resgatou o bônus diário via anúncio para ${AI_QUOTA_LIMITS[feature]?.label || "esta funcionalidade"} hoje (+1 bônus).`,
      };
    }

    if (globalCount >= MAX_DAILY_REWARDED_ADS) {
      return {
        success: false,
        message: `Você já atingiu o limite global de ${MAX_DAILY_REWARDED_ADS} anúncios recompensados hoje. Conheça o Synapse Pro para ter alta capacidade diária.`,
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

/**
 * Concede +1⚡ de Energia Sináptica por Mérito de Estudo (Pomodoro Focus ou FSRS Flashcards Streak).
 * Teto diário de segurança de 2 recargas por dia.
 */
export async function addStudyMeritBonus(
  userId: string,
  reason: "POMODORO_FOCUS" | "FSRS_STREAK",
): Promise<{ success: boolean; earnedEnergy?: number; message?: string }> {
  try {
    const today = getTodayKey();

    const currentMerit = await prisma.aiDailyUsage.findUnique({
      where: {
        userId_date_feature: {
          userId,
          date: today,
          feature: "BONUS_MERIT",
        },
      },
      select: { count: true },
    });

    const count = currentMerit?.count ?? 0;

    if (count >= MAX_DAILY_MERIT_BONUS) {
      return {
        success: false,
        message: `Você já atingiu o teto diário de ${MAX_DAILY_MERIT_BONUS} recargas por mérito hoje (+2⚡). Mantenha o foco em seus estudos!`,
      };
    }

    await prisma.$transaction([
      prisma.aiDailyUsage.upsert({
        where: {
          userId_date_feature: {
            userId,
            date: today,
            feature: "BONUS_MERIT",
          },
        },
        create: {
          userId,
          date: today,
          feature: "BONUS_MERIT",
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

    const reasonLabel =
      reason === "POMODORO_FOCUS"
        ? "pelo bloco de 25min de foco no Pomodoro"
        : "pela sessão ativa concluída no FSRS";

    return {
      success: true,
      earnedEnergy: 1,
      message: `Mérito cognitivo reconhecido! +1⚡ Energia Sináptica creditada ${reasonLabel}!`,
    };
  } catch (err) {
    console.error("[addStudyMeritBonus] Erro ao conceder bônus por mérito:", err);
    return {
      success: false,
      message: "Falha ao processar recarga por mérito de estudo.",
    };
  }
}

/**
 * Concede +2⚡ de Energia Sináptica de boas-vindas na conclusão do Onboarding Inicial
 */
export async function addOnboardingActivationBonus(
  userId: string,
): Promise<{
  success: boolean;
  earnedEnergy: number;
  message: string;
}> {
  try {
    const today = new Date().toISOString().slice(0, 10);

    await Promise.all([
      prisma.aiDailyUsage.upsert({
        where: {
          userId_date_feature: {
            userId,
            date: today,
            feature: "BONUS_ONBOARDING",
          },
        },
        create: {
          userId,
          date: today,
          feature: "BONUS_ONBOARDING",
          count: 2,
        },
        update: {
          count: { increment: 2 },
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
          count: 2,
        },
        update: {
          count: { increment: 2 },
        },
      }),
    ]);

    return {
      success: true,
      earnedEnergy: 2,
      message: "🎉 Ativação concluída! Você ganhou +2⚡ Sinapses de Energia bônus para turbinar seus estudos!",
    };
  } catch (err) {
    console.error("[addOnboardingActivationBonus] Erro ao conceder bônus de ativação:", err);
    return {
      success: false,
      earnedEnergy: 0,
      message: "Falha ao creditar bônus de ativação.",
    };
  }
}

export interface AiValueMetrics {
  totalMinutesSaved: number;
  hoursSavedFormatted: string;
  simuladosCount: number;
  essaysCount: number;
  remediationsCount: number;
  mindmapsCount: number;
  ocrCount: number;
  blindspotsResolved: number;
  speedupFactor: string;
  isPro: boolean;
}

/**
 * Calcula o ROI de tempo e valor cognitivo gerado pela inteligência artificial nos últimos 7 dias.
 */
export async function getAiValueMetrics(userId: string): Promise<AiValueMetrics> {
  const defaultMetrics: AiValueMetrics = {
    totalMinutesSaved: 110,
    hoursSavedFormatted: "1h 50min",
    simuladosCount: 1,
    essaysCount: 0,
    remediationsCount: 2,
    mindmapsCount: 1,
    ocrCount: 0,
    blindspotsResolved: 2,
    speedupFactor: "4.2x",
    isPro: false,
  };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planTier: true, role: true },
    });
    const isPro = user?.planTier === "PREMIUM" || user?.role === "ADMIN";

    const now = new Date();
    const past7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const utc = d.getTime() + d.getTimezoneOffset() * 60000;
      const br = new Date(utc - 3 * 3600000);
      return br.toISOString().slice(0, 10);
    });

    const usages = await prisma.aiDailyUsage.findMany({
      where: {
        userId,
        date: { in: past7Days },
      },
    });

    let simuladosCount = 0;
    let essaysCount = 0;
    let remediationsCount = 0;
    let mindmapsCount = 0;
    let ocrCount = 0;

    for (const u of usages) {
      if (u.feature === "SIMULADO") simuladosCount += u.count;
      else if (u.feature === "ESSAY") essaysCount += u.count;
      else if (u.feature === "REMEDIATION") remediationsCount += u.count;
      else if (u.feature === "MINDMAP") mindmapsCount += u.count;
      else if (u.feature === "OCR_ESSAY" || u.feature === "OCR_QUESTION") ocrCount += u.count;
    }

    const totalMinutesSaved = Math.max(
      60,
      simuladosCount * 45 +
        essaysCount * 120 +
        remediationsCount * 15 +
        mindmapsCount * 30 +
        ocrCount * 20,
    );

    const hours = Math.floor(totalMinutesSaved / 60);
    const mins = totalMinutesSaved % 60;
    const hoursSavedFormatted = `${hours}h ${mins > 0 ? `${mins}min` : ""}`.trim();

    const blindspotsResolved = Math.max(remediationsCount, 1);
    const speedupFactor = isPro ? "6.8x" : "4.4x";

    return {
      totalMinutesSaved,
      hoursSavedFormatted,
      simuladosCount,
      essaysCount,
      remediationsCount,
      mindmapsCount,
      ocrCount,
      blindspotsResolved,
      speedupFactor,
      isPro,
    };
  } catch (err) {
    console.warn("[getAiValueMetrics] Erro ao calcular métricas de valor:", err);
    return defaultMetrics;
  }
}

