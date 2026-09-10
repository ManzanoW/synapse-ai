"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";

export interface ToastAchievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  xpReward: number;
}

export interface AchievementToastProps {
  achievement: ToastAchievement | null;
  onClose: () => void;
  duration?: number;
}

export function AchievementToast({
  achievement,
  onClose,
  duration = 4000,
}: AchievementToastProps) {
  useEffect(() => {
    if (!achievement) return;

    // Disparo leve de confetti nas tonalidades violeta, roxo e dourado
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { x: 0.9, y: 0.88 },
        colors: ["#8b5cf6", "#a855f7", "#c084fc", "#e879f9", "#ffffff", "#fbbf24"],
        ticks: 180,
        gravity: 1.1,
        scalar: 0.9,
      });
    } catch (e) {
      console.error("Erro ao disparar confetti:", e);
    }

    // Auto-fechar após 4 segundos (ou tempo customizado)
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [achievement, onClose, duration]);

  return (
    <AnimatePresence mode="wait">
      {achievement && (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, y: 40, scale: 0.92, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(2px)" }}
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 left-4 md:left-auto z-50 flex w-auto md:w-full md:max-w-sm items-center gap-3.5 rounded-3xl border border-violet-500/40 bg-[#0B0A16]/90 p-4 shadow-[0_0_35px_rgba(139,92,246,0.3)] backdrop-blur-2xl select-none overflow-hidden"
        >
          {/* Brilho Superior Neon Violeta */}
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-violet-400/90 to-transparent" />

          {/* Luzes ambiente de fundo (Glow Cósmico) */}
          <div className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full bg-violet-600/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-fuchsia-600/15 blur-2xl" />

          {/* Ícone da Conquista com Borda Brilhante Violeta */}
          <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-violet-500/40 bg-violet-500/15 text-2xl shadow-[0_0_20px_rgba(139,92,246,0.35)]">
            {achievement.icon || "🏆"}
            <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-violet-400 text-slate-950 shadow-sm shadow-violet-400/50">
              <Sparkles size={10} className="fill-slate-950" />
            </span>
          </div>

          {/* Textos Informativos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-violet-400">
                <Sparkles size={10} className="text-violet-400" />
                Conquista Desbloqueada!
              </span>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 font-mono text-[9px] font-bold text-violet-200 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                +{achievement.xpReward} XP
              </span>
            </div>

            <h4 className="text-xs font-black text-white truncate mt-1">
              {achievement.title}
            </h4>

            <p className="text-[10px] text-slate-300 line-clamp-2 mt-0.5 leading-tight">
              {achievement.description}
            </p>
          </div>

          {/* Botão Fechar */}
          <button
            onClick={onClose}
            aria-label="Fechar notificação"
            className="cursor-pointer rounded-xl p-1.5 text-slate-400 hover:bg-violet-500/20 hover:text-white transition-all shrink-0 active:scale-95"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
