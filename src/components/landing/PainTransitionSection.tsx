"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Brain,
  Layers,
  Clock,
  AlertTriangle,
  Car,
  ChevronDown,
  Cpu,
  Zap,
  Activity,
  Flame,
} from "lucide-react";

export function PainTransitionSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // =========================================================================
  // SCROLL-DRIVEN COGNITIVE DIAGNOSTIC (SYNAPSE AI PROPRIETARY MOTION)
  // 4 Fases de Telemetria com Platôs Perfeitos:
  // 1. Ruído Sináptico (Sobrecarga de Editais)
  // 2. Fuga de Foco (Horas Mortas no Deslocamento)
  // 3. Colapso de Retenção (Curva de Esquecimento)
  // 4. Sincronização Harmônica (O Alívio do Algoritmo FSRS)
  // =========================================================================

  // Fase 1: Sobrecarga (0.04 a 0.28)
  const opacity1 = useTransform(scrollYProgress, [0.04, 0.12, 0.22, 0.28], [0, 1, 1, 0]);
  const y1 = useTransform(scrollYProgress, [0.04, 0.12, 0.22, 0.28], [40, 0, 0, -40]);
  const scale1 = useTransform(scrollYProgress, [0.04, 0.12, 0.28], [0.96, 1, 0.96]);

  // Fase 2: Horas Mortas no Trânsito (0.28 a 0.52)
  const opacity2 = useTransform(scrollYProgress, [0.28, 0.36, 0.46, 0.52], [0, 1, 1, 0]);
  const y2 = useTransform(scrollYProgress, [0.28, 0.36, 0.46, 0.52], [40, 0, 0, -40]);
  const scale2 = useTransform(scrollYProgress, [0.28, 0.36, 0.52], [0.96, 1, 0.96]);

  // Fase 3: Esquecimento na Véspera (0.52 a 0.74)
  const opacity3 = useTransform(scrollYProgress, [0.52, 0.60, 0.68, 0.74], [0, 1, 1, 0]);
  const y3 = useTransform(scrollYProgress, [0.52, 0.60, 0.68, 0.74], [40, 0, 0, -40]);
  const scale3 = useTransform(scrollYProgress, [0.52, 0.60, 0.74], [0.96, 1, 0.96]);

  // Fase 4: A Sincronização Sináptica (0.74 a 1.0)
  const opacity4 = useTransform(scrollYProgress, [0.74, 0.82, 0.95, 1.0], [0, 1, 1, 1]);
  const y4 = useTransform(scrollYProgress, [0.74, 0.82, 1.0], [50, 0, 0]);
  const scale4 = useTransform(scrollYProgress, [0.74, 0.82, 1.0], [0.94, 1, 1.02]);

  // Transição da Onda: Caos Estático ➔ Ressonância Harmônica Sincronizada
  const waveHarmonicProgress = useTransform(scrollYProgress, [0.65, 0.82], [0, 1]);

  // Iluminação Cósmica de Fundo
  const chaosAuraOpacity = useTransform(scrollYProgress, [0, 0.65, 0.76], [0.55, 0.65, 0]);
  const syncAuraOpacity = useTransform(scrollYProgress, [0.72, 0.84, 1.0], [0, 0.85, 0.95]);

  // Barra de Telemetria Inferior
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
        {/* ILUMINAÇÃO DE FUNDO REATIVA & RESPIRANDO                              */}
        {/* ===================================================================== */}
        {/* Aura de Tensão Cognitiva (Índigo & Violeta) */}
        <motion.div
          style={{ opacity: chaosAuraOpacity }}
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="w-[700px] sm:w-[1000px] h-[500px] sm:h-[750px] bg-gradient-to-r from-violet-900/25 via-indigo-900/30 to-purple-900/20 rounded-full blur-[180px]"
          />
        </motion.div>

        {/* Aura de Sincronização (Ciano Neon & Azul Elétrico) */}
        <motion.div
          style={{ opacity: syncAuraOpacity }}
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.7, 0.9, 0.7] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-[800px] sm:w-[1150px] h-[600px] sm:h-[850px] bg-gradient-to-r from-cyan-500/30 via-indigo-600/35 to-teal-400/25 rounded-full blur-[180px]"
          />
        </motion.div>

        {/* Feixe de Scanner Vertical Animado (Linha de Varredura Laser) */}
        <motion.div
          animate={{ y: ["-100%", "200%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-cyan-500/[0.04] to-transparent -z-10"
        />

        {/* Grade de Telemetria e Coordenadas Cósmicas */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* HUD Header Superior (Assinatura Sináptica Autêntica) */}
        <div className="absolute top-8 sm:top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#080d1a]/80 border border-white/[0.08] backdrop-blur-xl z-20 shadow-lg shadow-black/40">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <span>Scanner Cognitivo //</span>
            <span className="text-cyan-400 font-mono">
              {scrollYProgress.get() < 0.72 ? "Monitorando Sobrecarga Mental" : "Sinapse Sincronizada (60 FPS)"}
            </span>
          </span>
        </div>

        {/* ===================================================================== */}
        {/* ⚡ OSCILOSCÓPIO NEURAL VIVO & FLUINDO EM TEMPO REAL                     */}
        {/* Multi-camadas com fluxo horizontal contínuo e disparos elétricos      */}
        {/* ===================================================================== */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-80 -z-10 flex items-center justify-center overflow-hidden">
          {/* 1. ONDA CAÓTICA EM FLUXO CONTÍNUO (Fases 1 a 3) */}
          <motion.div
            style={{
              opacity: useTransform(waveHarmonicProgress, [0, 0.8], [0.85, 0]),
            }}
            className="w-full max-w-5xl h-44 relative flex items-center justify-center"
          >
            {/* SVG com onda dupla que se move horizontalmente em loop contínuo */}
            <motion.svg
              className="w-[200%] h-full overflow-visible shrink-0"
              viewBox="0 0 1600 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ x: [0, -800] }}
              transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            >
              {/* Linha de Base */}
              <line x1="0" y1="70" x2="1600" y2="70" stroke="rgba(255,255,255,0.06)" strokeDasharray="6 6" />

              {/* Camada 1: Glow Difuso da Onda Caótica */}
              <path
                d="M0,70 Q50,15 100,105 T200,35 T300,110 T400,20 T500,120 T600,40 T700,95 T800,70 Q850,15 900,105 T1000,35 T1100,110 T1200,20 T1300,120 T1400,40 T1500,95 T1600,70"
                stroke="#6366f1"
                strokeWidth="7"
                strokeLinecap="round"
                className="opacity-25 blur-sm"
              />

              {/* Camada 2: Onda Neural Caótica Principal */}
              <path
                d="M0,70 Q50,15 100,105 T200,35 T300,110 T400,20 T500,120 T600,40 T700,95 T800,70 Q850,15 900,105 T1000,35 T1100,110 T1200,20 T1300,120 T1400,40 T1500,95 T1600,70"
                stroke="url(#chaosGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Camada 3: Feixes Elétricos de Ação Rápida Correndo ao Longo do Fio */}
              <path
                d="M0,70 Q50,15 100,105 T200,35 T300,110 T400,20 T500,120 T600,40 T700,95 T800,70 Q850,15 900,105 T1000,35 T1100,110 T1200,20 T1300,120 T1400,40 T1500,95 T1600,70"
                stroke="#38bdf8"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="30 200"
                className="filter drop-shadow-[0_0_8px_#38bdf8]"
              />

              <defs>
                <linearGradient id="chaosGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="30%" stopColor="#c084fc" />
                  <stop offset="60%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
            </motion.svg>
          </motion.div>

          {/* 2. ONDA HARMÔNICA SINCRONIZADA (Entra triunfante na Fase 4) */}
          <motion.div
            style={{
              opacity: useTransform(waveHarmonicProgress, [0.3, 1], [0, 1]),
            }}
            className="w-full max-w-5xl h-44 absolute flex items-center justify-center"
          >
            <motion.svg
              className="w-[200%] h-full overflow-visible shrink-0"
              viewBox="0 0 1600 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ x: [0, -800] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            >
              {/* Linha de Base Harmônica */}
              <line x1="0" y1="70" x2="1600" y2="70" stroke="rgba(6,182,212,0.15)" strokeDasharray="4 4" />

              {/* Glow Ciano Suave */}
              <path
                d="M0,70 Q100,20 200,70 T400,70 T600,70 T800,70 Q900,20 1000,70 T1200,70 T1400,70 T1600,70"
                stroke="#06b6d4"
                strokeWidth="8"
                strokeLinecap="round"
                className="opacity-35 blur-md"
              />

              {/* Linha Harmônica Neon Laser */}
              <path
                d="M0,70 Q100,20 200,70 T400,70 T600,70 T800,70 Q900,20 1000,70 T1200,70 T1400,70 T1600,70"
                stroke="#22d3ee"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_15px_rgba(6,182,212,0.9)]"
              />

              {/* Impulso Elétrico Perfeito */}
              <path
                d="M0,70 Q100,20 200,70 T400,70 T600,70 T800,70 Q900,20 1000,70 T1200,70 T1400,70 T1600,70"
                stroke="#ffffff"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="20 280"
              />
            </motion.svg>
          </motion.div>
        </div>

        {/* ===================================================================== */}
        {/* PAINEL 1: SOBRECARGA DE EDITAIS                                       */}
        {/* ===================================================================== */}
        <motion.div
          style={{ opacity: opacity1, y: y1, scale: scale1 }}
          className="absolute max-w-3xl w-full px-4 text-center pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 font-mono text-xs font-bold uppercase tracking-wider mb-5 backdrop-blur-md">
            <Layers className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span>Fase 01 • Saturação Cognitiva</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            O cérebro humano não foi feito para decorar{" "}
            <span className="bg-gradient-to-r from-violet-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(139,92,246,0.35)]">
              1.200 páginas de edital.
            </span>
          </h2>

          {/* Cartões de Telemetria Dinâmicos com Micro-Animações */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 font-mono text-xs sm:text-sm text-slate-300">
            <div className="p-3.5 rounded-2xl bg-[#090d1a]/80 border border-violet-500/25 backdrop-blur-xl shadow-lg shadow-black/40 min-w-[170px] text-left">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] text-slate-400">Retenção Espontânea</span>
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              </div>
              <div className="text-rose-400 font-black text-xl sm:text-2xl font-mono">&lt; 18%</div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1.5">
                <motion.div
                  className="h-full bg-rose-500 rounded-full"
                  animate={{ width: ["18%", "12%", "18%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#090d1a]/80 border border-indigo-500/25 backdrop-blur-xl shadow-lg shadow-black/40 min-w-[170px] text-left">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] text-slate-400">Frequência Beta</span>
                <span className="text-amber-400 text-[10px]">38 Hz</span>
              </div>
              <div className="text-amber-300 font-black text-xl sm:text-2xl font-mono">Ruído Neural</div>
              {/* Mini Oscilador de Barras */}
              <div className="flex items-center gap-1 h-2 mt-1.5">
                {[40, 85, 60, 95, 50, 75].map((h, i) => (
                  <motion.span
                    key={i}
                    animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.3}%`] }}
                    transition={{ duration: 0.7 + i * 0.15, repeat: Infinity, ease: "easeInOut" }}
                    className="w-1 bg-amber-400/80 rounded-full"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider mb-5 backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Fase 02 • O Dreno Invisível</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            2 horas por dia perdidas no trânsito{" "}
            <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(245,158,11,0.35)]">
              são 500 horas mortas por ano.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-lg text-slate-300 font-mono max-w-xl mx-auto leading-relaxed">
            Preso no volante ou no transporte público querendo estudar, enquanto a concorrência avança com o tempo na mão.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#090d1a]/80 border border-amber-500/30 text-amber-300 font-mono text-xs backdrop-blur-xl shadow-lg">
            <Car className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>Déficit crônico: -2.5 meses de estudo líquido por edital</span>
          </div>
        </motion.div>

        {/* ===================================================================== */}
        {/* PAINEL 3: A CURVA DO ESQUECIMENTO DE EBBINGHAUS                       */}
        {/* ===================================================================== */}
        <motion.div
          style={{ opacity: opacity3, y: y3, scale: scale3 }}
          className="absolute max-w-3xl w-full px-4 text-center pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider mb-5 backdrop-blur-md">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Fase 03 • A Amnésia de Véspera</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            A dor de errar na prova exatamente aquilo que você{" "}
            <span className="bg-gradient-to-r from-rose-300 via-pink-300 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(244,63,94,0.35)]">
              estudou com afinco há 2 meses.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-lg text-slate-300 font-mono max-w-xl mx-auto leading-relaxed">
            Revisar na data errada é o motivo nº 1 de reprovação: cedo demais você perde tempo; tarde demais, a memória já apagou por completo.
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
            <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
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

          {/* Telemetria de Vitória Cognitiva com Bordas Brilhantes */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto pt-2 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-[#070b14]/90 border border-cyan-500/35 backdrop-blur-xl shadow-xl shadow-cyan-950/30">
              <span className="text-cyan-400 text-lg sm:text-2xl font-black block">94.8%</span>
              <span className="text-slate-400 text-[10px] sm:text-[11px]">Retenção FSRS</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#070b14]/90 border border-indigo-500/35 backdrop-blur-xl shadow-xl shadow-indigo-950/30">
              <span className="text-indigo-400 text-lg sm:text-2xl font-black block">+2h / dia</span>
              <span className="text-slate-400 text-[10px] sm:text-[11px]">Hands-Free Áudio</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#070b14]/90 border border-violet-500/35 backdrop-blur-xl shadow-xl shadow-violet-950/30">
              <span className="text-violet-400 text-lg sm:text-2xl font-black block">Nota 96+</span>
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
          <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
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
