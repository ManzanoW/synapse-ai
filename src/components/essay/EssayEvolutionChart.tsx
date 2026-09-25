"use client";

import React from "react";
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles,
  BarChart3,
  Target,
} from "lucide-react";

interface HistoryEssayItem {
  id: string;
  themeTitle: string;
  banca: string;
  score: number | null;
  maxScore: number;
  isApproved: boolean | null;
  createdAt: string;
}

interface EssayEvolutionChartProps {
  history: HistoryEssayItem[];
}

export function EssayEvolutionChart({ history }: EssayEvolutionChartProps) {
  if (!history || history.length === 0) return null;

  // Ordena cronologicamente (da mais antiga para a mais recente)
  const chronological = [...history]
    .filter((h) => typeof h.score === "number" && h.score !== null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (chronological.length === 0) return null;

  // Métricas
  const totalSubmissions = chronological.length;
  const scores = chronological.map((h) => h.score as number);
  const averageScore = Math.round(
    scores.reduce((acc, curr) => acc + curr, 0) / Math.max(1, scores.length)
  );
  const highestScore = Math.max(...scores);
  const latestScore = scores[scores.length - 1];
  const firstScore = scores[0];
  const scoreEvolution = latestScore - firstScore;

  const approvedCount = chronological.filter(
    (h) => h.isApproved || (h.score && h.score >= 60)
  ).length;
  const approvalRate = Math.round((approvedCount / Math.max(1, totalSubmissions)) * 100);

  // Dimensões do SVG
  const chartHeight = 160;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 30;

  const points = chronological.map((item, index) => {
    const x =
      chronological.length === 1
        ? chartWidth / 2
        : paddingX +
          (index / (chronological.length - 1)) * (chartWidth - paddingX * 2);

    const normalizedScore = Math.min(100, Math.max(0, item.score || 0));
    // Invertido para o SVG (0 no topo, 100 na base do chart)
    const y =
      chartHeight -
      paddingY -
      (normalizedScore / 100) * (chartHeight - paddingY * 2);

    return { x, y, score: item.score || 0, date: item.createdAt, banca: item.banca };
  });

  // Linha do SVG
  const pathD = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    // Curva suave
    const prev = points[idx - 1];
    const cX = (prev.x + pt.x) / 2;
    return `${acc} C ${cX} ${prev.y}, ${cX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");

  // Área preenchida com gradiente sob a curva
  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
      : "";

  // Linha de corte de aprovação (60 pontos)
  const cutoffY = chartHeight - paddingY - (60 / 100) * (chartHeight - paddingY * 2);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-sm dark:shadow-xl space-y-6">
      {/* CABEÇALHO COM CARDS DE KPI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-violet-600 dark:text-violet-400" />
              <span>Evolução da Nota Discursiva</span>
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/20 dark:border-violet-500/30">
              PROGRESSÃO
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acompanhe o seu avanço nos critérios de conteúdo, coesão e gramática
          </p>
        </div>

        {chronological.length >= 2 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                scoreEvolution >= 0
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
              }`}
            >
              <TrendingUp size={13} className={scoreEvolution < 0 ? "rotate-180" : ""} />
              <span>
                {scoreEvolution >= 0 ? `+${scoreEvolution}` : scoreEvolution} pts no histórico
              </span>
            </span>
          </div>
        )}
      </div>

      {/* MÉTRICAS CHAVE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <BarChart3 size={12} className="text-violet-600 dark:text-violet-400" /> Média Geral
          </span>
          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {averageScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Award size={12} className="text-amber-500 dark:text-amber-400" /> Nota Mais Alta
          </span>
          <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-300">
            {highestScore} <span className="text-xs font-normal text-slate-400">pts</span>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-500 dark:text-emerald-400" /> Taxa de Aprovação
          </span>
          <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
            {approvalRate}%
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Target size={12} className="text-indigo-600 dark:text-indigo-400" /> Última Nota
          </span>
          <p className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-300">
            {latestScore} <span className="text-xs font-normal text-slate-400">pts</span>
          </p>
        </div>
      </div>

      {/* GRÁFICO SVG RESPONSIVO */}
      {chronological.length >= 2 ? (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[500px] w-full">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Linha de Grade: 100 pontos */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={chartWidth - paddingX}
                y2={paddingY}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeDasharray="3 3"
                strokeWidth="0.8"
              />
              <text
                x={paddingX - 8}
                y={paddingY + 3}
                className="fill-slate-400 dark:fill-slate-500"
                fontSize="9"
                textAnchor="end"
                fontFamily="monospace"
              >
                100
              </text>

              {/* Linha de Corte: 60 pontos */}
              <line
                x1={paddingX}
                y1={cutoffY}
                x2={chartWidth - paddingX}
                y2={cutoffY}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth="1"
                opacity="0.8"
              />
              <text
                x={chartWidth - paddingX + 6}
                y={cutoffY + 3}
                fill="#f59e0b"
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
              >
                Corte: 60
              </text>

              {/* Linha de Base: 0 pontos */}
              <line
                x1={paddingX}
                y1={chartHeight - paddingY}
                x2={chartWidth - paddingX}
                y2={chartHeight - paddingY}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="1"
              />
              <text
                x={paddingX - 8}
                y={chartHeight - paddingY + 3}
                className="fill-slate-400 dark:fill-slate-500"
                fontSize="9"
                textAnchor="end"
                fontFamily="monospace"
              >
                0
              </text>

              {/* Área Sombreada */}
              {areaD && <path d={areaD} fill="url(#chartGradient)" />}

              {/* Linha Principal da Curva */}
              <path
                d={pathD}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Pontos da Curva */}
              {points.map((pt, idx) => {
                const isApproved = pt.score >= 60;
                return (
                  <g key={idx} className="transition-transform group">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill={isApproved ? "#10b981" : "#f43f5e"}
                      className="stroke-white dark:stroke-slate-900"
                      strokeWidth="2"
                    />

                    {/* Badge com a nota acima do ponto */}
                    <text
                      x={pt.x}
                      y={pt.y - 9}
                      textAnchor="middle"
                      className="fill-slate-800 dark:fill-slate-100 font-bold"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {pt.score}
                    </text>

                    {/* Rótulo inferior da redação (ex: #1, #2) */}
                    <text
                      x={pt.x}
                      y={chartHeight - paddingY + 16}
                      textAnchor="middle"
                      className="fill-slate-400 dark:fill-slate-500"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      #{idx + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            🎯 Pratique mais uma redação para desbloquear a linha completa de evolução de notas!
          </p>
          <p className="text-[11px] text-slate-500">
            Você já completou sua primeira redação oficial com nota <strong>{scores[0]}</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
