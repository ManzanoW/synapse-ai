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
  badgeText = "Guia Rápido",
  title,
  description,
  accentColor = "indigo",
  steps,
  primaryActionLabel = "Entendido",
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
      cardBorder: "border-slate-800/80",
      badge: "bg-slate-800/80 text-slate-300 border-slate-700",
      button: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm",
      stepIconBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
      tag: "bg-slate-800/80 text-slate-300 border-slate-700/80",
    },
    indigo: {
      cardBorder: "border-slate-800/80",
      badge: "bg-slate-800/80 text-slate-300 border-slate-700",
      button: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm",
      stepIconBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
      tag: "bg-slate-800/80 text-slate-300 border-slate-700/80",
    },
    emerald: {
      cardBorder: "border-slate-800/80",
      badge: "bg-slate-800/80 text-slate-300 border-slate-700",
      button: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm",
      stepIconBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      tag: "bg-slate-800/80 text-slate-300 border-slate-700/80",
    },
    amber: {
      cardBorder: "border-slate-800/80",
      badge: "bg-slate-800/80 text-slate-300 border-slate-700",
      button: "bg-amber-600 hover:bg-amber-500 text-white shadow-sm",
      stepIconBg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      tag: "bg-slate-800/80 text-slate-300 border-slate-700/80",
    },
  }[accentColor];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.99 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className={`relative overflow-hidden rounded-2xl border ${colorStyles.cardBorder} bg-[#0c121e]/95 p-5 sm:p-6 shadow-xl transition-colors`}
        >
          <div className="relative z-10 space-y-5">
            {/* Header com badge, título e botão de fechar */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${colorStyles.badge}`}
                  >
                    <Info size={13} className="text-cyan-400" />
                    {badgeText}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {description}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0 border border-slate-800"
                title="Fechar guia"
                aria-label="Fechar guia"
              >
                <X size={16} />
              </button>
            </div>

            {/* 3 Passos explicativos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-1">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center border ${colorStyles.stepIconBg}`}
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
                    <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                      {step.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ação de rodapé */}
            <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-800/80 flex-wrap">
              <span className="text-[11px] text-slate-400">
                Você pode consultar este guia a qualquer momento em{" "}
                <strong className="text-slate-300">Como Funciona?</strong> no topo.
              </span>
              <button
                type="button"
                onClick={handleDismiss}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${colorStyles.button}`}
              >
                <Check size={14} />
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
