"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  SlidersHorizontal,
  CalendarCheck2,
  CheckCircle2,
  ArrowRight,
  UploadCloud,
  Layers,
  Clock,
  RotateCcw,
  Zap,
} from "lucide-react";
import Link from "next/link";

export function StickyShowcaseWorkflow() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const STEPS = [
    {
      step: 1,
      tag: "Passo 01",
      title: "Importe seu Edital em PDF ou Texto",
      subtitle: "A IA processa o documento bruto e verticaliza tudo em segundos",
      desc: "Basta fazer o upload do PDF oficial da banca ou colar os tópicos. O Synapse descarta páginas burocráticas, detecta cargos e requisitos, e organiza as disciplinas em uma árvore hierárquica clara.",
      icon: FileText,
      badgeColor: "from-indigo-500 to-violet-500",
    },
    {
      step: 2,
      tag: "Passo 02",
      title: "Calibre os Pesos da sua Banca",
      subtitle: "Priorização estratégica baseada em dados reais de provas passadas",
      desc: "Informe seu tempo diário disponível e ajuste as prioridades. O Synapse cruza o peso de cada disciplina com a sua proficiência inicial para gerar a distribuição perfeita de horas de estudo.",
      icon: SlidersHorizontal,
      badgeColor: "from-violet-500 to-cyan-500",
    },
    {
      step: 3,
      tag: "Passo 03",
      title: "Siga seu Ciclo Adaptativo",
      subtitle: "Um cronograma vivo que se reorganiza sem culpa caso você perca um dia",
      desc: "Esqueça o desespero de acumular matéria. Se um imprevisto acontecer, o algoritmo recalibra sua carga horária nos dias seguintes sem sobrecarregar sua rotina e mantendo as revisões FSRS em dia.",
      icon: CalendarCheck2,
      badgeColor: "from-cyan-500 to-emerald-500",
    },
  ];

  return (
    <section id="fluxo" className="relative py-24 sm:py-32 overflow-hidden bg-[#030712]">
      {/* Glow Divisor Superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-5xl h-px bg-gradient-to-r from-transparent via-cyan-500/35 via-violet-500/35 to-transparent" />

      {/* Decorative Volumetric Lights */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-gradient-to-r from-indigo-600/[0.09] via-violet-600/[0.09] to-cyan-600/[0.09] blur-[160px] -z-10" />

      {/* Grade Cósmica Estelar */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fluxo Sem Fricção</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Do Edital Bruto ao Cronograma em{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
              3 Passos Simples
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Você não precisa de semanas montando tabelas. Em menos de 2 minutos, seu plano de estudos estará rodando no piloto automático.
          </p>
        </div>

        {/* Workflow Component: Steps on Left, Interactive Preview on Right */}
        <div className="mt-14 sm:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Coluna Esquerda: Seletor de Passos (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = activeStep === s.step;
              return (
                <div
                  key={s.step}
                  onClick={() => setActiveStep(s.step)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                    isActive
                      ? "bg-gradient-to-r from-white/[0.08] to-white/[0.02] border-indigo-500/60 shadow-xl shadow-indigo-500/10"
                      : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 via-violet-500 to-cyan-400" />
                  )}

                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                        isActive
                          ? "bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border-indigo-400 text-cyan-300 shadow-md shadow-indigo-500/30"
                          : "bg-white/5 border-white/10 text-slate-400"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                          {s.tag}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                        {s.title}
                      </h3>
                      <p className="text-xs text-slate-300/80 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coluna Direita: Live Mockup do Passo Ativo (7 cols) */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl p-1 bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
              <div className="rounded-[22px] bg-slate-950/90 border border-white/[0.08] p-6 sm:p-8 backdrop-blur-2xl min-h-[420px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {/* PREVIEW PASSO 1: IMPORTAÇÃO DO EDITAL */}
                  {activeStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold font-mono text-xs">
                            PDF
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">Edital_TCU_Auditor_2026.pdf</h4>
                            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Processamento Concluído por IA (1.4s)
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">
                          14 Disciplinas Detectadas
                        </span>
                      </div>

                      {/* Extracted Tree Preview */}
                      <div className="space-y-3 font-mono text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-500/20 flex items-center justify-between">
                          <span className="text-slate-200">⚖️ Direito Constitucional</span>
                          <span className="text-cyan-300 font-bold">12 Tópicos Estruturados</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-500/20 flex items-center justify-between">
                          <span className="text-slate-200">🏛️ Direito Administrativo & Licitações</span>
                          <span className="text-cyan-300 font-bold">18 Tópicos Estruturados</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-500/20 flex items-center justify-between">
                          <span className="text-slate-200">📊 Controle Externo da Administração Pública</span>
                          <span className="text-cyan-300 font-bold">9 Tópicos Estruturados</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-500/20 flex items-center justify-between">
                          <span className="text-slate-200">💼 Auditoria Governamental</span>
                          <span className="text-cyan-300 font-bold">15 Tópicos Estruturados</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-mono flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>Edital verticalizado com 100% de precisão. Zero necessidade de formatação manual.</span>
                      </div>
                    </motion.div>
                  )}

                  {/* PREVIEW PASSO 2: CALIBRAÇÃO DE PESOS */}
                  {activeStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                        <div>
                          <h4 className="text-sm font-bold text-white">Calibração de Carga Horária</h4>
                          <span className="text-[11px] font-mono text-cyan-400">
                            Meta Selecionada: 3.5 Horas Líquidas / Dia (Segunda a Sábado)
                          </span>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          Banca: Cebraspe
                        </span>
                      </div>

                      {/* Weight Sliders Preview */}
                      <div className="space-y-3.5 text-xs font-mono">
                        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                          <div className="flex justify-between">
                            <span className="text-slate-200 font-bold">Controle Externo (Alta Incidência)</span>
                            <span className="text-cyan-300 font-bold">6h / semana (Peso 3.0)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 w-[85%]" />
                          </div>
                        </div>

                        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                          <div className="flex justify-between">
                            <span className="text-slate-200 font-bold">Direito Administrativo (Fundamental)</span>
                            <span className="text-cyan-300 font-bold">5h / semana (Peso 2.5)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 w-[70%]" />
                          </div>
                        </div>

                        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                          <div className="flex justify-between">
                            <span className="text-slate-200 font-bold">Língua Portuguesa (Interpretação Cebraspe)</span>
                            <span className="text-cyan-300 font-bold">4h / semana (Peso 2.0)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 w-[55%]" />
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 font-mono flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 shrink-0" />
                        <span>Os pesos foram calibrados pelo histórico de 4.800 questões da banca examinadora.</span>
                      </div>
                    </motion.div>
                  )}

                  {/* PREVIEW PASSO 3: CICLO ADAPTATIVO */}
                  {activeStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <h4 className="text-sm font-bold text-white">Ciclo Semanal Adaptado</h4>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          Rebalanceamento Automático Ativo
                        </span>
                      </div>

                      {/* Calendar Cycle Preview */}
                      <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-1">
                          <span className="text-emerald-400 font-bold text-[10px] block">HOJE • COMPLETO</span>
                          <span className="text-white font-bold block">Controle Ext.</span>
                          <span className="text-[10px] text-slate-400">Teoria + 15 Cards FSRS</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-1">
                          <span className="text-cyan-400 font-bold text-[10px] block">AMANHÃ</span>
                          <span className="text-white font-bold block">Dir. Admin.</span>
                          <span className="text-[10px] text-slate-400">Licitações + Discursiva</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
                          <span className="text-slate-400 font-bold text-[10px] block">QUARTA-FEIRA</span>
                          <span className="text-slate-200 font-bold block">Auditoria</span>
                          <span className="text-[10px] text-slate-400">Simulado 30 Questões</span>
                        </div>
                      </div>

                      {/* Missed Day Alert Simulator */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono text-amber-300 font-bold">
                          <span>Simulação: Teve um imprevisto na quinta?</span>
                          <span className="text-emerald-400">Zero Culpa</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          O Synapse redistribui suavemente os 90 minutos perdidos entre os 3 dias seguintes (+30 min/dia), sem criar montanhas impossíveis de pendências.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    Pronto para estruturar seus estudos?
                  </span>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-white transition-colors"
                  >
                    <span>Importar meu edital agora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
