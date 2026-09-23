export type AiFeatureType =
  | "SIMULADO"
  | "ESSAY"
  | "FLASHCARD"
  | "MINDMAP"
  | "REMEDIATION"
  | "EDITAL";

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  isUnlimited: boolean;
  message?: string;
  resetsAt: string;
  canWatchRewardedAd?: boolean;
}

export interface UserQuotaStatus {
  isUnlimited: boolean;
  role: string;
  planTier: string;
  globalUsed: number;
  globalLimit: number;
  globalRemaining: number;
  rewardedBonusToday?: number;
  canWatchRewardedAd?: boolean;
  features: Record<
    AiFeatureType,
    {
      label: string;
      used: number;
      limit: number;
      remaining: number;
      bonusEarned?: number;
    }
  >;
}
