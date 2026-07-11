"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface AnalyticsData {
  metrics: {
    totalTopics: number;
    completedReviews: number;
    estimatedRetention: string;
    avgEasiness: number;
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
        <span className="text-sm text-slate-400 font-medium">
          Processando métricas de retenção...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <AlertTriangle size={40} className="text-rose-500 animate-pulse" />
        <h3 className="text-lg font-bold">Ops! Algo deu errado</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          {error || "Não foi possível carregar o painel."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* ================= HEADER ================= */}
        <div className="flex items-center gap-3 border-b border-slate-900 pb-5">
          <button
            onClick={openSidebar}
            className="p-2 bg-[#090d16] border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 md:hidden transition-colors"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 size={24} className="text-indigo-400" />
              Desempenho & Analytics
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Acompanhe a sua evolução e a força da sua memória no tempo.
            </p>
          </div>
        </div>

        {/* ================= CARDS DE MÉTRICAS INDICES COGNITIVOS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Retenção Estimada */}
          <div className="bg-[#090d16] border border-slate-800/60 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Retenção Estimada
                </span>
                <span className="text-3xl font-black text-emerald-400 block font-mono">
                  {data.metrics.estimatedRetention}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              Probabilidade atual de lembrar dos tópicos estudados.
            </p>
          </div>

          {/* Card 2: Grau de Domínio (Traduzido do Fator SM-2) */}
          <div className="bg-[#090d16] border border-slate-800/60 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Grau de Domínio
                </span>
                <span className="text-3xl font-black text-indigo-400 block font-mono">
                  {data.metrics.avgEasiness
                    ? ((data.metrics.avgEasiness / 2.5) * 10).toFixed(1)
                    : "10"}
                  <span className="text-xs text-slate-500 font-normal">
                    {" "}
                    / 10
                  </span>
                </span>
              </div>
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Activity size={18} />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              Média de facilidade e familiaridade com os temas estudados.
            </p>
          </div>

          {/* Card 3: Revisões Feitas */}
          <div className="bg-[#090d16] border border-slate-800/60 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Revisões Realizadas
                </span>
                <span className="text-3xl font-black text-slate-100 block font-mono">
                  {data.metrics.completedReviews}
                </span>
              </div>
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
                <CheckSquare size={18} />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              Total de sessões de repetição espaçada concluídas.
            </p>
          </div>

          {/* Card 4: Tópicos Mapeados */}
          <div className="bg-[#090d16] border border-slate-800/60 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tópicos no Edital
                </span>
                <span className="text-3xl font-black text-amber-400 block font-mono">
                  {data.metrics.totalTopics}
                </span>
              </div>
              <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                <Calendar size={18} />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              Assuntos cadastrados na sua esteira de planejamento.
            </p>
          </div>
        </div>

        {/* ================= SEÇÃO DOS GRÁFICOS NATIVOS TAILWIND ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico 1: Distribuição de Carga das Próximas Revisões */}
          <div className="lg:col-span-7 bg-[#090d16] border border-slate-800/60 rounded-2xl p-5 shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Carga de Revisão da Semana
              </h3>
              <p className="text-xs text-slate-400">
                Quantidade de assuntos que vão expirar na curva de esquecimento
                a cada dia.
              </p>
            </div>

            <div className="flex h-48 items-end gap-3 pt-6 px-2 justify-between">
              {data.chartDistribution.map((item, idx) => {
                const maxQty = Math.max(
                  ...data.chartDistribution.map((d) => d.quantidade),
                  1,
                );
                const heightPercent = `${(item.quantidade / maxQty) * 100}%`;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <div className="relative w-full flex justify-center">
                      <span className="absolute -top-6 text-[10px] font-mono font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shadow-md">
                        {item.quantidade}
                      </span>
                    </div>
                    <div
                      style={{ height: heightPercent }}
                      className={`w-full max-w-10 rounded-t-lg transition-all duration-500 ${
                        item.quantidade > 0
                          ? "bg-linear-to-t from-indigo-600 to-purple-500 shadow-lg shadow-indigo-950/40 group-hover:from-indigo-500 group-hover:to-pink-500"
                          : "bg-slate-950 border border-slate-900 h-1!"
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 font-medium uppercase mt-1">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico 2: Perfil de Resposta Histórico */}
          <div className="lg:col-span-5 bg-[#090d16] border border-slate-800/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Qualidade da Memorização
              </h3>
              <p className="text-xs text-slate-400">
                Distribuição dos feedbacks dados nas últimas 10 revisões.
              </p>
            </div>

            <div className="space-y-4 py-2 flex-1 flex flex-col justify-center">
              {[
                {
                  label: "🚀 Excelente (Bom)",
                  value: data.performanceSummary.bom,
                  color: "bg-emerald-500",
                  text: "text-emerald-400",
                },
                {
                  label: "⚠️ Regular (Difícil)",
                  value: data.performanceSummary.dificil,
                  color: "bg-amber-500",
                  text: "text-amber-400",
                },
                {
                  label: "💥 Crítico (Errei)",
                  value: data.performanceSummary.errei,
                  color: "bg-rose-500",
                  text: "text-rose-400",
                },
              ].map((item, idx) => {
                const total =
                  data.performanceSummary.bom +
                    data.performanceSummary.dificil +
                    data.performanceSummary.errei || 1;
                const barWidth = `${(item.value / total) * 100}%`;

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-300">{item.label}</span>
                      <span className={`font-mono font-bold ${item.text}`}>
                        {item.value}x
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 border border-slate-900 rounded-full overflow-hidden p-0.5">
                      <div
                        style={{ width: barWidth }}
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              Dica do Synapse: Se a barra de itens <b>Críticos</b> crescer,
              cogite quebrar a matéria em tópicos menores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
