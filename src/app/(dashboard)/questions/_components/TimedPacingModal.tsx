"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  X,
  Zap,
  Clock,
  Sliders,
  ShieldAlert,
  ArrowRight,
  Layers,
} from "lucide-react";
import { TimedQuizPacingMode } from "@/types/quiz";

export interface TimedPacingConfig {
  pacingMode: TimedQuizPacingMode;
  minutesPerQuestion: number;
  totalBlockMinutes: number;
  strictAntiDistraction: boolean;
}

interface TimedPacingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  totalQuestions: number;
  onConfirm: (config: TimedPacingConfig) => void;
}

const PER_QUESTION_PRESETS = [
  { value: 2, label: "2 min", tag: "Sprint Rápido" },
  { value: 2.5, label: "2.5 min", tag: "Ágil" },
  { value: 3, label: "3 min", tag: "Padrão Concurso" },
  { value: 4, label: "4 min", tag: "Aprofundado" },
];

const BLOCK_PRESETS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

export function TimedPacingModal({
  isOpen,
  onClose,
  title,
  subtitle,
  totalQuestions,
  onConfirm,
}: TimedPacingModalProps) {
  const [pacingMode, setPacingMode] =
    useState<TimedQuizPacingMode>("per_question");
  const [minutesPerQuestion, setMinutesPerQuestion] = useState(3);
  const [totalBlockMinutes, setTotalBlockMinutes] = useState(30);
  const [strictAntiDistraction, setStrictAntiDistraction] = useState(false);

  if (!isOpen) return null;

  const calculatedTotalSeconds =
    pacingMode === "per_question"
      ? totalQuestions * minutesPerQuestion * 60
      : totalBlockMinutes * 60;

  const totalMin = Math.round(calculatedTotalSeconds / 60);

  const handleStart = () => {
    onConfirm({
      pacingMode,
      minutesPerQuestion,
      totalBlockMinutes,
      strictAntiDistraction,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-linear-to-b from-[#0f1426] via-[#090d18] to-[#04060c] border border-violet-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-violet-950/40 text-slate-100 space-y-5 overflow-hidden"
        >
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-52 h-52 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-52 h-52 rounded-full bg-indigo-600/15 blur-3xl" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-300 flex items-center justify-center shadow-inner">
                <Timer size={22} className="text-violet-400" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Zap size={11} className="text-amber-400" />
                  0 Gasto de Tokens • Instantâneo
                </div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Ritmo do Simulado Cronometrado
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Info do Caderno */}
          <div className="relative z-10 bg-[#090d18]/80 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-bold text-slate-200 truncate">
                {title}
              </p>
              {subtitle && (
                <p className="text-[11px] text-slate-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-mono font-bold">
              <Layers size={13} />
              <span>{totalQuestions} questões</span>
            </div>
          </div>

          {/* Seletor de Modo de Ritmo */}
          <div className="relative z-10 space-y-3">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders size={13} className="text-violet-400" />
              <span>Modo de Gerenciamento do Tempo</span>
            </label>

            <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/5 rounded-2xl">
              <button
                type="button"
                onClick={() => setPacingMode("per_question")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  pacingMode === "per_question"
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clock size={13} />
                <span>Por Questão</span>
              </button>

              <button
                type="button"
                onClick={() => setPacingMode("total_block")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  pacingMode === "total_block"
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Timer size={13} />
                <span>Bloco Geral</span>
              </button>
            </div>

            {/* Opções Modo Por Questão */}
            {pacingMode === "per_question" ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {PER_QUESTION_PRESETS.map((preset) => {
                  const isSelected = minutesPerQuestion === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setMinutesPerQuestion(preset.value)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? "bg-violet-600/25 border-violet-500 text-white shadow-md shadow-violet-600/20 ring-1 ring-violet-500/40"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xs font-bold">{preset.label}</span>
                      <span className="text-[9px] text-violet-300 font-medium opacity-80">
                        {preset.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Opções Modo Bloco Fixo */
              <div className="grid grid-cols-4 gap-2 pt-1">
                {BLOCK_PRESETS.map((preset) => {
                  const isSelected = totalBlockMinutes === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setTotalBlockMinutes(preset.value)}
                      className={`py-2 px-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-violet-600/25 border-violet-500 text-white shadow-md shadow-violet-600/20 ring-1 ring-violet-500/40"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Toggle Anti-distração */}
          <div className="relative z-10 pt-1">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    Cockpit Anti-distração
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Oculta menus, sidebar e trava foco exclusivo na prova
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={strictAntiDistraction}
                onChange={(e) => setStrictAntiDistraction(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 bg-slate-900 border-slate-700 focus:ring-violet-500/30"
              />
            </label>
          </div>

          {/* Resumo e Botão Iniciar */}
          <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Tempo Total Estimado
              </p>
              <p className="text-sm font-black text-violet-300 font-mono">
                {totalMin} min{" "}
                <span className="text-[11px] font-normal text-slate-400">
                  ({calculatedTotalSeconds}s)
                </span>
              </p>
            </div>

            <button
              onClick={handleStart}
              type="button"
              className="px-5 py-2.5 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-violet-600/30 transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2"
            >
              <span>⚡ Iniciar Simulado</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
