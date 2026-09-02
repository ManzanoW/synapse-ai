"use client";

import React from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  X,
  Clock,
  ArrowRight,
} from "lucide-react";

export interface RebalanceComparisonItem {
  subjectId: string;
  subjectName: string;
  accuracyPercentage: number;
  previousWeeklyMinutes: number;
  newWeeklyMinutes: number;
  diffMinutes: number;
}

interface RebalanceImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparisons: RebalanceComparisonItem[];
  totalWeeklyHours: number;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function RebalanceImpactModal({
  isOpen,
  onClose,
  comparisons = [],
  totalWeeklyHours,
}: RebalanceImpactModalProps) {
  if (!isOpen) return null;

  const totalAdjustedSubjects = comparisons.filter((c) => c.diffMinutes !== 0).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#090d16] border border-violet-500/30 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden text-slate-100">
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-600/15 blur-3xl" />

        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Resumo da Calibragem Semanal
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalAdjustedSubjects} disciplina(s) ajustada(s) para meta de {totalWeeklyHours}h/semana.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabela Comparativa Antes vs Depois */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 relative z-10">
          {comparisons.map((item) => {
            const isIncrease = item.diffMinutes > 0;
            const isDecrease = item.diffMinutes < 0;

            return (
              <div
                key={item.subjectId}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isIncrease
                    ? "bg-violet-950/20 border-violet-500/30"
                    : isDecrease
                    ? "bg-slate-950/60 border-white/5"
                    : "bg-white/[0.02] border-white/5 opacity-70"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white truncate">
                      {item.subjectName}
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/5">
                      {item.accuracyPercentage}% acertos
                    </span>
                  </div>

                  {/* Comparativo de minutos */}
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                    <span>{formatMinutes(item.previousWeeklyMinutes)}</span>
                    <ArrowRight size={10} className="text-slate-600" />
                    <strong className="text-slate-200">
                      {formatMinutes(item.newWeeklyMinutes)}
                    </strong>
                  </div>
                </div>

                {/* Badge de variação (+ / - / =) */}
                <div className="shrink-0">
                  {isIncrease ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                      <TrendingUp size={12} />
                      +{item.diffMinutes} min
                    </span>
                  ) : isDecrease ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-extrabold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-xl">
                      <TrendingDown size={12} />
                      {item.diffMinutes} min
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-xl">
                      <Minus size={12} />
                      Estável
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé Informativo e Botão */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock size={13} className="text-violet-400" />
            <span>Grade recalculada com sucesso</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-violet-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 size={14} />
            <span>Entendido</span>
          </button>
        </div>
      </div>
    </div>
  );
}
