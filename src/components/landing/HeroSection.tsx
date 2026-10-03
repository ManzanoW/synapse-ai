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
  Activity,
  Award,
} from "lucide-react";

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
  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, -40]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 140]);

  // Iluminação cósmica que segue sutilmente o cursor
  const lightX = useTransform(smoothMouseX, [-0.5, 0.5], ["35%", "65%"]);
  const lightY = useTransform(smoothMouseY, [-0.5, 0.5], ["25%", "55%"]);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#030712] pt-24 pb-16 px-4 select-none"
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
          className="absolute w-[700px] sm:w-[1000px] h-[600px] sm:h-[800px] rounded-full opacity-70 blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: lightX,
            top: lightY,
            background:
              "radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.18) 40%, rgba(6,182,212,0.14) 70%, transparent 100%)",
          }}
        />

        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-cyan-500/12 rounded-full blur-[140px]" />

        {/* Constellation Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.85) 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />
      </motion.div>

      {/* ========================================================================= */}
      {/* CONTEÚDO HERO CENTRALIZADO & PERFEITAMENTE PROPORCIONADO                  */}
      {/* ========================================================================= */}
      <motion.div
        style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
        className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center justify-center space-y-6 sm:space-y-8 my-auto"
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
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto"
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
          className="pt-1 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-mono text-slate-400"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sem cartão de crédito
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span>Bancas: Cebraspe, FGV & FCC</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span>+87% de Retenção FSRS</span>
        </motion.div>

        {/* ======================================================================= */}
        {/* DOCK TELEMÉTRICO DE NEUROCIÊNCIA (4 PILARES INTEGRADOS & REFINADOS)      */}
        {/* ======================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55 }}
          className="w-full pt-4 sm:pt-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {/* Pilar 1: Motor FSRS */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-cyan-500/30 backdrop-blur-xl transition-all group text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <BrainCircuit className="w-4 h-4" />
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <div className="font-mono text-sm sm:text-base font-black text-white">
                94.8% <span className="text-[10px] font-normal text-slate-400">Retenção</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-mono text-cyan-300/80 truncate">
                FSRS 4.0 • Revisão em 7d
              </div>
            </div>

            {/* Pilar 2: Espelho Cebraspe */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-violet-500/30 backdrop-blur-xl transition-all group text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                  <FileCheck2 className="w-4 h-4" />
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  OURO
                </span>
              </div>
              <div className="font-mono text-sm sm:text-base font-black text-white">
                96.4 pts <span className="text-[10px] font-normal text-slate-400">Nota Final</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-mono text-violet-300/80 truncate">
                Critério Oficial Cebraspe
              </div>
            </div>

            {/* Pilar 3: Áudio Neural */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-indigo-500/30 backdrop-blur-xl transition-all group text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <Headphones className="w-4 h-4" />
                </span>
                <span className="text-[9px] font-mono text-indigo-300">1.25x HD</span>
              </div>
              <div className="font-mono text-sm sm:text-base font-black text-white">
                +2h / dia <span className="text-[10px] font-normal text-slate-400">no trânsito</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-mono text-indigo-300/80 truncate">
                Flashcards Hands-Free
              </div>
            </div>

            {/* Pilar 4: Consistência */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-amber-500/30 backdrop-blur-xl transition-all group text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Flame className="w-4 h-4" />
                </span>
                <span className="text-[9px] font-mono text-amber-300">Ofensiva</span>
              </div>
              <div className="font-mono text-sm sm:text-base font-black text-white">
                18 Dias <span className="text-[10px] font-normal text-slate-400">de Foco</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-mono text-amber-300/80 truncate">
                Hábito Inquebrável 🔥
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ========================================================================= */}
      {/* INDICADOR DE ROLAGEM NA BASE DA TELA (ROLE PARA DESCER ↓)                  */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="relative z-10 flex flex-col items-center gap-2 mt-6 sm:mt-8"
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
