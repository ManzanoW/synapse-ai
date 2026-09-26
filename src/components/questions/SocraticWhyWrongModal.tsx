// src/components/questions/SocraticWhyWrongModal.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Target,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { AlternativeExplanation } from "@/actions/socratic-actions";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface SocraticWhyWrongModalProps {
  isOpen: boolean;
  onClose: () => void;
  optionId: string;
  optionText: string;
  explanation: AlternativeExplanation | null;
  isLoading: boolean;
}

export function SocraticWhyWrongModal({
  isOpen,
  onClose,
  optionId,
  optionText,
  explanation,
  isLoading,
}: SocraticWhyWrongModalProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const toggleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if (!explanation) return;

    const textToSpeak = `Dissecação da alternativa ${optionId}. ${
      explanation.isCorrect
        ? "Esta é a alternativa correta."
        : "Esta é uma alternativa incorreta."
    } Análise da Banca: ${explanation.trapAnalysis}. Detalhe Crítico: ${
      explanation.criticalDetail
    }. Dica de Memorização: ${explanation.mnemonicTip}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "pt-BR";
    utterance.rate = 1.05;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    triggerHaptic("light");
    window.speechSynthesis.speak(utterance);
  };

  const handleClose = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 font-sans">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#07090e] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden z-10 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Dissecação da Alternativa ({optionId})</span>
                    {explanation && (
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          explanation.isCorrect
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {explanation.isCorrect ? "Gabarito Correto" : "Distrator / Incorreta"}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Análise cirúrgica da pegadinha elaborada pela banca
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {explanation && (
                  <button
                    type="button"
                    onClick={toggleSpeak}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      isPlayingAudio
                        ? "bg-indigo-600 text-white animate-pulse"
                        : "text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                    title={isPlayingAudio ? "Pausar áudio" : "Ouvir explicação com IA"}
                  >
                    {isPlayingAudio ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Texto da assertiva */}
            <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
              &quot;{optionText}&quot;
            </div>

            {/* Conteúdo da IA */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <div className="relative">
                  <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <Sparkles size={16} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Desmontando a pegadinha da banca...
                </p>
                <span className="text-[11px] text-slate-400">
                  Consultando base doutrinária e jurisprudencial
                </span>
              </div>
            ) : explanation ? (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {/* 1. Armadilha da Banca */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-100 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>A Pegadinha / Engenharia do Examinador</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {explanation.trapAnalysis}
                  </p>
                </div>

                {/* 2. Ponto Crítico */}
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-950 dark:text-indigo-100 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    <Target size={14} className="shrink-0" />
                    <span>Palavra-Chave / Detalhe Decisivo</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {explanation.criticalDetail}
                  </p>
                </div>

                {/* 3. Dica Mnemônica */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-100 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    <Lightbulb size={14} className="shrink-0" />
                    <span>Dica Prática para Nunca Mais Errar</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {explanation.mnemonicTip}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Rodapé */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
              >
                Entendi, Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
