"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  AlertTriangle,
  Flame,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Pause,
  Play,
  Flag,
  CheckCircle2,
} from "lucide-react";

interface PacingBarProps {
  remainingSeconds: number;
  totalAllocatedSeconds: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  isPaused?: boolean;
  onTogglePause?: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenExamSheet: () => void;
  examSheetOpen: boolean;
  answeredCount: number;
  flaggedCount: number;
}

export function PacingBar({
  remainingSeconds,
  totalAllocatedSeconds,
  currentQuestionIndex,
  totalQuestions,
  isPaused = false,
  onTogglePause,
  isFocusMode,
  onToggleFocusMode,
  onOpenExamSheet,
  examSheetOpen,
  answeredCount,
  flaggedCount,
}: PacingBarProps) {
  // Percentual restante (100% no início -> 0% no fim)
  const remainingPercent = Math.max(
    0,
    Math.min(100, (remainingSeconds / Math.max(1, totalAllocatedSeconds)) * 100)
  );

  // Determinação da faixa de ritmo e cor
  // > 50%: Tranquilo (Violeta/Índigo)
  // 10% a 50%: Atenção (Âmbar/Laranja)
  // < 10%: Crítico (Carmesim/Rose com pulso)
  const { status, barGradient, badgeBg, textColor, isPulsing } = useMemo(() => {
    if (remainingPercent <= 10) {
      return {
        status: "critical",
        barGradient: "from-rose-600 via-red-500 to-rose-700",
        badgeBg: "bg-rose-500/20 border-rose-500/40 text-rose-300",
        textColor: "text-rose-400",
        isPulsing: true,
      };
    }
    if (remainingPercent <= 50) {
      return {
        status: "warning",
        barGradient: "from-amber-500 via-orange-500 to-amber-600",
        badgeBg: "bg-amber-500/20 border-amber-500/40 text-amber-300",
        textColor: "text-amber-400",
        isPulsing: false,
      };
    }
    return {
      status: "normal",
      barGradient: "from-violet-500 via-indigo-500 to-purple-600",
      badgeBg: "bg-violet-500/15 border-violet-500/30 text-violet-300",
      textColor: "text-violet-300",
      isPulsing: false,
    };
  }, [remainingPercent]);

  // Formatação em HH:MM:SS ou MM:SS
  const formattedTime = useMemo(() => {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [remainingSeconds]);

  // Cálculo do tempo médio por questão restante
  const remainingQuestions = Math.max(1, totalQuestions - answeredCount);
  const avgSecondsPerRemaining = Math.round(remainingSeconds / remainingQuestions);
  const avgMinRemaining = Math.floor(avgSecondsPerRemaining / 60);
  const avgSecRemaining = avgSecondsPerRemaining % 60;

  return (
    <div className="sticky top-0 z-40 w-full bg-[#030712]/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl transition-all">
      {/* 1. BARRA DE RITMO DINÂMICA (Pacing Bar) */}
      <div className="w-full h-1.5 bg-white/5 relative overflow-hidden">
        <motion.div
          className={`h-full bg-linear-to-r ${barGradient} ${
            isPulsing ? "animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.8)]" : ""
          }`}
          style={{ width: `${remainingPercent}%` }}
          transition={{ ease: "linear", duration: 0.3 }}
        />
      </div>

      {/* 2. CONTEÚDO PRINCIPAL DO CABEÇALHO */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* LADO ESQUERDO: Indicador de questão e ritmo médio */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <button
            onClick={onOpenExamSheet}
            type="button"
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              examSheetOpen
                ? "bg-violet-500/20 border-violet-500/50 text-violet-200 shadow-md shadow-violet-500/10"
                : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-violet-500/30"
            }`}
            title="Abrir Grade de Gabarito (G)"
          >
            <LayoutGrid size={14} className="text-violet-400" />
            <span className="hidden sm:inline">Gabarito</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 text-slate-300 font-mono">
              {answeredCount}/{totalQuestions}
            </span>
          </button>

          <div className="min-w-0 flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-white whitespace-nowrap">
              Questão {currentQuestionIndex + 1}{" "}
              <span className="text-slate-500 font-normal">de {totalQuestions}</span>
            </span>

            {flaggedCount > 0 && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                <Flag size={10} />
                {flaggedCount} marcada{flaggedCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* CENTRO: ALERTA DE RITMO (Em telas médias/grandes) */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="text-slate-500">Ritmo restante:</span>
          <span className="text-slate-200 font-mono font-bold">
            ~{avgMinRemaining}m {avgSecRemaining}s/q
          </span>
          {isPulsing && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold animate-pulse">
              <AlertTriangle size={11} />
              Últimos 10% do Tempo!
            </span>
          )}
        </div>

        {/* LADO DIREITO: CRONÔMETRO REGRESSIVO + MODO FOCO */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Cronômetro Regressivo com Visual de HUD */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-sm transition-all shadow-md ${badgeBg} ${
              isPulsing
                ? "animate-pulse ring-2 ring-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                : ""
            }`}
          >
            <Clock
              size={14}
              className={`${textColor} ${isPulsing ? "animate-spin" : ""}`}
            />
            <span className="tracking-wider">{formattedTime}</span>

            {onTogglePause && (
              <button
                onClick={onTogglePause}
                type="button"
                className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors ml-0.5 cursor-pointer"
                title={isPaused ? "Retomar cronômetro" : "Pausar cronômetro"}
              >
                {isPaused ? <Play size={12} /> : <Pause size={12} />}
              </button>
            )}
          </div>

          {/* Botão Modo Anti-Distração */}
          <button
            onClick={onToggleFocusMode}
            type="button"
            className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isFocusMode
                ? "bg-violet-500/20 border-violet-500/50 text-violet-300 shadow-lg shadow-violet-500/20"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
            }`}
            title={
              isFocusMode
                ? "Sair do Modo Anti-Distração (ESC ou Z)"
                : "Entrar em Modo Anti-Distração (Z)"
            }
          >
            {isFocusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
