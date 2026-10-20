"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  BatteryLow,
  Crown,
  X,
  BookOpen,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { RewardedAdModal } from "@/components/quota/RewardedAdModal";
import {
  AI_EXHAUSTION_TRIGGERED_EVENT,
  triggerAiQuotaRefresh,
  type ExhaustionDetail,
} from "@/lib/quota-events";
import { getAiQuotaStatusAction } from "@/actions/quota-actions";
import { useMidnightCountdown } from "@/lib/countdown-service";
import type { UserQuotaStatus, AiFeatureType } from "@/types/quota";

export interface SynapticExhaustionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  feature?: string;
  reason?: string;
}

export function SynapticExhaustionModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  feature: controlledFeature,
  reason: controlledReason,
}: SynapticExhaustionModalProps = {}) {
  const [mounted, setMounted] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [exhaustionData, setExhaustionData] = useState<ExhaustionDetail>({});
  const [quota, setQuota] = useState<UserQuotaStatus | null>(null);
  const [isRewardedAdOpen, setIsRewardedAdOpen] = useState(false);
  const countdown = useMidnightCountdown();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escuta o evento global do navegador para abrir a modal de qualquer tela
  useEffect(() => {
    const handleExhaustion = (e: Event) => {
      const customEvent = e as CustomEvent<ExhaustionDetail>;
      setExhaustionData(customEvent.detail || {});
      setInternalOpen(true);
    };

    window.addEventListener(AI_EXHAUSTION_TRIGGERED_EVENT, handleExhaustion);
    return () => {
      window.removeEventListener(AI_EXHAUSTION_TRIGGERED_EVENT, handleExhaustion);
    };
  }, []);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const handleClose = useCallback(() => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  }, [controlledOnClose]);

  // Sincroniza quota ao abrir
  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;
    getAiQuotaStatusAction()
      .then((res) => {
        if (!isCurrent) return;
        if (res.success && res.data) {
          setQuota(res.data);
        }
      })
      .catch((err) => {
        console.warn("[SynapticExhaustionModal] Erro ao sincronizar cota:", err);
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const currentFeature = (controlledFeature || exhaustionData.feature || "SIMULADO") as AiFeatureType;
  const currentReason = controlledReason || exhaustionData.reason;

  return createPortal(
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-[#060913]/95 border border-cyan-500/30 dark:border-white/10 rounded-3xl p-5 sm:p-6 max-w-lg w-full relative overflow-hidden shadow-2xl shadow-indigo-950/80 backdrop-blur-2xl text-center space-y-4 max-h-[92vh] overflow-y-auto"
          >
            {/* Botão Fechar */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-20"
              title="Fechar"
            >
              <X size={16} />
            </button>

            {/* Cabeçalho */}
            <div className="flex flex-col items-center gap-2 pt-1 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10.5px] font-bold tracking-wider uppercase mb-1">
                <BatteryLow size={13} className="text-cyan-400" />
                <span>Limite Gratuito do Dia</span>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-violet-500/10 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                <Zap className="w-6 h-6 text-cyan-400 fill-cyan-400/20" />
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                  Você usou suas 10 ajudas com IA de hoje
                </h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1.5 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Clock size={12} className="text-cyan-400 animate-pulse" />
                  <span>Renovação das 10 ajudas gratuitas em: {countdown.formatted}</span>
                </div>
              </div>
            </div>

            {/* Contexto e Mensagem Humanizada */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900/40 border border-cyan-500/25 text-left relative z-10 space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
                <ShieldCheck size={14} className="text-cyan-400 shrink-0" />
                <span>Você ainda pode continuar estudando sem limites!</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                As explicações inteligentes possuem um limite diário na versão gratuita. Enquanto elas recarregam, você pode continuar resolvendo questões, revisando seus cartões e marcando o edital à vontade:
              </p>
              {currentReason && (
                <p className="text-[11px] text-cyan-400/80 font-mono pt-1">
                  Aviso: {currentReason}
                </p>
              )}
            </div>

            {/* Recomendações de Estudo Sem Consumo de IA (Livre) */}
            <div className="space-y-2 text-left relative z-10">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-1">
                <span>Continue Estudando Sem Gastar IA:</span>
                <span className="text-emerald-400 font-mono text-[10px]">100% Ilimitado</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Link
                  href="/flashcards"
                  onClick={handleClose}
                  className="p-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      <BookOpen size={13} className="text-cyan-400" />
                      <span>Cartões de Memória</span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-tight">
                      Revise o quanto quiser sem gastar créditos.
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[9.5px] font-bold text-cyan-400 font-mono">
                    <span>Revisar</span>
                    <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <Link
                  href="/questions?mode=offline"
                  onClick={handleClose}
                  className="p-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                      <ShieldCheck size={13} className="text-emerald-400" />
                      <span>Fazer Questões</span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-tight">
                      Resolva questões com gabarito sem limites.
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[9.5px] font-bold text-emerald-400 font-mono">
                    <span>Praticar</span>
                    <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <Link
                  href="/edital"
                  onClick={handleClose}
                  className="p-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-white/5 hover:border-indigo-500/30 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                      <Compass size={13} className="text-indigo-400" />
                      <span>Edital da Prova</span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-tight">
                      Acompanhe seu percentual de estudo.
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[9.5px] font-bold text-indigo-400 font-mono">
                    <span>Progresso</span>
                    <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Ações de Recarga e Conversão Pro */}
            <div className="space-y-2 pt-1 relative z-10">
              {/* Botão Secundário: Assistir Vídeo Rápido */}
              <button
                type="button"
                onClick={() => setIsRewardedAdOpen(true)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 hover:from-amber-500/25 hover:to-amber-400/25 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-[0_0_20px_rgba(251,191,36,0.15)] hover:shadow-[0_0_25px_rgba(251,191,36,0.3)] active:scale-98"
              >
                <Zap size={14} className="text-amber-400 fill-amber-400/30 group-hover:scale-110 transition-transform" />
                <span>🎬 Assistir Vídeo Rápido (+1 Ajuda com IA Agora)</span>
              </button>

              {/* Botão Primário Pro: Conhecer o Plano Pro */}
              <Link
                href="/pricing"
                onClick={handleClose}
                className="w-full py-3 px-4 rounded-xl text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/60 transition-all cursor-pointer group bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 border border-violet-400/30 hover:border-violet-300/50 active:scale-98"
              >
                <Crown
                  size={15}
                  className="text-amber-300 fill-amber-300/30 group-hover:scale-110 transition-transform"
                />
                <span>👑 Desbloquear Synapse Pro (60 Ajudas com IA por dia + Sem Espera)</span>
              </Link>

              {/* Botão de descanso voluntário */}
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Entendi, vou continuar estudando ou descansar por hoje ✨
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      <RewardedAdModal
        isOpen={isRewardedAdOpen}
        onClose={() => setIsRewardedAdOpen(false)}
        onRewardClaimed={() => {
          triggerAiQuotaRefresh();
          setIsRewardedAdOpen(false);
          handleClose();
        }}
        feature={currentFeature}
      />
    </>,
    document.body,
  );
}
