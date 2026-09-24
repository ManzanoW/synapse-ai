"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  X,
  Gift,
  Crown,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { claimRewardedAdBonusAction } from "@/actions/quota-actions";
import { triggerAiQuotaRefresh } from "@/lib/quota-events";
import type { AiFeatureType } from "@/types/quota";
import { RewardedAdPlayer } from "@/components/ads/RewardedAdPlayer";
import Link from "next/link";

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: () => void;
  feature?: AiFeatureType;
}

const TOTAL_AD_SECONDS = 15;

const FEATURE_REWARD_LABELS: Record<AiFeatureType, { single: string; cta: string }> = {
  SIMULADO: { single: "Simulado", cta: "+1 Simulado Bônus" },
  ESSAY: { single: "Correção de Redação", cta: "+1 Envio de Redação" },
  OCR_ESSAY: { single: "Leitura de Foto da Folha", cta: "+1 Leitura de Redação Manuscrita" },
  REMEDIATION: { single: "Remediação de Erro", cta: "+1 Remediação Cognitiva" },
  MINDMAP: { single: "Mapa Mental com IA", cta: "+1 Mapa Mental" },
  FLASHCARD: { single: "Geração de Flashcards", cta: "+1 Geração de Flashcards" },
  EDITAL: { single: "Importação de Edital", cta: "+1 Análise de Edital" },
  OCR_QUESTION: { single: "Scanner de Questões", cta: "+1 Leitura de Questão OCR" },
};

export function RewardedAdModal({
  isOpen,
  onClose,
  onRewardClaimed,
  feature = "SIMULADO",
}: RewardedAdModalProps) {
  const [mounted, setMounted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_AD_SECONDS);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reseta estado quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(TOTAL_AD_SECONDS);
      setIsCompleted(false);
      setIsClaiming(false);
      setClaimSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Contagem regressiva para indicação visual no header
  useEffect(() => {
    if (!isOpen || isCompleted) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isCompleted]);

  // Ação de reivindicar recompensa
  const handleClaim = async () => {
    if (isClaiming || claimSuccess) return;
    setIsClaiming(true);
    setErrorMessage(null);

    try {
      const res = await claimRewardedAdBonusAction(feature);
      if (res.success) {
        setClaimSuccess(true);
        triggerAiQuotaRefresh();
        setTimeout(() => {
          onRewardClaimed();
          onClose();
        }, 1200);
      } else {
        setErrorMessage(
          res.message || "Não foi possível liberar o bônus no momento.",
        );
      }
    } catch {
      setErrorMessage("Erro de conexão ao creditar bônus.");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const progressPercent = Math.min(
    100,
    Math.round(((TOTAL_AD_SECONDS - secondsLeft) / TOTAL_AD_SECONDS) * 100),
  );

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="bg-[#070b14] border border-violet-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-violet-950/50 flex flex-col relative"
        >
          {/* Header do Player Patrocinado */}
          <div className="px-4 py-3 bg-slate-900/80 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Gift size={11} className="text-amber-400" />
                Vídeo Recompensado
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                • Ganhe +1 Simulado
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isCompleted ? (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Bônus Liberado!
                </span>
              ) : (
                <span className="text-[11px] font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                  {secondsLeft}s restantes
                </span>
              )}

              {/* Botão de Fechar */}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Fechar anúncio"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Player Modular (Google IMA / Vídeo Customizado / Dicas Patrocinadas) */}
          <RewardedAdPlayer
            onCompleted={() => {
              setIsCompleted(true);
              setSecondsLeft(0);
            }}
            isCompleted={isCompleted}
            featureLabel={FEATURE_REWARD_LABELS[feature]?.single || "Recurso"}
          />

          {/* Barra de Progresso do Anúncio */}
          <div className="h-1.5 w-full bg-slate-950 overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
              style={{ width: `${progressPercent}%` }}
              transition={{ ease: "linear" }}
            />
          </div>

          {/* Rodapé com CTA de Recompensa e Opção de Upgrade Pro */}
          <div className="p-4 sm:p-5 bg-slate-900/60 border-t border-white/5 space-y-3">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs text-center font-medium">
                {errorMessage}
              </div>
            )}

            {claimSuccess ? (
              <div className="w-full py-3 px-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 size={16} />
                <span>
                  {FEATURE_REWARD_LABELS[feature]?.cta || "+1 Bônus"} Adicionado! Carregando...
                </span>
              </div>
            ) : isCompleted ? (
              <button
                type="button"
                onClick={handleClaim}
                disabled={isClaiming}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer group disabled:opacity-50"
              >
                {isClaiming ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creditando Bônus...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-amber-300 group-hover:scale-110 transition-transform" />
                    <span>
                      Resgatar {FEATURE_REWARD_LABELS[feature]?.cta || "+1 Bônus"} Agora 🎉
                    </span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full py-3 px-4 rounded-xl bg-slate-800/80 border border-white/5 text-slate-400 font-medium text-xs flex items-center justify-center gap-2 select-none">
                <span>
                  Aguarde {secondsLeft}s para desbloquear{" "}
                  {FEATURE_REWARD_LABELS[feature]?.single.toLowerCase() || "seu bônus"}
                </span>
              </div>
            )}

            {/* Alternativa: Não quer ver anúncios? Assine o Pro */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-white/5 text-slate-400">
              <span className="text-[11px]">Cansado de esperar?</span>
              <Link
                href="/pricing"
                onClick={onClose}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors text-[11px]"
              >
                <Crown size={12} className="fill-amber-400/20" />
                <span>Assine o Synapse Pro para IA ilimitada sem anúncios</span>
                <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
