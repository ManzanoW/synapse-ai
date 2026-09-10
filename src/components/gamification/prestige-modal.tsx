"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Crown, Zap, Check } from "lucide-react";
import { claimPrestigeAction } from "@/actions/gamification-actions";
import { useGamification } from "@/context/GamificationContext";

interface PrestigeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentPrestige: number;
}

export function PrestigeModal({
  isOpen,
  onClose,
  userId,
  currentPrestige,
}: PrestigeModalProps) {
  const [isAscending, setIsAscending] = useState(false);
  const [success, setSuccess] = useState(false);
  const { refreshStats } = useGamification();

  const handleAscend = async () => {
    try {
      setIsAscending(true);
      const res = await claimPrestigeAction(userId);
      if (res.success) {
        setSuccess(true);
        await refreshStats(userId);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAscending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-500/40 bg-linear-to-b from-[#0c1020] via-[#080c16] to-[#04060c] p-7 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-center"
        >
          {/* Luz de Topo Neon */}
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-cyan-500/20 blur-2xl pointer-events-none" />

          {/* Ícone Cósmico */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
            <Crown size={32} className="animate-pulse" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-mono font-black uppercase tracking-widest text-cyan-300">
            <Sparkles size={11} /> Ascensão Sináptica
          </span>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            Ascender para Prestígio {currentPrestige + 1}
          </h2>

          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            Você atingiu o <strong className="text-white">Nível 50</strong>.
            Ascenda para desbloquear uma insígnia cromada e multiplicadores de
            retenção visual permanentes.
          </p>

          <div className="mt-5 rounded-2xl border border-white/5 bg-slate-950/60 p-3.5 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Zap size={14} className="text-amber-400" />
              <span>Borda de Patente Exclusiva</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Sparkles size={14} className="text-cyan-400" />
              <span>
                Insígnia de Prestígio P{currentPrestige + 1} na Sidebar
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isAscending}
              className="flex-1 rounded-xl border border-white/10 py-3 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Agora Não
            </button>
            <button
              onClick={handleAscend}
              disabled={isAscending || success}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-indigo-600 py-3 text-xs font-black uppercase text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {success ? (
                <>
                  <Check size={16} /> Ascendido!
                </>
              ) : isAscending ? (
                "Ascendendo..."
              ) : (
                "Ascender Agora"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
