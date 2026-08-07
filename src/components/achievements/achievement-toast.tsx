"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";

export interface ToastAchievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  xpReward: number;
}

interface AchievementToastProps {
  achievement: ToastAchievement | null;
  onClose: () => void;
}

export function AchievementToast({
  achievement,
  onClose,
}: AchievementToastProps) {
  useEffect(() => {
    if (achievement) {
      // Dispara confete dourado no canto inferior direito
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x: 0.9, y: 0.9 },
        colors: ["#f59e0b", "#fbbf24", "#38bdf8", "#ffffff"],
      });

      // Auto-fechar após 5 segundos
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-6 right-6 z-50 flex w-full max-w-sm items-center gap-3.5 rounded-3xl border border-amber-500/40 bg-slate-950/90 p-4 shadow-[0_0_35px_rgba(245,158,11,0.25)] backdrop-blur-2xl select-none"
        >
          {/* Brilho Superior Neon */}
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-amber-400/80 to-transparent" />

          {/* Ícone da Conquista */}
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-3xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            {achievement.icon || "🏆"}
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950">
              <Sparkles size={10} className="fill-slate-950" />
            </span>
          </div>

          {/* Textos Informativos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400">
                Conquista Desbloqueada!
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-300">
                +{achievement.xpReward} XP
              </span>
            </div>

            <h4 className="text-xs font-black text-white truncate mt-0.5">
              {achievement.title}
            </h4>

            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
              {achievement.description}
            </p>
          </div>

          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="cursor-pointer rounded-xl p-1 text-slate-500 hover:bg-slate-800/80 hover:text-white transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
