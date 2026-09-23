"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Zap, Info, ChevronRight, X } from "lucide-react";
import { getAiQuotaStatusAction } from "@/actions/quota-actions";
import { UserQuotaStatus, GLOBAL_DAILY_AI_LIMIT } from "@/lib/ai-quota-service";

export function AiQuotaBadge() {
  const [quota, setQuota] = useState<UserQuotaStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getAiQuotaStatusAction().then((res) => {
      if (isMounted && res.success && res.data) {
        setQuota(res.data);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !quota) return null;

  if (quota.isUnlimited) {
    return (
      <div className="px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5 text-violet-300 font-bold">
          <Sparkles size={11} className="text-violet-400" />
          <span>IA Synapse: Ilimitada</span>
        </div>
        <span className="px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-200 font-mono text-[9px] font-black uppercase">
          {quota.role === "ADMIN" ? "ADMIN" : "PRO"}
        </span>
      </div>
    );
  }

  const percentUsed = Math.min(
    100,
    Math.round((quota.globalUsed / quota.globalLimit) * 100),
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-violet-500/30 transition-all text-left group cursor-pointer"
        title="Clique para ver detalhes das cotas diárias de teste"
      >
        <div className="flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold group-hover:text-violet-300 transition-colors">
            <Sparkles size={11} className="text-violet-400" />
            <span>Cota Diária de IA</span>
          </span>
          <span className="font-mono text-slate-400 text-[10px] font-bold">
            {quota.globalUsed}/{quota.globalLimit}
          </span>
        </div>

        {/* Barra de progresso sutil */}
        <div className="h-1 w-full bg-slate-950 rounded-full mt-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentUsed > 80
                ? "bg-rose-500"
                : percentUsed > 50
                  ? "bg-amber-400"
                  : "bg-violet-500"
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </button>

      {/* Modal / Popover com Detalhamento das Cotas */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 p-3.5 rounded-2xl bg-slate-900/95 border border-white/15 backdrop-blur-2xl shadow-2xl z-50 text-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Cotas de Teste da IA</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X size={12} />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-snug">
            Limites diários para o período de testes e garantia de estabilidade da plataforma. Renovam à meia-noite (Brasília).
          </p>

          <div className="space-y-1.5 text-[10px]">
            {Object.entries(quota.features).map(([key, item]) => (
              <div
                key={key}
                className="flex items-center justify-between py-0.5 border-b border-white/5"
              >
                <span className="text-slate-300">{item.label}</span>
                <span className="font-mono font-bold text-slate-400">
                  {item.used}/{item.limit}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>Total geral de hoje:</span>
            <span className="font-bold text-slate-300">
              {quota.globalUsed}/{GLOBAL_DAILY_AI_LIMIT} requisições
            </span>
          </div>

          <div className="pt-2 border-t border-white/10">
            <Link
              href="/pricing"
              onClick={() => setIsOpen(false)}
              className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-violet-950/50 transition-all cursor-pointer"
            >
              <Sparkles size={12} className="text-amber-300 fill-amber-300" />
              <span>Ver Vantagens do Premium</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
