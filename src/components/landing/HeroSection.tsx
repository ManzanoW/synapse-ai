"use client";

import React, { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Zap,
  BrainCircuit,
  FileCheck2,
  Headphones,
  Flame,
} from "lucide-react";
import { BorderBeam } from "./BorderBeam";

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);

  // Mouse Gyroscope Tracking para iluminação cósmica interativa
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 60, damping: 25 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 60, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 a 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 a 0.5
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Parallax suave de Scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.94]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, -35]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  // Iluminação cósmica que segue sutilmente o cursor
  const lightX = useTransform(smoothMouseX, [-0.5, 0.5], ["35%", "65%"]);
  const lightY = useTransform(smoothMouseY, [-0.5, 0.5], ["25%", "55%"]);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[100dvh] w-full flex flex-col justify-between items-center overflow-hidden bg-[#030712] pt-20 sm:pt-24 pb-4 sm:pb-6 px-4 select-none"
    >
      {/* ========================================================================= */}
      {/* CAMADA DE FUNDO (Z-0): GRADIENTES CÓSMICOS & REDE NEURAL ESTELAR          */}
      {/* ========================================================================= */}
      <motion.div
        style={{ y: bgY }}
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* Halo Cósmico Principal com física reativa ao mouse */}
        <motion.div
          className="absolute w-[600px] sm:w-[900px] h-[500px] sm:h-[750px] rounded-full opacity-65 blur-[140px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: lightX,
            top: lightY,
            background:
              "radial-gradient(circle, rgba(99,102,241,0.28) 0%, rgba(139,92,246,0.18) 40%, rgba(6,182,212,0.14) 70%, transparent 100%)",
          }}
        />

        <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/15 rounded-full blur-[130px]" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-cyan-500/12 rounded-full blur-[130px]" />

        {/* Constellation Grid Pattern com fade radial suave */}
        <div
          className="absolute inset-0 opacity-[0.035] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_30%,transparent_100%)]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.85) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Fios Sinápticos Etéreos (SVG Neural Web) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="heroNeuralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <motion.path
            d="M 100,220 Q 400,120 700,260 T 1200,210"
            fill="none"
            stroke="url(#heroNeuralGrad)"
            strokeWidth="1.2"
            strokeDasharray="4 6"
            animate={{ strokeDashoffset: [0, -40] }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          />
          <motion.path
            d="M 180,480 Q 520,560 820,420 T 1250,510"
            fill="none"
            stroke="url(#heroNeuralGrad)"
            strokeWidth="1.2"
            strokeDasharray="4 6"
            animate={{ strokeDashoffset: [-40, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </motion.div>

      {/* ========================================================================= */}
      {/* CONTEÚDO HERO CENTRALIZADO & PERFEITAMENTE PROPORCIONADO                  */}
      {/* ========================================================================= */}
      <motion.div
        style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
        className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center justify-center space-y-4 sm:space-y-6 my-auto w-full"
      >
        {/* Badge Superior Animado */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center"
        >
          <div className="relative group inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-violet-500/20 to-cyan-500/15 border border-indigo-500/35 text-indigo-300 text-xs sm:text-sm font-semibold backdrop-blur-xl shadow-[0_0_25px_rgba(99,102,241,0.2)] hover:border-cyan-400/40 transition-colors">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            </span>
            <span className="font-mono text-cyan-300 font-bold">⚡ O Primeiro Copiloto Cognitivo</span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline font-mono">
              Motor FSRS, Redação Discursiva & Áudio Neural
            </span>
          </div>
        </motion.div>

        {/* Headline Monumental com Shimmer Cinematográfico */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.2rem] font-black tracking-tight text-white leading-[1.08]"
        >
          A sua aprovação não depende de sorte.{" "}
          <motion.span
            className="block mt-1 sm:mt-2 bg-gradient-to-r from-cyan-300 via-indigo-200 via-white to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(99,102,241,0.45)]"
            style={{
              backgroundSize: "200% auto",
            }}
            animate={{
              backgroundPosition: ["0% center", "200% center"],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            Depende de neurociência.
          </motion.span>
        </motion.h1>

        {/* Sub-headline Concisa */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-sm sm:text-base md:text-lg text-slate-300/85 leading-relaxed max-w-2xl sm:max-w-3xl mx-auto font-normal px-2"
        >
          O Synapse AI mapeia seu edital, calcula sua curva de esquecimento, corrige redações discursivas no critério oficial da banca e transforma seu tempo no trânsito em horas líquidas com flashcards em áudio humanizado.
        </motion.p>

        {/* Dual CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-1 w-full sm:w-auto"
        >
          {/* Botão Primário com Ambient Glow */}
          <div className="relative group w-full sm:w-auto">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-600 to-cyan-500 opacity-40 blur-md group-hover:opacity-75 transition-opacity duration-300 animate-pulse pointer-events-none" />
            <Link
              href="/login"
              className="relative w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border border-indigo-400/40 hover:border-indigo-300/60 shadow-xl shadow-indigo-950/60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Começar Gratuitamente</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200 text-cyan-200" />
            </Link>
          </div>

          {/* Botão Secundário Cockpit */}
          <a
            href="#cockpit-showcase"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] hover:border-cyan-500/40 backdrop-blur-xl transition-all duration-200 shadow-lg shadow-black/40 group"
          >
            <Zap className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Ver Cockpit em Ação</span>
          </a>
        </motion.div>

        {/* Micro Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs font-mono text-slate-400 pt-0.5"
        >
          <span className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sem cartão de crédito
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span>Bancas: Cebraspe, FGV & FCC</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-cyan-400/90 font-semibold">+87% de Retenção FSRS</span>
        </motion.div>

        {/* ======================================================================= */}
        {/* DOCK TELEMÉTRICO UNIFICADO (COCKPIT HUD BAR)                             */}
        {/* ======================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55 }}
          className="w-full pt-2 sm:pt-4"
        >
          <div className="relative max-w-4xl mx-auto rounded-2xl bg-white/[0.03] hover:bg-white/[0.045] border border-white/[0.08] hover:border-white/[0.14] backdrop-blur-2xl p-2 sm:p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all">
            {/* Border Beam iluminando o perímetro do Dock */}
            <BorderBeam duration={10} colorFrom="#06b6d4" colorTo="#6366f1" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {/* 1. Motor FSRS */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-all group">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs sm:text-sm font-black text-white">94.8%</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-mono text-cyan-300/80 truncate">
                    Retenção FSRS 4.0
                  </div>
                </div>
              </div>

              {/* 2. Espelho Cebraspe */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-all group">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 shrink-0 group-hover:scale-105 transition-transform">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs sm:text-sm font-black text-white">96.4 pts</span>
                    <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      OURO
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-mono text-violet-300/80 truncate">
                    Discursiva Oficial
                  </div>
                </div>
              </div>

              {/* 3. Áudio Neural com Equalizador Vivo */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-all group">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs sm:text-sm font-black text-white">+2h / dia</span>
                    {/* Equalizador de áudio de 3 barras */}
                    <div className="flex items-end gap-0.5 h-3 px-1">
                      <motion.span
                        className="w-0.5 bg-indigo-400 rounded-full"
                        animate={{ height: ["3px", "10px", "4px", "12px", "3px"] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.span
                        className="w-0.5 bg-cyan-400 rounded-full"
                        animate={{ height: ["10px", "3px", "12px", "6px", "10px"] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                      />
                      <motion.span
                        className="w-0.5 bg-violet-400 rounded-full"
                        animate={{ height: ["4px", "12px", "3px", "8px", "4px"] }}
                        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                      />
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-mono text-indigo-300/80 truncate">
                    Áudio Hands-Free
                  </div>
                </div>
              </div>

              {/* 4. Consistência / Ofensiva */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-all group">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs sm:text-sm font-black text-white">18 Dias</span>
                    <span className="text-[9px] font-mono font-bold text-amber-400">🔥</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-mono text-amber-300/80 truncate">
                    Hábito Inquebrável
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ========================================================================= */}
      {/* INDICADOR MINIMALISTA DE ROLAGEM NA BASE DA TELA                           */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="relative z-10 flex flex-col items-center pt-2 sm:pt-3"
      >
        <a
          href="#pain-transition"
          className="group flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-all backdrop-blur-sm"
        >
          <span>ROLE PARA EXPLORAR</span>
          <ChevronDown className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-y-0.5 transition-transform animate-bounce" />
        </a>
      </motion.div>
    </section>
  );
}
