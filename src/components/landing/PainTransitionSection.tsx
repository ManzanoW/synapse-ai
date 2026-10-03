"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { AlertCircle, CheckCircle2, Sparkles, Brain } from "lucide-react";

export function PainTransitionSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Frase 1: "Sobrecarga mental de editais infinitos" (0.05 a 0.28)
  const opacity1 = useTransform(scrollYProgress, [0.05, 0.12, 0.22, 0.28], [0, 1, 1, 0]);
  const scale1 = useTransform(scrollYProgress, [0.05, 0.12, 0.22, 0.28], [0.85, 1, 1, 1.1]);
  const blur1 = useTransform(scrollYProgress, [0.05, 0.12, 0.22, 0.28], ["10px", "0px", "0px", "12px"]);
  const y1 = useTransform(scrollYProgress, [0.05, 0.12, 0.28], [30, 0, -30]);

  // Frase 2: "Falta de consistência e horas perdidas no trânsito" (0.28 a 0.52)
  const opacity2 = useTransform(scrollYProgress, [0.28, 0.35, 0.45, 0.52], [0, 1, 1, 0]);
  const scale2 = useTransform(scrollYProgress, [0.28, 0.35, 0.45, 0.52], [0.85, 1, 1, 1.1]);
  const blur2 = useTransform(scrollYProgress, [0.28, 0.35, 0.45, 0.52], ["10px", "0px", "0px", "12px"]);
  const y2 = useTransform(scrollYProgress, [0.28, 0.35, 0.52], [30, 0, -30]);

  // Frase 3: "Planilhas confusas e matérias esquecidas na véspera" (0.52 a 0.74)
  const opacity3 = useTransform(scrollYProgress, [0.52, 0.58, 0.68, 0.74], [0, 1, 1, 0]);
  const scale3 = useTransform(scrollYProgress, [0.52, 0.58, 0.68, 0.74], [0.85, 1, 1, 1.1]);
  const blur3 = useTransform(scrollYProgress, [0.52, 0.58, 0.68, 0.74], ["10px", "0px", "0px", "12px"]);
  const y3 = useTransform(scrollYProgress, [0.52, 0.58, 0.74], [30, 0, -30]);

  // Frase 4 (O Alívio): "Calma. Seu cérebro só precisava do algoritmo certo." (0.74 a 1.0)
  const opacityRelief = useTransform(scrollYProgress, [0.74, 0.83, 0.96, 1.0], [0, 1, 1, 0.95]);
  const scaleRelief = useTransform(scrollYProgress, [0.74, 0.83, 1.0], [0.85, 1, 1.05]);
  const glowOpacity = useTransform(scrollYProgress, [0.74, 0.85], [0, 0.8]);

  return (
    <div
      id="pain-transition"
      ref={containerRef}
      className="relative h-[220vh] w-full bg-[#030712] select-none"
    >
      {/* Sticky Fullscreen Container */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden px-4">
        {/* Background Ambient Aura for the Pain Stage */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-[600px] h-[600px] bg-rose-600/5 rounded-full blur-[150px]" />
        </div>

        {/* Dynamic Cosmic Cyan & Indigo Glow for the Relief Stage */}
        <motion.div
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10"
        >
          <div className="w-[850px] h-[550px] bg-gradient-to-r from-indigo-600/25 via-violet-600/20 to-cyan-500/25 rounded-full blur-[160px]" />
        </motion.div>

        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* ===================================================================== */}
        {/* FRASE 1: SOBRECARGA MENTAL                                            */}
        {/* ===================================================================== */}
        <motion.div
          style={{
            opacity: opacity1,
            scale: scale1,
            filter: blur1,
            y: y1,
          }}
          className="absolute text-center max-w-4xl px-4 pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-mono font-bold uppercase tracking-wider mb-6">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>O Peso da Preparação Arcaica</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-[0_0_35px_rgba(244,63,94,0.25)]">
            &quot;Sobrecarga mental de{" "}
            <span className="text-rose-400 underline decoration-rose-500/50 decoration-wavy">
              editais infinitos
            </span>
            &quot;
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-slate-400 font-mono">
            Centenas de páginas jurídicas e a sensação constante de que nada fixa na memória.
          </p>
        </motion.div>

        {/* ===================================================================== */}
        {/* FRASE 2: FALTA DE CONSISTÊNCIA                                        */}
        {/* ===================================================================== */}
        <motion.div
          style={{
            opacity: opacity2,
            scale: scale2,
            filter: blur2,
            y: y2,
          }}
          className="absolute text-center max-w-4xl px-4 pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-6">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Horas Mortas no Desperdício</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-[0_0_35px_rgba(245,158,11,0.25)]">
            &quot;Falta de consistência e{" "}
            <span className="text-amber-400 underline decoration-amber-500/50 decoration-wavy">
              horas perdidas no trânsito
            </span>
            &quot;
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-slate-400 font-mono">
            Passar 2h por dia preso no volante querendo estudar sem poder manusear livros.
          </p>
        </motion.div>

        {/* ===================================================================== */}
        {/* FRASE 3: PLANILHAS CONFUSAS & ESQUECIMENTO                            */}
        {/* ===================================================================== */}
        <motion.div
          style={{
            opacity: opacity3,
            scale: scale3,
            filter: blur3,
            y: y3,
          }}
          className="absolute text-center max-w-4xl px-4 pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-mono font-bold uppercase tracking-wider mb-6">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>A Bola de Neve do Esquecimento</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-[0_0_35px_rgba(244,63,94,0.25)]">
            &quot;Planilhas confusas e{" "}
            <span className="text-rose-400 underline decoration-rose-500/50 decoration-wavy">
              matérias esquecidas na véspera
            </span>
            &quot;
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-slate-400 font-mono">
            A dor de errar na prova exatamente aquilo que você estudou há dois meses.
          </p>
        </motion.div>

        {/* ===================================================================== */}
        {/* FRASE 4 (O ALÍVIO): SEU CÉREBRO SÓ PRECISAVA DO ALGORITMO CERTO       */}
        {/* ===================================================================== */}
        <motion.div
          style={{
            opacity: opacityRelief,
            scale: scaleRelief,
          }}
          className="absolute text-center max-w-4xl px-4 pointer-events-none z-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 via-cyan-500/20 to-emerald-500/20 border border-cyan-400/40 text-cyan-300 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider mb-6 shadow-[0_0_25px_rgba(6,182,212,0.35)]">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>O Ponto de Virada</span>
          </div>

          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
            Calma.{" "}
            <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-cyan-300 via-indigo-200 to-violet-300 bg-clip-text text-transparent drop-shadow-[0_0_45px_rgba(99,102,241,0.5)]">
              Seu cérebro só precisava do algoritmo certo.
            </span>
          </h2>

          <p className="mt-6 text-base sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Conheça o cockpit que calcula a estabilidade da sua memória, corrige discursivas no espelho oficial e estuda com você no fone Bluetooth.
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-mono text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>COCKPIT SYNAPSE CARREGANDO ABAIXO ↓</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
