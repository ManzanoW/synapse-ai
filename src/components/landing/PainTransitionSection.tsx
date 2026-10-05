"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Brain,
  Layers,
  Clock,
  AlertTriangle,
  Car,
  ChevronDown,
  Cpu,
  Activity,
  Flame,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";
import { NeuralWaveCanvas } from "./NeuralWaveCanvas";

export function PainTransitionSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Parallax cinematográfico do Vórtice de Editais (calibrado para 60 FPS mobile)
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -20]);

  // =========================================================================
  // SCROLL-DRIVEN COGNITIVE DIAGNOSTIC (MASTER UI/UX INTERACTION)
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

  // Iluminação Cósmica de Fundo
  const chaosAuraOpacity = useTransform(scrollYProgress, [0, 0.65, 0.76], [0.55, 0.65, 0]);
  const syncAuraOpacity = useTransform(scrollYProgress, [0.72, 0.84, 1.0], [0, 0.85, 0.95]);

  // Barra de Telemetria Inferior
  const diagnosticProgress = useTransform(scrollYProgress, [0.05, 0.95], ["0%", "100%"]);

  return (
    <div
      id="pain-transition"
      ref={containerRef}
      className="relative h-[210vh] sm:h-[260vh] md:h-[340vh] w-full bg-[#030712] select-none"
    >
      {/* Sticky Fullscreen HUD Viewport (100dvh previne jumps de barra de endereço mobile) */}
      <div className="sticky top-0 h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden px-3 sm:px-6">

        {/* ===================================================================== */}
        {/* 🌌 OBRA DE ARTE CINEMATOGRÁFICA: O VÓRTICE DA SOBRECARGA COGNITIVA     */}
        {/* ===================================================================== */}
        <motion.div
          style={{ scale: bgScale, y: bgY }}
          className="pointer-events-none absolute inset-0 z-0 w-full h-full overflow-hidden"
        >
          <Image
            src="/synapse-pain-storm.jpg"
            alt="Synapse AI - O Vórtice da Sobrecarga Cognitiva"
            fill
            priority
            unoptimized
            className="object-cover object-center"
          />

          {/* Overlay Escuro com Contraste para Legibilidade Perfeita */}
          <div className="absolute inset-0 bg-[#02050e]/65 backdrop-contrast-115" />

          {/* Halo de Energia Central no Feixe Sináptico */}
          <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-cyan-400/25 blur-3xl animate-pulse pointer-events-none" />

          {/* Aura de Tensão nas Fases Iniciais (Violeta/Índigo) */}
          <motion.div
            style={{ opacity: chaosAuraOpacity }}
            className="pointer-events-none absolute inset-0 bg-violet-950/30 mix-blend-screen"
          />

          {/* Aura de Alívio e Sincronização na Fase 4 (Ciano Neon) */}
          <motion.div
            style={{ opacity: syncAuraOpacity }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cyan-950/40 via-indigo-950/20 to-transparent"
          />

          {/* Scanner de Grade Holográfica Cósmica */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />

          {/* Vinhetas Suaves de Transição Superior e Inferior */}
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#030712] via-[#030712]/75 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#030712] via-[#030712]/85 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#030712]/70 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#030712]/70 to-transparent" />
        </motion.div>

        {/* HUD Header Superior (Assinatura Sináptica Autêntica) */}
        <div className="absolute top-8 sm:top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#080d1a]/85 border border-white/[0.08] backdrop-blur-xl z-20 shadow-lg shadow-black/40">
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
        {/* ⚡ OSCILOSCÓPIO NEURAL LÍQUIDO A 60 FPS (FÍSICA SENOIDAL PURA)        */}
        {/* Posicionado como horizonte de luz fluido abaixo do texto               */}
        {/* ===================================================================== */}
        <div
          className="pointer-events-none absolute inset-x-0 top-[52%] -translate-y-1/2 h-96 z-[1] flex items-center justify-center overflow-hidden opacity-35 mix-blend-screen"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
            maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
          }}
        >
          <NeuralWaveCanvas scrollProgress={scrollYProgress} className="w-full h-full" />
        </div>

        {/* ===================================================================== */}
        {/* PAINEL 1: SOBRECARGA DE EDITAIS                                       */}
        {/* ===================================================================== */}
        <motion.div
          style={{ opacity: opacity1, y: y1, scale: scale1 }}
          className="absolute max-w-3xl w-full px-4 text-center pointer-events-none z-10 will-change-[transform,opacity] transform-gpu"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 font-mono text-xs font-bold uppercase tracking-wider mb-3 sm:mb-5 backdrop-blur-md">
            <Layers className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span>Fase 01 • Saturação Cognitiva</span>
          </div>

          <h2 className="relative z-10 text-2xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.12] drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
            O cérebro humano não foi feito para decorar{" "}
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-violet-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(139,92,246,0.35)]">
              1.200 páginas de edital.
            </span>
          </h2>

          {/* Console de Telemetria Unificado Glassmorphism */}
          <div className="mt-5 sm:mt-8 mx-auto max-w-xl rounded-2xl bg-[#060a14]/85 border border-white/[0.1] backdrop-blur-2xl p-3.5 sm:p-5 shadow-2xl shadow-black/70 grid grid-cols-2 gap-3 sm:gap-4 text-left font-mono">
            {/* Coluna 1: Retenção */}
            <div className="space-y-1.5 border-r border-white/5 pr-2.5 sm:pr-4">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider">
                <span>Retenção Biológica</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-rose-400 tracking-tight flex items-baseline gap-2">
                &lt; 18.2%
                <span className="text-[10px] font-normal text-rose-300/80">Crítico</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                <motion.div
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full"
                  animate={{ width: ["18%", "12%", "18%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block truncate">Queda espontânea em 14d</span>
            </div>

            {/* Coluna 2: Frequência Neural */}
            <div className="space-y-1.5 pl-2 sm:pl-3">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider">
                <span>Padrão EEG</span>
                <span className="text-violet-400 font-bold text-[10px]">38.4 Hz</span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-violet-300 tracking-tight">
                Sobrecarga Beta
              </div>
              {/* Equalizador de Barras Fluido (GPU scaleY acelerado) */}
              <div className="flex items-center gap-1.5 h-3 pt-0.5">
                {[40, 85, 60, 95, 50, 80, 65].map((h, i) => (
                  <motion.span
                    key={i}
                    animate={{ scaleY: [0.35, 1, 0.4] }}
                    transition={{ duration: 0.7 + i * 0.12, repeat: Infinity, ease: "easeInOut" }}
                    className="w-1.5 bg-gradient-to-t from-indigo-500 to-violet-400 rounded-full origin-bottom"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-500 block truncate">Tensão mental extrema</span>
            </div>
          </div>
        </motion.div>

        {/* ===================================================================== */}
        {/* PAINEL 2: HORAS PERDIDAS NO TRÂNSITO                                  */}
        {/* ===================================================================== */}
        <motion.div
          style={{ opacity: opacity2, y: y2, scale: scale2 }}
          className="absolute max-w-3xl w-full px-4 text-center pointer-events-none z-10 will-change-[transform,opacity] transform-gpu"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider mb-3 sm:mb-5 backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Fase 02 • O Dreno Invisível</span>
          </div>

          <h2 className="relative z-10 text-2xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.12] drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
            2 horas por dia perdidas no trânsito{" "}
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(245,158,11,0.35)]">
              são 500 horas mortas por ano.
            </span>
          </h2>

          <div className="mt-5 sm:mt-8 mx-auto max-w-xl rounded-2xl bg-[#060a14]/85 border border-white/[0.1] backdrop-blur-2xl p-3.5 sm:p-5 shadow-2xl shadow-black/70 grid grid-cols-2 gap-3 sm:gap-4 text-left font-mono">
            <div className="space-y-1.5 border-r border-white/5 pr-2.5 sm:pr-4">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Déficit Temporal</span>
              <div className="text-lg sm:text-2xl font-black text-amber-400 tracking-tight">-520 Horas</div>
              <span className="text-[10px] text-slate-500 block truncate">Tempo líquido confiscado</span>
            </div>
            <div className="space-y-1.5 pl-2 sm:pl-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Impacto no Edital</span>
              <div className="text-lg sm:text-2xl font-black text-amber-300 tracking-tight">-2.5 Meses</div>
              <span className="text-[10px] text-slate-500 block truncate">Atraso na preparação teórica</span>
            </div>
          </div>
        </motion.div>

        {/* ===================================================================== */}
        {/* PAINEL 3: A CURVA DO ESQUECIMENTO DE EBBINGHAUS                       */}
        {/* ===================================================================== */}
        <motion.div
          style={{ opacity: opacity3, y: y3, scale: scale3 }}
          className="absolute max-w-3xl w-full px-4 text-center pointer-events-none z-10 will-change-[transform,opacity] transform-gpu"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider mb-3 sm:mb-5 backdrop-blur-md">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Fase 03 • A Amnésia de Véspera</span>
          </div>

          <h2 className="relative z-10 text-2xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.12] drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
            A dor de errar na prova exatamente aquilo que você{" "}
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-rose-300 via-pink-300 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(244,63,94,0.35)]">
              estudou com afinco há 2 meses.
            </span>
          </h2>

          <div className="mt-5 sm:mt-8 mx-auto max-w-xl rounded-2xl bg-[#060a14]/85 border border-white/[0.1] backdrop-blur-2xl p-3.5 sm:p-5 shadow-2xl shadow-black/70 grid grid-cols-2 gap-3 sm:gap-4 text-left font-mono">
            <div className="space-y-1.5 border-r border-white/5 pr-2.5 sm:pr-4">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Curva de Ebbinghaus</span>
              <div className="text-lg sm:text-2xl font-black text-rose-400 tracking-tight">-80% Memória</div>
              <span className="text-[10px] text-slate-500 block truncate">Perda sem algoritmo preditivo</span>
            </div>
            <div className="space-y-1.5 pl-2 sm:pl-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Timing das Revisões</span>
              <div className="text-lg sm:text-2xl font-black text-rose-300 tracking-tight">Zero Precisão</div>
              <span className="text-[10px] text-slate-500 block truncate">Planilhas e palpites manuais</span>
            </div>
          </div>
        </motion.div>

        {/* ===================================================================== */}
        {/* PAINEL 4: A SINCRONIZAÇÃO NEURAL SYNAPSE (A RESPOSTA DEFINITIVA)       */}
        {/* ===================================================================== */}
        <motion.div
          style={{ opacity: opacity4, y: y4, scale: scale4 }}
          className="absolute max-w-4xl w-full px-4 text-center pointer-events-none space-y-4 sm:space-y-6 z-10 will-change-[transform,opacity] transform-gpu"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-teal-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] sm:text-sm font-bold uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.35)]">
            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-pulse" />
            <span>Sincronização Sináptica Completa</span>
          </div>

          <h2 className="relative z-10 text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]">
            Calma. Seu cérebro só precisava da{" "}
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-cyan-300 via-indigo-200 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(99,102,241,0.5)]">
              neurociência certa.
            </span>
          </h2>

          <p className="text-xs sm:text-lg text-slate-300/95 max-w-2xl mx-auto leading-relaxed font-normal drop-shadow-md">
            O Synapse AI assume o cálculo biológico do seu esquecimento, audita suas redações no critério oficial da banca e transforma seu trânsito em horas líquidas de estudo.
          </p>

          {/* Telemetria de Vitória Cognitiva com Bordas Brilhantes */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto pt-1 sm:pt-2 font-mono text-xs">
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#070b14]/90 border border-cyan-500/35 backdrop-blur-2xl shadow-xl shadow-cyan-950/40">
              <span className="text-cyan-400 text-base sm:text-2xl font-black block">94.8%</span>
              <span className="text-slate-400 text-[9px] sm:text-[11px]">Retenção FSRS</span>
            </div>
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#070b14]/90 border border-indigo-500/35 backdrop-blur-2xl shadow-xl shadow-indigo-950/40">
              <span className="text-indigo-400 text-base sm:text-2xl font-black block">+2h / dia</span>
              <span className="text-slate-400 text-[9px] sm:text-[11px]">Hands-Free Áudio</span>
            </div>
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#070b14]/90 border border-violet-500/35 backdrop-blur-2xl shadow-xl shadow-violet-950/40">
              <span className="text-violet-400 text-base sm:text-2xl font-black block">Nota 96+</span>
              <span className="text-slate-400 text-[9px] sm:text-[11px]">Espelho Cebraspe</span>
            </div>
          </div>

          <div className="pt-1 sm:pt-2 flex items-center justify-center gap-2 text-cyan-400 font-mono text-xs sm:text-sm font-bold animate-bounce">
            <span>Role para entrar no Cockpit Synapse</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </motion.div>

        {/* ===================================================================== */}
        {/* BARRA DE TELEMETRIA NA BASE (ESTILO SCANNER SINÁPTICO)                 */}
        {/* ===================================================================== */}
        <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/85 border border-white/10 backdrop-blur-xl z-20 shadow-xl">
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
