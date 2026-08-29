"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Snowflake,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

const FREEZE_COST_XP = 300;
const MAX_FREEZES = 5;

interface StreakFreezeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentXp: number;
  streakFreezes: number;
  /** Called after a successful purchase with the updated values */
  onPurchaseSuccess?: (newXp: number, newFreezes: number) => void;
}

type PurchaseState = "idle" | "loading" | "success" | "error";

export function StreakFreezeModal({
  isOpen,
  onClose,
  currentXp,
  streakFreezes,
  onPurchaseSuccess,
}: StreakFreezeModalProps) {
  const [purchaseState, setPurchaseState] = useState<PurchaseState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [localFreezes, setLocalFreezes] = useState<number | null>(null);
  const [localXp, setLocalXp] = useState<number | null>(null);

  const displayedFreezes = localFreezes ?? streakFreezes;
  const displayedXp = localXp ?? currentXp;
  const canAfford = displayedXp >= FREEZE_COST_XP;
  const isCapped = displayedFreezes >= MAX_FREEZES;
  const canPurchase = canAfford && !isCapped && purchaseState === "idle";

  const handlePurchase = async () => {
    if (!canPurchase) return;

    setPurchaseState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/gamification/streak-freeze", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.error || "Erro ao comprar a Trava de Gelo. Tente novamente.",
        );
        setPurchaseState("error");

        // Auto-reset error state after 4s
        setTimeout(() => setPurchaseState("idle"), 4000);
        return;
      }

      // Update local state optimistically
      setLocalFreezes(data.streakFreezes);
      setLocalXp(data.remainingXp);
      setPurchaseState("success");
      onPurchaseSuccess?.(data.remainingXp, data.streakFreezes);

      // Auto-reset success state to allow further purchases (up to cap)
      setTimeout(() => setPurchaseState("idle"), 3000);
    } catch {
      setErrorMessage("Erro de conexão. Verifique sua internet.");
      setPurchaseState("error");
      setTimeout(() => setPurchaseState("idle"), 4000);
    }
  };

  const handleClose = () => {
    // Reset local overrides when closing so next open shows fresh props
    setLocalFreezes(null);
    setLocalXp(null);
    setPurchaseState("idle");
    setErrorMessage("");
    onClose();
  };

  const freezeSlots = Array.from({ length: MAX_FREEZES }, (_, i) => i);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-cyan-500/25 bg-[#070b14] shadow-[0_0_60px_rgba(6,182,212,0.15)] backdrop-blur-2xl"
          >
            {/* Ambient Lighting */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-blue-600/10 blur-[80px]" />

            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-white/5 px-6 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Snowflake size={18} className="animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight text-white">
                    Trava de Sequência
                  </h2>
                  <p className="text-[10px] font-medium text-slate-400">
                    Proteja sua ofensiva de estudos
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="cursor-pointer rounded-xl p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="relative space-y-5 px-6 py-5">
              {/* Freeze Slots Indicator */}
              <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Travas Ativas
                  </span>
                  <span className="font-mono text-[10px] font-bold text-cyan-400">
                    {displayedFreezes}/{MAX_FREEZES}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {freezeSlots.map((i) => {
                    const isActive = i < displayedFreezes;
                    return (
                      <motion.div
                        key={i}
                        initial={false}
                        animate={
                          isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }
                        }
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                          isActive
                            ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                            : "border-white/5 bg-slate-950/60 text-slate-700"
                        }`}
                      >
                        <Snowflake size={14} />
                      </motion.div>
                    );
                  })}
                </div>

                {isCapped && (
                  <p className="mt-2 text-[10px] font-semibold text-cyan-400">
                    ✓ Capacidade máxima atingida
                  </p>
                )}
              </div>

              {/* Info Box: cost + XP */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-3 text-center">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Custo
                  </span>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <Zap size={12} className="text-amber-400" />
                    <span className="font-mono text-lg font-black text-amber-300">
                      {FREEZE_COST_XP}
                    </span>
                    <span className="text-[10px] text-slate-400">XP</span>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-3 text-center transition-colors ${
                    canAfford
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-rose-500/20 bg-rose-500/5"
                  }`}
                >
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Saldo
                  </span>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <Zap
                      size={12}
                      className={
                        canAfford ? "text-emerald-400" : "text-rose-400"
                      }
                    />
                    <span
                      className={`font-mono text-lg font-black ${
                        canAfford ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {displayedXp.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-slate-400">XP</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-center text-[11px] leading-relaxed text-slate-400">
                Uma Trava de Gelo protege sua sequência por{" "}
                <strong className="text-cyan-300">1 dia</strong> caso você não
                estude. Ela é usada automaticamente.
              </p>

              {/* Error Message */}
              <AnimatePresence>
                {purchaseState === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5"
                  >
                    <AlertCircle size={14} className="shrink-0 text-rose-400" />
                    <p className="text-[11px] font-medium text-rose-300">
                      {errorMessage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Purchase Button */}
              <button
                onClick={handlePurchase}
                disabled={!canPurchase}
                className={`relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl py-3 text-xs font-black tracking-wide transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
                  purchaseState === "success"
                    ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : isCapped
                      ? "border border-white/10 bg-slate-900 text-slate-500"
                      : !canAfford
                        ? "border border-rose-500/20 bg-rose-500/5 text-rose-400"
                        : "border border-cyan-500/40 bg-linear-to-r from-cyan-600/90 to-blue-600/90 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]"
                }`}
              >
                {/* Shimmer on hover (idle+affordable) */}
                {canPurchase && (
                  <div className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/10 to-transparent" />
                )}

                {purchaseState === "loading" ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : purchaseState === "success" ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Trava Resgatada! ❄️</span>
                  </>
                ) : isCapped ? (
                  <>
                    <Snowflake size={14} />
                    <span>Máximo de travas atingido</span>
                  </>
                ) : !canAfford ? (
                  <>
                    <Zap size={14} />
                    <span>
                      XP insuficiente ({FREEZE_COST_XP} XP necessário)
                    </span>
                  </>
                ) : (
                  <>
                    <Snowflake size={14} />
                    <span>Resgatar Trava de Gelo ({FREEZE_COST_XP} XP)</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
