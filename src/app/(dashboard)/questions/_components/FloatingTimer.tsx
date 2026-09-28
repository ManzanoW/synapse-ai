"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  Pause,
  Play,
  Eye,
  EyeOff,
  Flame,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Timer,
  FileSpreadsheet,
  Zap,
} from "lucide-react";

interface FloatingTimerProps {
  seconds: number;
  currentQuestionSeconds?: number;
  questionIndex?: number;
  totalQuestions?: number;
  isRunning: boolean;
  onToggleTimer: () => void;
  totalTimeLimitSeconds?: number;
  onOpenOpticalSheet?: () => void;
  onOpenSpeedQuiz?: () => void;
}

export function FloatingTimer({
  seconds,
  currentQuestionSeconds = 0,
  questionIndex = 0,
  totalQuestions = 0,
  isRunning,
  onToggleTimer,
  totalTimeLimitSeconds,
  onOpenOpticalSheet,
  onOpenSpeedQuiz,
}: FloatingTimerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return hrs > 0
      ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  };

  // Pacing status por questão:
  // <= 150s (2m30s): Ideal
  // 151s a 210s (3m30s): Atenção
  // > 210s (> 3m30s): Crítico
  const pacingStatus = useMemo(() => {
    if (currentQuestionSeconds > 210) {
      return {
        level: "critical",
        badgeColor: "bg-rose-500/20 border-rose-500/40 text-rose-300",
        dotColor: "bg-rose-400 animate-ping",
        label: "Tempo Crítico (> 3m30s)",
        alert: "Considere marcar e avançar para não comprometer sua prova.",
      };
    }
    if (currentQuestionSeconds > 150) {
      return {
        level: "warning",
        badgeColor: "bg-amber-500/20 border-amber-500/40 text-amber-300",
        dotColor: "bg-amber-400",
        label: "Atenção ao Ritmo",
        alert: "Aproximando-se do tempo médio de banca (3 min).",
      };
    }
    return {
      level: "optimal",
      badgeColor: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
      dotColor: "bg-emerald-400",
      label: "Ritmo Ideal",
      alert: null,
    };
  }, [currentQuestionSeconds]);

  const isFinal15Minutes = useMemo(() => {
    if (!totalTimeLimitSeconds) return false;
    const remaining = totalTimeLimitSeconds - seconds;
    return remaining <= 900 && remaining > 0;
  }, [totalTimeLimitSeconds, seconds]);

  return (
    <div className="fixed top-5 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col items-end gap-1.5">
        {/* Barra Principal do HUD */}
        <div className="bg-[#080d1a]/95 border border-indigo-500/40 backdrop-blur-xl px-3 sm:px-3.5 py-1.5 rounded-2xl text-xs font-mono font-bold text-indigo-300 shadow-2xl shadow-indigo-950/40 flex items-center gap-2.5 sm:gap-3 transition-all">
          {/* Tempo Total */}
          <div className="flex items-center gap-1.5" title="Tempo total do simulado">
            <Clock
              size={13}
              className={
                isRunning ? "animate-pulse text-indigo-400" : "text-slate-500"
              }
            />
            <span className="min-w-11 text-center font-bold text-slate-200">
              {isVisible ? formatTimer(seconds) : "••:••"}
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-800" />

          {/* Tempo da Questão Atual com Indicador de Pacing */}
          {isVisible && (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] transition-all cursor-pointer ${pacingStatus.badgeColor}`}
              onClick={() => setIsExpanded((prev) => !prev)}
              title={`Tempo gasto na questão ${questionIndex + 1}: ${formatTimer(currentQuestionSeconds)} (${pacingStatus.label})`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${pacingStatus.dotColor}`}
                />
                <span
                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pacingStatus.dotColor.replace(" animate-ping", "")}`}
                />
              </span>
              <span className="font-semibold text-slate-300">
                Q{questionIndex + 1}:
              </span>
              <span className="font-mono font-black">
                {formatTimer(currentQuestionSeconds)}
              </span>
              {isExpanded ? (
                <ChevronUp size={12} className="opacity-70" />
              ) : (
                <ChevronDown size={12} className="opacity-70" />
              )}
            </div>
          )}

          <div className="h-3.5 w-px bg-slate-800" />

          {/* Ações de Controle */}
          <div className="flex items-center gap-0.5">
            {onOpenOpticalSheet && (
              <button
                onClick={onOpenOpticalSheet}
                type="button"
                className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                title="Abrir Folha Óptica de Respostas (Cartão-Resposta)"
              >
                <FileSpreadsheet size={13} />
              </button>
            )}

            {onOpenSpeedQuiz && (
              <button
                onClick={onOpenSpeedQuiz}
                type="button"
                className="p-1 hover:bg-amber-500/20 rounded-md text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                title="Desafio Relâmpago 45s (Speed Quiz)"
              >
                <Zap size={13} className="fill-amber-400" />
              </button>
            )}

            <button
              onClick={onToggleTimer}
              type="button"
              className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-indigo-200 transition-colors cursor-pointer"
              title={isRunning ? "Pausar cronômetro" : "Retomar cronômetro"}
            >
              {isRunning ? <Pause size={13} /> : <Play size={13} />}
            </button>

            <button
              onClick={() => setIsVisible((prev) => !prev)}
              type="button"
              className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-indigo-200 transition-colors cursor-pointer"
              title={isVisible ? "Ocultar tempo" : "Exibir tempo"}
            >
              {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>

        {/* Banner de Aviso dos 15 Minutos Finais */}
        {isFinal15Minutes && (
          <div
            onClick={onOpenOpticalSheet}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-bold shadow-lg shadow-amber-950/40 cursor-pointer animate-pulse hover:bg-amber-500/25 transition-all"
            title="Clique para abrir a Folha Óptica"
          >
            <AlertTriangle size={13} className="text-amber-400 shrink-0" />
            <span>Faltam menos de 15 min! Preencha a Folha Óptica</span>
          </div>
        )}

        {/* Painel Expansível de Pacing Real-Time */}
        {isVisible && isExpanded && (
          <div className="w-64 bg-[#0a0f20]/95 border border-white/10 backdrop-blur-2xl rounded-xl p-3 shadow-xl text-slate-200 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-400 flex items-center gap-1">
                <Timer size={12} className="text-indigo-400" /> Ritmo de Prova
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${pacingStatus.badgeColor}`}
              >
                {pacingStatus.label}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono pt-0.5">
              <span className="text-slate-400">Questão atual:</span>
              <span className="font-bold text-white">
                {questionIndex + 1}{totalQuestions > 0 ? ` de ${totalQuestions}` : ""}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Tempo nesta questão:</span>
              <span className="font-bold text-white">
                {formatTimer(currentQuestionSeconds)}
              </span>
            </div>

            {pacingStatus.alert && (
              <div className="pt-1 border-t border-white/5 flex items-start gap-1.5 text-[10px] text-amber-300 leading-tight">
                <AlertTriangle size={12} className="shrink-0 text-amber-400 mt-0.5" />
                <span>{pacingStatus.alert}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
