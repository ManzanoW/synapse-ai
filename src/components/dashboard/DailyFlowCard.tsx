"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Zap,
  Sparkles,
  BrainCircuit,
  Target,
  ArrowRight,
  Clock,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { DailyFlowData, DailyFlowStep } from "@/actions/daily-flow-actions";

interface DailyFlowCardProps {
  flowData: DailyFlowData | null;
}

export function DailyFlowCard({ flowData }: DailyFlowCardProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!flowData || !flowData.hasActivity) {
    return null;
  }

  const { totalMinutes, steps, greeting } = flowData;
  const primaryStep = steps[0];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-[#0c1024]/90 via-[#0a0e1c]/90 to-[#070a14]/90 p-4 sm:p-6 shadow-xl shadow-indigo-950/20 backdrop-blur-md transition-all">
      {/* GLOW DECORATIVO DE FUNDO */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-cyan-600/10 blur-3xl" />

      {/* CABEÇALHO DO CARD */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/40 bg-indigo-500/15 text-indigo-400 shadow-xs">
            <Zap size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-1.5">
                Sessão Recomendada de Hoje
              </h2>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
                1-Click Flow
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {greeting}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs font-mono text-slate-300">
            <Clock size={13} className="text-indigo-400" />
            <span>~{totalMinutes} min de foco</span>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded-lg border border-slate-800 bg-slate-900/50 p-2 text-slate-400 hover:text-white transition-colors"
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            {isMinimized ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>

      {/* CONTEÚDO EXPANSÍVEL */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 pt-4"
          >
            {/* ETAPAS DA SESSÃO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {steps.map((step, idx) => {
                const stepIcons = [
                  <Layers key="f" size={16} className="text-amber-400" />,
                  <Target key="q" size={16} className="text-indigo-400" />,
                  <BrainCircuit key="r" size={16} className="text-rose-400" />,
                ];
                const stepLabels = ["1. Aquecimento", "2. Treino Focado", "3. Cura Cognitiva"];

                return (
                  <Link
                    key={step.id}
                    href={step.actionUrl}
                    className="group flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5 transition-all hover:border-indigo-500/50 hover:bg-slate-900/60 hover:shadow-lg active:scale-[0.99]"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5">
                        <span className="font-semibold text-slate-400">
                          {stepLabels[idx]}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {step.durationMinutes} min
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-indigo-500/30 transition-colors">
                          {stepIcons[idx]}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-indigo-200 transition-colors line-clamp-1">
                            {step.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                            {step.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-900 pt-2 text-[11px]">
                      <span className="font-mono text-indigo-400/90 font-medium">
                        {step.badge}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-400 group-hover:text-indigo-300 transition-colors">
                        Iniciar <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* BOTÃO PRINCIPAL DE AÇÃO */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60 pt-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles size={14} className="text-amber-400" />
                <span>Completa os 3 blocos para atingir sua meta diária de retenção máxima</span>
              </div>

              <Link
                href={primaryStep.actionUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-950/50 transition-all active:scale-95 cursor-pointer ml-auto"
              >
                <Play size={14} className="fill-white" />
                <span>Iniciar Sessão Diária Completa</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
