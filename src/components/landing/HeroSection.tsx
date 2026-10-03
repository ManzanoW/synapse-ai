"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Headphones,
  FileCheck2,
  Brain,
  Zap,
  Activity,
  Award,
  Clock,
  Shield,
  CheckCircle2,
  ChevronRight,
  Volume2,
  Sliders,
  Play,
  RotateCcw,
} from "lucide-react";

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<"fsrs" | "discursiva" | "audio" | "radar">("fsrs");

  // 3D Tilt Effect on Cockpit Hover
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateXSpring = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), {
    damping: 25,
    stiffness: 200,
  });
  const rotateYSpring = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    damping: 25,
    stiffness: 200,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
      {/* Background Volumetric Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-violet-600/15 to-transparent blur-[160px] -z-10" />
      <div className="pointer-events-none absolute top-1/4 -left-40 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] -z-10" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-[550px] h-[550px] bg-violet-600/15 blur-[160px] -z-10" />

      {/* Grid Pattern Overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Badges & Copy */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Animated Neon Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-violet-500/15 to-cyan-500/10 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-semibold backdrop-blur-xl shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <span className="font-mono text-cyan-300">⚡ O Primeiro Copiloto Cognitivo</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-300 hidden sm:inline">Motor FSRS, Redação Discursiva & Áudio Neural</span>
            </div>
          </motion.div>

          {/* Headline de Alto Impacto */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]"
          >
            A sua aprovação não depende de sorte.{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(168,85,247,0.35)]">
              Depende de neurociência.
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-xl text-slate-300/90 leading-relaxed max-w-3xl mx-auto font-normal"
          >
            O Synapse AI mapeia seu edital, calcula sua curva de esquecimento com o motor{" "}
            <strong className="text-white font-semibold">FSRS</strong>, corrige redações no critério oficial da banca e transforma seu tempo no trânsito em horas líquidas com flashcards em{" "}
            <strong className="text-white font-semibold">áudio neural humanizado</strong>.
          </motion.p>

          {/* Dual CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3"
          >
            {/* Primary Glow Button */}
            <Link
              href="/login"
              className="w-full sm:w-auto relative group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-black text-sm sm:text-base text-white overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.35)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 rounded-2xl" />
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-200 animate-pulse" />
                <span>Começar Gratuitamente</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Secondary Glass Button */}
            <a
              href="#cockpit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-bold text-sm sm:text-base text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] hover:border-white/[0.2] backdrop-blur-xl transition-all duration-200"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Ver Cockpit em Ação</span>
            </a>
          </motion.div>

          {/* Social Proof & Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-mono text-slate-400"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Calibrado para <strong className="text-slate-200 font-bold">Cebraspe, FGV & FCC</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span><strong className="text-slate-200 font-bold">+87%</strong> de Retenção a Longo Prazo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-400" />
              <span><strong className="text-slate-200 font-bold">14.800+</strong> Questões Resolvidas</span>
            </div>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* 🛸 3D TILT COCKPIT MOCKUP INTERATIVO                                      */}
        {/* ========================================================================= */}
        <div id="cockpit" className="pt-14 sm:pt-20 perspective-1000">
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              rotateX: rotateXSpring,
              rotateY: rotateYSpring,
              transformStyle: "preserve-3d",
            }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="relative mx-auto max-w-5xl rounded-3xl p-1 bg-gradient-to-b from-white/[0.15] via-white/[0.05] to-transparent shadow-[0_25px_80px_rgba(0,0,0,0.8),0_0_80px_rgba(99,102,241,0.15)] group transition-transform"
          >
            {/* Outer Glow Halo */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-violet-500/30 to-cyan-500/20 blur-xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Inner Dashboard Glass Shell */}
            <div className="relative rounded-[22px] bg-[#070b14]/90 backdrop-blur-2xl border border-white/[0.08] overflow-hidden">
              {/* Window Header Bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="h-4 w-px bg-white/10 mx-2" />
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span className="text-indigo-400 font-bold">synapse-cockpit.v2</span>
                    <span className="hidden sm:inline text-slate-600">|</span>
                    <span className="hidden sm:inline text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Motor FSRS Calibrado
                    </span>
                  </div>
                </div>

                {/* Live User Badges in Mockup */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
                    <span>🔥 18 Dias</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold font-mono">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Nível 24 • Auditor</span>
                  </div>
                </div>
              </div>

              {/* Interactive Cockpit Navigation Tabs */}
              <div className="px-5 pt-4 pb-2 flex flex-wrap items-center gap-2 border-b border-white/[0.05] bg-black/20">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mr-2 hidden sm:inline">
                  Simulação Ao Vivo:
                </span>

                <button
                  type="button"
                  onClick={() => setActiveTab("fsrs")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "fsrs"
                      ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Brain className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Motor FSRS ($R = 0.9^{'{'}t/S{'}'}$)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("discursiva")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "discursiva"
                      ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-violet-300" />
                  <span>Redação Discursiva (Banca)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("audio")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "audio"
                      ? "bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Áudio Neural Hands-Free</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("radar")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "radar"
                      ? "bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Radar de Incidência</span>
                </button>
              </div>

              {/* Cockpit Content Area */}
              <div className="p-5 sm:p-7 min-h-[360px] flex items-center justify-center">
                {/* 1. ABA FSRS */}
                {activeTab === "fsrs" && (
                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
                    <div className="md:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                              Estabilidade FSRS (Free Spaced Repetition)
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                              ÓTIMO
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                            Direito Administrativo • Licitações (Lei 14.133/21)
                          </h4>
                        </div>
                        <span className="text-2xl font-black text-emerald-400 font-mono">
                          94.8%
                        </span>
                      </div>

                      {/* Visual Retention Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono text-slate-400">
                          <span>Probabilidade de Recordação no Dia da Prova</span>
                          <span className="text-indigo-300 font-bold">Intervalo Atual: +28 dias</span>
                        </div>
                        <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 w-[95%] shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
                        </div>
                      </div>

                      {/* Card Preview */}
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-white/[0.06] text-xs space-y-2">
                        <p className="font-bold text-slate-200">
                          Pergunta: Qual o prazo mínimo para apresentação de propostas no Pregão Eletrônico quando o critério for Menor Preço?
                        </p>
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-slate-400 font-mono text-[11px]">
                          <span className="text-emerald-300">Resposta Memorizada: 8 dias úteis (Art. 55, I)</span>
                          <span className="text-slate-500">Última repetição: há 3 semanas</span>
                        </div>
                      </div>

                      {/* Next Evaluation Buttons */}
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                          <span className="text-[10px] text-rose-300 block font-bold">Errei</span>
                          <span className="text-xs font-mono text-slate-300">Hoje</span>
                        </div>
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                          <span className="text-[10px] text-amber-300 block font-bold">Difícil</span>
                          <span className="text-xs font-mono text-slate-300">+4 dias</span>
                        </div>
                        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                          <span className="text-[10px] text-indigo-300 block font-bold">Bom</span>
                          <span className="text-xs font-mono text-slate-300">+12 dias</span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                          <span className="text-[10px] text-emerald-300 block font-bold">Fácil</span>
                          <span className="text-xs font-mono text-slate-300">+28 dias</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-950/60 border border-indigo-500/20 p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold block">
                          Curva de Esquecimento Eliminada
                        </span>
                        <div className="text-3xl font-black text-white">
                          -65% <span className="text-xs font-normal text-slate-400">tempo gasto</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          O modelo matemático recalcula a dificuldade do card a cada resposta, agendando revisões apenas no limiar de esquecimento.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Cards para Hoje:</span>
                          <span className="text-cyan-300 font-bold">38 cards</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Tempo Estimado:</span>
                          <span className="text-slate-200 font-bold">12 minutos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ABA REDAÇÃO DISCURSIVA */}
                {activeTab === "discursiva" && (
                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
                    <div className="md:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-[10px] font-mono font-bold">
                              BANCA CEBRASPE
                            </span>
                            <span className="text-xs font-mono text-slate-400">30 Linhas • Estudo de Caso</span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-white mt-1">
                            Tema: O Devido Processo Legal no Processo Administrativo Disciplinar
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block font-mono">Nota Final</span>
                          <span className="text-2xl font-black text-violet-400 font-mono">
                            96.5 <span className="text-xs text-slate-500">/ 100</span>
                          </span>
                        </div>
                      </div>

                      {/* Formula Oficial Display */}
                      <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/20 font-mono text-xs flex items-center justify-between">
                        <span className="text-violet-300 font-bold">Fórmula Cebraspe: NF = NC - 2 × (NE / TL)</span>
                        <span className="text-slate-400">NE: 2 erros • TL: 28 linhas</span>
                      </div>

                      {/* Macroestrutura vs Microestrutura */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-300">Macroestrutura (Conteúdo)</span>
                            <span className="text-emerald-400">58.0 / 60</span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Abordou ampla defesa, contraditório e súmula vinculante nº 5 do STF com precisão doutrinária.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-300">Microestrutura (Gramática)</span>
                            <span className="text-amber-400">-1.5 pts</span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Linha 14: Regência de &quot;implicar em&quot; (transitivo direto). Linha 22: Uso indevido de crase antes de verbo.
                          </p>
                        </div>
                      </div>

                      {/* Golden Version Badge */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-400 text-xs flex items-center justify-between">
                        <span className="text-amber-200">
                          ✨ <strong>Versão Ouro Gerada:</strong> Vocabulário técnico reescrito no padrão de espelho da banca examinadora.
                        </span>
                        <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-b from-violet-950/40 to-slate-950/60 border border-violet-500/20 p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300 font-bold block">
                          Diagnóstico da Banca
                        </span>
                        <h5 className="text-lg font-bold text-white">Status: Aprovado no Padrão Ouro</h5>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          A IA avalia sua redação em menos de 10 segundos, exatamente como a banca examinadora aplica no dia oficial do concurso.
                        </p>
                      </div>

                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Coesão Referencial: Excelente</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Fundamentação Legal: Completa</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>OCR de Manuscrito Habilitado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ABA ÁUDIO NEURAL */}
                {activeTab === "audio" && (
                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
                    <div className="md:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
                            <Headphones className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-cyan-400">
                                MODO HANDS-FREE • FONE BLUETOOTH CONECTADO
                              </span>
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            </div>
                            <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                              Direito Constitucional • Eficácia das Normas Constitucionais
                            </h4>
                          </div>
                        </div>

                        <span className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">
                          Card 14 de 32
                        </span>
                      </div>

                      {/* Animated Audio Waveform & Status */}
                      <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/20 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold">
                            <Volume2 className="w-4 h-4" /> Voz Neural Humana em Execução
                          </span>
                          <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Pausa Reflexiva: 03s
                          </span>
                        </div>

                        {/* Pulsing Audio Waves */}
                        <div className="flex items-center justify-center gap-1.5 h-12 py-2">
                          {[40, 75, 95, 60, 30, 85, 100, 70, 45, 90, 65, 35, 80, 95, 50, 75, 40].map((h, i) => (
                            <motion.span
                              key={i}
                              animate={{ height: [`${Math.max(15, h * 0.3)}%`, `${h}%`, `${Math.max(15, h * 0.4)}%`] }}
                              transition={{ duration: 0.8 + (i % 3) * 0.2, repeat: Infinity, ease: "easeInOut" }}
                              className="w-1.5 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>

                        <p className="text-xs text-slate-200 font-mono text-center italic">
                          &quot;Qual a diferença primordial entre normas constitucionais de eficácia contida e eficácia limitada segundo José Afonso da Silva?&quot;
                        </p>
                      </div>

                      {/* Mobile & Lockscreen Benefits */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-cyan-300 font-bold block text-[11px]">Tela Bloqueada</span>
                          <span className="text-[10px] text-slate-400">MediaSession API</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-cyan-300 font-bold block text-[11px]">Botões do Fone</span>
                          <span className="text-[10px] text-slate-400">Play, Avançar e Gabarito</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-cyan-300 font-bold block text-[11px]">Pausa Ativa</span>
                          <span className="text-[10px] text-slate-400">Recuperação Ativa Real</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-950/60 border border-cyan-500/20 p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block">
                          Horas Mortas Viram Posse
                        </span>
                        <div className="text-3xl font-black text-white">
                          +2h <span className="text-xs font-normal text-slate-400">líquidas por dia</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Estude enquanto dirige, lava louça ou treina na academia. Seu cérebro responde mentalmente e ouve o gabarito sem tocar no telefone.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono">Velocidade da Voz:</span>
                        <span className="font-bold text-cyan-300">1.25x Dinâmica</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. ABA RADAR */}
                {activeTab === "radar" && (
                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
                    <div className="md:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div>
                          <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                            Raio-X de Recorrência Histórica da Banca
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                            Tribunal de Contas da União (TCU) • Auditor
                          </h4>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          Chance de Corte: 84%
                        </span>
                      </div>

                      {/* Disciplinas Bars */}
                      <div className="space-y-3 pt-1">
                        {[
                          { name: "Controle Externo & Legislação do TCU", weight: "Peso 3", domain: 92, status: "Domínio Crítico" },
                          { name: "Direito Administrativo & Licitações", weight: "Peso 2.5", domain: 88, status: "Consolidado" },
                          { name: "Auditoria Governamental & Riscos", weight: "Peso 2.5", domain: 84, status: "Consolidado" },
                          { name: "Contabilidade Pública (CASP)", weight: "Peso 2", domain: 71, status: "Em Reforço" },
                        ].map((sub, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-slate-200 font-bold">{sub.name} <span className="text-slate-500 font-normal">({sub.weight})</span></span>
                              <span className="text-emerald-400 font-bold">{sub.domain}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                                style={{ width: `${sub.domain}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-950/60 border border-emerald-500/20 p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold block">
                          Preditor de Aprovação
                        </span>
                        <h5 className="text-lg font-bold text-white">Pronto para a Nota de Corte</h5>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          O Synapse cruza seu percentual de acerto líquido com o peso histórico do seu edital, alertando onde você ganha mais pontos por hora gasta.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Meta do Ciclo:</span>
                          <span className="text-emerald-300 font-bold">82 pts Líquidos</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Previsão Atual:</span>
                          <span className="text-white font-bold">85.4 pts Líquidos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
