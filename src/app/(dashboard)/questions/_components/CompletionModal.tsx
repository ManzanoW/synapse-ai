"use client";

import React from "react";
import {
  Trophy,
  Loader2,
  RotateCcw,
  Clock,
  Zap,
  CheckCircle2,
  Sliders,
} from "lucide-react";

interface CompletionModalProps {
  totalQuestions: number;
  correctCount: number;
  percentageAcc: number;
  timerSeconds: number;
  lastEarnedXp: number;
  isSyncingSM2: boolean;
  levelUpData: {
    leveledUp: boolean;
    newLevel: number;
    title?: string;
  } | null;
  rebalancedData?: {
    rebalanced: boolean;
    subjectName?: string;
  } | null;
  onRestart: () => void;
  onReview: () => void;
}

export function CompletionModal({
  totalQuestions,
  correctCount,
  percentageAcc,
  timerSeconds,
  lastEarnedXp,
  isSyncingSM2,
  levelUpData,
  rebalancedData,
  onRestart,
  onReview,
}: CompletionModalProps) {
  const isPerfect = totalQuestions > 0 && correctCount === totalQuestions;
  const averageTimePerQuestion =
    totalQuestions > 0 ? Math.round(timerSeconds / totalQuestions) : 0;

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return hrs > 0
      ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className={`bg-[#090d16] border rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl relative text-center space-y-5 animate-in zoom-in-95 duration-200 ${
          isPerfect
            ? "border-amber-500/40 shadow-[0_0_50px_-10px_rgba(245,158,11,0.25)]"
            : "border-slate-800"
        }`}
      >
        {/* TROFÉU */}
        <div className="relative inline-block mx-auto">
          {isPerfect && (
            <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl animate-pulse" />
          )}
          <div
            className={`w-20 h-20 rounded-full border flex items-center justify-center relative z-10 transition-transform hover:scale-105 ${
              isPerfect
                ? "bg-linear-to-tr from-amber-500/20 via-amber-400/10 to-yellow-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/20"
                : "bg-linear-to-tr from-indigo-500/20 to-emerald-500/20 border-indigo-500/30 text-indigo-400"
            }`}
          >
            <Trophy
              size={36}
              className={
                isPerfect ? "text-amber-400 animate-bounce" : "text-indigo-400"
              }
            />
          </div>
        </div>

        {/* HEADER */}
        <div className="space-y-1">
          {isPerfect ? (
            <>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-block">
                🏆 Desempenho Impecável
              </span>
              <h3 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-r from-amber-200 via-amber-400 to-yellow-500 pt-1">
                GABARITO PERFEITO!
              </h3>
            </>
          ) : (
            <h3 className="text-xl font-bold text-slate-100">
              Simulado Concluído!
            </h3>
          )}
          <p className="text-xs text-slate-400">
            Análise sintética de desempenho gerada pelo Synapse AI.
          </p>
        </div>

        {/* CARDS DE MÉTRICAS */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl shadow-inner space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-stretch">
            <div className="flex flex-col justify-center p-2 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Total
              </span>
              <span className="text-base font-black text-slate-200 font-mono mt-0.5">
                {totalQuestions} Q
              </span>
            </div>

            <div className="flex flex-col justify-center p-2 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Acertos
              </span>
              <span className="text-base font-black text-emerald-400 font-mono mt-0.5">
                {correctCount}
              </span>
            </div>

            <div className="flex flex-col justify-center p-2 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Taxa
              </span>
              <span
                className={`text-base font-black font-mono mt-0.5 ${
                  isPerfect ? "text-amber-400" : "text-indigo-400"
                }`}
              >
                {percentageAcc}%
              </span>
            </div>

            <div className="flex flex-col justify-center p-2 bg-indigo-500/10 border border-indigo-500/25 rounded-xl">
              <span className="block text-[10px] text-indigo-300 font-bold uppercase tracking-wider items-center justify-center gap-1">
                <Clock size={11} /> Tempo Total
              </span>
              <span className="text-base font-black text-indigo-200 font-mono mt-0.5">
                {formatTimer(timerSeconds)}
              </span>
              <span className="text-[10px] text-indigo-300/70 font-mono mt-0.5 font-semibold">
                ~{averageTimePerQuestion}s / questão
              </span>
            </div>
          </div>

          <div
            className={`flex items-center justify-between px-4 py-2 rounded-xl transition-all border ${
              isPerfect
                ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]"
                : "bg-slate-900/60 border-slate-800/80"
            }`}
          >
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Zap size={13} /> Recompensa de Treino
            </span>
            <div className="flex items-center gap-2">
              {isPerfect && (
                <span className="bg-linear-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-200 tracking-wider">
                  🔥 +25% Bônus
                </span>
              )}
              <span className="text-sm font-black text-amber-400 font-mono">
                +{lastEarnedXp} XP
              </span>
            </div>
          </div>
        </div>

        {/* BANNER DE REBALANCEAMENTO ADAPTATIVO */}
        {rebalancedData?.rebalanced && (
          <div className="relative overflow-hidden bg-linear-to-r from-cyan-950/60 via-cyan-900/40 to-slate-900/60 border border-cyan-500/40 p-3 rounded-2xl shadow-lg animate-in fade-in duration-300 text-left flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Sliders size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                Carga Semanal Rebalanceada
              </span>
              <p className="text-xs text-slate-200 leading-snug">
                As metas de estudo para{" "}
                <strong className="text-cyan-200 font-semibold">
                  {rebalancedData.subjectName || "esta disciplina"}
                </strong>{" "}
                foram reajustadas automaticamente no seu Planner.
              </p>
            </div>
          </div>
        )}

        {/* BANNER DE LEVEL UP */}
        {levelUpData?.leveledUp && (
          <div className="relative overflow-hidden bg-linear-to-r from-purple-900/50 via-indigo-900/50 to-purple-900/50 border border-purple-500/50 p-3.5 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.3)] animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl animate-bounce">🎉</span>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 block">
                  LEVEL UP ALCANÇADO!
                </span>
                <h4 className="text-sm font-black text-white tracking-tight">
                  Você subiu para o{" "}
                  <span className="text-purple-400">
                    Nível {levelUpData.newLevel}
                  </span>
                  ! 🚀
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* DIAGNÓSTICO COGNITIVO */}
        <p
          className={`text-xs p-3.5 rounded-2xl leading-relaxed text-left border ${
            isPerfect
              ? "bg-amber-500/10 border-amber-500/30 text-amber-200/90"
              : "bg-indigo-500/10 border-indigo-500/20 text-slate-300"
          }`}
        >
          🧠{" "}
          <strong className={isPerfect ? "text-amber-300" : "text-indigo-300"}>
            Diagnóstico Cognitivo:
          </strong>{" "}
          {isPerfect
            ? "Domínio absoluto do conteúdo! Você gabaritou todas as questões com precisão cirúrgica."
            : percentageAcc >= 80
              ? "Excelente domínio do assunto! Seu percentual de retenção atinge patamares de aprovação no topo das bancas."
              : percentageAcc >= 50
                ? "Bom rendimento, porém há pontos de atenção. Recomendamos criar Flashcards das questões incorretas para fixação."
                : "Taxa de retenção abaixo do ideal. Recomendamos revisar a teoria base e praticar novo simulado focado."}
        </p>

        {/* SINCRONIZAÇÃO SM-2 */}
        <div className="flex items-center justify-between text-[11px] font-mono bg-slate-950 border border-slate-800/80 px-4 py-2.5 rounded-xl text-slate-400 shadow-inner">
          <span className="flex items-center gap-2">
            {isSyncingSM2 ? (
              <Loader2 size={12} className="animate-spin text-indigo-400" />
            ) : (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            Sincronização SM-2:
          </span>
          <span className="text-emerald-400 font-bold">
            {isSyncingSM2
              ? "Calculando novo espaçamento..."
              : isPerfect
                ? "Revisão estendida ao máximo! 🚀"
                : percentageAcc >= 70
                  ? "Próxima revisão estendida pelo algoritmo 🚀"
                  : "Revisão priorizada na grade de amanhã ⚠️"}
          </span>
        </div>

        {/* BOTOES DE AÇÃO */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onRestart}
            type="button"
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw size={14} />
            Refazer Agora
          </button>
          <button
            onClick={onReview}
            type="button"
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
              isPerfect
                ? "bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-950/40 text-slate-950 font-black"
                : "bg-indigo-600 hover:bg-indigo-500 text-slate-100 shadow-indigo-950/40"
            }`}
          >
            <CheckCircle2 size={14} />
            Revisar Respostas
          </button>
        </div>
      </div>
    </div>
  );
}
