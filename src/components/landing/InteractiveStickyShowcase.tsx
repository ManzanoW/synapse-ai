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

  // Parallax Multi-Plano dos Painéis Laterais de Fundo (Estilo Mentoris Imagem 3)
  const bgPanelLeftX = useTransform(scrollYProgress, [0, 1], [-10, -85]);
  const bgPanelLeftY = useTransform(scrollYProgress, [0, 1], [30, -50]);
  const bgPanelLeftRotate = useTransform(scrollYProgress, [0, 1], [16, 26]);

  const bgPanelRightX = useTransform(scrollYProgress, [0, 1], [10, 85]);
  const bgPanelRightY = useTransform(scrollYProgress, [0, 1], [-30, 50]);
  const bgPanelRightRotate = useTransform(scrollYProgress, [0, 1], [-16, -26]);

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
          {/* ======================================================================= */}
          {/* PAINÉIS DE FUNDO EM 3D PARALLAX (PROFUNDIDADE MULTI-PLANO ESTILO MENTORIS)*/}
          {/* ======================================================================= */}
          {/* Painel Esquerdo: Edital Mapeado */}
          <motion.div
            style={{
              x: bgPanelLeftX,
              y: bgPanelLeftY,
              rotateY: bgPanelLeftRotate,
              rotateZ: -4,
            }}
            className="hidden xl:block absolute -left-28 top-1/2 -translate-y-1/2 w-64 p-4 rounded-2xl bg-[#090d1a]/85 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-none -z-10 opacity-70"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-[11px] font-mono font-bold text-cyan-300">Edital Verticalizado</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">84% Coberto</span>
            </div>
            <div className="space-y-2 pt-2.5 text-[11px] font-mono">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300 text-[10px]">
                  <span>Dir. Administrativo</span>
                  <span className="text-cyan-400">92%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 w-[92%]" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300 text-[10px]">
                  <span>Dir. Constitucional</span>
                  <span className="text-indigo-400">86%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[86%]" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300 text-[10px]">
                  <span>Língua Portuguesa</span>
                  <span className="text-violet-400">78%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 w-[78%]" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Painel Direito: Planner de Revisões */}
          <motion.div
            style={{
              x: bgPanelRightX,
              y: bgPanelRightY,
              rotateY: bgPanelRightRotate,
              rotateZ: 4,
            }}
            className="hidden xl:block absolute -right-28 top-1/2 -translate-y-1/2 w-64 p-4 rounded-2xl bg-[#090d1a]/85 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-none -z-10 opacity-70"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-[11px] font-mono font-bold text-violet-300">Planner de Revisões</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">+27% Retenção</span>
            </div>
            <div className="space-y-2.5 pt-2.5 text-[11px] font-mono">
              <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Amanhã • 08:30</div>
                  <div className="text-xs font-bold text-white">Contratos Públicos</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">FSRS +7d</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Quinta • 19:00</div>
                  <div className="text-xs font-bold text-white">Habeas Corpus / Data</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">Áudio</span>
              </div>
            </div>
          </motion.div>

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
                      className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
                    >
                      <div className="md:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 sm:p-5 space-y-3.5">
                        {/* Topic Header & Retention Probability */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold transition-colors ${ratingConfig.statusColor}`}>
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${ratingConfig.pulseColor}`} />
                                {ratingConfig.statusBadge}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                                Algoritmo FSRS de 4ª Geração
                              </span>
                            </div>
                            <h4 className="text-sm sm:text-base font-bold text-white">
                              Direito Administrativo • Licitações & Contratos (Lei 14.133/21)
                            </h4>
                          </div>

                          <div className="text-right shrink-0">
                            <motion.span
                              key={ratingConfig.percentage}
                              initial={{ scale: 0.9, opacity: 0.8 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight block transition-colors ${ratingConfig.textColor}`}
                            >
                              {ratingConfig.percentage}
                            </motion.span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              Lembrança Estimada
                            </span>
                          </div>
                        </div>

                        {/* Visual Memory Curve Indicator */}
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium text-[11px] sm:text-xs">
                              Curva de Fixação no Dia da Prova
                            </span>
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className="text-slate-400">Próximo Contato Ótimo:</span>
                              <span className={`font-bold px-2 py-0.5 rounded border transition-colors ${ratingConfig.reviewPill}`}>
                                {ratingConfig.nextReview}
                              </span>
                            </div>
                          </div>

                          {/* Retention Bar with Threshold Marker */}
                          <div className="space-y-1">
                            <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                              <motion.div
                                animate={{ width: ratingConfig.barWidth }}
                                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                                className={`h-full rounded-full bg-gradient-to-r transition-all ${ratingConfig.barGradient}`}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                              <span>0%</span>
                              <span className="text-slate-400">Meta Segura: 90%</span>
                              <span className={`font-semibold transition-colors ${ratingConfig.textColor}`}>
                                {ratingConfig.safeLabel}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Question Preview */}
                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-xs space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span className="text-indigo-400 font-bold">QUESTÃO #142 • PROVA COMENTADA</span>
                            <span className="text-emerald-400/90 font-medium">✓ Respondido com Confiança</span>
                          </div>
                          <p className="font-semibold text-slate-200 leading-snug">
                            No Pregão Eletrônico, qual a consequência da não comprovação da habilitação fiscal pelo licitante primeiro colocado?
                          </p>
                          <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                            <div className="text-slate-300">
                              <strong className="text-emerald-400">Gabarito:</strong> Convocação do segundo colocado nas mesmas condições da proposta ofertada.
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 self-start sm:self-auto transition-colors ${ratingConfig.tagColor}`}>
                              {ratingConfig.intervalText}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Evaluation Rating Simulator */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span className="text-cyan-300 font-bold flex items-center gap-1">
                              <span>👉 Clique para simular o recálculo do algoritmo:</span>
                            </span>
                            <span className="text-slate-500 text-[10px]">Feedback do Concurseiro</span>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-xs font-mono">
                            {/* Errei */}
                            <button
                              type="button"
                              onClick={() => setUserRating("again")}
                              className={`p-2 rounded-xl transition-all cursor-pointer relative ${
                                userRating === "again"
                                  ? "bg-rose-600/30 border-2 border-rose-400 text-white shadow-md shadow-rose-600/30"
                                  : "bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20"
                              }`}
                            >
                              {userRating === "again" && (
                                <div className="absolute -top-2 right-1 px-1.5 py-0.2 rounded bg-rose-500 text-[8px] font-bold uppercase tracking-wider text-white">
                                  Ativo
                                </div>
                              )}
                              <span className="font-bold block text-[10px] sm:text-[11px]">Errei</span>
                              <span className="text-[9px] sm:text-[10px] text-rose-300/80">Rever Hoje</span>
                            </button>

                            {/* Difícil */}
                            <button
                              type="button"
                              onClick={() => setUserRating("hard")}
                              className={`p-2 rounded-xl transition-all cursor-pointer relative ${
                                userRating === "hard"
                                  ? "bg-amber-600/30 border-2 border-amber-400 text-white shadow-md shadow-amber-600/30"
                                  : "bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20"
                              }`}
                            >
                              {userRating === "hard" && (
                                <div className="absolute -top-2 right-1 px-1.5 py-0.2 rounded bg-amber-500 text-[8px] font-bold uppercase tracking-wider text-white">
                                  Ativo
                                </div>
                              )}
                              <span className="font-bold block text-[10px] sm:text-[11px]">Difícil</span>
                              <span className="text-[9px] sm:text-[10px] text-amber-300/80">+2 dias</span>
                            </button>

                            {/* Bom */}
                            <button
                              type="button"
                              onClick={() => setUserRating("good")}
                              className={`p-2 rounded-xl transition-all cursor-pointer relative ${
                                userRating === "good"
                                  ? "bg-indigo-600/30 border-2 border-indigo-400 text-white shadow-md shadow-indigo-600/30"
                                  : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20"
                              }`}
                            >
                              {userRating === "good" && (
                                <div className="absolute -top-2 right-1 px-1.5 py-0.2 rounded bg-indigo-500 text-[8px] font-bold uppercase tracking-wider text-white">
                                  Ativo
                                </div>
                              )}
                              <span className="font-bold block text-[10px] sm:text-[11px]">Bom</span>
                              <span className="text-[9px] sm:text-[10px] text-indigo-300/80">+7 dias</span>
                            </button>

                            {/* Fácil */}
                            <button
                              type="button"
                              onClick={() => setUserRating("easy")}
                              className={`p-2 rounded-xl transition-all cursor-pointer relative ${
                                userRating === "easy"
                                  ? "bg-cyan-600/30 border-2 border-cyan-400 text-white shadow-md shadow-cyan-600/30"
                                  : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20"
                              }`}
                            >
                              {userRating === "easy" && (
                                <div className="absolute -top-2 right-1 px-1.5 py-0.2 rounded bg-cyan-500 text-[8px] font-bold uppercase tracking-wider text-white">
                                  Ativo
                                </div>
                              )}
                              <span className="font-bold block text-[10px] sm:text-[11px]">Fácil</span>
                              <span className="text-[9px] sm:text-[10px] text-cyan-300/80">+21 dias</span>
                            </button>
                          </div>

                          {/* Dynamic Feedback Banner */}
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-300 font-mono">
                            {ratingConfig.feedback}
                          </div>
                        </div>
                      </div>

                      {/* Right Insight Box */}
                      <div className="rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-950/60 border border-indigo-500/25 p-4 sm:p-5 flex flex-col justify-between space-y-3">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
                              Eficiência Real de Estudo
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[9px] font-mono font-bold">
                              vs. Anki SM-2
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="text-2xl sm:text-3xl font-black text-white">
                              -65% <span className="text-xs font-normal text-slate-400">revisões diárias</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed pt-1">
                              O Synapse só aciona revisões quando a retenção atinge 90%. Sem repetições inúteis do que você já domina.
                            </p>
                          </div>

                          {/* Comparativo Visual */}
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-slate-400 text-[11px]">
                              <span>Método Tradicional:</span>
                              <span className="font-mono text-rose-400 font-semibold">120 cards/dia</span>
                            </div>
                            <div className="flex items-center justify-between text-white text-[11px]">
                              <span className="font-medium text-cyan-300">Synapse FSRS:</span>
                              <span className="font-mono text-emerald-400 font-bold">24 cards/dia</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Tempo Poupado:</span>
                            <span className="text-cyan-300 font-bold">~45 min/dia</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Retenção na Prova:</span>
                            <span className="text-emerald-400 font-bold">92%+ garantida</span>
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
                    >
                      <div className="md:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 sm:p-5 space-y-3.5">
                        <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-[10px] font-mono font-bold">
                                BANCA CEBRASPE
                              </span>
                              <span className="text-xs font-mono text-slate-400">Padrão Oficial • 30 Linhas</span>
                            </div>
                            <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                              Tema: Princípio da Impessoalidade e Conflito de Interesses
                            </h4>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-mono">Nota Final</span>
                            <span className="text-xl sm:text-2xl font-black text-violet-400 font-mono">
                              96.5 <span className="text-[11px] text-slate-500">/ 100</span>
                            </span>
                          </div>
                        </div>

                        {/* Formula Bar */}
                        <div className="p-2.5 rounded-xl bg-violet-950/30 border border-violet-500/20 font-mono text-[11px] sm:text-xs flex flex-wrap items-center justify-between gap-1">
                          <span className="text-violet-300 font-bold">Critério Oficial Cebraspe: NF = NC - 2 × (NE / TL)</span>
                          <span className="text-slate-400">Nota Conteúdo: 98 • 2 Erros • 30 Linhas</span>
                        </div>

                        {/* Line by line error annotations */}
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] sm:text-[11px]">
                              <span className="text-rose-400 font-bold">Linha 14 • Regência Verbal</span>
                              <span>Microestrutura</span>
                            </div>
                            <p className="text-slate-300 font-mono text-[11px]">
                              &quot;...a referida portaria visa atender aos ditames constitucionais...&quot;
                            </p>
                            <p className="text-emerald-300 font-mono text-[10px]">
                              ↳ Sugestão da Banca: Correto! Verbo &quot;visar&quot; no sentido de objetivar rege preposição &quot;a&quot;.
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span><strong>Versão Ouro Recomendada:</strong> Reescrita com termos técnicos aprovados pela banca.</span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                          </div>
                        </div>
                      </div>

                      {/* Right Feedback Box */}
                      <div className="rounded-2xl bg-gradient-to-b from-violet-950/40 to-slate-950/60 border border-violet-500/20 p-4 sm:p-5 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300 font-bold block">
                            Resultado Imediato
                          </span>
                          <h5 className="text-base sm:text-lg font-bold text-white">Status: Aprovado no Padrão Ouro</h5>
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
                    >
                      <div className="md:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 sm:p-5 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
                              <Headphones className="w-4 h-4 animate-pulse" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold text-cyan-400">
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
                        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/20 space-y-2.5">
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold text-[11px]">
                              <Volume2 className="w-3.5 h-3.5" /> Voz Neural Humana em Execução
                            </span>
                            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              Pausa Reflexiva: 03s
                            </span>
                          </div>

                          <div className="flex items-center justify-center gap-1.5 h-10 py-1">
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
                          <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-cyan-300 font-bold block text-[10px] sm:text-[11px]">Tela Bloqueada</span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">MediaSession</span>
                          </div>
                          <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-cyan-300 font-bold block text-[10px] sm:text-[11px]">Botão do Fone</span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">Play/Gabarito</span>
                          </div>
                          <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-cyan-300 font-bold block text-[10px] sm:text-[11px]">Recuperação Ativa</span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">Memória Real</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Benefit Box */}
                      <div className="rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-950/60 border border-cyan-500/20 p-4 sm:p-5 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block">
                            Horas Líquidas no Bolso
                          </span>
                          <div className="text-2xl sm:text-3xl font-black text-white">
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
