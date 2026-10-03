"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  FileSpreadsheet,
  FileX2,
  TrendingDown,
  Sparkles,
  Headphones,
  Flame,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export function RealityCheckSection() {
  const [activeTab, setActiveTab] = useState<"all" | "arcaico" | "synapse">("all");

  const PAIN_POINTS = [
    {
      painIcon: FileSpreadsheet,
      painTitle: "Planilhas de Excel que viram um cemitério",
      painDesc: "Você gasta 3 dias montando um cronograma colorido perfeito no Excel. Na segunda semana, um imprevisto acontece, o arquivo desorganiza e você abandona tudo com sensação de culpa.",
      solIcon: Zap,
      solTitle: "Ciclo Adaptativo Inteligente",
      solDesc: "O algoritmo reequilibra seu cronograma automaticamente quando você perde um dia. Sem culpa, sem empilhar matéria atrasada e sem precisar refazer planilhas.",
    },
    {
      painIcon: FileX2,
      painTitle: "Redações sem correção oficial ou com semanas de espera",
      painDesc: "Contratar professores particulares custa uma fortuna e leva até 10 dias para receber um feedback genérico, enquanto você precisa treinar temas toda semana.",
      solIcon: Sparkles,
      solTitle: "Corretor Discursivo no Rigor da Banca",
      solDesc: "Correção instantânea com as fórmulas exatas de desconto do Cebraspe, FGV e FCC. Análise de macroestrutura, microestrutura linha a linha e versão ouro gerada em 10 segundos.",
    },
    {
      painIcon: Clock,
      painTitle: "Horas líquidas jogadas no lixo no trânsito",
      painDesc: "Você passa 2 a 3 horas diárias preso no trânsito, no metrô ou lavando louça querendo estudar, mas não consegue ler apostilas ou manusear telas.",
      solIcon: Headphones,
      solTitle: "Flashcards Hands-Free com Voz Neural",
      solDesc: "Coloque os fones de ouvido e estude com o celular no bolso. O Synapse faz a pergunta com voz natural, dá uma pausa reflexiva para você pensar e solta o gabarito oficial.",
    },
    {
      painIcon: TrendingDown,
      painTitle: "A bola de neve incontrolável do Anki tradicional",
      painDesc: "Com o algoritmo SM-2 básico dos anos 80, se você fica 4 dias sem abrir o app, se depara com 800 cards acumulados para revisar num único dia desesperador.",
      solIcon: Flame,
      solTitle: "Motor FSRS com Estabilidade de Memória",
      solDesc: "Modelo moderno de repetição espaçada que calcula o limiar exato da sua retenção, diminuindo em até 65% a quantidade de revisões necessárias com 90%+ de acerto.",
    },
  ];

  return (
    <section id="metodo" className="relative py-24 sm:py-32 overflow-hidden bg-[#030712]">
      {/* Glow Divisor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-5xl h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      {/* Volumetric Lights */}
      <div className="pointer-events-none absolute top-1/2 -left-60 w-96 h-96 bg-rose-600/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 -right-60 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-mono font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>O Choque de Realidade</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Por que 95% dos concurseiros{" "}
            <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-rose-300 bg-clip-text text-transparent">
              reprovam por cansaço
            </span>{" "}
            e não por falta de esforço?
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Estudar para concurso com as ferramentas da década passada é como tentar disputar uma corrida de Fórmula 1 pedalando uma bicicleta enferrujada.
          </p>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex sm:hidden justify-center items-center gap-2 mt-8">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "all" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Lado a Lado
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("arcaico")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "arcaico" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-slate-400 hover:text-white"
            }`}
          >
            Método Arcaico
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("synapse")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "synapse" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
            }`}
          >
            Synapse AI
          </button>
        </div>

        {/* Grid Comparativo */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* ================= COLUNA 1: MÉTODO ARCAICO ================= */}
          {(activeTab === "all" || activeTab === "arcaico") && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl bg-gradient-to-b from-rose-950/20 via-slate-950/60 to-black/80 border border-rose-500/20 p-6 sm:p-8 space-y-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-rose-500/15">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-black">
                      O Método Tradicional
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-200">
                      O Ciclo do Desespero & Caos
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {PAIN_POINTS.map((item, idx) => {
                    const Icon = item.painIcon;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl bg-black/40 border border-white/[0.04] p-4 space-y-2 hover:border-rose-500/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0 mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                              <span>{item.painTitle}</span>
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed mt-1">
                              {item.painDesc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-rose-500/15 text-center">
                <span className="text-xs font-mono text-rose-300/80">
                  Resultado: Sobrecarga cognitiva, burnout e mais 1 ano pagando cursinho.
                </span>
              </div>
            </motion.div>
          )}

          {/* ================= COLUNA 2: O ECOSSISTEMA SYNAPSE AI ================= */}
          {(activeTab === "all" || activeTab === "synapse") && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-950/80 to-purple-950/30 border-2 border-indigo-500/50 p-6 sm:p-8 space-y-6 shadow-[0_0_60px_rgba(99,102,241,0.2)] flex flex-col justify-between"
            >
              {/* Top Neon Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 text-white text-[11px] font-black uppercase tracking-wider shadow-lg shadow-indigo-500/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>O Futuro da Aprovação</span>
              </div>

              <div>
                <div className="flex items-center justify-between pb-6 border-b border-indigo-500/20 pt-2 sm:pt-0">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-black">
                      O Ecossistema Synapse AI
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Neurociência Pura & Velocidade 3.8x
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {PAIN_POINTS.map((item, idx) => {
                    const Icon = item.solIcon;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl bg-slate-900/60 border border-indigo-500/20 p-4 space-y-2 hover:border-cyan-400/50 hover:bg-slate-900/90 transition-all shadow-sm group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-cyan-300 shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{item.solTitle}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold">
                                Ativo
                              </span>
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed mt-1">
                              {item.solDesc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-mono text-cyan-300 font-bold text-center sm:text-left">
                  ⚡ Menos esforço inútil. Mais retenção definitiva no dia da prova.
                </span>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-black hover:opacity-90 transition-opacity shadow-md shadow-cyan-500/20"
                >
                  <span>Experimentar Agora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
