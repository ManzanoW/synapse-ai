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
        className={`relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/70 p-5 shadow-2xl backdrop-blur-2xl animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-white/10" />
              <div className="h-3 w-48 rounded bg-white/5" />
            </div>
          </div>
          <div className="h-10 w-28 rounded-xl bg-white/10" />
        </div>
      </div>
    );
  }

  // Caso haja cards vencidos pendentes para revisão
  if (dueCount > 0) {
    return (
      <div
        className={`group relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-[#171205]/95 via-[#0d0b1a]/95 to-[#060814]/95 p-5 sm:p-6 shadow-2xl shadow-amber-950/20 backdrop-blur-2xl transition-all duration-300 hover:border-amber-500/50 ${className}`}
      >
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Lado Esquerdo: Ícone e Texto Explicativo */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                <BrainCircuit size={22} className="animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-slate-950">
                !
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                  <Zap size={10} className="fill-amber-300" />
                  Revisão FSRS Pendente Hoje
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Algoritmo FSRS-4.5
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>
                  {dueCount} {dueCount === 1 ? "flashcard pronto" : "flashcards prontos"} para consolidação
                </span>
              </h3>

              <div className="flex items-center gap-3 text-xs text-zinc-300 flex-wrap">
                <span className="inline-flex items-center gap-1 text-amber-200/90 font-medium">
                  <Clock size={12} className="text-amber-400" />
                  ~{estimatedMinutes} min de revisão ativa
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 text-[11px]">
                  Evite a curva de esquecimento de Ebbinghaus
                </span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Botão de Ação Rápida "Revisar Agora" */}
          <div className="flex items-center gap-3 shrink-0 self-stretch md:self-center justify-end">
            <Link
              href="/flashcards/study/all"
              className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-xl shadow-amber-500/25 active:scale-95 border border-amber-300/40 inline-flex items-center justify-center gap-2 cursor-pointer group/btn"
            >
              <span>Revisar Agora</span>
              <ArrowRight
                size={14}
                className="transition-transform group-hover/btn:translate-x-1 font-bold"
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
        className={`group relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-950/60 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-emerald-500/30 ${className}`}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Memória em Dia!</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-bold">
                  100% Consolidado
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Nenhum flashcard pendente para hoje. O algoritmo FSRS agendará suas próximas repetições.
              </p>
            </div>
          </div>

          <Link
            href="/flashcards"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 hover:text-white transition-all inline-flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center cursor-pointer"
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
      className={`group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-indigo-500/30 ${className}`}
    >
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
            <BrainCircuit size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">
              Turbine sua Memorização com FSRS
            </h4>
            <p className="text-[11px] text-zinc-400">
              Crie flashcards a partir do seu edital ou converta seus mapas mentais em baralhos inteligentes.
            </p>
          </div>
        </div>

        <Link
          href="/flashcards"
          className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center cursor-pointer"
        >
          <Sparkles size={13} />
          <span>Criar Flashcards</span>
        </Link>
      </div>
    </div>
  );
}
