"use client";

import React, { useMemo } from "react";
import { Zap, Clock, Target, TrendingUp, Layers, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HeatmapDay {
  date: string;
  count: number;
  level: number;
}

interface KeyMetricsCardProps {
  isLoading?: boolean;
  totalTime?: string;
  precision?: string;
  sessionsCount?: number;
  questionsCount?: number;
  averageTimePerSession?: string;
  heatmap?: HeatmapDay[];
  className?: string;
}

const WEEKDAY_NAMES = ["S", "T", "Q", "Q", "S", "S", "D"];

export function KeyMetricsCard({
  isLoading = false,
  totalTime = "0h 0m",
  precision = "0%",
  sessionsCount = 0,
  questionsCount = 0,
  averageTimePerSession = "0min",
  heatmap = [],
  className = "",
}: KeyMetricsCardProps) {
  // Pega os últimos 7 dias do heatmap para renderizar o mini histograma
  const last7Days = useMemo(() => {
    if (!heatmap || heatmap.length === 0) {
      return Array.from({ length: 7 }, (_, i) => ({
        date: "",
        count: 0,
        level: 0,
        label: WEEKDAY_NAMES[i],
        isToday: i === 6,
      }));
    }

    const slice = heatmap.slice(-7);
    const todayStr = format(new Date(), "yyyy-MM-dd");

    return slice.map((item, idx) => {
      let label = WEEKDAY_NAMES[idx] || "";
      if (item.date) {
        try {
          const parsed = parseISO(item.date);
          label = format(parsed, "ccccc", { locale: ptBR }).toUpperCase();
        } catch {
          label = WEEKDAY_NAMES[idx] || "";
        }
      }
      return {
        ...item,
        label,
        isToday: item.date === todayStr,
      };
    });
  }, [heatmap]);

  // Encontra o pico de ações na semana para calcular altura percentual das barras
  const maxCount = useMemo(() => {
    const counts = last7Days.map((d) => d.count);
    return Math.max(1, ...counts);
  }, [last7Days]);

  const totalWeeklyActions = useMemo(() => {
    return last7Days.reduce((acc, d) => acc + d.count, 0);
  }, [last7Days]);

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] bg-linear-to-br from-slate-950/80 via-[#0a0d1a]/90 to-slate-950/90 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-indigo-500/30 ${className}`}
    >
      {/* Luz ambiente de fundo */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/40 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* ================= 1. CABEÇALHO ================= */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
            <Zap size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Estatísticas Chave
            </h3>
            <p className="text-[10px] text-slate-400">Telemetria de performance em tempo real</p>
          </div>
        </div>

        <span className="flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[9px] font-black uppercase text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Tempo Real
        </span>
      </div>

      {/* ================= 2. LINHA DE MÉTRICAS PRINCIPAIS ================= */}
      <div className="relative z-10 my-3 grid grid-cols-2 gap-3">
        {/* Tempo Total */}
        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tempo Total
            </span>
            <Clock size={12} className="text-indigo-400" />
          </div>
          {isLoading ? (
            <div className="h-7 w-20 rounded bg-white/10 animate-pulse my-0.5" />
          ) : (
            <span className="font-mono text-xl font-black text-white tracking-tight">
              {totalTime}
            </span>
          )}
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Acumulado em estudos
          </span>
        </div>

        {/* Precisão Geral */}
        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Precisão
            </span>
            <Target size={12} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            {isLoading ? (
              <div className="h-7 w-16 rounded bg-emerald-400/20 animate-pulse my-0.5" />
            ) : (
              <span className="font-mono text-xl font-black text-emerald-400 tracking-tight">
                {precision}
              </span>
            )}
            <span className="text-[9px] font-mono font-bold text-slate-400">
              Média de acertos
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-900 border border-white/5 p-0.2">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-500"
              style={{ width: precision }}
            />
          </div>
        </div>
      </div>

      {/* ================= 3. MINI HISTOGRAMA DE RITMO SEMANAL (Preenche o vácuo!) ================= */}
      <div className="relative z-10 rounded-2xl border border-white/5 bg-slate-950/50 p-3 my-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <TrendingUp size={12} className="text-cyan-400" />
            Ritmo dos Últimos 7 Dias
          </span>
          <span className="font-mono text-[9px] text-slate-400">
            {totalWeeklyActions} revisões na semana
          </span>
        </div>

        {/* 7 Colunas Verticais */}
        <div className="grid grid-cols-7 gap-2 items-end h-16 pt-2 px-1">
          {last7Days.map((day, idx) => {
            const heightPercent =
              day.count > 0 ? Math.max(18, Math.round((day.count / maxCount) * 100)) : 8;

            return (
              <div
                key={idx}
                className="group/bar flex flex-col items-center justify-end h-full relative"
                title={`${day.date ? day.date : "Dia"}: ${day.count} ações`}
              >
                {/* Tooltip no Hover */}
                <div className="absolute -top-7 hidden group-hover/bar:flex items-center justify-center rounded-md bg-slate-900 border border-white/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow-lg pointer-events-none whitespace-nowrap z-20">
                  {day.count} ações
                </div>

                {/* Barra */}
                <div className="w-full max-w-[18px] bg-slate-900 rounded-lg overflow-hidden h-full flex items-end border border-white/5">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-md transition-all duration-500 ${
                      day.isToday
                        ? "bg-linear-to-t from-cyan-500 to-indigo-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                        : day.count > 0
                          ? "bg-linear-to-t from-indigo-600 to-indigo-400"
                          : "bg-slate-800/40"
                    }`}
                  />
                </div>

                {/* Rótulo do Dia */}
                <span
                  className={`mt-1.5 font-mono text-[9px] font-bold ${
                    day.isToday ? "text-cyan-400 font-black" : "text-slate-500"
                  }`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 4. RODAPÉ DE MÉTRICAS COMPACTAS ================= */}
      <div className="relative z-10 grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
          <span className="block text-[9px] font-bold uppercase text-slate-400">
            Sessões
          </span>
          {isLoading ? (
            <div className="mx-auto my-0.5 h-4 w-8 rounded bg-white/10 animate-pulse" />
          ) : (
            <span className="font-mono text-sm font-black text-white">
              {sessionsCount}
            </span>
          )}
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
          <span className="block text-[9px] font-bold uppercase text-slate-400">
            Questões
          </span>
          {isLoading ? (
            <div className="mx-auto my-0.5 h-4 w-8 rounded bg-white/10 animate-pulse" />
          ) : (
            <span className="font-mono text-sm font-black text-white">
              {questionsCount}
            </span>
          )}
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
          <span className="block text-[9px] font-bold uppercase text-slate-400">
            Méd/Dia
          </span>
          {isLoading ? (
            <div className="mx-auto my-0.5 h-4 w-10 rounded bg-white/10 animate-pulse" />
          ) : (
            <span className="font-mono text-sm font-black text-white">
              {averageTimePerSession}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
