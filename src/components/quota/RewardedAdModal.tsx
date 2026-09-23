"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  X,
  Gift,
  Crown,
  Zap,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Loader2,
} from "lucide-react";
import { claimRewardedAdBonusAction } from "@/actions/quota-actions";
import { triggerAiQuotaRefresh } from "@/lib/quota-events";
import Link from "next/link";

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: () => void;
  feature?: "SIMULADO" | "ESSAY" | "FLASHCARD" | "MINDMAP" | "REMEDIATION" | "EDITAL";
}

const TOTAL_AD_SECONDS = 15;

const SPONSOR_TIPS = [
  "Dica Synapse: Ciclos de estudo de 25 minutos aumentam a retenção em 60%.",
  "A repetição espaçada (SRS) ativa a memória de longo prazo antes da curva de esquecimento.",
  "Simulados com IA adaptam-se aos seus pontos fracos para acelerar sua aprovação.",
  "Estudantes que revisam erros nas primeiras 24h têm 3x mais probabilidade de gabaritar.",
];

export function RewardedAdModal({
  isOpen,
  onClose,
  onRewardClaimed,
  feature = "SIMULADO",
}: RewardedAdModalProps) {
  const [mounted, setMounted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_AD_SECONDS);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
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
      setIsPlaying(true);
      setIsCompleted(false);
      setIsClaiming(false);
      setClaimSuccess(false);
      setErrorMessage(null);
      setTipIndex(0);
    }
  }, [isOpen]);

  // Rotaciona dicas a cada 4 segundos
  useEffect(() => {
    if (!isOpen || isCompleted) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % SPONSOR_TIPS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isOpen, isCompleted]);

  // Timer regressivo do vídeo
  useEffect(() => {
    if (!isOpen || !isPlaying || isCompleted) return;

    if (secondsLeft <= 0) {
      setIsCompleted(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, isCompleted, secondsLeft]);

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

              {/* Botão de Fechar só habilitado se completou ou se quiser desistir */}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Fechar anúncio"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Área de Visualização do Vídeo Patrocinado / Apresentação Tecnológica */}
          <div className="relative aspect-video bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden select-none">
            {/* Efeito de grade sutil animada de fundo */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

            {/* Pulso dinâmico de IA */}
            <motion.div
              animate={{
                scale: isPlaying ? [1, 1.06, 1] : 1,
                opacity: isPlaying ? [0.4, 0.7, 0.4] : 0.3,
              }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-violet-600/20 via-indigo-500/20 to-amber-500/20 blur-2xl pointer-events-none"
            />

            {!isCompleted ? (
              <div className="relative z-10 space-y-4 max-w-sm">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-amber-500/30 border border-violet-400/30 flex items-center justify-center mx-auto shadow-lg shadow-violet-950/60">
                  <BrainCircuit size={28} className="text-violet-300 animate-pulse" />
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                    Synapse AI • Neuro-Aprendizado
                  </h3>
                  <p className="text-[11px] text-violet-300/80 font-mono mt-0.5">
                    Patrocinado • Dicas de Alta Performance
                  </p>
                </div>

                <div className="min-h-[44px] flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900/60 border border-white/5 backdrop-blur-xs">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={tipIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.25 }}
                      className="text-xs text-slate-300 font-medium leading-relaxed italic"
                    >
                      &ldquo;{SPONSOR_TIPS[tipIndex]}&rdquo;
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 space-y-3 max-w-sm"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Vídeo Concluído!
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Você assistiu ao conteúdo patrocinado. Seu +1 Simulado Bônus está pronto para ser resgatado.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Controles de Play/Pause e Áudio flutuantes */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white/90 border border-white/10 transition-colors"
                  title={isPlaying ? "Pausar" : "Reproduzir"}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white/90 border border-white/10 transition-colors"
                  title={isMuted ? "Ativar som" : "Desativar som"}
                >
                  {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
              </div>

              <div className="text-[10px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                00:{String(TOTAL_AD_SECONDS - secondsLeft).padStart(2, "0")} / 00:{TOTAL_AD_SECONDS}
              </div>
            </div>
          </div>

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
                <span>+1 Simulado Bônus Adicionado! Carregando...</span>
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
                    <span>Resgatar +1 Simulado Bônus Agora 🎉</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full py-3 px-4 rounded-xl bg-slate-800/80 border border-white/5 text-slate-400 font-medium text-xs flex items-center justify-center gap-2 select-none">
                <span>Aguarde {secondsLeft}s para desbloquear seu simulado bônus</span>
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
