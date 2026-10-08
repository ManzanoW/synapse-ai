"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  AlertTriangle,
  Zap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { playUiSound } from "@/lib/sensory/audio-feedback";

interface ComparisonRow {
  feature: string;
  category: string;
  cursinho: {
    text: string;
    status: "bad" | "warning" | "good";
  };
  anki: {
    text: string;
    status: "bad" | "warning" | "good";
  };
  synapse: {
    text: string;
    status: "good";
    highlight?: boolean;
  };
}

export function ComparisonMatrixSection() {
  const [mobileTab, setMobileTab] = useState<"synapse" | "cursinho" | "anki">("synapse");

  const ROWS: ComparisonRow[] = [
    {
      feature: "Investimento Anual",
      category: "Custo",
      cursinho: { text: "R$ 1.800 a R$ 3.500 / ano", status: "bad" },
      anki: { text: "Grátis (mas exige meses configurando)", status: "warning" },
      synapse: { text: "R$ 29,90/mês (~R$ 0,99/dia)", status: "good", highlight: true },
    },
    {
      feature: "Algoritmo de Retenção de Memória",
      category: "Metodologia",
      cursinho: { text: "Nenhum (PDFs estáticos e videoaulas passivas)", status: "bad" },
      anki: { text: "SM-2 de 1987 (bola de neve de 600 revisões)", status: "warning" },
      synapse: { text: "Motor FSRS 4.5 Preditivo (-65% revisões inúteis)", status: "good", highlight: true },
    },
    {
      feature: "Áudio Neural Hands-Free no Trânsito",
      category: "Produtividade",
      cursinho: { text: "Não existe (videoaulas exigem tela ligada)", status: "bad" },
      anki: { text: "TTS robótico e sem pausa de reflexão ativa", status: "bad" },
      synapse: { text: "Vozes de estúdio com tela bloqueada no bolso", status: "good", highlight: true },
    },
    {
      feature: "Correção de Redação Discursiva",
      category: "Discursivas",
      cursinho: { text: "R$ 150/tema avulso e 15 dias de espera", status: "bad" },
      anki: { text: "Não oferece", status: "bad" },
      synapse: { text: "Espelho oficial (Cebraspe/FGV/FCC) em 8s", status: "good", highlight: true },
    },
    {
      feature: "OCR de Manuscrito na Folha de Prova",
      category: "Discursivas",
      cursinho: { text: "Apenas digitação manual no teclado", status: "bad" },
      anki: { text: "Não oferece", status: "bad" },
      synapse: { text: "Foto direta da folha de prova via IA Vision", status: "good" },
    },
    {
      feature: "Edital Verticalizado com Raio-X",
      category: "Planejamento",
      cursinho: { text: "Planilhas de Excel estáticas e manuais", status: "warning" },
      anki: { text: "Não oferece", status: "bad" },
      synapse: { text: "Importação direta de PDF com incidência da banca", status: "good" },
    },
    {
      feature: "Ciclo Adaptativo Anti-Culpa",
      category: "Metodologia",
      cursinho: { text: "Cronograma racha no primeiro imprevisto", status: "bad" },
      anki: { text: "Punição com centenas de cards acumulados", status: "bad" },
      synapse: { text: "Rebalanceamento suave automático da semana", status: "good", highlight: true },
    },
  ];

  const handleMobileTab = (tab: "synapse" | "cursinho" | "anki") => {
    setMobileTab(tab);
    triggerHaptic("light");
    playUiSound("switch");
  };

  return (
    <section id="comparativo" className="relative py-24 sm:py-32 overflow-hidden bg-[#030712] scroll-mt-24 border-t border-white/[0.06]">
      {/* Background Volumetric Glows */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-r from-indigo-600/[0.08] via-cyan-600/[0.1] to-purple-600/[0.08] rounded-full blur-[170px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span>Matriz de Decisão Racional</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Por que os métodos tradicionais custam caro e{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
              entregam pouco?
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Compare o custo-benefício de cursinhos de R$ 2.000+, do Anki dos anos 80 e do ecossistema integrado Synapse AI.
          </p>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden items-center justify-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/10 mb-6 max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => handleMobileTab("synapse")}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              mobileTab === "synapse"
                ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Synapse AI 👑
          </button>
          <button
            type="button"
            onClick={() => handleMobileTab("cursinho")}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              mobileTab === "cursinho"
                ? "bg-slate-800 text-slate-200 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Cursinhos
          </button>
          <button
            type="button"
            onClick={() => handleMobileTab("anki")}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              mobileTab === "anki"
                ? "bg-slate-800 text-slate-200 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Anki Clássico
          </button>
        </div>

        {/* Mobile View: Cards Verticais Compactos */}
        <div className="md:hidden space-y-3">
          {ROWS.map((row, i) => {
            const data =
              mobileTab === "synapse"
                ? row.synapse
                : mobileTab === "cursinho"
                ? row.cursinho
                : row.anki;

            return (
              <div
                key={i}
                className={`p-4 rounded-2xl border backdrop-blur-xl ${
                  mobileTab === "synapse"
                    ? "bg-gradient-to-b from-indigo-950/40 to-slate-900/80 border-cyan-500/35 shadow-lg shadow-cyan-950/20"
                    : "bg-slate-900/40 border-white/[0.08]"
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                  <span className="text-xs font-mono text-slate-400 font-bold">
                    {row.feature}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {row.category}
                  </span>
                </div>
                <div className="pt-2 flex items-start gap-2">
                  {data.status === "good" ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : data.status === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-xs font-medium leading-relaxed ${
                      mobileTab === "synapse" ? "text-white font-bold" : "text-slate-300"
                    }`}
                  >
                    {data.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Tabela Magnífica de Vidro Temperado */}
        <div className="hidden md:block rounded-3xl bg-[#070b14]/70 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-12 border-b border-white/10 bg-slate-900/60 p-4 lg:p-6 items-center text-sm font-mono font-bold">
            <div className="col-span-4 text-slate-300">
              RECURSO / CRITÉRIO TÁTICO
            </div>
            <div className="col-span-2.5 text-center text-slate-400">
              CURSINHOS CLÁSSICOS
            </div>
            <div className="col-span-2.5 text-center text-slate-400">
              ANKI TRADICIONAL
            </div>
            <div className="col-span-3 text-center text-cyan-300 flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-500/20 via-cyan-500/20 to-purple-500/20 py-2 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>SYNAPSE AI</span>
            </div>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {ROWS.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 p-4 lg:p-5 items-center hover:bg-white/[0.02] transition-colors text-xs lg:text-sm"
              >
                {/* Feature Name */}
                <div className="col-span-4 font-bold text-white flex flex-col pr-4">
                  <span>{row.feature}</span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-normal">
                    {row.category}
                  </span>
                </div>

                {/* Cursinho Tradicional */}
                <div className="col-span-2.5 px-3 text-center flex items-center justify-center gap-1.5 text-slate-400 text-xs">
                  {row.cursinho.status === "bad" ? (
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>{row.cursinho.text}</span>
                </div>

                {/* Anki Tradicional */}
                <div className="col-span-2.5 px-3 text-center flex items-center justify-center gap-1.5 text-slate-400 text-xs">
                  {row.anki.status === "bad" ? (
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>{row.anki.text}</span>
                </div>

                {/* Synapse AI (Highlighted Column) */}
                <div className="col-span-3 px-3 py-2 text-center rounded-xl bg-cyan-950/20 border border-cyan-500/25 flex items-center justify-center gap-2 text-cyan-200 font-bold text-xs lg:text-sm shadow-xs">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-white">{row.synapse.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Callout */}
        <div className="mt-10 sm:mt-12 text-center">
          <Link
            href="#planos"
            onClick={() => triggerHaptic("medium")}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-bold text-xs sm:text-sm hover:opacity-95 shadow-xl shadow-indigo-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Ver Planos & Destravar o Synapse Pro</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
