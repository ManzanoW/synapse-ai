"use client";

import React from "react";
import Link from "next/link";
import {
  BrainCircuit,
  RotateCcw,
  Sparkles,
  Clock,
  ArrowRight,
  CheckCircle2,
  Layers,
  Zap,
} from "lucide-react";

interface FsrsReviewWidgetProps {
  dueCount?: number;
  totalCount?: number;
  isLoading?: boolean;
  className?: string;
}

export function FsrsReviewWidget({
  dueCount = 0,
  totalCount = 0,
  isLoading = false,
  className = "",
}: FsrsReviewWidgetProps) {
  // Tempo estimado de revisão: média de ~36s (0.6 min) por flashcard
  const estimatedMinutes = Math.max(1, Math.round(dueCount * 0.6));

  if (isLoading) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/70 p-5 shadow-xs dark:shadow-2xl backdrop-blur-2xl animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-200 dark:bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-3 w-48 rounded bg-slate-200 dark:bg-white/5" />
            </div>
          </div>
          <div className="h-10 w-28 rounded-xl bg-slate-200 dark:bg-white/10" />
        </div>
      </div>
    );
  }

  // Caso haja cards vencidos pendentes para revisão
  if (dueCount > 0) {
    return (
      <div
        className={`group relative overflow-hidden rounded-3xl border border-amber-300/80 dark:border-amber-500/30 bg-amber-50/75 dark:bg-gradient-to-r dark:from-[#171205]/95 dark:via-[#0d0b1a]/95 dark:to-[#060814]/95 p-5 sm:p-6 shadow-md shadow-amber-100/40 dark:shadow-2xl dark:shadow-amber-950/20 backdrop-blur-2xl transition-all duration-300 hover:border-amber-400 dark:hover:border-amber-500/50 ${className}`}
      >
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Lado Esquerdo: Ícone e Texto Explicativo */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/50 bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <BrainCircuit size={22} className="animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-slate-950">
                !
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 inline-flex items-center gap-1">
                  <Zap size={10} className="fill-amber-600 dark:fill-amber-300" />
                  Revisão FSRS Pendente Hoje
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                  Algoritmo FSRS-4.5
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>
                  {dueCount} {dueCount === 1 ? "flashcard pronto" : "flashcards prontos"} para consolidação
                </span>
              </h3>

              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-zinc-300 flex-wrap">
                <span className="inline-flex items-center gap-1 text-amber-900 dark:text-amber-200/90 font-medium">
                  <Clock size={12} className="text-amber-600 dark:text-amber-400" />
                  ~{estimatedMinutes} min de revisão ativa
                </span>
                <span className="text-slate-300 dark:text-zinc-600">•</span>
                <span className="text-slate-500 dark:text-zinc-400 text-[11px]">
                  Evite a curva de esquecimento de Ebbinghaus
                </span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Botão de Ação Rápida "Revisar Agora" */}
          <div className="flex items-center gap-3 shrink-0 self-stretch md:self-center justify-end">
            <Link
              href="/flashcards/study/all?filter=due"
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide transition-all duration-200 shadow-md shadow-amber-500/20 active:scale-95 border border-amber-400/40 inline-flex items-center justify-center gap-2 cursor-pointer group/btn"
            >
              <span>Revisar Agora</span>
              <ArrowRight
                size={14}
                className="transition-transform group-hover/btn:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Caso todos os cards já tenham sido revisados
  if (totalCount > 0) {
    return (
      <div
        className={`group relative overflow-hidden rounded-3xl border border-emerald-200/90 dark:border-emerald-500/20 bg-white dark:bg-slate-950/60 p-4 sm:p-5 shadow-xs dark:shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-emerald-300 dark:hover:border-emerald-500/30 ${className}`}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Memória em Dia!</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20 font-bold">
                  100% Consolidado
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Nenhum flashcard pendente para hoje. O algoritmo FSRS agendará suas próximas repetições.
              </p>
            </div>
          </div>

          <Link
            href="/flashcards"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-zinc-200 dark:hover:text-white transition-all inline-flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center cursor-pointer"
          >
            <Layers size={13} />
            <span>Ver Baralhos ({totalCount})</span>
          </Link>
        </div>
      </div>
    );
  }

  // Caso o usuário ainda não possua nenhum flashcard criado
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-slate-950/60 p-4 sm:p-5 shadow-xs dark:shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-500/30 ${className}`}
    >
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <BrainCircuit size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Turbine sua Memorização com FSRS
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Crie flashcards a partir do seu edital ou converta seus mapas mentais em baralhos inteligentes.
            </p>
          </div>
        </div>

        <Link
          href="/flashcards"
          className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-600/30 dark:hover:bg-indigo-600/40 dark:text-indigo-200 dark:border-indigo-500/30 text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center cursor-pointer"
        >
          <Sparkles size={13} />
          <span>Criar Flashcards</span>
        </Link>
      </div>
    </div>
  );
}
