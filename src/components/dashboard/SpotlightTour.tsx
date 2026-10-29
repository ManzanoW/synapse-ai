"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Calendar,
  Layers,
  Headphones,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Zap,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface SpotlightTourProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const TOUR_STEPS = [
  {
    step: 1,
    title: "1. Seu Ciclo de Estudos Inteligente",
    badge: "Roteiro de Hoje",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    icon: Calendar,
    iconColor: "text-indigo-400",
    desc: "A IA distribui suas disciplinas ao longo da semana de acordo com suas horas disponíveis. Se você perder algum dia, ela reorganiza automaticamente sem ansiedade.",
  },
  {
    step: 2,
    title: "2. Simulados & Caderno de Erros FSRS",
    badge: "Fixação Ativa",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    icon: Layers,
    iconColor: "text-cyan-400",
    desc: "Ao resolver questões da sua banca, cada falha é catalogada automaticamente no seu Caderno de Erros com repetição espaçada para você revisar na hora certa antes da curva do esquecimento.",
  },
  {
    step: 3,
    title: "3. Sala de Foco & Áudios Binaurais",
    badge: "Alta Performance",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: Headphones,
    iconColor: "text-emerald-400",
    desc: "Estude em sessões cronometradas com frequências sonoras que induzem ondas alfa e foco profundo, longe de notificações e distrações.",
  },
];

export function SpotlightTour({ isOpen: controlledIsOpen, onClose }: SpotlightTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsVisible(controlledIsOpen);
      return;
    }

    try {
      const seen = localStorage.getItem("synapse_spotlight_tour_seen") === "true";
      // Não exibe imediatamente se o onboarding quiz ainda está aberto
      const quizSeen = localStorage.getItem("synapse_onboarding_quiz_seen") === "true";
      if (!seen && quizSeen) {
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [controlledIsOpen]);

  if (!isVisible) return null;

  const current = TOUR_STEPS[currentStep];

  const handleNext = () => {
    triggerHaptic("light");
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    triggerHaptic("light");
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    triggerHaptic("medium");
    setIsVisible(false);
    try {
      localStorage.setItem("synapse_spotlight_tour_seen", "true");
    } catch {}
    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-indigo-500/30 bg-linear-to-b from-[#0f1426] via-[#090d1a] to-[#060810] p-6 shadow-2xl"
        >
          {/* Luz de topo */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/60 to-transparent" />
          <div className="pointer-events-none absolute -top-20 -left-20 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />

          {/* Cabeçalho do Card */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles size={18} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-indigo-300 block">
                  Tour Rápido • {currentStep + 1} de {TOUR_STEPS.length}
                </span>
                <span className="text-xs font-bold text-white block mt-0.5">
                  Conheça o essencial da sua preparação
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleComplete}
              className="p-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Pular tour"
            >
              <X size={15} />
            </button>
          </div>

          {/* Conteúdo do Passo Atual */}
          <div className="my-5 p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white shrink-0">
                <current.icon size={20} className={current.iconColor} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">{current.title}</h4>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded-full border ${current.badgeColor}`}>
                    {current.badge}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {current.desc}
            </p>
          </div>

          {/* Barra de Progresso e Navegação */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep
                      ? "w-6 bg-indigo-500"
                      : "w-1.5 bg-white/20"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <ArrowLeft size={13} />
                  <span>Anterior</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>{currentStep === TOUR_STEPS.length - 1 ? "Entendi, Começar!" : "Próximo"}</span>
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <Check size={14} />
                ) : (
                  <ArrowRight size={14} />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
