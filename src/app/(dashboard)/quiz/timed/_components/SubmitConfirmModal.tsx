"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Flag,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReviewPending: () => void;
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
  remainingSeconds: number;
  isTimeoutAutoSubmit?: boolean;
  isSubmitting?: boolean;
}

export function SubmitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  onReviewPending,
  totalQuestions,
  answeredCount,
  flaggedCount,
  remainingSeconds,
  isTimeoutAutoSubmit = false,
  isSubmitting = false,
}: SubmitConfirmModalProps) {
  if (!isOpen) return null;

  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const hasPending = unansweredCount > 0 || flaggedCount > 0;

  const minutesRemaining = Math.floor(remainingSeconds / 60);
  const secondsRemaining = remainingSeconds % 60;
  const timeFormatted = `${String(minutesRemaining).padStart(2, "0")}:${String(
    secondsRemaining
  ).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-linear-to-b from-[#0e1424] via-[#090d18] to-[#05070e] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
      >
        {/* Glow de fundo */}
        <div
          className={`pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl ${
            isTimeoutAutoSubmit
              ? "bg-rose-500/20"
              : hasPending
              ? "bg-amber-500/15"
              : "bg-violet-500/20"
          }`}
        />

        <div className="relative z-10 space-y-5">
          {/* CABEÇALHO DO MODAL */}
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl border shrink-0 ${
                isTimeoutAutoSubmit
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-rose-500/20"
                  : hasPending
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-amber-500/20"
                  : "bg-violet-500/15 border-violet-500/30 text-violet-400 shadow-violet-500/20"
              } shadow-lg`}
            >
              {isTimeoutAutoSubmit ? (
                <Clock size={28} className="animate-spin" />
              ) : hasPending ? (
                <AlertTriangle size={28} className="animate-pulse" />
              ) : (
                <CheckCircle2 size={28} />
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight text-white">
                {isTimeoutAutoSubmit
                  ? "Tempo Esgotado!"
                  : "Finalizar Simulado?"}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isTimeoutAutoSubmit
                  ? "O cronômetro chegou ao fim. Suas respostas registradas até o momento serão submetidas agora."
                  : "Revise a auditoria das suas respostas antes de encerrar e calcular a pontuação."}
              </p>
            </div>
          </div>

          {/* AUDITORIA DE STATUS */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Respondidas
              </span>
              <span className="text-lg font-black text-violet-300">
                {answeredCount} / {totalQuestions}
              </span>
            </div>

            <div
              className={`p-3 rounded-2xl border text-center ${
                unansweredCount > 0
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-white/5 border-white/10 text-slate-400"
              }`}
            >
              <span className="text-[10px] uppercase font-bold block">
                Em Branco
              </span>
              <span className="text-lg font-black">{unansweredCount}</span>
            </div>

            <div
              className={`p-3 rounded-2xl border text-center ${
                flaggedCount > 0
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-white/5 border-white/10 text-slate-400"
              }`}
            >
              <span className="text-[10px] uppercase font-bold block">
                Revisão
              </span>
              <span className="text-lg font-black">{flaggedCount}</span>
            </div>
          </div>

          {/* ALERTA DE PENDÊNCIAS SE HOUVER */}
          {!isTimeoutAutoSubmit && hasPending && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-bold">Atenção às questões pendentes:</p>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  Você ainda possui{" "}
                  {unansweredCount > 0 && (
                    <span className="font-bold underline">
                      {unansweredCount} questão(ões) em branco
                    </span>
                  )}
                  {unansweredCount > 0 && flaggedCount > 0 && " e "}
                  {flaggedCount > 0 && (
                    <span className="font-bold underline">
                      {flaggedCount} marcada(s) para revisão
                    </span>
                  )}
                  . Você ainda tem{" "}
                  <span className="font-mono font-bold text-white">
                    {timeFormatted}
                  </span>{" "}
                  para checar.
                </p>
              </div>
            </div>
          )}

          {/* BOTÕES DE AÇÃO */}
          <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-3">
            {!isTimeoutAutoSubmit && (
              <button
                onClick={hasPending ? onReviewPending : onClose}
                type="button"
                disabled={isSubmitting}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {hasPending ? (
                  <>
                    <RotateCcw size={14} />
                    <span>Revisar Pendentes</span>
                  </>
                ) : (
                  <span>Voltar à Prova</span>
                )}
              </button>
            )}

            <button
              onClick={onConfirm}
              type="button"
              disabled={isSubmitting}
              className={`w-full ${
                isTimeoutAutoSubmit ? "sm:w-full" : "sm:w-1/2"
              } py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 ${
                isTimeoutAutoSubmit
                  ? "bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30"
                  : "bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-600/30"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Computando Gabarito...</span>
                </>
              ) : (
                <>
                  <span>
                    {isTimeoutAutoSubmit
                      ? "Submeter Respostas"
                      : "Confirmar Submissão"}
                  </span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
