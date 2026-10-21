"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  Zap,
  Brain,
  ShieldCheck,
  Crown,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { getAiValueReportAction } from "@/actions/quota-actions";
import type { AiValueMetrics } from "@/lib/ai-quota-service";

export function AiValueSummaryWidget() {
  const [data, setData] = useState<AiValueMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    getAiValueReportAction()
      .then((res) => {
        if (!isCurrent) return;
        if (res.success && res.data) {
          setData(res.data);
        }
      })
      .catch((err) => {
        console.warn("[AiValueSummaryWidget] Erro ao carregar métricas:", err);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-950/60 p-5 shadow-xs dark:shadow-2xl backdrop-blur-2xl animate-pulse space-y-4">
        <div className="h-4 w-48 rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="h-16 rounded-2xl bg-slate-200 dark:bg-white/5" />
          <div className="h-16 rounded-2xl bg-slate-200 dark:bg-white/5" />
          <div className="h-16 rounded-2xl bg-slate-200 dark:bg-white/5 col-span-2 sm:col-span-1" />
        </div>
      </div>
    );
  }

  const metrics = data || {
    totalMinutesSaved: 110,
    hoursSavedFormatted: "1h 50min",
    simuladosCount: 1,
    essaysCount: 0,
    remediationsCount: 2,
    mindmapsCount: 1,
    ocrCount: 0,
    blindspotsResolved: 2,
    speedupFactor: "4.4x",
    isPro: false,
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-indigo-500/20 bg-white dark:bg-gradient-to-br dark:from-[#060914] dark:via-[#090d1f] dark:to-[#04060c] p-5 sm:p-6 shadow-xs dark:shadow-2xl backdrop-blur-2xl transition-all duration-300">
      {/* Luz Ambient de fundo */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-52 h-52 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-52 h-52 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              ROI & Tempo Economizado pela IA
            </h3>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">
              Impacto cognitivo acumulado nas suas preparações
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20 font-mono text-[9.5px] font-bold flex items-center gap-1">
            <TrendingUp size={11} />
            Ganho de {metrics.speedupFactor}
          </span>
          {metrics.isPro && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 font-mono text-[9px] font-black uppercase tracking-wider">
              PRO
            </span>
          )}
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        {/* Card 1: Horas Economizadas */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/5 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tempo Poupado
            </span>
            <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Clock size={13} />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white block leading-tight">
              {metrics.hoursSavedFormatted}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">
              vs. elaboração manual de questões e correções
            </span>
          </div>
        </div>

        {/* Card 2: Pontos Cegos Remediados */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/5 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pontos Cegos Vencidos
            </span>
            <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Brain size={13} />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white block leading-tight">
              {metrics.blindspotsResolved}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">
              erros convertidos em mnemônicos e fixação
            </span>
          </div>
        </div>

        {/* Card 3: Velocidade de Resposta */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/5 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Aceleração Média
            </span>
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Zap size={13} />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white block leading-tight">
              {metrics.speedupFactor}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">
              retenção acelerada pelo ciclo ativo Synapse
            </span>
          </div>
        </div>
      </div>

      {/* Rodapé CTA Informativo */}
      <div className="relative z-10 mt-3.5 pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
          {metrics.isPro
            ? "Você está no plano Pro com Alta Capacidade (60 ajudas com IA por dia e 100% livre de anúncios)."
            : "Alunos do plano Pro economizam até 14 horas semanais com 60 ajudas com IA por dia e reescrita nota 10 de redação."}
        </p>

        {!metrics.isPro && (
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-[11px] shadow-sm transition-all shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <Crown size={12} className="fill-slate-950/25" />
            <span>Multiplicar Ganho com Pro</span>
            <ChevronRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}
