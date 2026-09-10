"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Sparkles,
  Layers,
  Target,
  Flame,
  ArrowUpRight,
  HelpCircle,
} from "lucide-react";
import {
  ApprovalOddsData,
  getApprovalOddsAction,
} from "@/actions/analytics-actions";

interface ApprovalOddsCardProps {
  initialData?: ApprovalOddsData | null;
  className?: string;
}

export function ApprovalOddsCard({
  initialData,
  className = "",
}: ApprovalOddsCardProps) {
  const [data, setData] = useState<ApprovalOddsData | null>(
    initialData ?? null,
  );
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) return;

    let isMounted = true;
    async function fetchApprovalOdds() {
      try {
        const res = await getApprovalOddsAction();
        if (isMounted && res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Erro ao carregar chance de aprovação:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchApprovalOdds();
    return () => {
      isMounted = false;
    };
  }, [initialData]);

  if (loading) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl animate-pulse ${className}`}
      >
        <div className="h-4 w-36 bg-white/5 rounded-full mb-6" />
        <div className="flex items-center gap-6">
          <div className="h-28 w-28 rounded-full bg-white/5 shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-3/4 bg-white/5 rounded-full" />
            <div className="h-3 w-1/2 bg-white/5 rounded-full" />
            <div className="h-3 w-2/3 bg-white/5 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Se não há dados suficientes para projeção matemática
  if (!data || !data.hasEnoughData) {
    return (
      <div
        className={`group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl ${className}`}
      >
        {/* Linha Neon Superior Violeta */}
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-violet-500/40 to-transparent" />
        <div className="pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-2 text-violet-400">
              <BrainCircuit size={18} />
            </div>
            <div>
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-violet-400">
                Predição Neural
              </span>
              <h3 className="text-xs font-bold text-white tracking-wide">
                Chance de Aprovação
              </h3>
            </div>
          </div>
          <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 font-mono text-[9px] font-bold text-violet-300 flex items-center gap-1">
            <Sparkles size={10} className="text-cyan-400" />
            Calibragem
          </span>
        </div>

        <div className="py-5 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/5 text-violet-300">
            <Target size={26} className="text-cyan-400 animate-pulse" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-sm font-extrabold text-white">
              Índice em Calibração
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Resolva simulados e avance no edital para calibrar sua projeção
              matemática de aprovação.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <Link
              href="/questions"
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/15 px-3.5 py-2 text-xs font-bold text-violet-200 hover:bg-violet-500/25 hover:text-white transition-all shadow-sm"
            >
              <Sparkles size={12} className="text-cyan-400" />
              <span>Fazer Simulado</span>
            </Link>
            <Link
              href="/edital"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <span>Ver Edital</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cores dinâmicas baseadas no status
  const statusTheme = {
    ZONA_DE_APROVACAO: {
      neon: "via-emerald-400",
      ambient: "bg-emerald-500/15",
      badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      gaugeGradient: ["#10b981", "#34d399", "#06b6d4"],
      glowShadow: "shadow-[0_0_30px_rgba(16,185,129,0.2)]",
    },
    COMPETITIVO: {
      neon: "via-cyan-400",
      ambient: "bg-cyan-500/15",
      badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
      gaugeGradient: ["#06b6d4", "#38bdf8", "#818cf8"],
      glowShadow: "shadow-[0_0_30px_rgba(6,182,212,0.2)]",
    },
    EM_CONSTRUCAO: {
      neon: "via-violet-400",
      ambient: "bg-violet-500/15",
      badge: "border-violet-500/30 bg-violet-500/10 text-violet-300",
      gaugeGradient: ["#8b5cf6", "#a855f7", "#ec4899"],
      glowShadow: "shadow-[0_0_30px_rgba(139,92,246,0.2)]",
    },
    FASE_INICIAL: {
      neon: "via-slate-400",
      ambient: "bg-slate-500/10",
      badge: "border-slate-500/30 bg-slate-500/10 text-slate-300",
      gaugeGradient: ["#64748b", "#94a3b8", "#a855f7"],
      glowShadow: "shadow-[0_0_30px_rgba(148,163,184,0.1)]",
    },
  }[data.status];

  // Cálculo SVG do Gauge circular (raio 40, circunferência ~ 251.33)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (data.overallOdds / 100) * circumference;

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl transition-all ${className}`}
    >
      {/* Luz Neon no topo adaptada ao status */}
      <div
        className={`absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent ${statusTheme.neon} to-transparent`}
      />

      {/* Glow Cósmico de Fundo */}
      <div
        className={`pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full ${statusTheme.ambient} blur-3xl`}
      />

      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-2 text-violet-400 shadow-sm shadow-violet-500/20">
            <BrainCircuit size={18} />
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase tracking-widest text-violet-400">
              Projeção Preditiva
            </span>
            <h3 className="text-xs font-bold text-white tracking-wide">
              Chance de Aprovação
            </h3>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTooltip((prev) => !prev)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="cursor-pointer text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg"
            aria-label="Como é calculado o índice"
          >
            <HelpCircle size={15} />
          </button>

          {showTooltip && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-violet-500/30 bg-[#0B0A16]/95 p-3.5 text-[11px] text-slate-300 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <span className="block font-bold text-white mb-1 flex items-center gap-1.5">
                <Sparkles size={12} className="text-cyan-400" />
                Fórmula Preditiva IA:
              </span>
              <ul className="space-y-1 text-slate-300 text-[10px]">
                <li>• 40% Cobertura do Edital</li>
                <li>• 40% Retenção Ponderada (por peso)</li>
                <li>• 20% Constância Semanal (Streak/Meta)</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bloco Central: Medidor Circular & Diagnóstico */}
      <div className="my-5 flex flex-col sm:flex-row items-center justify-between gap-5">
        {/* Medidor Circular SVG */}
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
          <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Gradiente do traço */}
            <defs>
              <linearGradient
                id={`odds-gradient-${data.status}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={statusTheme.gaugeGradient[0]} />
                <stop offset="50%" stopColor={statusTheme.gaugeGradient[1]} />
                <stop offset="100%" stopColor={statusTheme.gaugeGradient[2]} />
              </linearGradient>
            </defs>

            {/* Trilha de fundo */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              className="text-white/5"
            />

            {/* Arco de progresso */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={`url(#odds-gradient-${data.status})`}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Valor Central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight leading-none drop-shadow-sm">
              {data.overallOdds}%
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              Score
            </span>
          </div>
        </div>

        {/* Diagnóstico Qualitativo */}
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-mono font-extrabold uppercase tracking-widest shadow-xs">
            <span
              className={`inline-block h-2 w-2 rounded-full animate-pulse ${
                data.status === "ZONA_DE_APROVACAO"
                  ? "bg-emerald-400"
                  : data.status === "COMPETITIVO"
                    ? "bg-cyan-400"
                    : "bg-violet-400"
              }`}
            />
            <span className={statusTheme.badge}>{data.statusLabel}</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
            {data.statusDescription}
          </p>
        </div>
      </div>

      {/* 3 Mini-Indicadores dos Pilares */}
      <div className="space-y-2.5 border-t border-white/5 pt-4">
        {/* 1. Cobertura do Edital */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Layers size={12} className="text-violet-400" />
              Cobertura do Edital
            </span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[10px] text-slate-500">
                {data.pillars.coverage.completedTopics}/
                {data.pillars.coverage.totalTopics} tópicos
              </span>
              <strong className="text-xs font-bold text-violet-300">
                {data.pillars.coverage.score}%
              </strong>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-950 border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.pillars.coverage.score}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-linear-to-r from-violet-600 to-purple-400"
            />
          </div>
        </div>

        {/* 2. Retenção Ponderada em Simulados */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Target size={12} className="text-cyan-400" />
              Retenção em Simulados
            </span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[10px] text-slate-500">
                {data.pillars.domain.totalQuestions > 0
                  ? `${data.pillars.domain.correctQuestions}/${data.pillars.domain.totalQuestions} acertos`
                  : "Por peso"}
              </span>
              <strong className="text-xs font-bold text-cyan-300">
                {data.pillars.domain.score}%
              </strong>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-950 border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.pillars.domain.score}%` }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="h-full rounded-full bg-linear-to-r from-cyan-500 to-emerald-400"
            />
          </div>
        </div>

        {/* 3. Constância Semanal */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Flame size={12} className="text-amber-400" />
              Constância Semanal
            </span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[10px] text-slate-500">
                {data.pillars.constancy.streakDays}d streak
              </span>
              <strong className="text-xs font-bold text-amber-300">
                {data.pillars.constancy.score}%
              </strong>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-950 border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.pillars.constancy.score}%` }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="h-full rounded-full bg-linear-to-r from-amber-500 to-orange-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApprovalOddsCard;
