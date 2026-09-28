// src/config/ads.ts

export type AdProvider =
  | "SPONSOR_SIMULATOR"
  | "GOOGLE_ADSENSE"
  | "GOOGLE_IMA"
  | "CUSTOM_VIDEO";

export interface AdConfiguration {
  enabled: boolean;
  provider: AdProvider;
  adSenseClientId?: string;
  adSenseRewardedSlotId?: string;
  imaVastTagUrl?: string;
  customVideoUrl?: string;
  fallbackTimeoutSeconds: number;
}

/**
 * Retorna a configuração consolidada de anúncios a partir das variáveis de ambiente.
 */
export function getAdConfiguration(): AdConfiguration {
  const isEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED !== "false";
  const rawProvider = (process.env.NEXT_PUBLIC_AD_PROVIDER || "SPONSOR_SIMULATOR").toUpperCase();

  let provider: AdProvider = "SPONSOR_SIMULATOR";
  if (rawProvider === "GOOGLE_ADSENSE") {
    provider = "GOOGLE_ADSENSE";
  } else if (rawProvider === "GOOGLE_IMA") {
    provider = "GOOGLE_IMA";
  } else if (rawProvider === "CUSTOM_VIDEO") {
    provider = "CUSTOM_VIDEO";
  }

  return {
    enabled: isEnabled,
    provider,
    adSenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "",
    adSenseRewardedSlotId: process.env.NEXT_PUBLIC_ADSENSE_REWARDED_SLOT_ID || "",
    imaVastTagUrl: process.env.NEXT_PUBLIC_IMA_VAST_TAG_URL || "",
    customVideoUrl: process.env.NEXT_PUBLIC_CUSTOM_AD_VIDEO_URL || "",
    fallbackTimeoutSeconds: 15,
  };
}

/**
 * Verifica se uma rede programática real externa está configurada e ativa.
 */
export function isRealAdNetworkConfigured(): boolean {
  const config = getAdConfiguration();
  if (!config.enabled) return false;

  if (config.provider === "GOOGLE_ADSENSE" && Boolean(config.adSenseClientId)) {
    return true;
  }
  if (config.provider === "GOOGLE_IMA" && Boolean(config.imaVastTagUrl)) {
    return true;
  }
  if (config.provider === "CUSTOM_VIDEO" && Boolean(config.customVideoUrl)) {
    return true;
  }

  return false;
}
