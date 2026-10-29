"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Gift,
  Sparkles,
  Zap,
  Trophy,
  Check,
  ArrowRight,
  Flame,
  X,
} from "lucide-react";
import { claimOnboardingRewardAction } from "@/actions/gamification-actions";
import { useGamification } from "@/context/GamificationContext";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface WelcomeGiftModalProps {
  userName?: string | null;
  isOpenOverride?: boolean;
  onClose?: () => void;
}

export function WelcomeGiftModal({
  userName,
  isOpenOverride,
  onClose,
}: WelcomeGiftModalProps) {
  const { refreshStats } = useGamification();
  const [isOpen, setIsOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (isOpenOverride !== undefined) {
      setIsOpen(isOpenOverride);
      return;
    }

    try {
      const alreadyClaimed = localStorage.getItem("synapse_welcome_gift_claimed");
      const quizSeen = localStorage.getItem("synapse_onboarding_quiz_seen");

      // Abre automaticamente se ainda não resgatou e o quiz já foi visto ou não está pendente
      if (!alreadyClaimed) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          triggerHaptic("medium");
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [isOpenOverride]);

  const handleClaim = async () => {
    setIsClaiming(true);
    triggerHaptic("heavy");

    // Efeito de confetes festivo
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#10b981"],
      });
    } catch {}

    try {
      await claimOnboardingRewardAction();
      await refreshStats();
    } catch (e) {
      console.warn("Aviso ao sincronizar recompensa de boas-vindas:", e);
    }

    try {
      localStorage.setItem("synapse_welcome_gift_claimed", "true");
    } catch {}

    setClaimed(true);
    setIsClaiming(false);

    setTimeout(() => {
      setIsOpen(false);
      if (onClose) onClose();
    }, 1800);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem("synapse_welcome_gift_claimed", "true");
    } catch {}
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 via-[#0a0f1d] to-[#050811] p-6 sm:p-8 text-center shadow-2xl shadow-indigo-950/50"
        >
          {/* Efeitos de Glow no fundo */}
          <div className="absolute -top-24 -left-24 w-56 h-56 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-56 h-56 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

          {/* Botão fechar sutil */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={16} />
          </button>

          {/* Ícone de Presente Animado */}
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-linear-to-tr from-indigo-500 to-violet-500 blur-lg opacity-40 animate-pulse" />
            <motion.div
              animate={{ rotate: [0, -6, 6, -3, 3, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 1 }}
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-tr from-indigo-600 via-violet-600 to-indigo-500 border border-indigo-400/30 text-white shadow-xl shadow-indigo-600/30"
            >
              <Gift size={38} className="drop-shadow-md" />
            </motion.div>
          </div>

          {/* Tag de Destaque */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles size={13} className="text-amber-400 animate-spin" />
            <span>Presente de Boas-Vindas</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {userName ? `Olá, ${userName.split(" ")[0]}!` : "Bem-vindo ao Synapse!"}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Para acelerar seu início rumo à aprovação, liberamos um bônus de ativação imediato na sua conta:
          </p>

          {/* Cartões dos Bônus */}
          <div className="mt-5 grid grid-cols-3 gap-2.5 text-left">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 mb-1.5">
                <Zap size={18} />
              </div>
              <span className="text-base font-black text-white">+100 XP</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Pontos Iniciais</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 mb-1.5">
                <Trophy size={18} />
              </div>
              <span className="text-xs font-bold text-white leading-tight">1ª Conquista</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Primeiro Passo</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 mb-1.5">
                <Sparkles size={18} />
              </div>
              <span className="text-xs font-bold text-white leading-tight">IA Ativa</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Cota Sináptica</span>
            </div>
          </div>

          {/* Botão de Resgate */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleClaim}
              disabled={isClaiming || claimed}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                claimed
                  ? "bg-emerald-600 text-white shadow-emerald-900/50"
                  : "bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 active:scale-98"
              }`}
            >
              {claimed ? (
                <>
                  <Check size={18} className="text-white" />
                  <span>Resgatado com Sucesso! Bons Estudos!</span>
                </>
              ) : isClaiming ? (
                <>
                  <Sparkles size={18} className="animate-spin text-amber-300" />
                  <span>Creditando seus +100 XP...</span>
                </>
              ) : (
                <>
                  <Gift size={18} className="text-amber-300" />
                  <span>Resgatar Presente & Começar (+100 XP)</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            Seus pontos já contam para a Liga Semanal e o Ranking de Concurseiros.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
