"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, AlertCircle, Eye, Clock, ArrowRight } from "lucide-react";
import { ErrorClassification } from "@/types/quiz";

interface ErrorDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReason: (reason: ErrorClassification) => void;
  questionTitle?: string;
}

const ERROR_REASONS: {
  key: ErrorClassification;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    key: "THEORY_GAP",
    label: "Lacuna Teórica",
    desc: "Não conhecia ou esqueci o conceito teórico da matéria.",
    icon: Brain,
    color: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  },
  {
    key: "ATTENTION_LAPSE",
    label: "Falta de Atenção",
    desc: "Sabia a teoria, mas caí em pegadinha ou li com pressa.",
    icon: Eye,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  {
    key: "MISINTERPRETATION",
    label: "Erro de Interpretação",
    desc: "Interpretei errado o enunciado ou o comando da questão.",
    icon: AlertCircle,
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  },
  {
    key: "TIME_PRESSURE",
    label: "Pressão de Tempo",
    desc: "Faltou tempo para calcular ou analisar as opções com calma.",
    icon: Clock,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
];

export function ErrorDiagnosisModal({
  isOpen,
  onClose,
  onSelectReason,
  questionTitle,
}: ErrorDiagnosisModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#070b14] p-6 shadow-2xl backdrop-blur-2xl"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-rose-500/50 to-transparent" />

          <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <AlertCircle size={14} /> Diagnóstico de Erro Inteligente
          </div>

          <h3 className="text-lg font-black text-white">
            Por que você errou esta questão?
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
            Classificar o motivo do erro permite calibrar o rebalanceador adaptativo e criar flashcards específicos para fixação.
          </p>

          <div className="space-y-2.5">
            {ERROR_REASONS.map((reason) => {
              const Icon = reason.icon;
              return (
                <button
                  key={reason.key}
                  onClick={() => {
                    onSelectReason(reason.key);
                    onClose();
                  }}
                  className="cursor-pointer w-full flex items-center justify-between p-3.5 rounded-2xl border border-white/5 bg-slate-950/60 hover:bg-slate-900/60 hover:border-white/15 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${reason.color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                        {reason.label}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {reason.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={15}
                    className="text-slate-600 group-hover:text-white transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={() => {
                onSelectReason("UNCLASSIFIED");
                onClose();
              }}
              className="cursor-pointer text-xs font-mono text-slate-500 hover:text-slate-300 py-1.5 px-3"
            >
              Pular diagnóstico
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
