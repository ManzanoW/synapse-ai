"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, Download, X, Sparkles } from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

export function DashboardPwaBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      // 1. Checa se já está em modo standalone (PWA já instalado)
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      if (isStandalone) {
        setIsVisible(false);
        return;
      }

      // 2. Checa se o usuário dispensou o aviso
      const dismissed = localStorage.getItem("synapse_pwa_banner_dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(false);
    }
  }, []);

  const handleOpenInstall = () => {
    triggerHaptic("medium");
    window.dispatchEvent(new CustomEvent("open-pwa-install"));
  };

  const handleDismiss = () => {
    triggerHaptic("light");
    setIsVisible(false);
    try {
      localStorage.setItem("synapse_pwa_banner_dismissed", "true");
    } catch {}
  };

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-cyan-950/20 to-slate-900/90 p-3.5 sm:p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-200 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0">
          <Smartphone size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Estude no Celular sem Abas do Navegador
            </h4>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              PWA
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Instale o Synapse na tela inicial do seu celular para foco total em tela cheia e modo offline.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={handleOpenInstall}
          className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/50 flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Download size={13} />
          <span>Instalar App</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
          title="Dispensar aviso"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
