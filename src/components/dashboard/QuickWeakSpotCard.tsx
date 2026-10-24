"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Flame, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { DashboardSubject } from "@/types";

interface QuickWeakSpotCardProps {
  subjects: DashboardSubject[];
  isLoading?: boolean;
}

export function QuickWeakSpotCard({ subjects, isLoading }: QuickWeakSpotCardProps) {
  // Identifica a matéria com menor taxa de acerto ou menor domínio para treino direcionado
  const weakSpot = useMemo(() => {
    if (!subjects || subjects.length === 0) return null;

    // Prioriza matérias com acurácia registrada abaixo de 75%
    const withAccuracy = subjects.filter(
      (s) => typeof s.accuracy === "number" && s.accuracy > 0
    );

    if (withAccuracy.length > 0) {
      return withAccuracy.reduce((lowest, curr) =>
        (curr.accuracy ?? 100) < (lowest.accuracy ?? 100) ? curr : lowest
      );
    }

    // Se nenhuma tiver acurácia explícita, escolhe a de menor domínio ou progresso
    const withDomain = subjects.filter((s) => typeof s.domain === "number");
    if (withDomain.length > 0) {
      return withDomain.reduce((lowest, curr) =>
        (curr.domain ?? 100) < (lowest.domain ?? 100) ? curr : lowest
      );
    }

    return subjects[0];
  }, [subjects]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-950/60 p-5 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md mb-3" />
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md mb-4" />
        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (!weakSpot) return null;

  const accuracy = Math.round(weakSpot.accuracy ?? weakSpot.domain ?? 0);
  const isHighMastery = accuracy >= 80;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-slate-950/60 p-5 sm:p-6 shadow-xs dark:shadow-2xl backdrop-blur-2xl transition-all hover:border-amber-500/30">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/40 to-transparent" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Lado Esquerdo: Diagnóstico */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider border ${
              isHighMastery
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            }`}>
              {isHighMastery ? (
                <>
                  <CheckCircle2 size={11} />
                  Domínio Alto
                </>
              ) : (
                <>
                  <Flame size={11} className="text-amber-500" />
                  Ponto de Atenção Detectado
                </>
              )}
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Taxa de Acerto: <strong className={isHighMastery ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>{accuracy}%</strong>
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{weakSpot.name}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
              {isHighMastery
                ? "Excelente rendimento! Faça um treino expresso de 5 questões para manter a retenção ativa e calibrada."
                : "Seu menor índice de retenção recente. Resolva 5 questões rápidas agora para fechar esta lacuna antes do simulado geral."}
            </p>
          </div>
        </div>

        {/* Lado Direito: Botão de Ação Direta */}
        <div className="shrink-0">
          <Link
            href={`/questions?mode=express&subject=${encodeURIComponent(weakSpot.id || weakSpot.name)}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer min-h-[44px]"
            title={`Iniciar treino expresso focado em ${weakSpot.name}`}
          >
            <Zap size={16} className="fill-white" />
            <span>Treino Expresso (5 Questões)</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
