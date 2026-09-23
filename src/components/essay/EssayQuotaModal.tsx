"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Gift,
  X,
  ShieldCheck,
  Sparkles,
  FileText,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { RewardedAdModal } from "@/components/quota/RewardedAdModal";
import { triggerAiQuotaRefresh } from "@/lib/quota-events";

interface EssayQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineCount?: number;
  wordCount?: number;
  onRewardClaimed?: () => void;
}

export function EssayQuotaModal({
  isOpen,
  onClose,
  lineCount = 0,
  wordCount = 0,
  onRewardClaimed,
}: EssayQuotaModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isRewardedAdOpen, setIsRewardedAdOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-28 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-[#080c16] border border-violet-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full relative overflow-hidden shadow-2xl shadow-violet-950/60 text-center space-y-6"
          >
            {/* Header Badge */}
            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold tracking-wider uppercase">
                <Crown size={13} className="text-amber-400" />
                <span>Cota Diária Esgotada • Redação IA</span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                Limite Diário de Redação Atingido (1/1)
              </h2>

              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                No plano gratuito, você conta com 1 correção oficial aprofundada por dia com critérios da banca, Versão Ouro e Parecer Linha a Linha.
              </p>
            </div>

            {/* Aviso de Preservação do Rascunho */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3 text-left">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-300">
                  Seu texto está 100% salvo e seguro!
                </p>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Seu rascunho com{" "}
                  <span className="text-white font-mono font-bold">
                    {lineCount > 0 ? `${lineCount} linhas` : "seu texto"}
                  </span>
                  {wordCount > 0 ? ` (${wordCount} palavras)` : ""} não será perdido.
                </p>
              </div>
            </div>

            {/* Botões de Ação Principais */}
            <div className="space-y-2.5 pt-1 relative z-10">
              {/* Opção 1: Assistir Vídeo (+1 Correção Bônus) */}
              <button
                type="button"
                onClick={() => setIsRewardedAdOpen(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <Gift size={16} className="text-white group-hover:scale-110 transition-transform" />
                <span>🎬 Assistir Vídeo (+1 Correção Bônus)</span>
              </button>

              {/* Opção 2: Desbloquear Synapse Pro (Ilimitado) */}
              <Link
                href="/pricing"
                onClick={onClose}
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-violet-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <Crown size={16} className="fill-amber-300 text-amber-300 group-hover:scale-110 transition-transform" />
                <span>👑 Desbloquear Synapse Pro (Ilimitado)</span>
              </Link>

              {/* Botão de Fechar / Continuar Editando */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-800 transition-all cursor-pointer mt-1"
              >
                Continuar Editando Rascunho
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Modal de Vídeo Recompensado */}
      <RewardedAdModal
        isOpen={isRewardedAdOpen}
        onClose={() => setIsRewardedAdOpen(false)}
        onRewardClaimed={() => {
          triggerAiQuotaRefresh();
          setIsRewardedAdOpen(false);
          if (onRewardClaimed) {
            onRewardClaimed();
          }
          onClose();
        }}
        feature="ESSAY"
      />
    </>,
    document.body,
  );
}
