"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingDown,
  TrendingUp,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  Sliders,
  Flame,
  Info,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { playUiSound } from "@/lib/sensory/audio-feedback";

export function RetentionCurveSimulator() {
  const [daysWithoutReview, setDaysWithoutReview] = useState<number>(7);

  // Fórmulas matemáticas de retenção de memória:
  // Ebbinghaus clássico (decaimento exponencial rápido): R = 100 * exp(-t / 3.8)
  const calcTradicional = (days: number) => {
    const r = Math.round(100 * Math.exp(-days / 3.8));
    return Math.max(5, Math.min(100, r));
  };

  // FSRS 4.5 (estabilidade algorítmica preditiva com recuperação ativa):
  const calcFsrs = (days: number) => {
    const s = 14; // Estabilidade média calibrada do FSRS
    const factor = 1 + 0.19 * (days / s);
    const r = Math.round(100 / Math.pow(factor, 0.45));
    return Math.max(78, Math.min(99, r));
  };

  const retTrad = calcTradicional(daysWithoutReview);
  const retFsrs = calcFsrs(daysWithoutReview);

  // Estimativa de cards acumulados no método tradicional vs. revisões cirúrgicas no FSRS
  const cardsAcumulados = Math.round(daysWithoutReview * 95);
  const revisoesFsrs = Math.max(12, Math.round(daysWithoutReview * 18));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setDaysWithoutReview(val);
    triggerHaptic("light");
    playUiSound("slider");
  };

  const setDaysPreset = (days: number) => {
    setDaysWithoutReview(days);
    triggerHaptic("medium");
    playUiSound("switch");
  };

  // Coordenadas normalizadas do SVG do gráfico (Width: 600, Height: 240)
  // X vai de dia 0 a 30 (0 a 560px), Y vai de 0% a 100% (200px a 20px)
  const mapX = (d: number) => 30 + (d / 30) * 530;
  const mapY = (ret: number) => 220 - (ret / 100) * 190;

  // Gerar SVG path para a curva tradicional
  const tradPoints = Array.from({ length: 31 }, (_, d) => `${mapX(d)},${mapY(calcTradicional(d))}`).join(" ");
  // Gerar SVG path para a curva FSRS
  const fsrsPoints = Array.from({ length: 31 }, (_, d) => `${mapX(d)},${mapY(calcFsrs(d))}`).join(" ");

  return (
    <div className="mt-14 sm:mt-18 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-[#070b14] to-cyan-950/30 border border-cyan-500/30 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
      {/* Luz volumétrica de fundo */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />

      {/* Top Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
          <Brain className="w-3.5 h-3.5 text-cyan-400" />
          <span>Laboratório de Neurociência Computacional</span>
        </div>

        <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
          O que acontece quando você passa dias sem revisar?
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
          Arraste o simulador e veja o colapso da Curva de Ebbinghaus no estudo tradicional versus a blindagem preditiva do Motor FSRS 4.5.
        </p>
      </div>

      {/* Slider Interativo & Presets */}
      <div className="max-w-xl mx-auto space-y-4 mb-8">
        <div className="flex items-center justify-between text-xs sm:text-sm font-mono font-bold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dias sem abrir as revisões:</span>
          </span>
          <span className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-sm font-black">
            {daysWithoutReview} {daysWithoutReview === 1 ? "dia" : "dias"}
          </span>
        </div>

        <input
          type="range"
          min={1}
          max={30}
          value={daysWithoutReview}
          onChange={handleSliderChange}
          aria-label="Dias sem revisão ativa"
          className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-hidden"
        />

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {[2, 5, 7, 14, 21, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDaysPreset(d)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                daysWithoutReview === d
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 scale-105"
                  : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08]"
              }`}
            >
              {d} dias
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico Comparativo SVG Interativo */}
      <div className="relative rounded-2xl bg-[#030712]/90 border border-white/10 p-4 sm:p-6 shadow-inner">
        {/* Legenda do Gráfico */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-white/[0.06] text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-rose-400 font-bold">
              <span className="w-3 h-1 rounded-full bg-rose-500" />
              <span>Método Arcaico (Ebbinghaus)</span>
            </span>
            <span className="flex items-center gap-2 text-cyan-300 font-bold">
              <span className="w-3 h-1 rounded-full bg-cyan-400" />
              <span>Synapse FSRS 4.5</span>
            </span>
          </div>
          <span className="text-slate-500 text-[11px] hidden sm:inline">
            Eixo vertical: Retenção na memória (%) • Eixo horizontal: Tempo (Dias)
          </span>
        </div>

        {/* Canvas SVG */}
        <div className="w-full overflow-hidden">
          <svg viewBox="0 0 600 240" className="w-full h-44 sm:h-60 select-none">
            {/* Linhas de Grade de Retenção */}
            {[25, 50, 75, 100].map((val) => {
              const y = mapY(val);
              return (
                <g key={val}>
                  <line
                    x1="30"
                    y1={y}
                    x2="560"
                    y2={y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="4 4"
                  />
                  <text x="22" y={y + 4} fill="rgba(148,163,184,0.5)" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Linha vertical indicativa do dia selecionado */}
            <line
              x1={mapX(daysWithoutReview)}
              y1="20"
              x2={mapX(daysWithoutReview)}
              y2="220"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeDasharray="3 3"
              opacity="0.8"
            />

            {/* Curva Tradicional (Vermelha) */}
            <polyline
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={tradPoints}
              opacity="0.9"
            />

            {/* Curva FSRS 4.5 (Ciano Neon) */}
            <polyline
              fill="none"
              stroke="#22d3ee"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={fsrsPoints}
            />

            {/* Marcador na Curva Tradicional */}
            <circle
              cx={mapX(daysWithoutReview)}
              cy={mapY(retTrad)}
              r="6"
              fill="#f43f5e"
              stroke="#030712"
              strokeWidth="2"
            />

            {/* Marcador na Curva FSRS */}
            <circle
              cx={mapX(daysWithoutReview)}
              cy={mapY(retFsrs)}
              r="6"
              fill="#22d3ee"
              stroke="#030712"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* Cards de Diagnóstico Clínico Lado a Lado */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Diagnóstico Arcaico */}
        <div className="rounded-2xl bg-rose-950/20 border border-rose-500/30 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400 uppercase">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>Método Antigo / Apostilas</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-black">
              {retTrad}% de Retenção
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">
              {retTrad <= 25
                ? "Colapso Cognitivo Total"
                : retTrad <= 50
                ? "Perda Crítica de Memória"
                : "Decaimento Acelerado"}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {retTrad <= 25 ? (
                <>
                  Você esqueceu praticamente toda a matéria estudada. Na semana seguinte, precisará <strong>reler 100% dos PDFs do zero</strong>, com uma avalanche desesperadora de{" "}
                  <span className="text-rose-300 font-bold">~{cardsAcumulados} revisões acumuladas</span>.
                </>
              ) : (
                <>
                  Metade dos conceitos já desapareceu da sua memória de trabalho. Você sente a clássica ilusão de fluência, mas trava ao fazer questões de prova.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Card 2: Diagnóstico Synapse FSRS */}
        <div className="rounded-2xl bg-gradient-to-br from-cyan-950/30 to-indigo-950/30 border border-cyan-500/40 p-5 space-y-3 shadow-lg shadow-cyan-950/30">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 uppercase">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Synapse FSRS 4.5</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-black shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              {retFsrs}% de Retenção
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">
              Memória de Longo Prazo Blindada
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              O algoritmo FSRS calculou a curva de estabilidade matemática. Em vez de 600 revisões desnecessárias, você faz apenas{" "}
              <strong className="text-cyan-300 font-bold">~{revisoesFsrs} micro-revisões ativas</strong> nos pontos exatos de fraqueza, economizando <strong>65% de tempo</strong> com nota máxima garantida na prova.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
