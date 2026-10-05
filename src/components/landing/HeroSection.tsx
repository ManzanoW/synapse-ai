"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  ArrowDownRight,
  Zap,
  BrainCircuit,
  Sparkles,
  Activity,
  Star,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);

  // Parallax suave de Scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const contentY = useTransform(scrollYProgress, [0, 0.6], [0, -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

  // Mouse Parallax sutil para profundidade 3D
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 45, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 45, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const artworkX = useTransform(smoothMouseX, [-0.5, 0.5], [12, -12]);
  const artworkY = useTransform(smoothMouseY, [-0.5, 0.5], [8, -8]);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-screen min-h-[100dvh] w-full flex flex-col justify-between items-center overflow-hidden bg-[#02050e] pt-24 pb-8 sm:pb-10 px-4 select-none"
    >
      {/* ========================================================================= */}
      {/* 🌌 OBRA DE ARTE CINEMATOGRÁFICA DE FUNDO COM PARALLAX                      */}
      {/* ========================================================================= */}
      <motion.div
        style={{ scale: bgScale, y: bgY, x: artworkX }}
        className="pointer-events-none absolute inset-0 z-0 w-full h-full overflow-hidden"
      >
        <Image
          src="/synapse-cinematic-prologue.jpg"
          alt="Synapse AI - O Portal Cognitivo"
          fill
          priority
          unoptimized
          className="object-cover object-center"
        />

        {/* Halo de Luz no Ponto Ápice do Cérebro Cósmico */}
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-cyan-400/20 blur-3xl animate-pulse pointer-events-none" />

        {/* Gradiente Superior Suave para Legibilidade da Navbar */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#02050e]/85 via-[#02050e]/30 to-transparent" />

        {/* Vinheta Inferior Suave para Transição de Scroll */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#030712] via-[#030712]/60 to-transparent" />

        {/* Vinhetas Laterais Sutis de Cinema */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#02050e]/60 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#02050e]/60 to-transparent" />
      </motion.div>

      {/* Espaçador Topo */}
      <div className="h-2 sm:h-4" />

      {/* ========================================================================= */}
      {/* 🎬 NARRATIVA CINEMATOGRÁFICA MONUMENTAL (O IMPACTO CENTRAL)                */}
      {/* ========================================================================= */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center justify-center space-y-3 sm:space-y-4 my-auto px-2"
      >
        {/* Prólogo Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#030712]/60 border border-cyan-500/20 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.15)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-cyan-300 uppercase">
            SUA APROVAÇÃO NÃO DEPENDE DE SORTE
          </span>
        </motion.div>

        {/* Título Épico Monumental */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] font-black tracking-tight text-white uppercase leading-[0.98] drop-shadow-[0_8px_30px_rgba(0,0,0,0.95)]"
        >
          DEPENDE DE{" "}
          <motion.span
            className="block mt-1 sm:mt-2 bg-gradient-to-r from-cyan-300 via-indigo-100 via-white to-violet-300 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(6,182,212,0.6)]"
            style={{ backgroundSize: "200% auto" }}
            animate={{ backgroundPosition: ["0% center", "200% center"] }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          >
            NEUROCIÊNCIA
          </motion.span>
        </motion.h1>

        {/* Linha Reflexiva de Conexão Emocional */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="text-xs sm:text-base md:text-lg text-slate-200/95 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] px-3 py-1.5 rounded-xl bg-[#02050e]/40 backdrop-blur-xs"
        >
          O cérebro humano não foi feito para memorizar 1.200 páginas no esforço bruto.
          Conecte sua preparação à inteligência do primeiro copiloto cognitivo.
        </motion.p>

        {/* Prova Social & Avaliação dos Concurseiros */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 pt-1"
        >
          {/* Avatar stack */}
          <div className="flex -space-x-2 items-center">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#02050e] bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md ring-1 ring-cyan-400/40">
              TR
            </div>
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#02050e] bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md ring-1 ring-purple-400/40">
              MS
            </div>
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#02050e] bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md ring-1 ring-emerald-400/40">
              GA
            </div>
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#02050e] bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md ring-1 ring-amber-400/40">
              LF
            </div>
          </div>

          {/* Stars & Metric */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-3.5 h-3.5 text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                />
              ))}
              <span className="text-xs font-bold text-white ml-1">4.9/5</span>
            </div>
            <span className="text-[11px] text-slate-300 font-mono tracking-tight drop-shadow-sm">
              Mais de <strong className="text-cyan-300 font-bold">+1.480 concurseiros</strong> acelerando aprovações
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 🧭 HUD DE NAVEGAÇÃO & TELEMETRIA COGNITIVA (DOCK PROPRIETÁRIO SYNAPSE)    */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.55 }}
        className="relative z-10 w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 px-2 sm:px-4"
      >
        {/* Esquerda: Telemetria do Algoritmo (Desktop) */}
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#030712]/60 border border-white/5 backdrop-blur-md shadow-sm text-[11px] font-mono text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="text-slate-400 tracking-wider">STATUS:</span>
          <span className="font-bold text-cyan-300">MOTOR FSRS 4.5 ATIVO</span>
        </div>

        {/* Centro: Indicador Minimalista de Scroll (Mouse com Feixe Fluido) */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-[10px] sm:text-[11px] font-mono font-medium tracking-[0.25em] text-slate-300 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            ROLE PARA INICIAR A JORNADA
          </span>
          <div className="w-4 h-7 rounded-full border border-cyan-400/40 flex items-start justify-center p-0.5 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee]"
            />
          </div>
        </div>

        {/* Direita: Acesso Tático Direto ao Cockpit (Sem qualquer jargão de 'pular apresentação') */}
        <a
          href="#cockpit"
          onClick={() => triggerHaptic("medium")}
          className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-[#030712]/80 hover:bg-cyan-950/70 border border-cyan-500/25 hover:border-cyan-400/60 backdrop-blur-md text-xs font-mono font-bold text-cyan-300 hover:text-white transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] active:scale-95"
        >
          <BrainCircuit className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span className="tracking-wide">IR DIRETO AO COCKPIT</span>
          <ArrowDownRight className="w-3.5 h-3.5 text-cyan-400/80 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
        </a>
      </motion.div>
    </section>
  );
}
