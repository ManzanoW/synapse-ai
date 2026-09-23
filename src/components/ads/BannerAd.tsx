// src/components/ads/BannerAd.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { getAdConfiguration } from "@/config/ads";
import { loadGoogleAdSenseSdk } from "@/lib/ad-sdk-loader";
import { Sparkles, Crown } from "lucide-react";
import Link from "next/link";

interface BannerAdProps {
  slotId?: string;
  format?: "auto" | "horizontal" | "rectangle";
  className?: string;
  isUserPro?: boolean;
}

export function BannerAd({
  slotId,
  format = "horizontal",
  className = "",
  isUserPro = false,
}: BannerAdProps) {
  const config = getAdConfiguration();
  const adRef = useRef<HTMLModElement | null>(null);
  const isPushedRef = useRef(false);

  // Usuários Pro são 100% livres de anúncios
  if (isUserPro) return null;
  if (!config.enabled) return null;

  useEffect(() => {
    if (config.provider === "GOOGLE_ADSENSE" && config.adSenseClientId && slotId) {
      loadGoogleAdSenseSdk().then((loaded) => {
        if (loaded && !isPushedRef.current && window.adsbygoogle) {
          try {
            window.adsbygoogle.push({});
            isPushedRef.current = true;
          } catch (e) {
            console.warn("[BannerAd] Erro ao renderizar anúncio AdSense:", e);
          }
        }
      });
    }
  }, [config.provider, config.adSenseClientId, slotId]);

  // Se Google AdSense estiver ativo com slot configurado
  if (config.provider === "GOOGLE_ADSENSE" && config.adSenseClientId && slotId) {
    return (
      <div className={`overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-2 text-center ${className}`}>
        <ins
          ref={adRef}
          className="adsbygoogle block"
          data-ad-client={config.adSenseClientId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Banner padrão elegante: Dica de Concurso & Patrocínio Synapse
  return (
    <div
      className={`rounded-2xl border border-indigo-500/20 bg-linear-to-r from-slate-950 via-indigo-950/20 to-slate-950 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
          <Sparkles size={16} />
        </div>
        <div>
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>Dica de Estudo Ativa</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Patrocinado
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Mantenha a consistência: 30 minutos de resolução diária garantem retenção de longo prazo.
          </p>
        </div>
      </div>

      <Link
        href="/pricing"
        className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1.5"
      >
        <Crown size={12} className="text-amber-400" />
        <span>Seja Synapse Pro</span>
      </Link>
    </div>
  );
}
