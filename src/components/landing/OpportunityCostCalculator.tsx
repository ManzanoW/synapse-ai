"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  Briefcase,
  Sliders,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { playUiSound } from "@/lib/sensory/audio-feedback";

interface CareerPreset {
  id: string;
  name: string;
  category: string;
  salary: number;
  icon: string;
}

const CAREERS: CareerPreset[] = [
  {
    id: "fiscal",
    name: "Auditor Fiscal (Receita / SEFAZ)",
    category: "Área Fiscal",
    salary: 24500,
    icon: "🏛️",
  },
  {
    id: "policial",
    name: "Agente / Perito (Polícia Federal)",
    category: "Área Policial",
    salary: 15200,
    icon: "👮",
  },
  {
    id: "analista",
    name: "Analista Judiciário (TRF / TJ / TRT)",
    category: "Tribunais",
    salary: 14800,
    icon: "⚖️",
  },
  {
    id: "tecnico",
    name: "Técnico Judiciário (Tribunais Federais)",
    category: "Tribunais",
    salary: 9200,
    icon: "📋",
  },
  {
    id: "juridica",
    name: "Procurador / Defensor Público",
    category: "Carreira Jurídica",
    salary: 32000,
    icon: "💼",
  },
];

export function OpportunityCostCalculator() {
  const [selectedCareerId, setSelectedCareerId] = useState<string>("fiscal");
  const [monthsAccelerated, setMonthsAccelerated] = useState<number>(3); // 3 meses de aceleração

  const currentCareer = CAREERS.find((c) => c.id === selectedCareerId) || CAREERS[0];
  const annualProCost = 358.8; // R$ 29,90 * 12

  // Total de salários recebidos a mais ao antecipar a posse
  const totalSalariesGained = currentCareer.salary * monthsAccelerated;
  const roiMultiplier = Math.round(totalSalariesGained / annualProCost);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCareerChange = (id: string) => {
    setSelectedCareerId(id);
    triggerHaptic("medium");
    playUiSound("switch");
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonthsAccelerated(Number(e.target.value));
    triggerHaptic("light");
    playUiSound("slider");
  };

  return (
    <section id="custo-oportunidade" className="relative py-24 sm:py-32 overflow-hidden bg-[#030712] border-t border-white/[0.06] scroll-mt-24">
      {/* Glow Divisor Superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-5xl h-px bg-gradient-to-r from-transparent via-emerald-500/35 via-cyan-500/35 to-transparent" />

      {/* Volumetric Lights */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-gradient-to-r from-emerald-600/[0.08] via-cyan-600/[0.1] to-indigo-600/[0.08] rounded-full blur-[160px] -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>Calculadora do Custo de Oportunidade</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Quanto custa cada mês de atraso{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
              na sua nomeação?
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Você não estuda para acumular apostilas. Você estuda para ver o seu nome no Diário Oficial e receber o primeiro contracheque da posse.
          </p>
        </div>

        {/* Grid Interativo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Lado Esquerdo: Controles & Seleção de Carreira (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl bg-[#070b14]/80 border border-white/10 p-6 sm:p-8 backdrop-blur-2xl flex flex-col justify-between space-y-6 shadow-xl">
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-bold block">
                  Passo 1 • Seu Cargo Alvo
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Selecione sua carreira dos sonhos:
                </h3>
              </div>

              {/* Lista de Carreiras em Botões Táteis */}
              <div className="space-y-2">
                {CAREERS.map((c) => {
                  const isSelected = c.id === selectedCareerId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleCareerChange(c.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900 border-emerald-500/50 shadow-md shadow-emerald-950/30"
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{c.icon}</span>
                        <div>
                          <div className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-300"}`}>
                            {c.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {c.category}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {formatBRL(c.salary)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">/mês</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Passo 2: Meses de Aceleração */}
              <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Se você antecipar sua posse em:</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-black">
                    {monthsAccelerated} {monthsAccelerated === 1 ? "mês" : "meses"}
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={12}
                  value={monthsAccelerated}
                  onChange={handleSliderChange}
                  aria-label="Meses antecipados até a posse"
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-hidden"
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>1 mês antes</span>
                  <span>6 meses</span>
                  <span>12 meses (1 ano)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito: O Impacto Financeiro da Posse (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-gradient-to-b from-emerald-950/30 via-[#070b14] to-cyan-950/20 border border-emerald-500/35 p-6 sm:p-10 backdrop-blur-2xl flex flex-col justify-between shadow-2xl relative overflow-hidden">
            {/* Top Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/[0.08]">
              <div>
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Retorno Real Sobre o Investimento</span>
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Salários Antecipados na Sua Conta
                </h4>
              </div>

              <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                ROI de {roiMultiplier}x
              </div>
            </div>

            {/* Número Monumental */}
            <div className="my-8 sm:my-10 space-y-2 text-center sm:text-left">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Total de remuneração adiantada na nomeação:
              </span>
              <div className="text-4xl sm:text-6xl font-black bg-gradient-to-r from-emerald-300 via-cyan-200 to-white bg-clip-text text-transparent tracking-tight">
                +{formatBRL(totalSalariesGained)}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed pt-1">
                Ao antecipar sua posse em apenas <strong>{monthsAccelerated} {monthsAccelerated === 1 ? "mês" : "meses"}</strong> com o método FSRS e discursivas nota 10, você recebe{" "}
                <strong className="text-emerald-300">{formatBRL(totalSalariesGained)}</strong> que seriam perdidos na inércia dos cursinhos tradicionais.
              </p>
            </div>

            {/* Comparativo de Investimento vs Retorno */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Investimento no Synapse Pro (1 ano):</span>
                <span className="text-slate-200 font-bold">R$ 358,80</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">Patrimônio Líquido Adicional:</span>
                <span className="text-emerald-300 font-black text-sm">+{formatBRL(totalSalariesGained)}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 w-full" />
              </div>
            </div>

            {/* CTA */}
            <div className="pt-6">
              <Link
                href="#planos"
                onClick={() => triggerHaptic("medium")}
                className="w-full group inline-flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400 hover:opacity-95 shadow-xl shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <span>Acelerar Minha Posse Agora</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
