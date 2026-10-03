"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Activity,
  Brain,
  AlertTriangle,
  Car,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Layers,
} from "lucide-react";

export function PainTransitionSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // =========================================================================
  // SCROLL-DRIVEN COGNITIVE DIAGNOSTIC (IDENTIDADE AUTÊNTICA SYNAPSE AI)
  // 4 Fases de Telemetria Neural:
  // 1. Ruído Sináptico (Sobrecarga de Editais)
  // 2. Fuga de Foco (Horas Mortas no Deslocamento)
  // 3. Colapso de Retenção (Curva de Esquecimento)
  // 4. Sincronização Harmônica (O Alívio do Algoritmo FSRS)
  // =========================================================================

  // Fase 1: Sobrecarga (0.04 a 0.28)
  const opacity1 = useTransform(scrollYProgress, [0.04, 0.12, 0.22, 0.28], [0, 1, 1, 0]);
  const y1 = useTransform(scrollYProgress, [0.04, 0.12, 0.22, 0.28], [40, 0, 0, -40]);
  const scale1 = useTransform(scrollYProgress, [0.04, 0.12, 0.28], [0.95, 1, 0.95]);

  // Fase 2: Horas Mortas no Trânsito (0.28 a 0.52)
  const opacity2 = useTransform(scrollYProgress, [0.28, 0.36, 0.46, 0.52], [0, 1, 1, 0]);
  const y2 = useTransform(scrollYProgress, [0.28, 0.36, 0.46, 0.52], [40, 0, 0, -40]);
  const scale2 = useTransform(scrollYProgress, [0.28, 0.36, 0.52], [0.95, 1, 0.95]);

  // Fase 3: Esquecimento na Véspera (0.52 a 0.74)
  const opacity3 = useTransform(scrollYProgress, [0.52, 0.60, 0.68, 0.74], [0, 1, 1, 0]);
  const y3 = useTransform(scrollYProgress, [0.52, 0.60, 0.68, 0.74], [40, 0, 0, -40]);
  const scale3 = useTransform(scrollYProgress, [0.52, 0.60, 0.74], [0.95, 1, 0.95]);

  // Fase 4: A Sincronização Sináptica (0.74 a 1.0)
  const opacity4 = useTransform(scrollYProgress, [0.74, 0.82, 0.95, 1.0], [0, 1, 1, 1]);
  const y4 = useTransform(scrollYProgress, [0.74, 0.82, 1.0], [50, 0, 0]);
  const scale4 = useTransform(scrollYProgress, [0.74, 0.82, 1.0], [0.92, 1, 1.02]);

  // Onda Caótica -> Onda Harmônica Sincronizada
  const waveHarmonicProgress = useTransform(scrollYProgress, [0.65, 0.85], [0, 1]);

  // Iluminação Sináptica Cósmica
  const chaosAuraOpacity = useTransform(scrollYProgress, [0, 0.65, 0.75], [0.5, 0.6, 0]);
  const syncAuraOpacity = useTransform(scrollYProgress, [0.72, 0.85, 1.0], [0, 0.8, 0.9]);

  // Progresso Linear da Telemetria
  const diagnosticProgress = useTransform(scrollYProgress, [0.05, 0.95], ["0%", "100%"]);

  return (
    <div
      id="pain-transition"
      ref={containerRef}
      className="relative h-[360vh] w-full bg-[#030712] select-none"
    >
      {/* Sticky Fullscreen HUD Viewport */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6">

        {/* ===================================================================== */}
        {/* ILUMINAÇÃO DE FUNDO: REDE NEURAL & HALOS CÓSMICOS SYNAPSE              */}
        {/* ===================================================================== */}
        {/* Aura de Tensão Cognitiva (Índigo & Violeta Profundo) */}
        <motion.div
          style={{ opacity: chaosAuraOpacity }}
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
        >
          <div className="w-[700px] sm:w-[950px] h-[500px] sm:h-[700px] bg-gradient-to-r from-violet-900/20 via-indigo-900/25 to-purple-900/15 rounded-full blur-[170px]" />
          <div className="absolute top-1/3 -left-20 w-80 h-80 bg-indigo-700/15 rounded-full blur-[140px]" />
        </motion.div>

        {/* Aura de Sincronização (Ciano Neon & Azul Elétrico) */}
        <motion.div
          style={{ opacity: syncAuraOpacity }}
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
        >
          <div className="w-[800px] sm:w-[1100px] h-[600px] sm:h-[800px] bg-gradient-to-r from-cyan-500/25 via-indigo-600/30 to-teal-500/20 rounded-full blur-[180px]" />
        </motion.div>

        {/* Grade de Telemetria e Coordenadas Cósmicas */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* HUD Header Superior (Assinatura Sináptica Autêntica) */}
        <div className="absolute top-8 sm:top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl z-20">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
            Diagnóstico Neural //{" "}
            <span className="text-cyan-400">
              {scrollYProgress.get() < 0.72 ? "Sobrecarga Biológica Detectada" : "Memória Sincronizada"}
            </span>
          </span>
        </div>

        {/* ===================================================================== */}
        {/* VISUALIZADOR DE ONDAS NEURAIS (OSCILOSCÓPIO COGNITIVO SYNAPSE)         */}
        {/* ===================================================================== */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-64 -z-10 flex items-center justify-center opacity-30">
          <svg
            className="w-full max-w-4xl h-32 overflow-visible"
            viewBox="0 0 800 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Linha de Base */}
            <line x1="0" y1="60" x2="800" y2="60" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />

            {/* Onda Neural Caótica */}
            <motion.path
              d="M0,60 Q50,20 100,85 T200,30 T300,95 T400,15 T500,105 T600,35 T700,80 T800,60"
              stroke="url(#neuralGradient)"
              strokeWidth="2.5"
              fill="none"
              style={{
                opacity: useTransform(waveHarmonicProgress, [0, 1], [0.9, 0]),
              }}
            />

            {/* Onda Harmônica Sincronizada (Entra na Fase 4) */}
            <motion.path
              d="M0,60 Q100,10 200,60 T400,60 T600,60 T800,60"
              stroke="#06b6d4"
              strokeWidth="3"
              fill="none"
              style={{
                opacity: useTransform(waveHarmonicProgress, [0, 1], [0, 1]),
                filter: "drop-shadow(0 0 12px rgba(6,182,212,0.8))",
              }}
            />

            <defs>
              <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ===================================================================== */}
        {/* PAINEL 1: SOBRECARGA DE EDITAIS                                       */}
        {/* ===================================================================== */}
        <motion.div
          style={{ opacity: opacity1, y: y1, scale: scale1 }}
          className="absolute max-w-3xl w-full px-4 text-center pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 font-mono text-xs font-bold uppercase tracking-wider mb-5">
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            <span>Fase 01 • Saturação Cognitiva</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            O cérebro humano não foi feito para decorar{" "}
            <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
              1.200 páginas de edital.
            </span>
          </h2>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 font-mono text-xs sm:text-sm text-slate-300">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
              <span className="text-violet-400 font-bold block text-base sm:text-lg">&lt; 18%</span>
              <span className="text-slate-400 text-[11px]">Retenção espontânea em 14 dias</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
              <span className="text-rose-400 font-bold block text-base sm:text-lg">Ruído Neural</span>
              <span className="text-slate-400 text-[11px]">Sensação de estagnação mental</span>
            </div>
          </div>
        </motion.div>

        {/* ===================================================================== */}
        {/* PAINEL 2: HORAS PERDIDAS NO TRÂNSITO                                  */}
        {/* ===================================================================== */}
        <motion.div
          style={{ opacity: opacity2, y: y2, scale: scale2 }}
          className="absolute max-w-3xl w-full px-4 text-center pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider mb-5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Fase 02 • O Dreno Invisível</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            2 horas por dia perdidas no trânsito{" "}
            <span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
              são 500 horas mortas por ano.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-lg text-slate-300 font-mono max-w-xl mx-auto leading-relaxed">
            Preso no volante ou no transporte público querendo estudar, enquanto a concorrência avança.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs">
            <Car className="w-4 h-4 text-amber-400" />
            <span>Tempo líquido irrecuperável sem estudo hands-free</span>
          </div>
        </motion.div>

        {/* ===================================================================== */}
        {/* PAINEL 3: A CURVA DO ESQUECIMENTO DE EBBINGHAUS                       */}
        {/* ===================================================================== */}
        <motion.div
          style={{ opacity: opacity3, y: y3, scale: scale3 }}
          className="absolute max-w-3xl w-full px-4 text-center pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider mb-5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Fase 03 • A Amnésia de Véspera</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            A dor de errar na prova exatamente aquilo que você{" "}
            <span className="bg-gradient-to-r from-rose-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">
              estudou com afinco há 2 meses.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-lg text-slate-300 font-mono max-w-xl mx-auto leading-relaxed">
            Revisar na data errada é o motivo nº 1 de reprovação: cedo demais você perde tempo; tarde demais, a memória já apagou.
          </p>
        </motion.div>

        {/* ===================================================================== */}
        {/* PAINEL 4: A SINCRONIZAÇÃO NEURAL SYNAPSE (A RESPOSTA DEFINITIVA)       */}
        {/* ===================================================================== */}
        <motion.div
          style={{ opacity: opacity4, y: y4, scale: scale4 }}
          className="absolute max-w-4xl w-full px-4 text-center pointer-events-none space-y-5 sm:space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-teal-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.35)]">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>Sincronização Sináptica Completa</span>
          </div>

          <h2 className="text-3xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08]">
            Calma. Seu cérebro só precisava da{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(99,102,241,0.5)]">
              neurociência certa.
            </span>
          </h2>

          <p className="text-sm sm:text-xl text-slate-300/95 max-w-2xl mx-auto leading-relaxed font-normal">
            O Synapse AI assume o cálculo biológico do seu esquecimento, audita suas redações no critério oficial da banca e transforma seu trânsito em horas líquidas de estudo.
          </p>

          {/* Telemetria de Vitória Cognitiva */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto pt-2 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-black/50 border border-cyan-500/30 backdrop-blur-xl">
              <span className="text-cyan-400 text-lg sm:text-xl font-black block">94.8%</span>
              <span className="text-slate-400 text-[10px] sm:text-[11px]">Retenção FSRS</span>
            </div>
            <div className="p-3 rounded-2xl bg-black/50 border border-indigo-500/30 backdrop-blur-xl">
              <span className="text-indigo-400 text-lg sm:text-xl font-black block">+2h / dia</span>
              <span className="text-slate-400 text-[10px] sm:text-[11px]">Hands-Free Áudio</span>
            </div>
            <div className="p-3 rounded-2xl bg-black/50 border border-violet-500/30 backdrop-blur-xl">
              <span className="text-violet-400 text-lg sm:text-xl font-black block">Nota 96+</span>
              <span className="text-slate-400 text-[10px] sm:text-[11px]">Espelho Cebraspe</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-cyan-400 font-mono text-xs sm:text-sm font-bold animate-bounce">
            <span>Role para entrar no Cockpit Synapse</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </motion.div>

        {/* ===================================================================== */}
        {/* BARRA DE TELEMETRIA NA BASE (ESTILO SCANNER SINÁPTICO)                 */}
        {/* ===================================================================== */}
        <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-xl z-20 shadow-xl">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <div className="h-1.5 w-36 sm:w-52 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-400 rounded-full"
              style={{ width: diagnosticProgress }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Diagnóstico ➔ FSRS
          </span>
        </div>
      </div>
    </div>
  );
}
