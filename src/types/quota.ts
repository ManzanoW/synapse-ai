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
