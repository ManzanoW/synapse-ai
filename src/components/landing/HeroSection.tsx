"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ShieldCheck, ChevronDown, Zap } from "lucide-react";

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax transform bindings based on user spec
  const scale = useTransform(scrollYProgress, [0, 0.25], [1, 0.88]);
  const opacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.25], [0, -50]);

  // Subtle floating background particles parallax
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full flex flex-col items-center justify-between overflow-hidden bg-[#030712] pt-28 pb-10 px-4 select-none"
    >
      {/* ========================================================================= */}
      {/* CAMADA DE FUNDO (Z-0): GRADIENTES CÓSMICOS & PARTICULAS ESTELARES         */}
      {/* ========================================================================= */}
      <motion.div
        style={{ y: bgY }}
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* Radial Cosmic Halos */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[600px] sm:h-[800px] opacity-70 blur-[150px]"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.18) 40%, rgba(6,182,212,0.12) 70%, transparent 100%)",
          }}
        />

        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-cyan-500/12 rounded-full blur-[140px]" />

        {/* Constellation Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.85) 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />
      </motion.div>

      {/* Espaçador superior invisível para centralização visual */}
      <div className="w-full h-2" />

      {/* ========================================================================= */}
      {/* CAMADA MÉDIA (Z-10): TÍTULO MONUMENTAL & COPY PARALLAX                    */}
      {/* ========================================================================= */}
      <motion.div
        style={{ scale, opacity, y }}
        className="relative z-10 text-center max-w-5xl mx-auto space-y-6 sm:space-y-8 my-auto"
      >
        {/* Badge Superior Animado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-violet-500/20 to-cyan-500/15 border border-indigo-500/35 text-indigo-300 text-xs sm:text-sm font-semibold backdrop-blur-xl shadow-[0_0_30px_rgba(99,102,241,0.25)]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <span className="font-mono text-cyan-300 font-bold">⚡ O Primeiro Copiloto Cognitivo</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline font-mono">Motor FSRS, Redação Discursiva & Áudio Neural</span>
          </div>
        </motion.div>

        {/* Headline Monumental */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.08]"
        >
          A sua aprovação não depende de sorte.{" "}
          <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-cyan-300 via-indigo-200 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(99,102,241,0.4)]">
            Depende de neurociência.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-base sm:text-xl text-slate-300/90 leading-relaxed max-w-3xl mx-auto font-normal px-2"
        >
          O Synapse AI mapeia seu edital, calcula sua curva de esquecimento, corrige redações discursivas no critério oficial da banca e transforma seu tempo no trânsito em horas líquidas com flashcards em áudio humanizado.
        </motion.p>

        {/* Dual CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <Link
            href="/login"
            className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border border-indigo-400/30 hover:border-indigo-300/50 shadow-xl shadow-indigo-950/60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Começar Gratuitamente</span>
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <a
            href="#cockpit-showcase"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-bold text-sm sm:text-base text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] hover:border-white/[0.22] backdrop-blur-xl transition-all duration-200 shadow-lg shadow-black/40"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Ver Cockpit em Ação</span>
          </a>
        </motion.div>

        {/* Micro Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-mono text-slate-400"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sem cartão de crédito
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span>Bancas: Cebraspe, FGV & FCC</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span>+87% de Retenção FSRS</span>
        </motion.div>
      </motion.div>

      {/* ========================================================================= */}
      {/* INDICADOR DE ROLAGEM NA BASE DA TELA (ROLE PARA DESCER ↓)                  */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-2"
      >
        <a
          href="#pain-transition"
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-mono font-bold text-slate-300 hover:text-white backdrop-blur-xl transition-all shadow-md animate-bounce"
        >
          <span className="text-cyan-400">ROLE PARA DESCER</span>
          <ChevronDown className="w-3.5 h-3.5 text-cyan-300 group-hover:translate-y-0.5 transition-transform" />
        </a>
      </motion.div>
    </section>
  );
}
