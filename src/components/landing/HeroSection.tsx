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
  Zap,
  BrainCircuit,
  Sparkles,
} from "lucide-react";

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
        className="pointer-events-none absolute inset-0 -z-20 w-full h-full overflow-hidden"
      >
        <Image
          src="/synapse-cinematic-prologue.jpg"
          alt="Synapse AI - O Portal Cognitivo"
          fill
          priority
          quality={95}
          className="object-cover object-center sm:object-[center_35%]"
        />

        {/* Halo de Luz no Ponto Ápice do Cérebro Cósmico */}
        <div className="absolute top-[12%] sm:top-[16%] left-1/2 -translate-x-1/2 w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-cyan-400/25 blur-3xl animate-pulse pointer-events-none" />

        {/* Gradiente Superior para Legibilidade da Navbar */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#02050e]/95 via-[#02050e]/50 to-transparent" />

        {/* Vinheta Inferior Suave para Transição Perfeita de Scroll */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#030712] via-[#030712]/75 to-transparent" />

        {/* Vinhetas Laterais de Cinema */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#02050e]/80 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#02050e]/80 to-transparent" />
      </motion.div>

      {/* Espaçador Topo */}
      <div className="h-6" />

      {/* ========================================================================= */}
      {/* 🎬 NARRATIVA CINEMATOGRÁFICA MONUMENTAL (O IMPACTO CENTRAL)                */}
      {/* ========================================================================= */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center justify-center space-y-4 sm:space-y-5 my-auto"
      >
        {/* Prólogo Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="inline-flex items-center gap-2"
        >
          <span className="text-xs sm:text-sm md:text-base font-mono font-black tracking-[0.22em] text-cyan-300 uppercase drop-shadow-[0_2px_20px_rgba(0,0,0,0.95)]">
            SUA APROVAÇÃO NÃO DEPENDE DE SORTE
          </span>
        </motion.div>

        {/* Título Épico Monumental */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-4xl sm:text-7xl md:text-8xl lg:text-[5.8rem] font-black tracking-tight text-white uppercase leading-[0.96] drop-shadow-[0_10px_40px_rgba(0,0,0,0.98)]"
        >
          DEPENDE DE{" "}
          <motion.span
            className="block mt-1 sm:mt-2 bg-gradient-to-r from-cyan-300 via-indigo-100 via-white to-violet-300 bg-clip-text text-transparent drop-shadow-[0_0_50px_rgba(6,182,212,0.7)]"
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
          transition={{ duration: 0.9, delay: 0.35 }}
          className="text-xs sm:text-base md:text-lg text-slate-200/95 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] px-2"
        >
          O cérebro humano não foi feito para memorizar 1.200 páginas no esforço bruto.
          Conecte sua preparação à inteligência do primeiro copiloto cognitivo.
        </motion.p>
      </motion.div>

      {/* ========================================================================= */}
      {/* 🧭 CONTROLES DE IMERSÃO NARRATIVA (PULAR APRESENTAÇÃO & DESCER)           */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.55 }}
        className="relative z-10 flex flex-col items-center gap-3 sm:gap-4 pb-2"
      >
        {/* Botão de Pular Apresentação (Estilo Mentoris, porém com acabamento Synapse) */}
        <a
          href="#cockpit-showcase"
          className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#040814]/70 hover:bg-cyan-950/70 border border-cyan-500/35 hover:border-cyan-400 text-xs sm:text-sm font-mono font-bold text-cyan-300 hover:text-white backdrop-blur-xl transition-all shadow-[0_0_25px_rgba(6,182,212,0.2)] active:scale-95"
        >
          <span>PULAR APRESENTAÇÃO</span>
          <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
        </a>

        {/* Indicador de Rolagem para Iniciar a Jornada */}
        <div className="flex flex-col items-center gap-1 text-[10px] sm:text-[11px] font-mono text-slate-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          <span className="tracking-wider">ROLE PARA INICIAR A JORNADA</span>
          <ChevronDown className="w-4 h-4 text-cyan-400 animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}
