"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Sparkles, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import {
  checkRebalanceNeedsAction,
  autoRebalanceFromPerformanceAction,
  RebalanceAlertStatus,
} from "@/actions/adaptive-actions";

interface AdaptiveRebalanceBannerProps {
  onRebalanceApplied?: () => void;
}

export function AdaptiveRebalanceBanner({
  onRebalanceApplied,
}: AdaptiveRebalanceBannerProps) {
  const [status, setStatus] = useState<RebalanceAlertStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    checkRebalanceNeedsAction().then((res) => {
      if (res.success && res.data) {
        setStatus(res.data);
      }
    });
  }, []);

  if (dismissed || !status || !status.needsRebalance) {
    return null;
  }

  const handleApplyRebalance = () => {
    startTransition(async () => {
      const res = await autoRebalanceFromPerformanceAction();
      if (res.success) {
        setApplied(true);
        setTimeout(() => {
          if (onRebalanceApplied) onRebalanceApplied();
          setDismissed(true);
        }, 1500);
      }
    });
  };

  const firstCrit = status.criticalSubjects[0];
  const otherCount = status.criticalSubjects.length - 1;

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-[#0d1020] to-indigo-950/40 p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-all">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet-600/15 blur-2xl" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Lado Esquerdo: Ícone e Texto Informativo */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-2.5 text-violet-400 shrink-0 shadow-inner">
            <Sparkles size={20} className="animate-pulse" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-violet-300">
                Otimização Preditiva Disponível
              </span>
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-300 flex items-center gap-1">
                <AlertTriangle size={10} />
                Déficit Detectado
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Sua retenção em <strong className="text-white">{firstCrit.name}</strong> está em{" "}
              <strong className="text-rose-400">{firstCrit.accuracy}%</strong>
              {otherCount > 0 && ` (+${otherCount} outra disciplina)`}. A IA sugere calibrar a
              distribuição de horas semanais para reforçar estes tópicos.
            </p>
          </div>
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <button
            onClick={() => setDismissed(true)}
            disabled={isPending || applied}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Ignorar
          </button>

          <button
            onClick={handleApplyRebalance}
            disabled={isPending || applied}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {applied ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-300" />
                <span>Cronograma Rebalanceado!</span>
              </>
            ) : isPending ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Recalibrando...</span>
              </>
            ) : (
              <>
                <span>Calibrar Semana com IA</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
