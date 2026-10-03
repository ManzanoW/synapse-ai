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
  Volume2,
} from "lucide-react";
import { BorderBeam } from "./BorderBeam";

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);

  // Mouse Gyroscope Tracking com Física de Mola Suave
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 85, damping: 22 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 85, damping: 22 });

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

  // Parallax de Scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.94]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.35], [0, -50]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 160]);

  // Rotação 3D da Base do Cockpit Teaser
  const cockpitRotateX = useTransform(smoothMouseY, [-0.5, 0.5], [18, 6]);
  const cockpitRotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-8, 8]);

  // Parallax Multi-Camadas nos 4 Satélites Orbitais
  // Satélite 1 (Top Left): Profundidade -20px
  const sat1X = useTransform(smoothMouseX, [-0.5, 0.5], [-24, 24]);
  const sat1Y = useTransform(smoothMouseY, [-0.5, 0.5], [-18, 18]);

  // Satélite 2 (Top Right): Profundidade +25px
  const sat2X = useTransform(smoothMouseX, [-0.5, 0.5], [28, -28]);
  const sat2Y = useTransform(smoothMouseY, [-0.5, 0.5], [-22, 22]);

  // Satélite 3 (Bottom Left): Profundidade +22px
  const sat3X = useTransform(smoothMouseX, [-0.5, 0.5], [-32, 32]);
  const sat3Y = useTransform(smoothMouseY, [-0.5, 0.5], [20, -20]);

  // Satélite 4 (Bottom Right): Profundidade +15px
  const sat4X = useTransform(smoothMouseX, [-0.5, 0.5], [22, -22]);
  const sat4Y = useTransform(smoothMouseY, [-0.5, 0.5], [18, -18]);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden bg-[#030712] pt-28 pb-12 px-4 select-none"
    >
      {/* ========================================================================= */}
      {/* CAMADA DE FUNDO (Z-0): GRADIENTES CÓSMICOS & REDE NEURAL ESTELAR          */}
      {/* ========================================================================= */}
      <motion.div
        style={{ y: bgY }}
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* Halos Cósmicos Radiais */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1100px] h-[600px] sm:h-[800px] opacity-75 blur-[160px]"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.18) 40%, rgba(6,182,212,0.12) 75%, transparent 100%)",
          }}
        />

        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-cyan-500/12 rounded-full blur-[140px]" />

        {/* Constellation Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.85) 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />
      </motion.div>

      {/* ========================================================================= */}
      {/* CAMADA MÉDIA (Z-10): TÍTULO MONUMENTAL & COPY PRINCIPAL                   */}
      {/* ========================================================================= */}
      <motion.div
        style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
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
      </motion.div>

      {/* ========================================================================= */}
      {/* 🛸 CAMADA FRONTAL 3D: COCKPIT TEASER & SATÉLITES ORBITAIS PARALLAX        */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative w-full max-w-5xl mx-auto mt-8 sm:mt-12 mb-4"
        style={{ perspective: 1200 }}
      >
        {/* ======================================================================= */}
        {/* 4 SATÉLITES ORBITAIS (DESKTOP / TABLET): PARALLAX DINÂMICO MULTI-CAMADA   */}
        {/* ======================================================================= */}
        
        {/* Satélite 1 (Top Left): Motor FSRS */}
        <motion.div
          style={{ x: sat1X, y: sat1Y }}
          className="hidden md:flex absolute -top-8 -left-8 lg:-left-12 z-30 items-center gap-3 p-3 rounded-2xl bg-[#090d1a]/90 backdrop-blur-xl border border-cyan-500/30 shadow-xl shadow-cyan-950/40 pointer-events-none"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-left font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-bold text-white">FSRS 4.0</span>
            </div>
            <div className="text-xs font-black text-cyan-300">94.8% Retenção</div>
            <span className="text-[10px] text-slate-400">Próx. Revisão: 7d</span>
          </div>
        </motion.div>

        {/* Satélite 2 (Top Right): Espelho Cebraspe */}
        <motion.div
          style={{ x: sat2X, y: sat2Y }}
          className="hidden md:flex absolute -top-10 -right-8 lg:-right-12 z-30 items-center gap-3 p-3 rounded-2xl bg-[#090d1a]/90 backdrop-blur-xl border border-violet-500/30 shadow-xl shadow-violet-950/40 pointer-events-none"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-left font-mono">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Espelho Cebraspe</span>
            <div className="text-xs font-black text-violet-300">96.4 pts Nota Ouro</div>
            <span className="text-[10px] text-emerald-400">Zero desvios formais</span>
          </div>
        </motion.div>

        {/* Satélite 3 (Bottom Left): Áudio Neural */}
        <motion.div
          style={{ x: sat3X, y: sat3Y }}
          className="hidden md:flex absolute -bottom-6 -left-6 lg:-left-10 z-30 items-center gap-3 p-3 rounded-2xl bg-[#090d1a]/90 backdrop-blur-xl border border-indigo-500/30 shadow-xl shadow-indigo-950/40 pointer-events-none"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-left font-mono">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Áudio Neural</span>
            <div className="text-xs font-black text-indigo-300">1.25x Hands-Free</div>
            <span className="text-[10px] text-cyan-400">Bluetooth Ativo</span>
          </div>
        </motion.div>

        {/* Satélite 4 (Bottom Right): Consistência & Ofensiva */}
        <motion.div
          style={{ x: sat4X, y: sat4Y }}
          className="hidden md:flex absolute -bottom-6 -right-6 lg:-right-10 z-30 items-center gap-3 p-3 rounded-2xl bg-[#090d1a]/90 backdrop-blur-xl border border-amber-500/30 shadow-xl shadow-amber-950/40 pointer-events-none"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-left font-mono">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Consistência</span>
            <div className="text-xs font-black text-amber-300">18 Dias de Foco</div>
            <span className="text-[10px] text-slate-400">Ofensiva Imparável 🔥</span>
          </div>
        </motion.div>

        {/* ======================================================================= */}
        {/* MOCKUP 3D DO COCKPIT TEASER COM BORDER BEAM SINÁPTICO                    */}
        {/* ======================================================================= */}
        <motion.div
          style={{
            rotateX: cockpitRotateX,
            rotateY: cockpitRotateY,
            boxShadow: "0 25px 60px -15px rgba(99, 102, 241, 0.35)",
          }}
          className="relative rounded-2xl sm:rounded-3xl p-[1.5px] overflow-hidden group"
        >
          {/* Border Beam Contínuo */}
          <BorderBeam duration={7} colorFrom="#06b6d4" colorTo="#818cf8" />

          {/* Cartão Interno Dark */}
          <div className="relative rounded-[inherit] bg-[#070b14]/95 backdrop-blur-2xl p-4 sm:p-6 border border-white/10 overflow-hidden">
            {/* Header da Janela */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-3 w-px bg-white/10 mx-2" />
                <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-300">
                  synapse.os // <span className="text-cyan-400">copiloto_cognitivo</span>
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ONLINE • 60 FPS</span>
              </div>
            </div>

            {/* Grid de Alta Densidade: Visão Geral Rápida do Cockpit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4">
              {/* Mini Card 1: FSRS Retention Curve */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase">
                    Memória Preditiva
                  </span>
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <div className="text-xl sm:text-2xl font-black font-mono text-white">94.8%</div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div className="h-full w-[95%] bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" />
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 block">
                  Estabilidade: +14 dias sem esquecer
                </span>
              </div>

              {/* Mini Card 2: Neural Audio Stream */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase">
                    Áudio Hands-Free
                  </span>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white truncate">
                    Art. 37 CF/88 • Princípios LIMPE
                  </div>
                  {/* Mini Sound Equalizer */}
                  <div className="flex items-center gap-1 h-5 pt-1">
                    {[40, 75, 55, 90, 65, 80, 45, 95, 70, 85].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full animate-pulse"
                        style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 block">
                  Pausa ativa para recall de 5s
                </span>
              </div>

              {/* Mini Card 3: Discursiva Cebraspe */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-violet-300 uppercase">
                    Redação Cebraspe
                  </span>
                  <FileCheck2 className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div className="space-y-1">
                  <div className="text-xl sm:text-2xl font-black font-mono text-white">96.4 pts</div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                    Nota Máxima Recomendada
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 block">
                  Fórmula oficial: NF = NC - 2(NE/TL)
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ambient Ground Reflection Glow */}
        <div
          className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-20 opacity-50 blur-2xl"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.4) 0%, rgba(6,182,212,0.2) 40%, transparent 80%)",
          }}
        />
      </motion.div>

      {/* ========================================================================= */}
      {/* INDICADOR DE ROLAGEM NA BASE DA TELA (ROLE PARA DESCER ↓)                  */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="relative z-10 flex flex-col items-center gap-2 mt-4"
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
