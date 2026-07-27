"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSidebar } from "@/lib/sidebar-context";
import {
  Menu,
  BarChart3,
  TrendingUp,
  Calendar,
  CheckSquare,
  Loader2,
  AlertTriangle,
  Activity,
  Flame,
  ArrowRight,
  Zap,
  Sparkles,
  Brain,
} from "lucide-react";

interface AnalyticsData {
  metrics: {
    totalTopics: number;
    completedReviews: number;
    estimatedRetention: string;
    avgEasiness: number;
    materiasPendentes: number;
  };
  chartDistribution: Array<{ day: string; quantidade: number }>;
  performanceSummary: {
    bom: number;
    dificil: number;
    errei: number;
  };
}

export default function AnalyticsPage() {
  const { openSidebar } = useSidebar();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentDayName = new Date()
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .substring(0, 3)
    .toUpperCase();

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/analytics");
        if (!response.ok) throw new Error("Falha ao carregar estatísticas");
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          Carregando métricas de retenção...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500">
          <AlertTriangle size={36} className="animate-bounce" />
        </div>
        <h3 className="text-lg font-bold">Ops! Algo deu errado</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          {error || "Não foi possível carregar o painel."}
        </p>
      </div>
    );
  }

  const totalSummary =
    data.performanceSummary.bom +
    data.performanceSummary.dificil +
    data.performanceSummary.errei;

  const maxChartQty = Math.max(
    ...data.chartDistribution.map((d) => d.quantidade),
    1,
  );

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 p-4 md:p-8 font-sans antialiased select-none overflow-hidden">
      {/* ================= EFETUANDO NEON AMBIENCE GLOW DE FUNDO ================= */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        {/* ================= HEADER ================= */}
        <div className="flex items-center gap-3">
          <button
            onClick={openSidebar}
            className="p-2.5 bg-slate-900/80 border border-white/10 rounded-2xl text-slate-400 hover:text-white md:hidden transition-all active:scale-95"
          >
            <Menu size={20} />
          </button>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-linear-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Activity size={13} className="text-indigo-400" />
              <span>Analytics & Métricas</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <BarChart3
                size={32}
                className="text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.5)]"
              />
              Desempenho
            </h1>
            <p className="text-slate-400 text-xs md:text-sm">
              Acompanhe a sua evolução contínua e a força da sua memória no
              tempo.
            </p>
          </div>
        </div>

        {/* ================= BANNER DE AÇÃO (REVISÃO PENDENTE) ================= */}
        {data.metrics.materiasPendentes > 0 ? (
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-950/70 via-indigo-900/40 to-slate-950/80 border border-indigo-500/40 p-6 shadow-[0_0_50px_-12px_rgba(99,102,241,0.35)] backdrop-blur-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-indigo-500/60 transition-all">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-indigo-400/60 to-transparent" />
            <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-13 h-13 rounded-2xl bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 flex items-center justify-center shrink-0 shadow-[0_0_25px_rgba(99,102,241,0.4)]">
                <Flame size={24} className="text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Revisão Pendente
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-black shadow-[0_0_12px_rgba(99,102,241,0.6)]">
                    {data.metrics.materiasPendentes}
                  </span>
                </h3>
                <p className="text-slate-300 text-xs">
                  Você tem {data.metrics.materiasPendentes} matérias que
                  venceram hoje na sua curva de repetição.
                </p>
              </div>
            </div>

            <Link
              href="/planner"
              className="relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(99,102,241,0.7)] active:scale-95 shrink-0"
            >
              <span>Ir para o Planner</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-white/10 p-6 backdrop-blur-2xl flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Tudo em dia por aqui!
                </h3>
                <p className="text-slate-400 text-xs">
                  Você não possui nenhuma revisão acumulada para hoje.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= CARDS DE MÉTRICAS (KPIS) ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Retenção Estimada */}
          <div className="relative group overflow-hidden bg-slate-900/40 border border-white/10 hover:border-emerald-500/50 rounded-3xl p-6 backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.25)] hover:-translate-y-0.5">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                Retenção Estimada
              </span>
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-emerald-300 to-emerald-500 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                {data.metrics.estimatedRetention}
              </div>
              <p className="text-slate-400 text-[11px]">
                Probabilidade atual de lembrar dos tópicos.
              </p>
            </div>
          </div>

          {/* Card 2: Grau de Domínio */}
          <div className="relative group overflow-hidden bg-slate-900/40 border border-white/10 hover:border-indigo-500/50 rounded-3xl p-6 backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.25)] hover:-translate-y-0.5">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                Grau de Domínio
              </span>
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Activity size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-indigo-300 to-indigo-500 font-mono tracking-tight flex items-baseline gap-1 drop-shadow-[0_0_15px_rgba(129,140,248,0.3)]">
                {data.metrics.avgEasiness
                  ? ((data.metrics.avgEasiness / 2.5) * 10).toFixed(1)
                  : "10.0"}
                <span className="text-xs font-semibold text-slate-500 font-sans">
                  / 10
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Média de facilidade e familiaridade.
              </p>
            </div>
          </div>

          {/* Card 3: Revisões Realizadas */}
          <div className="relative group overflow-hidden bg-slate-900/40 border border-white/10 hover:border-purple-500/50 rounded-3xl p-6 backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.25)] hover:-translate-y-0.5">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-purple-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                Revisões Realizadas
              </span>
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <CheckSquare size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-black text-white font-mono tracking-tight">
                {data.metrics.completedReviews}
              </div>
              <p className="text-slate-400 text-[11px]">
                Sessões de repetição concluídas.
              </p>
            </div>
          </div>

          {/* Card 4: Tópicos no Edital */}
          <div className="relative group overflow-hidden bg-slate-900/40 border border-white/10 hover:border-amber-500/50 rounded-3xl p-6 backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.25)] hover:-translate-y-0.5">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-amber-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                Tópicos no Edital
              </span>
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Calendar size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-300 to-amber-500 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                {data.metrics.totalTopics}
              </div>
              <p className="text-slate-400 text-[11px]">
                Assuntos na esteira de planejamento.
              </p>
            </div>
          </div>
        </div>

        {/* ================= GRÁFICOS PRINCIPAIS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Gráfico 1: Carga de Revisão */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Carga de Revisão da Semana
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Assuntos previstos para expirar na curva de esquecimento.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold shadow-[0_0_10px_rgba(99,102,241,0.15)]">
                <Zap size={13} className="text-indigo-400" />
                <span>Semana Atual</span>
              </div>
            </div>

            <div className="h-60 w-full flex items-end justify-between gap-2 md:gap-4 pt-8 px-2">
              {data.chartDistribution.map((item, idx) => {
                const heightPercent = `${(item.quantidade / maxChartQty) * 100}%`;
                const isToday = item.day.toUpperCase() === currentDayName;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group cursor-pointer"
                  >
                    {/* Tooltip Hover */}
                    <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-[10px] font-bold text-indigo-200 bg-indigo-950/90 border border-indigo-500/40 px-2 py-0.5 rounded-md shadow-xl pointer-events-none">
                      {item.quantidade}
                    </span>

                    {/* Container da Barra estilo Cápsula Cyber */}
                    <div
                      className={`w-full max-w-11 bg-slate-950/80 rounded-2xl h-full flex items-end overflow-hidden p-1 border transition-all ${
                        isToday
                          ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.35)] bg-indigo-950/30"
                          : "border-white/5 group-hover:border-white/20"
                      }`}
                    >
                      <div
                        style={{
                          height: item.quantidade > 0 ? heightPercent : "8%",
                        }}
                        className={`w-full rounded-xl transition-all duration-700 ${
                          item.quantidade > 0
                            ? "bg-linear-to-t from-indigo-600 via-purple-500 to-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] group-hover:brightness-125"
                            : "bg-slate-800/40"
                        }`}
                      />
                    </div>

                    {/* Rótulo do Dia */}
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        isToday
                          ? "text-indigo-400 font-black drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                          : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    >
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico 2: Qualidade da Memorização */}
          <div className="lg:col-span-5 bg-slate-900/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-purple-500/30 to-transparent" />

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Qualidade da Memorização
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Distribuição dos feedbacks acumulados.
              </p>
            </div>

            {/* Lista de Barras de Progresso */}
            <div className="space-y-6 my-auto">
              {[
                {
                  label: "🚀 Excelente (Bom)",
                  value: data.performanceSummary.bom,
                  barColor: "bg-emerald-500 shadow-[0_0_12px_#10b981]",
                  textColor: "text-emerald-400",
                },
                {
                  label: "⚠️ Regular (Difícil)",
                  value: data.performanceSummary.dificil,
                  barColor: "bg-amber-500 shadow-[0_0_12px_#f59e0b]",
                  textColor: "text-amber-400",
                },
                {
                  label: "💥 Crítico (Errei)",
                  value: data.performanceSummary.errei,
                  barColor: "bg-rose-500 shadow-[0_0_12px_#f43f5e]",
                  textColor: "text-rose-400",
                },
              ].map((item, idx) => {
                const percentage =
                  totalSummary > 0
                    ? Math.round((item.value / totalSummary) * 100)
                    : 0;

                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-200">{item.label}</span>
                      <span className={`font-mono font-bold ${item.textColor}`}>
                        {item.value}x{" "}
                        <span className="text-[10px] text-slate-500 font-sans font-normal">
                          ({percentage}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-950/90 rounded-full overflow-hidden border border-white/5 p-0.5">
                      <div
                        style={{ width: `${percentage > 0 ? percentage : 2}%` }}
                        className={`h-full ${
                          percentage > 0 ? item.barColor : "bg-slate-800/50"
                        } rounded-full transition-all duration-700`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dica da IA - Card Neon Destacado */}
            <div className="mt-6 relative overflow-hidden p-3 rounded-2xl bg-linear-to-r from-indigo-950/60 via-indigo-900/30 to-slate-950/80 border border-indigo-500/40 shadow-[0_0_30px_-5px_rgba(99,102,241,0.25)] backdrop-blur-2xl flex items-center gap-4 transition-all hover:border-indigo-500/60">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 shadow-[0_0_18px_rgba(99,102,241,0.35)]">
                <Brain size={22} className="text-indigo-400" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-300 tracking-widest block drop-shadow-[0_0_10px_rgba(129,140,248,0.6)]">
                  Insight Synapse AI
                </span>
                <p className="text-xs text-slate-200 leading-snug">
                  Se os itens{" "}
                  <strong className="text-rose-400 font-bold drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                    Críticos
                  </strong>{" "}
                  crescerem, cogite fragmentar a matéria em tópicos menores.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
