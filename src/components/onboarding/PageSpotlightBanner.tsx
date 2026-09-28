"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Check, HelpCircle, ChevronRight, Info } from "lucide-react";

export interface SpotlightStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag?: string;
}

export interface PageSpotlightBannerProps {
  storageKey: string;
  badgeText?: string;
  title: string;
  description: string;
  accentColor?: "violet" | "indigo" | "emerald" | "amber";
  steps: SpotlightStep[];
  primaryActionLabel?: string;
  externalIsOpen?: boolean;
  onClose?: () => void;
}

export function useSpotlight(storageKey: string) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      // Aberto por padrão se nunca foi visto
      if (stored === null || stored === "open") {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    } catch {
      setIsOpen(false);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, "dismissed");
    } catch {}
    setIsOpen(false);
  };

  const open = () => {
    try {
      localStorage.setItem(storageKey, "open");
    } catch {}
    setIsOpen(true);
  };

  const toggle = () => {
    if (isOpen) {
      dismiss();
    } else {
      open();
    }
  };

  return { isOpen, isLoaded, dismiss, open, toggle };
}

export function PageSpotlightBanner({
  storageKey,
  badgeText = "💡 Dica de Primeiro Acesso",
  title,
  description,
  accentColor = "indigo",
  steps,
  primaryActionLabel = "Entendi, pronto para estudar!",
  externalIsOpen,
  onClose,
}: PageSpotlightBannerProps) {
  const { isOpen: internalIsOpen, isLoaded, dismiss: internalDismiss } = useSpotlight(storageKey);

  const isVisible = externalIsOpen !== undefined ? externalIsOpen : (isLoaded && internalIsOpen);

  const handleDismiss = () => {
    internalDismiss();
    if (onClose) onClose();
  };

  const colorStyles = {
    violet: {
      cardBorder: "border-violet-500/30 hover:border-violet-500/50",
      bgGradient: "from-violet-950/40 via-slate-900/80 to-slate-950/90",
      badge: "bg-violet-500/15 text-violet-300 border-violet-500/30",
      button: "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/40",
      stepIconBg: "bg-violet-500/15 border-violet-500/25 text-violet-300",
      tag: "bg-violet-500/10 text-violet-300 border-violet-500/20",
      glow: "bg-violet-600/10",
    },
    indigo: {
      cardBorder: "border-indigo-500/30 hover:border-indigo-500/50",
      bgGradient: "from-indigo-950/40 via-slate-900/80 to-slate-950/90",
      badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      button: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40",
      stepIconBg: "bg-indigo-500/15 border-indigo-500/25 text-indigo-300",
      tag: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
      glow: "bg-indigo-600/10",
    },
    emerald: {
      cardBorder: "border-emerald-500/30 hover:border-emerald-500/50",
      bgGradient: "from-emerald-950/40 via-slate-900/80 to-slate-950/90",
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      button: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40",
      stepIconBg: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300",
      tag: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
      glow: "bg-emerald-600/10",
    },
    amber: {
      cardBorder: "border-amber-500/30 hover:border-amber-500/50",
      bgGradient: "from-amber-950/40 via-slate-900/80 to-slate-950/90",
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      button: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40",
      stepIconBg: "bg-amber-500/15 border-amber-500/25 text-amber-300",
      tag: "bg-amber-500/10 text-amber-300 border-amber-500/20",
      glow: "bg-amber-600/10",
    },
  }[accentColor];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={`relative overflow-hidden rounded-3xl border ${colorStyles.cardBorder} bg-gradient-to-br ${colorStyles.bgGradient} p-5 sm:p-7 shadow-2xl backdrop-blur-xl transition-colors`}
        >
          {/* Subtle Ambient Glow */}
          <div
            className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full ${colorStyles.glow} blur-3xl`}
          />

          <div className="relative z-10 space-y-5">
            {/* Header com badge, título e botão de fechar */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border uppercase ${colorStyles.badge}`}
                  >
                    <Sparkles size={13} />
                    {badgeText}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {description}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0 border border-white/10"
                title="Fechar dica"
                aria-label="Fechar dica"
              >
                <X size={16} />
              </button>
            </div>

            {/* 3 Passos explicativos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-1">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colorStyles.stepIconBg}`}
                      >
                        {step.icon}
                      </div>
                      {step.tag && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${colorStyles.tag}`}
                        >
                          {step.tag}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      {step.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-300/90 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ação de rodapé */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/10 flex-wrap">
              <span className="text-[11px] text-slate-400">
                Você pode reabrir esta dica a qualquer momento clicando em{" "}
                <strong className="text-slate-300">Como Funciona?</strong> no topo.
              </span>
              <button
                type="button"
                onClick={handleDismiss}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer ${colorStyles.button}`}
              >
                <Check size={15} />
                <span>{primaryActionLabel}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SpotlightTriggerButton({
  onClick,
  label = "Como Funciona?",
  accentColor = "indigo",
}: {
  onClick: () => void;
  label?: string;
  accentColor?: "violet" | "indigo" | "emerald" | "amber";
}) {
  const colorStyles = {
    violet: "hover:text-violet-300 hover:border-violet-500/40 hover:bg-violet-500/10",
    indigo: "hover:text-indigo-300 hover:border-indigo-500/40 hover:bg-indigo-500/10",
    emerald: "hover:text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/10",
    amber: "hover:text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/10",
  }[accentColor];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer ${colorStyles}`}
      title="Ver guia rápido desta tela"
    >
      <HelpCircle size={14} className="text-slate-400" />
      <span>{label}</span>
    </button>
  );
}
