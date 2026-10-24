"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Check } from "lucide-react";

const CONSENT_STORAGE_KEY = "synapse_lgpd_consent_v1";

export function LgpdConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!existing) {
        setVisible(true);
      }
    } catch {
      // Caso o navegador bloqueie o acesso ao localStorage, não exibe de forma intrusiva
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
          accepted: true,
          timestamp: new Date().toISOString(),
          policyVersion: "2026.10",
          law: "Lei nº 13.709/2018 (LGPD)",
        }),
      );
    } catch {
      // Ignora erro de escrita caso ocorra
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de Privacidade e Proteção de Dados (LGPD)"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#090d16]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-all"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Transparência & Proteção de Dados (LGPD)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Utilizamos apenas cookies estritamente necessários para autenticação segura e armazenamento local (
              <code className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">localStorage</code>) para seus mapas mentais e preferências de leitura. Você pode exportar ou eliminar 100% dos seus dados a qualquer momento no seu Perfil. Consulte nossa{" "}
              <Link
                href="/privacy"
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Política de Privacidade
              </Link>{" "}
              e{" "}
              <Link
                href="/terms"
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Termos de Uso
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleAccept}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Check size={14} />
            <span>Ciente e Concordar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
