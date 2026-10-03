"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Zap, Sparkles, BrainCircuit, ArrowDown } from "lucide-react";

export function PainTransitionSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // =========================================================================
  // SCROLL MAPPING COREOGRÁFICO CONTÍNUO (ESTILO MENTORIS)
  // Conforme o usuário rola, uma palavra sobe e desvanece enquanto a próxima entra
  // =========================================================================

  // 1. "Sobrecarga mental" (0.02 a 0.30)
  const opacity1 = useTransform(scrollYProgress, [0.02, 0.10, 0.22, 0.30], [0, 1, 1, 0]);
  const y1 = useTransform(scrollYProgress, [0.02, 0.10, 0.22, 0.30], [60, 0, 0, -80]);
  const blur1 = useTransform(scrollYProgress, [0.02, 0.10, 0.22, 0.30], ["blur(10px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  // 2. "Falta de consistência" (0.24 a 0.54) - Começa a entrar antes da 1 sumir, como na foto do Mentoris!
  const opacity2 = useTransform(scrollYProgress, [0.24, 0.34, 0.44, 0.54], [0, 1, 1, 0]);
  const y2 = useTransform(scrollYProgress, [0.24, 0.34, 0.44, 0.54], [80, 0, 0, -80]);
  const blur2 = useTransform(scrollYProgress, [0.24, 0.34, 0.44, 0.54], ["blur(10px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  // 3. "Planilhas confusas e esquecimento" (0.48 a 0.76)
  const opacity3 = useTransform(scrollYProgress, [0.48, 0.58, 0.68, 0.76], [0, 1, 1, 0]);
  const y3 = useTransform(scrollYProgress, [0.48, 0.58, 0.68, 0.76], [80, 0, 0, -80]);
  const blur3 = useTransform(scrollYProgress, [0.48, 0.58, 0.68, 0.76], ["blur(10px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  // 4. A VIRADA: "Calma. Seu cérebro só precisava do algoritmo certo." (0.74 a 1.0)
  const opacityRelief = useTransform(scrollYProgress, [0.74, 0.84, 0.96, 1.0], [0, 1, 1, 0.9]);
  const yRelief = useTransform(scrollYProgress, [0.74, 0.84, 1.0], [70, 0, -10]);
  const scaleRelief = useTransform(scrollYProgress, [0.74, 0.84, 1.0], [0.92, 1, 1.02]);

  // Transição de Iluminação: do Vermelho Estresse (Dor) para Ciano/Índigo (Alívio)
  const redGlowOpacity = useTransform(scrollYProgress, [0, 0.65, 0.78], [0.7, 0.7, 0]);
  const cyanGlowOpacity = useTransform(scrollYProgress, [0.72, 0.85, 1.0], [0, 0.85, 0.9]);

  // Barra de progresso contínua estilo story
  const storyProgress = useTransform(scrollYProgress, [0.05, 0.95], ["0%", "100%"]);

  // Faíscas e brasas determinísticas fixas
  const embers = [
    { top: "15%", left: "12%", size: 3, delay: 0.2, duration: 3.2 },
    { top: "25%", left: "85%", size: 4, delay: 0.5, duration: 4.1 },
    { top: "35%", left: "20%", size: 2.5, delay: 1.1, duration: 3.8 },
    { top: "45%", left: "75%", size: 3.5, delay: 0.8, duration: 4.5 },
    { top: "55%", left: "10%", size: 4, delay: 1.5, duration: 3.6 },
    { top: "65%", left: "88%", size: 3, delay: 0.3, duration: 4.2 },
    { top: "75%", left: "28%", size: 2.5, delay: 1.8, duration: 3.9 },
    { top: "82%", left: "70%", size: 4, delay: 0.7, duration: 4.7 },
    { top: "18%", left: "60%", size: 3, delay: 2.1, duration: 3.4 },
    { top: "68%", left: "45%", size: 2, delay: 1.2, duration: 4.0 },
  ];

  return (
    <div
      id="pain-transition"
      ref={containerRef}
      className="relative h-[380vh] w-full bg-[#030712] select-none"
    >
      {/* Sticky Fullscreen Viewport Container */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden px-4">
        
        {/* ===================================================================== */}
        {/* 1. ATMOSFERA CÓSMICA DE ESTRESSE: BRASAS & FAÍSCAS (ESTILO MENTORIS)  */}
        {/* ===================================================================== */}
        <motion.div
          style={{ opacity: redGlowOpacity }}
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden transition-opacity"
        >
          {/* Halo Vermelho de Estresse Cognitivo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[550px] sm:h-[750px] bg-rose-600/18 rounded-full blur-[180px]" />
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-rose-700/12 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-600/10 rounded-full blur-[140px]" />

          {/* Brasas e Partículas Vermelhas Flutuantes */}
          {embers.map((ember, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-rose-400 shadow-[0_0_10px_#f43f5e]"
              style={{
                top: ember.top,
                left: ember.left,
                width: `${ember.size}px`,
                height: `${ember.size}px`,
              }}
              animate={{
                opacity: [0.2, 0.9, 0.3],
                scale: [0.8, 1.4, 0.9],
                y: [-5, -25, -5],
              }}
              transition={{
                duration: ember.duration,
                repeat: Infinity,
                delay: ember.delay,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Faíscas / Riscos de Luz Cortando o Fundo */}
          <div className="absolute top-1/3 left-1/4 w-32 h-[1px] bg-gradient-to-r from-transparent via-rose-500/60 to-transparent -rotate-12 blur-[0.5px]" />
          <div className="absolute bottom-1/3 right-1/4 w-44 h-[1px] bg-gradient-to-r from-transparent via-rose-400/50 to-transparent rotate-6 blur-[0.5px]" />
        </motion.div>

        {/* ===================================================================== */}
        {/* 2. ATMOSFERA CÓSMICA DO ALÍVIO (CIANO & ÍNDIGO NEON)                  */}
        {/* ===================================================================== */}
        <motion.div
          style={{ opacity: cyanGlowOpacity }}
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden transition-opacity"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] sm:w-[1100px] h-[600px] sm:h-[800px] bg-gradient-to-r from-cyan-500/25 via-indigo-600/25 to-violet-600/25 rounded-full blur-[170px]" />
        </motion.div>

        {/* Constellation Grid Overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />

        {/* ===================================================================== */}
        {/* FRASE 1: SOBRECARGA MENTAL (MONUMENTAL & CÓSMICA)                      */}
        {/* ===================================================================== */}
        <motion.div
          style={{
            opacity: opacity1,
            y: y1,
            filter: blur1,
          }}
          className="absolute text-center max-w-4xl px-4 pointer-events-none flex flex-col items-center"
        >
          <h2 className="text-4xl sm:text-7xl md:text-8xl font-black text-white tracking-tight leading-none drop-shadow-[0_0_40px_rgba(244,63,94,0.4)]">
            Sobrecarga mental
          </h2>
          <p className="mt-5 text-sm sm:text-xl text-rose-300/80 font-mono tracking-wide max-w-lg">
            Centenas de páginas de editais infinitos e a sensação de que nada fixa.
          </p>
        </motion.div>

        {/* ===================================================================== */}
        {/* FRASE 2: FALTA DE CONSISTÊNCIA                                        */}
        {/* ===================================================================== */}
        <motion.div
          style={{
            opacity: opacity2,
            y: y2,
            filter: blur2,
          }}
          className="absolute text-center max-w-4xl px-4 pointer-events-none flex flex-col items-center"
        >
          <h2 className="text-4xl sm:text-7xl md:text-8xl font-black text-white tracking-tight leading-none drop-shadow-[0_0_40px_rgba(245,158,11,0.4)]">
            Falta de consistência
          </h2>
          <p className="mt-5 text-sm sm:text-xl text-amber-300/80 font-mono tracking-wide max-w-lg">
            2 horas por dia perdidas no trânsito querendo estudar sem conseguir.
          </p>
        </motion.div>

        {/* ===================================================================== */}
        {/* FRASE 3: PLANILHAS CONFUSAS & ESQUECIMENTO                            */}
        {/* ===================================================================== */}
        <motion.div
          style={{
            opacity: opacity3,
            y: y3,
            filter: blur3,
          }}
          className="absolute text-center max-w-4xl px-4 pointer-events-none flex flex-col items-center"
        >
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-tight drop-shadow-[0_0_40px_rgba(244,63,94,0.4)]">
            Esquecimento na véspera
          </h2>
          <p className="mt-5 text-sm sm:text-xl text-rose-300/80 font-mono tracking-wide max-w-lg">
            A dor de errar na prova exatamente aquilo que você estudou há 2 meses.
          </p>
        </motion.div>

        {/* ===================================================================== */}
        {/* A VIRADA: O ALÍVIO DA NEUROCIÊNCIA (A TRANSIÇÃO PERFEITA PARA O COCKPIT) */}
        {/* ===================================================================== */}
        <motion.div
          style={{
            opacity: opacityRelief,
            y: yRelief,
            scale: scaleRelief,
          }}
          className="absolute text-center max-w-4xl px-4 pointer-events-none flex flex-col items-center space-y-4 sm:space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-xs sm:text-sm font-mono font-bold tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            <BrainCircuit className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>A RESPOSTA DA NEUROCIÊNCIA</span>
          </div>

          <h2 className="text-3xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-tight">
            Calma. Seu cérebro só precisava do{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(99,102,241,0.5)]">
              algoritmo certo.
            </span>
          </h2>

          <p className="text-sm sm:text-xl text-slate-300/90 font-normal max-w-2xl mx-auto leading-relaxed">
            O Synapse AI assume o cálculo exato da sua curva de esquecimento, audita suas redações e transforma seu trânsito em horas líquidas de estudo.
          </p>

          <div className="pt-2 flex items-center gap-2 text-cyan-400 font-mono text-xs sm:text-sm font-bold animate-bounce">
            <span>Role para conhecer o Cockpit Synapse</span>
            <ArrowDown className="w-4 h-4" />
          </div>
        </motion.div>

        {/* ===================================================================== */}
        {/* INDICADOR DE PROGRESSO DE ROLAGEM CONTÍNUA                            */}
        {/* ===================================================================== */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-xl z-20 shadow-xl">
          <div className="h-1.5 w-32 sm:w-44 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 rounded-full"
              style={{ width: storyProgress }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Do Estresse à Solução
          </span>
        </div>
      </div>
    </div>
  );
}
