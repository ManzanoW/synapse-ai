"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { Sparkles, Brain, Cpu, CheckCircle2, AlertCircle, Crown, Gift, ArrowRight, X } from "lucide-react";
import { RewardedAdModal } from "@/components/quota/RewardedAdModal";
import { triggerAiQuotaRefresh } from "@/lib/quota-events";

export interface SimuladoGenerationModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  banca?: string;
  materia?: string;
  qtdQuestoes?: number | string;
  error?: string | null;
  onComplete?: () => void;
  onClose?: () => void;
  onRewardedBonusEarned?: () => void;
}


interface StepPhase {
  min: number;
  max: number;
  text: string;
  subtext: string;
}

const PHASES: StepPhase[] = [
  {
    min: 0,
    max: 25,
    text: "Indexando diretrizes do edital e perfil da banca...",
    subtext: "Mapeando jurisprudência, incidência de tópicos e estilo de cobrança.",
  },
  {
    min: 25,
    max: 55,
    text: "Sintetizando questões contextuais e distratores...",
    subtext: "Elaborando enunciados aprofundados e calibrando alternativas plausíveis.",
  },
  {
    min: 55,
    max: 85,
    text: "Calibrando justificativas e gabaritos comentados...",
    subtext: "Validando resolução matemática, embasamento legal e cards de Active Recall.",
  },
  {
    min: 85,
    max: 100,
    text: "Finalizando montagem do caderno de prova...",
    subtext: "Consolidando lotes paralelos e organizando o simulado inédito.",
  },
];

export function SimuladoGenerationModal({
  isOpen,
  isGenerating,
  banca = "Banca",
  materia = "Geral",
  qtdQuestoes = 5,
  error = null,
  onComplete,
  onClose,
  onRewardedBonusEarned,
}: SimuladoGenerationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isRewardedModalOpen, setIsRewardedModalOpen] = useState(false);
  const [targetProgress, setTargetProgress] = useState(0);
  const [hasTriggeredComplete, setHasTriggeredComplete] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasTriggeredRef = useRef(false);

  const triggerCompletion = () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    setHasTriggeredComplete(true);
    onCompleteRef.current?.();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mola para animação suave do percentual (spring physics)
  const springProgress = useSpring(0, {
    stiffness: 70,
    damping: 18,
    mass: 0.8,
  });

  const [displayValue, setDisplayValue] = useState(0);

  // Sincroniza o valor arredondado da mola com o display
  useEffect(() => {
    const unsubscribe = springProgress.on("change", (latest) => {
      setDisplayValue(Math.min(100, Math.max(0, Math.round(latest))));
    });
    return () => unsubscribe();
  }, [springProgress]);

  // Efeito de progressão temporal adaptativa durante a geração
  useEffect(() => {
    if (!isOpen) {
      setTargetProgress(0);
      springProgress.set(0);
      hasTriggeredRef.current = false;
      setHasTriggeredComplete(false);
      return;
    }

    if (error) {
      return;
    }

    let intervalId: NodeJS.Timeout;

    if (isGenerating) {
      hasTriggeredRef.current = false;
      setHasTriggeredComplete(false);
      // Inicia progressão suave até ~90% enquanto aguarda a API
      intervalId = setInterval(() => {
        setTargetProgress((current) => {
          if (current < 25) {
            return current + 3.5;
          } else if (current < 55) {
            return current + 2.2;
          } else if (current < 85) {
            return current + 1.4;
          } else if (current < 92) {
            return current + 0.5;
          }
          return current;
        });
      }, 150);
    } else {
      // Concluiu: pula direto para 100%
      setTargetProgress(100);
      springProgress.set(100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, isGenerating, error, springProgress]);

  // Atualiza a mola quando o targetProgress mudar
  useEffect(() => {
    springProgress.set(targetProgress);
  }, [targetProgress, springProgress]);

  // Quando a geração termina com sucesso, agenda a transição sem depender de displayValue (evita cancelamento da mola)
  useEffect(() => {
    if (!isOpen || isGenerating || error || hasTriggeredRef.current) {
      return;
    }

    setTargetProgress(100);
    springProgress.set(100);

    const timer = setTimeout(() => {
      triggerCompletion();
    }, 600);

    return () => clearTimeout(timer);
  }, [isOpen, isGenerating, error, springProgress]);

  // Se o display atingir 100% e a geração já concluiu, garante o avanço imediato
  useEffect(() => {
    if (isOpen && !isGenerating && !error && displayValue >= 100 && !hasTriggeredRef.current) {
      const immediateTimer = setTimeout(() => {
        triggerCompletion();
      }, 350);
      return () => clearTimeout(immediateTimer);
    }
  }, [isOpen, isGenerating, error, displayValue]);

  // Determina a etapa textual atual com base no progresso visual
  const currentPhase = useMemo(() => {
    const val = displayValue;
    return (
      PHASES.find((p) => val >= p.min && val <= p.max) ||
      PHASES[PHASES.length - 1]
    );
  }, [displayValue]);

  if (!isOpen || !mounted) return null;

  const isQuotaError = Boolean(
    error &&
      (error.toLowerCase().includes("limite") ||
        error.toLowerCase().includes("cota") ||
        error.toLowerCase().includes("premium") ||
        error.includes("429")),
  );

  return createPortal(
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">

        {/* Glows ambientais sutis */}
        <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-28 left-1/2 -translate-x-1/2 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl" />

        {/* Card Principal Glassmorphism Dark Futurista */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-black/85 backdrop-blur-md border border-violet-500/20 rounded-2xl p-6 sm:p-8 max-w-lg w-full relative overflow-hidden shadow-2xl shadow-violet-950/40 text-center space-y-6"
        >
          {/* Botão Fechar (X) - garante que o usuário nunca fique preso */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-30 cursor-pointer"
              title="Fechar"
              aria-label="Fechar modal de geração"
            >
              <X size={18} />
            </button>
          )}

          {/* Header com badge de contexto */}
          <div className="space-y-2 relative z-10">
            {error ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold tracking-wider uppercase">
                <Crown size={13} className="text-amber-400" />
                <span>
                  {error.toLowerCase().includes("cota") ||
                  error.toLowerCase().includes("limite")
                    ? "Cota Diária Esgotada"
                    : "Falha na Geração"}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[11px] font-bold tracking-wider uppercase">
                <Sparkles size={13} className="text-violet-400 animate-spin" />
                <span>Geração Cognitiva Paralela</span>
              </div>
            )}

            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
              {error
                ? error.toLowerCase().includes("cota") ||
                  error.toLowerCase().includes("limite")
                  ? "Limite Diário de Simulados Atingido"
                  : "Não Foi Possível Gerar o Simulado"
                : "Sintetizando Simulado com IA"}
            </h2>

            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {banca} • {materia} •{" "}
              <span className="text-violet-300 font-semibold font-mono">
                {qtdQuestoes} Questões
              </span>
            </p>
          </div>

          {/* ========================================================== */}
          {/* EFEITO VISUAL CENTRAL: PULSO / REDE NEURAL OU COROA DE ERRO */}
          {/* ========================================================== */}
          <div className="relative py-3 flex items-center justify-center">
            {error ? (
              <div className="w-20 h-20 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center relative shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                {error.toLowerCase().includes("cota") ||
                error.toLowerCase().includes("limite") ||
                error.toLowerCase().includes("premium") ? (
                  <Crown size={36} className="text-amber-400 fill-amber-400/20 animate-pulse" />
                ) : (
                  <AlertCircle size={36} className="text-rose-400" />
                )}
              </div>
            ) : (
              <>
                {/* Anel exterior giratório tracejado */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-violet-500/20 border-dashed absolute"
                />

                {/* Anel intermediário pulsante com nós de sinapse */}
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.35, 0.7, 0.35],
                  }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-violet-500/40 absolute shadow-[0_0_25px_rgba(139,92,246,0.25)]"
                />

                {/* Pulso interno com nós sinápticos */}
                <motion.div
                  animate={{
                    scale: [0.95, 1.05, 0.95],
                  }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-linear-to-tr from-violet-600/30 via-fuchsia-500/20 to-indigo-600/30 border border-violet-400/50 flex items-center justify-center relative shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                >
                  {displayValue >= 98 && !isGenerating ? (
                    <CheckCircle2 size={28} className="text-emerald-400 animate-bounce" />
                  ) : (
                    <Brain size={26} className="text-violet-300 animate-pulse" />
                  )}

                  {/* Ponto orbital neural */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 flex items-start justify-center pointer-events-none"
                  >
                    <div className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_8px_#e879f9] -mt-1" />
                  </motion.div>
                </motion.div>
              </>
            )}
          </div>

          {/* ========================================================== */}
          {/* BARRA DE PROGRESSO (APENAS QUANDO GERANDO) OU CAIXA DE ERRO */}
          {/* ========================================================== */}
          {!error ? (
            <div className="space-y-3 relative z-10">
              {/* Header da Barra: Etapa atual e Porcentagem */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Cpu size={12} className="text-violet-400" />
                  <span>Status da Matriz</span>
                </span>
                <span className="text-sm font-black text-transparent bg-clip-text bg-linear-to-r from-violet-300 via-fuchsia-300 to-indigo-200">
                  {displayValue}%
                </span>
              </div>

              {/* Trilho da Barra com Gradiente Neon e Glow */}
              <div className="w-full bg-slate-900/90 rounded-full h-2.5 p-0.5 overflow-hidden border border-violet-500/30 shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-violet-600 via-fuchsia-500 to-indigo-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  style={{ width: `${displayValue}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-center space-y-2 relative z-10">
              <p className="text-xs font-semibold text-amber-200 leading-relaxed">
                {error}
              </p>
              <p className="text-[11px] text-slate-400">
                No plano gratuito você conta com 2 simulados diários completos que renovam todo dia à meia-noite (Brasília).
              </p>
            </div>
          )}

          {/* ========================================================== */}
          {/* INDICADOR DINÂMICO DE ETAPAS TEXTUAIS COM TRANSIÇÃO SUAVE  */}
          {/* ========================================================== */}
          {!error && (
            <div className="min-h-[58px] flex flex-col items-center justify-center relative z-10 px-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhase.text}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="space-y-1 text-center"
                >
                  <p className="text-xs font-bold text-violet-200 leading-snug tracking-wide">
                    {currentPhase.text}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">
                    {currentPhase.subtext}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Botão de ação imediata ao concluir */}
          {!error && !isGenerating && (
            <div className="pt-1 flex justify-center relative z-10 animate-in fade-in duration-300">
              <button
                type="button"
                onClick={() => triggerCompletion()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-950/60 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Acessar Simulado Agora</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Ação de cancelamento ou CTA de upgrade em caso de erro */}
          {error && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full relative z-10">
              {isQuotaError ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsRewardedModalOpen(true)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-black rounded-xl shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <Gift
                      size={15}
                      className="text-white group-hover:scale-110 transition-transform"
                    />
                    <span>Assistir Vídeo (+1 Simulado)</span>
                  </button>

                  <Link
                    href="/pricing"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white text-xs font-black rounded-xl shadow-lg shadow-violet-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <Crown
                      size={14}
                      className="fill-amber-300 text-amber-300 group-hover:scale-110 transition-transform"
                    />
                    <span>Virar Pro (Ilimitado)</span>
                  </Link>
                </>
              ) : null}

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-800 transition-all cursor-pointer"
                >
                  Entendido
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>

    <RewardedAdModal
      isOpen={isRewardedModalOpen}
      onClose={() => setIsRewardedModalOpen(false)}
      onRewardClaimed={() => {
        triggerAiQuotaRefresh();
        setIsRewardedModalOpen(false);
        if (onRewardedBonusEarned) {
          onRewardedBonusEarned();
        }
        if (onClose) {
          onClose();
        }
      }}
      feature="SIMULADO"
    />
  </>,
  document.body,
);
}
