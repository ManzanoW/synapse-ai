"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, Zap, ArrowRight } from "lucide-react";

interface LevelUpModalProps {
  isOpen: boolean;
  newLevel: number;
  newTitle: string;
  onClose: () => void;
}

export function LevelUpModal({
  isOpen,
  newLevel,
  newTitle,
  onClose,
}: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Escuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-indigo-500/30 bg-slate-900/90 p-6 text-center shadow-[0_0_50px_rgba(99,102,241,0.25)] backdrop-blur-2xl"
          >
            {/* Ambient Lighting */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-[60px]" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-[60px]" />

            {/* Ícone com Pulse */}
            <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.4)]">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Trophy size={40} />
              </motion.div>
              <Sparkles
                size={18}
                className="absolute -top-2 -right-2 animate-bounce text-cyan-400"
              />
            </div>

            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 font-mono text-[10px] font-bold tracking-widest text-indigo-300 uppercase">
              <Zap size={12} /> Level Up!
            </span>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
              Nível {newLevel} Alcançado
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Você desbloqueou a patente:
            </p>

            <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3 font-mono text-sm font-extrabold text-cyan-300">
              {newTitle}
            </div>

            <button
              onClick={onClose}
              className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-indigo-500/40 bg-linear-to-r from-indigo-600 to-cyan-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:opacity-90 active:scale-95"
            >
              <span>Continuar Evoluindo</span>
              <ArrowRight size={14} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
