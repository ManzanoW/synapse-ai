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
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  claimRewardedAdBonusAction,
  getAiQuotaStatusAction,
} from "@/actions/quota-actions";
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
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [bonusEarnedToday, setBonusEarnedToday] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_AD_SECONDS);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Verificação prévia de cota: NUNCA inicia o vídeo se o limite diário de 2/2 já foi atingido
  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;
    setIsCheckingQuota(true);
    setIsLimitReached(false);
    setBonusEarnedToday(0);
    setSecondsLeft(TOTAL_AD_SECONDS);
    setIsCompleted(false);
    setIsClaiming(false);
    setClaimSuccess(false);
    setErrorMessage(null);

    getAiQuotaStatusAction()
      .then((res) => {
        if (!isCurrent) return;
        if (res.success && res.data) {
          const featureBonus = res.data.features?.[feature]?.bonusEarned ?? 0;
          setBonusEarnedToday(featureBonus);

          // Se já atingiu 2 bônus hoje ou se a flag geral canWatchRewardedAd é falsa
          if (featureBonus >= 2 || !res.data.canWatchRewardedAd) {
            setIsLimitReached(true);
          } else {
            setIsLimitReached(false);
          }
        }
      })
      .catch((err) => {
        console.error("[RewardedAdModal] Erro ao verificar status de cota:", err);
      })
      .finally(() => {
        if (isCurrent) {
          setIsCheckingQuota(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, feature]);

  // Contagem regressiva para indicação visual no header (apenas se liberado e anúncio em exibição)
  useEffect(() => {
    if (!isOpen || isCheckingQuota || isLimitReached || isCompleted) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isCheckingQuota, isLimitReached, isCompleted]);

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
          {/* Header do Modal */}
          <div className="px-4 py-3 bg-slate-900/80 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Gift size={11} className="text-amber-400" />
                {isLimitReached
                  ? "Limite Atingido (2/2)"
                  : `Vídeo ${bonusEarnedToday + 1} de 2 hoje`}
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                • {isLimitReached ? "Recompensas Diárias" : FEATURE_REWARD_LABELS[feature]?.cta || "+1 Bônus"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isCheckingQuota ? (
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin text-violet-400" />
                  Verificando...
                </span>
              ) : isLimitReached ? (
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <Clock size={13} />
                  Esgotado hoje
                </span>
              ) : errorMessage ? (
                <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                  <AlertCircle size={13} />
                  Erro
                </span>
              ) : isCompleted ? (
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
                title="Fechar"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Conteúdo do Modal: Três Cenários */}
          {isCheckingQuota ? (
            /* Cenário 1: Checagem Rápida de Cota */
            <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-950/40">
                <Loader2 size={24} className="text-violet-400 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-200">
                  Verificando disponibilidade de bônus...
                </p>
                <p className="text-xs text-slate-400">
                  Consultando cota diária de recompensas por vídeo.
                </p>
              </div>
            </div>
          ) : isLimitReached ? (
            /* Cenário 2: Limite Diário Atingido Upfront (Sem reproduzir anúncio, sem frustração) */
            <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-xl shadow-amber-950/40">
                  <Clock size={32} className="text-amber-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black text-[11px] font-black flex items-center justify-center border-2 border-[#070b14]">
                  2
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider">
                  <Gift size={12} className="text-amber-400" />
                  Limite Diário Atingido (2 de 2)
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Você já utilizou os vídeos bônus de hoje
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                  O limite diário é de <strong>2 vídeos patrocinados por dia</strong> e se renova todos os dias à meia-noite (horário de Brasília).
                </p>
              </div>

              {/* Resumo do status dos vídeos de hoje */}
              <div className="w-full max-w-sm grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-left">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400">1º Vídeo</p>
                    <p className="text-[11px] font-semibold text-emerald-300">Utilizado hoje</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400">2º Vídeo</p>
                    <p className="text-[11px] font-semibold text-emerald-300">Utilizado hoje</p>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="w-full space-y-2.5 pt-2">
                <Link
                  href="/pricing"
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-950/60 transition-all cursor-pointer group"
                >
                  <Crown size={15} className="fill-amber-300 text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>Assinar Synapse Pro (IA Ilimitada sem Anúncios)</span>
                  <ArrowRight size={13} />
                </Link>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 transition-all cursor-pointer"
                >
                  Entendido, fechar
                </button>
              </div>
            </div>
          ) : (
            /* Cenário 3: Usuário Elegível (0/2 ou 1/2) - Exibe Player e Barra */
            <>
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
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
