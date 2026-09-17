"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sliders,
  Check,
  ArrowRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  X,
  Calendar,
} from "lucide-react";
import confetti from "canvas-confetti";
import { RebalanceComparisonItem } from "@/actions/adaptive-actions";

interface AdaptiveRebalanceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: RebalanceComparisonItem[];
  totalWeeklyHours?: number;
}

export function AdaptiveRebalanceComparisonModal({
  isOpen,
  onClose,
  comparison,
  totalWeeklyHours = 10,
}: AdaptiveRebalanceComparisonModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#06b6d4", "#10b981", "#a855f7"],
        });
      } catch {
        // Ignora caso confetti não esteja disponível no ambiente
      }
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const reinforcements = comparison.filter((c) => c.diffMinutes > 0);
  const reductions = comparison.filter((c) => c.diffMinutes < 0);
  const maintained = comparison.filter((c) => c.diffMinutes === 0);

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop escuro com blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#02050e]/80 backdrop-blur-md"
        />

        {/* Card do Modal */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
          className="relative w-full max-w-2xl bg-gradient-to-b from-[#0e1529] via-[#090d1a] to-[#04060d] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden z-10 space-y-6 max-h-[90vh] flex flex-col"
        >
          {/* Luz de destaque decorativa */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-[90px]" />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles size={13} className="text-cyan-400" />
                <span>Rebalanceador Adaptativo Aplicado</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Cronograma Calibrado com Sucesso! 🎯
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Os minutos semanais foram redistribuídos matematicamente para
                sanar déficits críticos e consolidar disciplinas avançadas.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Resumo Rápido */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                ⚡ Reforço
              </span>
              <span className="text-lg font-black text-rose-300 font-mono">
                {reinforcements.length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                +25% tempo
              </span>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                🎯 Otimizadas
              </span>
              <span className="text-lg font-black text-emerald-300 font-mono">
                {reductions.length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                -15% tempo
              </span>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                ⏱️ Meta Total
              </span>
              <span className="text-lg font-black text-indigo-300 font-mono">
                {totalWeeklyHours}h
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                semanais mantidas
              </span>
            </div>
          </div>

          {/* Lista Comparativa: Antes vs. Depois */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 -mr-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              <span>Disciplina</span>
              <span>Antes ➔ Novo Alvo</span>
            </div>

            {comparison.map((item, idx) => {
              const isReinforced = item.diffMinutes > 0;
              const isReduced = item.diffMinutes < 0;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-100 font-bold">
                        {item.subjectName}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          item.accuracyPercentage < 65
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : item.accuracyPercentage > 85
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-500/15 text-slate-400 border border-slate-500/30"
                        }`}
                      >
                        {item.accuracyPercentage}% acerto
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      {isReinforced && (
                        <span className="text-rose-400 flex items-center gap-1">
                          <TrendingUp size={12} /> Déficit detectado (+25%)
                        </span>
                      )}
                      {isReduced && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <TrendingDown size={12} /> Domínio elevado (-15%)
                        </span>
                      )}
                      {!isReinforced && !isReduced && (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock size={12} /> Ritmo estável preservado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="flex items-center justify-end gap-1.5 font-mono font-bold">
                      <span className="text-slate-500 line-through text-[11px]">
                        {item.previousWeeklyMinutes}m
                      </span>
                      <ArrowRight size={12} className="text-slate-600" />
                      <span className="text-white text-sm">
                        {item.newWeeklyMinutes}m
                      </span>
                    </div>

                    <div className="text-[10px] font-mono font-bold">
                      {isReinforced && (
                        <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                          +{item.diffMinutes} min
                        </span>
                      )}
                      {isReduced && (
                        <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {item.diffMinutes} min
                        </span>
                      )}
                      {!isReinforced && !isReduced && (
                        <span className="text-slate-500">Mantido</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer de Ações */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={16} className="text-cyan-400 shrink-0" />
              <span>Conquista &quot;Estrategista Adaptativo&quot; atualizada.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href="/week"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <Calendar size={14} />
                <span>Ver na Semana</span>
              </Link>

              <button
                onClick={onClose}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
              >
                <Check size={14} />
                <span>Concluir</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
