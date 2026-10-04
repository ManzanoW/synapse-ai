"use client";

import React, { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { BorderBeam } from "./BorderBeam";
import {
  Brain,
  FileCheck2,
  Headphones,
  Award,
  Volume2,
  CheckCircle2,
  ChevronRight,
  Activity,
  Zap,
  Flame,
} from "lucide-react";

export function InteractiveStickyShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // 3D Perspective Transforms: sutil e elegante, mantendo o Cockpit no centro do viewport
  const rotateX = useTransform(scrollYProgress, [0, 0.15], [10, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.15], [0.95, 1]);
  const y = useTransform(scrollYProgress, [0, 0.15], [20, 0]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.25], [0.35, 0.8]);

  // Mouse Gyroscope Tracking com física de mola suave (Inspiração Mentoris / Linear)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 95, damping: 22 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 95, damping: 22 });

  const mouseTiltX = useTransform(smoothMouseY, [-0.5, 0.5], [6, -6]);
  const mouseTiltY = useTransform(smoothMouseX, [-0.5, 0.5], [-8, 8]);

  const totalRotateX = useTransform([rotateX, mouseTiltX], ([rX, mX]) => (rX as number) + (mX as number));
  const totalRotateY = mouseTiltY;

  const glareX = useTransform(smoothMouseX, [-0.5, 0.5], ["20%", "80%"]);
  const glareY = useTransform(smoothMouseY, [-0.5, 0.5], ["20%", "80%"]);

  const handleCockpitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleCockpitMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Screen selection state: 0 = FSRS, 1 = Discursiva, 2 = Audio
  const [activeScreen, setActiveScreen] = useState<0 | 1 | 2>(0);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [userRating, setUserRating] = useState<"again" | "hard" | "good" | "easy">("good");

  const ratingConfig = {
    again: {
      percentage: "58.4%",
      barWidth: "58%",
      statusBadge: "QUEDA DE RETENÇÃO • REVISÃO HOJE",
      statusColor: "text-rose-400 bg-rose-500/10 border-rose-500/25",
      pulseColor: "bg-rose-400",
      barGradient: "from-rose-600 to-rose-400",
      textColor: "text-rose-400",
      nextReview: "Hoje (Recomeço)",
      reviewPill: "text-rose-300 bg-rose-500/20 border-rose-500/30",
      safeLabel: "58.4% Abaixo do corte",
      intervalText: "Intervalo: Imediato (Hoje)",
      tagColor: "text-rose-300 bg-rose-500/15 border-rose-500/25",
      feedback: "⚠️ Falha na retenção. O algoritmo reagendou para hoje para restaurar as vias neurais.",
    },
    hard: {
      percentage: "79.2%",
      barWidth: "79%",
      statusBadge: "RETENÇÃO SOB TENSÃO • REFORÇO EM 48H",
      statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/25",
      pulseColor: "bg-amber-400",
      barGradient: "from-amber-600 via-amber-500 to-amber-400",
      textColor: "text-amber-400",
      nextReview: "em 2 dias",
      reviewPill: "text-amber-300 bg-amber-500/20 border-amber-500/30",
      safeLabel: "79.2% Atenção",
      intervalText: "Intervalo: +2 dias",
      tagColor: "text-amber-300 bg-amber-500/15 border-amber-500/25",
      feedback: "⚡ Lembrança custosa. O FSRS encurtou o intervalo para 48h para fixar a sinapse enquanto fresca.",
    },
    good: {
      percentage: "94.8%",
      barWidth: "95%",
      statusBadge: "MEMÓRIA ESTABILIZADA • NÍVEL 4/5",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
      pulseColor: "bg-emerald-400",
      barGradient: "from-indigo-500 via-cyan-400 to-emerald-400",
      textColor: "text-emerald-400",
      nextReview: "em 7 dias",
      reviewPill: "text-indigo-300 bg-indigo-500/20 border-indigo-500/30",
      safeLabel: "94.8% Seguro",
      intervalText: "Intervalo Otimizado: +7 dias",
      tagColor: "text-indigo-300 bg-indigo-500/15 border-indigo-500/25",
      feedback: "✓ Recuperação ideal. O algoritmo calculou 7 dias de estabilidade biológica — zero repetições inúteis.",
    },
    easy: {
      percentage: "98.6%",
      barWidth: "98%",
      statusBadge: "MEMÓRIA PERMANENTE • NÍVEL 5/5",
      statusColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
      pulseColor: "bg-cyan-400",
      barGradient: "from-cyan-500 via-teal-400 to-emerald-400",
      textColor: "text-cyan-400",
      nextReview: "em 21 dias",
      reviewPill: "text-cyan-300 bg-cyan-500/20 border-cyan-500/30",
      safeLabel: "98.6% Dominado",
      intervalText: "Intervalo Otimizado: +21 dias",
      tagColor: "text-cyan-300 bg-cyan-500/15 border-cyan-500/25",
      feedback: "💎 Domínio total. Próximo contato em 3 semanas, poupando seu tempo para novos tópicos.",
    },
  }[userRating];

  // Sync scroll progress com as 3 telas de forma contínua e sem lacunas
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (isManualOverride) return;

    if (latest < 0.34) {
      if (activeScreen !== 0) setActiveScreen(0);
    } else if (latest < 0.68) {
      if (activeScreen !== 1) setActiveScreen(1);
    } else {
      if (activeScreen !== 2) setActiveScreen(2);
    }
  });

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
      className="relative h-[290vh] w-full bg-[#030712] select-none"
    >
      {/* Sticky Viewport Container - Centralizado perfeitamente na tela */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-3 sm:px-6 lg:px-8 py-6">
        {/* Dynamic Background Volumetric Light */}
        <motion.div
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10"
        >
          <div className="w-[750px] sm:w-[950px] h-[450px] sm:h-[550px] bg-gradient-to-r from-indigo-600/25 via-violet-600/25 to-cyan-500/25 rounded-full blur-[150px]" />
        </motion.div>

        {/* Floating Cockpit Subtitle / Progress Header */}
        <div className="text-center space-y-1.5 sm:space-y-2 mb-3 sm:mb-5 max-w-2xl px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cockpit Synapse em Ação</span>
          </div>

          <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            {activeScreen === 0 && "1. Revisão Preditiva & Curva de Fixação Ativa"}
            {activeScreen === 1 && "2. Correção de Redação Discursiva no Rigor da Banca"}
            {activeScreen === 2 && "3. Modo Hands-Free com Áudio Neural Humanizado"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            {activeScreen === 0 && "O algoritmo antecipa a curva de esquecimento e agenda o momento exato de revisar."}
            {activeScreen === 1 && "Espelho oficial Cebraspe/FGV com cálculo rigoroso de notas e versão ouro recomendada."}
            {activeScreen === 2 && "Estude no trânsito ou caminhada com áudio estéreo natural e pausa para recuperação ativa."}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 🛸 3D PERSPECTIVE COCKPIT CONTAINER                                       */}
        {/* ========================================================================= */}
        <div
          className="w-full max-w-5xl relative"
          style={{ perspective: 1200 }}
          onMouseMove={handleCockpitMouseMove}
          onMouseLeave={handleCockpitMouseLeave}
        >
          <motion.div
            style={{
              rotateX: totalRotateX,
              rotateY: totalRotateY,
              scale,
              y,
              boxShadow: "0 0 50px rgba(99, 102, 241, 0.28)",
            }}
            className="relative rounded-2xl sm:rounded-3xl p-[1.5px] overflow-hidden group shadow-2xl transition-shadow"
          >
            {/* Border Beam Neon Circular Contínuo */}
            <BorderBeam duration={8} colorFrom="#06b6d4" colorTo="#818cf8" />

            {/* Specular Glare que acompanha o cursor do mouse em tempo real */}
            <motion.div
              className="pointer-events-none absolute inset-0 z-20 opacity-35 mix-blend-overlay"
              style={{
                background: useTransform(
                  [glareX, glareY],
                  ([gX, gY]) => `radial-gradient(circle 500px at ${gX} ${gY}, rgba(255,255,255,0.22), transparent 70%)`
                ),
              }}
            />

            {/* Glass Reflection Highlight Sweep */}
            <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-white/[0.06] rounded-full blur-3xl transform -rotate-45" />

            {/* Inner Dashboard Card */}
            <div className="relative rounded-[inherit] bg-[#070b14]/95 backdrop-blur-2xl border border-white/[0.08] overflow-hidden z-10">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-white/[0.08] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="h-3.5 w-px bg-white/10 mx-2" />
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-300">
                    synapse.cockpit //{" "}
                    <span className="text-cyan-400">
                      {activeScreen === 0 && "memoria_preditiva"}
                      {activeScreen === 1 && "corretor_discursivo"}
                      {activeScreen === 2 && "audio_hands_free"}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-bold font-mono">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>18 Dias de Foco</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold font-mono">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Nível 24 • Auditor</span>
                  </div>
                </div>
              </div>

              {/* Interactive Screen Selector Tabs */}
              <div className="px-3 sm:px-6 pt-2 pb-2 flex items-center gap-1.5 sm:gap-2 border-b border-white/[0.05] bg-black/20 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => handleManualTab(0)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeScreen === 0
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Brain className="w-3.5 h-3.5 text-indigo-300" />
                  <span>1. Revisão Preditiva (FSRS)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleManualTab(1)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeScreen === 1
                      ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-md shadow-violet-600/30 border border-violet-400/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-violet-300" />
                  <span>2. Redação Discursiva</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleManualTab(2)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeScreen === 2
                      ? "bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-600/30 border border-cyan-400/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5 text-cyan-300" />
                  <span>3. Áudio Hands-Free</span>
                </button>
              </div>

              {/* Dynamic Content Frame with AnimatePresence */}
              <div className="p-3 sm:p-6 min-h-[310px] sm:min-h-[350px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {/* ================================================================= */}
                  {/* TELA 1: REVISÃO PREDITIVA & CURVA DE FIXAÇÃO ATIVA                */}
                  {/* ================================================================= */}
                  {activeScreen === 0 && (
                    <motion.div
                      key="screen-fsrs"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-5"
                    >
                      {/* Top Bar: Tópico & Status Neural */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold transition-colors ${ratingConfig.statusColor}`}>
                              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${ratingConfig.pulseColor}`} />
                              {ratingConfig.statusBadge}
                            </span>
                            <span className="text-[11px] font-mono text-cyan-300 font-semibold hidden sm:inline">
                              Motor FSRS 4ª Geração
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-bold text-white">
                            Direito Administrativo • Licitações & Contratos
                          </h4>
                        </div>

                        {/* Retention Rate Badge */}
                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1">
                          <div className="flex items-baseline gap-1.5">
                            <motion.span
                              key={ratingConfig.percentage}
                              initial={{ scale: 0.9, opacity: 0.8 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight transition-colors ${ratingConfig.textColor}`}
                            >
                              {ratingConfig.percentage}
                            </motion.span>
                            <span className="text-[10px] text-slate-400 font-mono">Retenção</span>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${ratingConfig.reviewPill}`}>
                            Próximo contato: {ratingConfig.nextReview}
                          </span>
                        </div>
                      </div>

                      {/* Flashcard Cognitivo Sintético */}
                      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-indigo-400 font-mono font-bold text-[11px] flex items-center gap-1.5">
                            <Brain className="w-3.5 h-3.5" /> FLASHCARD COGNITIVO
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            Curva de Ebbinghaus calibrada
                          </span>
                        </div>

                        {/* Pergunta e Resposta Diretas */}
                        <div className="space-y-2">
                          <p className="text-sm sm:text-base font-medium text-slate-100">
                            &ldquo;Qual o prazo legal para impugnação do edital de licitação por qualquer cidadão?&rdquo;
                          </p>
                          <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs sm:text-sm text-cyan-200 font-mono flex items-center gap-2">
                            <span className="text-emerald-400 font-bold shrink-0">↳ Gabarito:</span>
                            <span>Até 3 dias úteis antes da data de abertura do certame (Lei 14.133/21).</span>
                          </div>
                        </div>

                        {/* Dynamic Progress Bar (Barra de Fixação) */}
                        <div className="space-y-1.5 pt-1">
                          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <motion.div
                              animate={{ width: ratingConfig.barWidth }}
                              transition={{ type: "spring", stiffness: 120, damping: 20 }}
                              className={`h-full rounded-full bg-gradient-to-r transition-all ${ratingConfig.barGradient}`}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                            <span>0% Esquecimento</span>
                            <span className="text-slate-300">Meta Biológica: 90%</span>
                            <span className={`font-semibold transition-colors ${ratingConfig.textColor}`}>
                              {ratingConfig.safeLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Área Interativa de Simulação (Protagonista e Tátil) */}
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Simule o recálculo do algoritmo FSRS:</span>
                          </span>
                          <span className="text-slate-400 text-[11px] hidden sm:inline">Clique para testar</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                          {/* Errei */}
                          <button
                            type="button"
                            onClick={() => setUserRating("again")}
                            className={`p-3 rounded-xl transition-all cursor-pointer relative ${
                              userRating === "again"
                                ? "bg-rose-600/30 border-2 border-rose-400 text-white shadow-lg shadow-rose-600/30 scale-[1.02]"
                                : "bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 hover:scale-[1.01]"
                            }`}
                          >
                            {userRating === "again" && (
                              <div className="absolute -top-2 right-2 px-1.5 py-0.2 rounded bg-rose-500 text-[8px] font-bold uppercase tracking-wider text-white">
                                Ativo
                              </div>
                            )}
                            <span className="font-bold block text-xs sm:text-sm">Errei</span>
                            <span className="text-[10px] text-rose-300/80 font-mono">Rever Hoje</span>
                          </button>

                          {/* Difícil */}
                          <button
                            type="button"
                            onClick={() => setUserRating("hard")}
                            className={`p-3 rounded-xl transition-all cursor-pointer relative ${
                              userRating === "hard"
                                ? "bg-amber-600/30 border-2 border-amber-400 text-white shadow-lg shadow-amber-600/30 scale-[1.02]"
                                : "bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 hover:scale-[1.01]"
                            }`}
                          >
                            {userRating === "hard" && (
                              <div className="absolute -top-2 right-2 px-1.5 py-0.2 rounded bg-amber-500 text-[8px] font-bold uppercase tracking-wider text-white">
                                Ativo
                              </div>
                            )}
                            <span className="font-bold block text-xs sm:text-sm">Difícil</span>
                            <span className="text-[10px] text-amber-300/80 font-mono">+2 dias</span>
                          </button>

                          {/* Bom */}
                          <button
                            type="button"
                            onClick={() => setUserRating("good")}
                            className={`p-3 rounded-xl transition-all cursor-pointer relative ${
                              userRating === "good"
                                ? "bg-indigo-600/30 border-2 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]"
                                : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 hover:scale-[1.01]"
                            }`}
                          >
                            {userRating === "good" && (
                              <div className="absolute -top-2 right-2 px-1.5 py-0.2 rounded bg-indigo-500 text-[8px] font-bold uppercase tracking-wider text-white">
                                Ativo
                              </div>
                            )}
                            <span className="font-bold block text-xs sm:text-sm">Bom</span>
                            <span className="text-[10px] text-indigo-300/80 font-mono">+7 dias</span>
                          </button>

                          {/* Fácil */}
                          <button
                            type="button"
                            onClick={() => setUserRating("easy")}
                            className={`p-3 rounded-xl transition-all cursor-pointer relative ${
                              userRating === "easy"
                                ? "bg-cyan-600/30 border-2 border-cyan-400 text-white shadow-lg shadow-cyan-600/30 scale-[1.02]"
                                : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 hover:scale-[1.01]"
                            }`}
                          >
                            {userRating === "easy" && (
                              <div className="absolute -top-2 right-2 px-1.5 py-0.2 rounded bg-cyan-500 text-[8px] font-bold uppercase tracking-wider text-white">
                                Ativo
                              </div>
                            )}
                            <span className="font-bold block text-xs sm:text-sm">Fácil</span>
                            <span className="text-[10px] text-cyan-300/80 font-mono">+21 dias</span>
                          </button>
                        </div>

                        {/* Dynamic Feedback Banner */}
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 font-mono flex items-center justify-between">
                          <span>{ratingConfig.feedback}</span>
                          <span className="text-cyan-400 font-bold shrink-0 hidden sm:inline">Tempo poupado: ~45 min/dia</span>
                        </div>
                      </div>

                      {/* Rodapé Sintético de Eficiência */}
                      <div className="pt-2 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-center text-xs font-mono">
                        <div className="p-2 rounded-xl bg-white/[0.02]">
                          <span className="text-slate-400 block text-[10px]">Revisões Inúteis</span>
                          <span className="text-cyan-300 font-bold text-xs sm:text-sm">-65% vs. Anki</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.02]">
                          <span className="text-slate-400 block text-[10px]">Economia Diária</span>
                          <span className="text-emerald-400 font-bold text-xs sm:text-sm">~45 min/dia</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.02]">
                          <span className="text-slate-400 block text-[10px]">Retenção na Prova</span>
                          <span className="text-indigo-300 font-bold text-xs sm:text-sm">92%+ garantida</span>
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-5"
                    >
                      {/* Top Bar: Tema e Nota Final */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-mono font-bold">
                              BANCA CEBRASPE & FGV
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                              Critério Oficial • 30 Linhas
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-bold text-white">
                            Tema: Princípio da Impessoalidade e Conflito de Interesses
                          </h4>
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-violet-400">
                              96.5 <span className="text-xs text-slate-500">/ 100</span>
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-violet-500/30 bg-violet-500/20 text-violet-300 font-bold">
                            PADRÃO OURO • APROVADO
                          </span>
                        </div>
                      </div>

                      {/* O Trecho Analisado com OCR & Correção Cirúrgica */}
                      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-violet-400 font-mono font-bold text-[11px] flex items-center gap-1.5">
                            <FileCheck2 className="w-3.5 h-3.5" /> ANÁLISE DE MICRO & MACROESTRUTURA
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            Fórmula Oficial: NF = NC - 2 × (NE / TL)
                          </span>
                        </div>

                        {/* Exemplo de Linha com Apontamento */}
                        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-rose-400 font-bold">Linha 14 • Regência Verbal</span>
                            <span className="text-emerald-400 font-bold">+0.5 pts Concedidos</span>
                          </div>
                          <p className="text-slate-200 font-mono text-xs sm:text-sm">
                            &ldquo;...a referida portaria <span className="text-cyan-300 underline decoration-cyan-400/50">visa atender aos</span> ditames constitucionais...&rdquo;
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            ↳ <strong className="text-emerald-400">Critério da Banca:</strong> Correto. O verbo <em>visar</em> no sentido de objetivar exige a preposição <em>&ldquo;a&rdquo;</em>.
                          </p>
                        </div>

                        {/* Versão Ouro de Reescrita Recomendada */}
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-200">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-400 shrink-0" />
                            <span><strong>Versão Ouro Sugerida:</strong> Aprimoramento de vocabulário técnico aderente ao padrão da banca examinadora.</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                        </div>
                      </div>

                      {/* Rodapé com 3 Métricas de Rigor */}
                      <div className="pt-2 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-center text-xs font-mono">
                        <div className="p-2 rounded-xl bg-white/[0.02]">
                          <span className="text-slate-400 block text-[10px]">Velocidade de Análise</span>
                          <span className="text-cyan-300 font-bold text-xs sm:text-sm">8 segundos</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.02]">
                          <span className="text-slate-400 block text-[10px]">Macroestrutura</span>
                          <span className="text-emerald-400 font-bold text-xs sm:text-sm">58 / 60 pts</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.02]">
                          <span className="text-slate-400 block text-[10px]">Microestrutura</span>
                          <span className="text-violet-300 font-bold text-xs sm:text-sm">-1.5 pts (leve)</span>
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-5"
                    >
                      {/* Top Bar: Modo Hands-Free */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                              MODO HANDS-FREE ATIVO
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                              Bluetooth & Fone de Ouvido
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-bold text-white">
                            Direito Constitucional • Ações Constitucionais
                          </h4>
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-cyan-300">
                              +2h / dia
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/20 text-cyan-300 font-bold">
                            HORAS LÍQUIDAS NO TRÂNSITO
                          </span>
                        </div>
                      </div>

                      {/* Visualizador de Onda Sonora & Card de Áudio */}
                      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-cyan-300 font-mono font-bold text-[11px] flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5" /> VOZ NEURAL HUMANA EM EXECUÇÃO
                          </span>
                          <span className="text-amber-300 font-mono text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Pausa Reflexiva: 03s
                          </span>
                        </div>

                        {/* Dynamic Animated Waveform */}
                        <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-12 py-1 bg-slate-950/60 rounded-xl border border-white/5">
                          {[30, 60, 85, 45, 25, 75, 100, 65, 40, 90, 55, 30, 75, 95, 45, 70, 35].map((h, i) => (
                            <motion.span
                              key={i}
                              animate={{ height: [`${Math.max(15, h * 0.3)}%`, `${h}%`, `${Math.max(15, h * 0.35)}%`] }}
                              transition={{ duration: 0.8 + (i % 3) * 0.2, repeat: Infinity, ease: "easeInOut" }}
                              className="w-1.5 sm:w-2 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>

                        {/* Pergunta Falada pelo Fone */}
                        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 text-center">
                          <p className="text-xs sm:text-sm text-slate-200 font-mono italic">
                            &ldquo;Qual a legitimidade ativa extraordinária para impetração de Habeas Data segundo o STJ?&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Rodapé com 3 Especificações Hands-Free */}
                      <div className="pt-2 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-center text-xs font-mono">
                        <div className="p-2 rounded-xl bg-white/[0.02]">
                          <span className="text-slate-400 block text-[10px]">Tela Bloqueada</span>
                          <span className="text-cyan-300 font-bold text-xs sm:text-sm">MediaSession API</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.02]">
                          <span className="text-slate-400 block text-[10px]">Controle do Fone</span>
                          <span className="text-emerald-400 font-bold text-xs sm:text-sm">Clique = Gabarito</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.02]">
                          <span className="text-slate-400 block text-[10px]">Qualidade de Voz</span>
                          <span className="text-indigo-300 font-bold text-xs sm:text-sm">1.25x Studio HD</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Ambient Volumetric Floor Reflection / Ground Mirror */}
          <div
            className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-20 opacity-60 blur-2xl"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.35) 0%, rgba(6,182,212,0.18) 40%, transparent 75%)",
            }}
          />
        </div>

        {/* Scroll Progress Bar indicator under the Cockpit */}
        <div className="mt-3 sm:mt-5 flex items-center gap-3">
          <div className="flex gap-2">
            <span
              onClick={() => handleManualTab(0)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeScreen === 0 ? "w-8 bg-indigo-500 shadow-[0_0_8px_#6366f1]" : "w-2 bg-slate-700 hover:bg-slate-500"
              }`}
            />
            <span
              onClick={() => handleManualTab(1)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeScreen === 1 ? "w-8 bg-violet-400 shadow-[0_0_8px_#a855f7]" : "w-2 bg-slate-700 hover:bg-slate-500"
              }`}
            />
            <span
              onClick={() => handleManualTab(2)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeScreen === 2 ? "w-8 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "w-2 bg-slate-700 hover:bg-slate-500"
              }`}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {activeScreen === 0 && "Role para ver o Corretor Discursivo (2/3) ↓"}
            {activeScreen === 1 && "Role para ver os Flashcards em Áudio (3/3) ↓"}
            {activeScreen === 2 && "Cockpit concluído! Continue rolando para o método ↓"}
          </span>
        </div>
      </div>
    </div>
  );
}
