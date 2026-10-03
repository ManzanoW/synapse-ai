"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Brain,
  FileCheck2,
  Headphones,
  Award,
  Sparkles,
  Volume2,
  CheckCircle2,
  ChevronRight,
  Zap,
  Activity,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export function InteractiveStickyShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // 3D Perspective Transforms connected to scroll based on spec
  const rotateX = useTransform(scrollYProgress, [0.05, 0.25], [25, 0]);
  const scale = useTransform(scrollYProgress, [0.05, 0.25], [0.85, 1]);
  const y = useTransform(scrollYProgress, [0.05, 0.25], [100, 0]);
  const glowOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0.2, 0.7]);

  // Screen selection state: 0 = FSRS, 1 = Discursiva, 2 = Audio
  const [activeScreen, setActiveScreen] = useState<0 | 1 | 2>(0);
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Sync scroll progress with active screen when user is scrolling
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (isManualOverride) return;

      if (latest < 0.45) {
        setActiveScreen(0);
      } else if (latest < 0.75) {
        setActiveScreen(1);
      } else {
        setActiveScreen(2);
      }
    });

    return () => unsubscribe();
  }, [scrollYProgress, isManualOverride]);

  const handleManualTab = (index: 0 | 1 | 2) => {
    setIsManualOverride(true);
    setActiveScreen(index);
    // Libera a sincronização por scroll após 4 segundos se o usuário voltar a rolar
    setTimeout(() => setIsManualOverride(false), 4000);
  };

  return (
    <div
      id="cockpit-showcase"
      ref={containerRef}
      className="relative h-[320vh] w-full bg-[#030712] select-none"
    >
      {/* Sticky Viewport Container */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-3 sm:px-6 lg:px-8">
        {/* Dynamic Background Volumetric Light */}
        <motion.div
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10"
        >
          <div className="w-[900px] h-[500px] bg-gradient-to-r from-indigo-600/20 via-violet-600/25 to-cyan-500/20 rounded-full blur-[150px]" />
        </motion.div>

        {/* Floating Cockpit Subtitle / Progress Header */}
        <div className="text-center space-y-2 mb-4 sm:mb-6 max-w-2xl px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cockpit Synapse em Ação</span>
          </div>

          <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            {activeScreen === 0 && "1. O Algoritmo FSRS de Memória Biológica"}
            {activeScreen === 1 && "2. Correção de Redação Discursiva no Rigor da Banca"}
            {activeScreen === 2 && "3. Modo Hands-Free com Áudio Neural Humanizado"}
          </h3>
        </div>

        {/* ========================================================================= */}
        {/* 🛸 3D PERSPECTIVE COCKPIT CONTAINER                                       */}
        {/* ========================================================================= */}
        <div
          className="w-full max-w-5xl"
          style={{ perspective: 1200 }}
        >
          <motion.div
            style={{
              rotateX,
              scale,
              y,
              boxShadow: "0 0 50px rgba(99, 102, 241, 0.25)",
            }}
            className="relative rounded-3xl p-1 bg-gradient-to-b from-white/[0.2] via-white/[0.06] to-transparent border border-white/[0.12] overflow-hidden group shadow-2xl"
          >
            {/* Glass Reflection Highlight Sweep */}
            <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-white/[0.08] rounded-full blur-3xl transform -rotate-45" />

            {/* Inner Dashboard Card */}
            <div className="relative rounded-[22px] bg-[#070b14]/95 backdrop-blur-2xl border border-white/[0.08] overflow-hidden">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.08] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="h-4 w-px bg-white/10 mx-2" />
                  <span className="text-xs font-mono font-bold text-slate-300">
                    synapse.cockpit //{" "}
                    <span className="text-cyan-400">
                      {activeScreen === 0 && "fsrs_engine"}
                      {activeScreen === 1 && "discursiva_evaluator"}
                      {activeScreen === 2 && "neural_audio_player"}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold font-mono">
                    <span>🔥 18 Dias</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold font-mono">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Nível 24 • Auditor</span>
                  </div>
                </div>
              </div>

              {/* Interactive Screen Selector Tabs */}
              <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center gap-2 border-b border-white/[0.05] bg-black/20 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => handleManualTab(0)}
                  className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    activeScreen === 0
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Brain className="w-3.5 h-3.5 text-indigo-300" />
                  <span>1. Motor FSRS ($R = 0.9^{'{'}t/S{'}'}$)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleManualTab(1)}
                  className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    activeScreen === 1
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-violet-300" />
                  <span>2. Analista Discursiva (Banca)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleManualTab(2)}
                  className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    activeScreen === 2
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5 text-cyan-300" />
                  <span>3. Áudio Hands-Free (Bluetooth)</span>
                </button>
              </div>

              {/* Dynamic Content Frame with AnimatePresence */}
              <div className="p-4 sm:p-7 min-h-[360px] sm:min-h-[380px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {/* ================================================================= */}
                  {/* TELA 1: MOTOR FSRS & CURVA DE RETENÇÃO                            */}
                  {/* ================================================================= */}
                  {activeScreen === 0 && (
                    <motion.div
                      key="screen-fsrs"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.35 }}
                      className="w-full grid grid-cols-1 md:grid-cols-3 gap-5"
                    >
                      <div className="md:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                              Estabilidade FSRS (Free Spaced Repetition Scheduler)
                            </span>
                            <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">
                              Direito Administrativo • Licitações & Contratos (Lei 14.133/21)
                            </h4>
                          </div>
                          <span className="text-2xl font-black text-emerald-400 font-mono">
                            94.8%
                          </span>
                        </div>

                        {/* Retention Progress */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono text-slate-400">
                            <span>Retenção Calculada ($R = 0.9^{'{'}t/S{'}'}$)</span>
                            <span className="text-indigo-300 font-bold">Próxima Revisão: +7 dias</span>
                          </div>
                          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 w-[95%]" />
                          </div>
                        </div>

                        {/* Question Preview */}
                        <div className="p-4 rounded-xl bg-slate-950/70 border border-white/[0.06] text-xs space-y-2">
                          <p className="font-bold text-slate-200">
                            Pergunta: No Pregão Eletrônico, qual a consequência da não comprovação da habilitação fiscal pelo licitante primeiro colocado?
                          </p>
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-slate-400 font-mono text-[11px]">
                            <span className="text-emerald-300">Resposta: Convocação do segundo colocado nas mesmas condições.</span>
                            <span className="text-slate-500">Intervalo FSRS: +7 dias</span>
                          </div>
                        </div>

                        {/* Badges FSRS */}
                        <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                            <span className="font-bold block text-[10px]">Errei</span>
                            <span>Hoje</span>
                          </div>
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                            <span className="font-bold block text-[10px]">Difícil</span>
                            <span>+2 dias</span>
                          </div>
                          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                            <span className="font-bold block text-[10px]">Bom</span>
                            <span>+7 dias</span>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                            <span className="font-bold block text-[10px]">Fácil</span>
                            <span>+21 dias</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Insight Box */}
                      <div className="rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-950/60 border border-indigo-500/20 p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold block">
                            Impacto no Cronograma
                          </span>
                          <div className="text-3xl font-black text-white">
                            -65% <span className="text-xs font-normal text-slate-400">cards diários</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            O FSRS ajusta a estabilidade dinamicamente para que você nunca revise matéria que já fixou nem esqueça o que é difícil.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Cards Hoje:</span>
                            <span className="text-cyan-300 font-bold">24 revisões</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Retenção no Dia D:</span>
                            <span className="text-emerald-400 font-bold">92%</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ================================================================= */}
                  {/* TELA 2: ANALISTA DE REDAÇÃO DISCURSIVA                            */}
                  {/* ================================================================= */}
                  {activeScreen === 1 && (
                    <motion.div
                      key="screen-discursiva"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.35 }}
                      className="w-full grid grid-cols-1 md:grid-cols-3 gap-5"
                    >
                      <div className="md:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-[10px] font-mono font-bold">
                                BANCA CEBRASPE
                              </span>
                              <span className="text-xs font-mono text-slate-400">Padrão Oficial • 30 Linhas</span>
                            </div>
                            <h4 className="text-sm sm:text-base font-bold text-white mt-1">
                              Tema: Princípio da Impessoalidade e Conflito de Interesses
                            </h4>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-slate-400 block font-mono">Nota Final</span>
                            <span className="text-2xl font-black text-violet-400 font-mono">
                              96.5 <span className="text-xs text-slate-500">/ 100</span>
                            </span>
                          </div>
                        </div>

                        {/* Formula Bar */}
                        <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/20 font-mono text-xs flex items-center justify-between">
                          <span className="text-violet-300 font-bold">Fórmula Oficial: NF = NC - 2 × (NE / TL)</span>
                          <span className="text-slate-400">NC: 98 pts • NE: 2 erros • TL: 30 linhas</span>
                        </div>

                        {/* Line by line error annotations */}
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                            <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                              <span className="text-rose-400 font-bold">Linha 14 • Regência Verbal</span>
                              <span>Microestrutura</span>
                            </div>
                            <p className="text-slate-300 font-mono">
                              &quot;...a referida portaria visa atender aos ditames constitucionais...&quot;
                            </p>
                            <p className="text-emerald-300 font-mono text-[11px]">
                              ↳ Sugestão da Banca: Correto! Verbo &quot;visar&quot; no sentido de objetivar rege preposição &quot;a&quot;.
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between">
                            <span>✨ <strong>Versão Ouro Recomendada:</strong> Reescrita com termos técnicos aprovados pela banca.</span>
                            <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                          </div>
                        </div>
                      </div>

                      {/* Right Feedback Box */}
                      <div className="rounded-2xl bg-gradient-to-b from-violet-950/40 to-slate-950/60 border border-violet-500/20 p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300 font-bold block">
                            Resultado Imediato
                          </span>
                          <h5 className="text-lg font-bold text-white">Status: Aprovado no Padrão Ouro</h5>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Correção gerada em 8 segundos com OCR de manuscrito suportado direto da folha de prova.
                          </p>
                        </div>

                        <div className="space-y-2 text-xs font-mono">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Macroestrutura: 58/60 pts</span>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Microestrutura: -1.5 pts</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ================================================================= */}
                  {/* TELA 3: FLASHCARDS EM ÁUDIO HUMANIZADO                            */}
                  {/* ================================================================= */}
                  {activeScreen === 2 && (
                    <motion.div
                      key="screen-audio"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.35 }}
                      className="w-full grid grid-cols-1 md:grid-cols-3 gap-5"
                    >
                      <div className="md:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
                              <Headphones className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-cyan-400">
                                  MODO HANDS-FREE • FONE BLUETOOTH ATIVO
                                </span>
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                              </div>
                              <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                                Direito Constitucional • Ações Constitucionais
                              </h4>
                            </div>
                          </div>

                          <span className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">
                            Card 18 de 40
                          </span>
                        </div>

                        {/* Pulsing Audio Waveform Visualizer */}
                        <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/20 space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold">
                              <Volume2 className="w-4 h-4" /> Voz Neural Humana em Execução
                            </span>
                            <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              Pausa Reflexiva: 03s
                            </span>
                          </div>

                          <div className="flex items-center justify-center gap-1.5 h-12 py-2">
                            {[40, 75, 95, 60, 30, 85, 100, 70, 45, 90, 65, 35, 80, 95, 50, 75, 40].map((h, i) => (
                              <motion.span
                                key={i}
                                animate={{ height: [`${Math.max(15, h * 0.3)}%`, `${h}%`, `${Math.max(15, h * 0.4)}%`] }}
                                transition={{ duration: 0.8 + (i % 3) * 0.2, repeat: Infinity, ease: "easeInOut" }}
                                className="w-1.5 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full"
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>

                          <p className="text-xs text-slate-200 font-mono text-center italic">
                            &quot;Qual a legitimidade ativa extraordinária para impetração de Habeas Data segundo o STJ?&quot;
                          </p>
                        </div>

                        {/* Bluetooth & Lockscreen Specs */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-cyan-300 font-bold block text-[11px]">Tela Bloqueada</span>
                            <span className="text-[10px] text-slate-400 font-mono">MediaSession</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-cyan-300 font-bold block text-[11px]">Botão do Fone</span>
                            <span className="text-[10px] text-slate-400 font-mono">Play/Gabarito</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-cyan-300 font-bold block text-[11px]">Recuperação Ativa</span>
                            <span className="text-[10px] text-slate-400 font-mono">Memória Real</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Benefit Box */}
                      <div className="rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-950/60 border border-cyan-500/20 p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block">
                            Horas Líquidas no Bolso
                          </span>
                          <div className="text-3xl font-black text-white">
                            +2h / dia <span className="text-xs font-normal text-slate-400">no trânsito</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Estude enquanto dirige ou treina. O Synapse fala a pergunta, aguarda seu cérebro recuperar a resposta e profere a resolução.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Velocidade da Voz:</span>
                          <span className="text-cyan-300 font-bold">1.25x Studio HD</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Progress Bar indicator under the Cockpit */}
        <div className="mt-4 sm:mt-6 flex items-center gap-3">
          <div className="flex gap-2">
            <span
              onClick={() => handleManualTab(0)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeScreen === 0 ? "w-8 bg-cyan-400" : "w-2 bg-slate-700 hover:bg-slate-500"
              }`}
            />
            <span
              onClick={() => handleManualTab(1)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeScreen === 1 ? "w-8 bg-violet-400" : "w-2 bg-slate-700 hover:bg-slate-500"
              }`}
            />
            <span
              onClick={() => handleManualTab(2)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeScreen === 2 ? "w-8 bg-emerald-400" : "w-2 bg-slate-700 hover:bg-slate-500"
              }`}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {activeScreen === 0 && "Role para ver o Corretor Discursivo ↓"}
            {activeScreen === 1 && "Role para ver os Flashcards em Áudio ↓"}
            {activeScreen === 2 && "Cockpit concluído! Prossiga para o método ↓"}
          </span>
        </div>
      </div>
    </div>
  );
}
