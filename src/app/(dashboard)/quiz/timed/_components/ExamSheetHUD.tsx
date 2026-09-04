"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Flag,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";

interface ExamSheetHUDProps {
  isOpen: boolean;
  onClose: () => void;
  totalQuestions: number;
  currentIndex: number;
  selectedAnswers: Record<number, string>;
  flaggedQuestions: Record<number, boolean>;
  onSelectQuestion: (index: number) => void;
  onRequestFinish: () => void;
}

export function ExamSheetHUD({
  isOpen,
  onClose,
  totalQuestions,
  currentIndex,
  selectedAnswers,
  flaggedQuestions,
  onSelectQuestion,
  onRequestFinish,
}: ExamSheetHUDProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "flagged" | "answered">("all");

  const answeredCount = Object.keys(selectedAnswers).filter(
    (k) => selectedAnswers[Number(k)] !== undefined && selectedAnswers[Number(k)] !== ""
  ).length;

  const flaggedCount = Object.keys(flaggedQuestions).filter(
    (k) => Boolean(flaggedQuestions[Number(k)])
  ).length;

  const pendingCount = Math.max(0, totalQuestions - answeredCount);

  // Filtragem das questões na grade
  const questionIndices = Array.from({ length: totalQuestions }, (_, i) => i);
  const filteredIndices = questionIndices.filter((idx) => {
    const isAnswered = selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== "";
    const isFlagged = Boolean(flaggedQuestions[idx]);

    if (filter === "pending") return !isAnswered;
    if (filter === "flagged") return isFlagged;
    if (filter === "answered") return isAnswered;
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur escurecido para mobile / overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
          />

          {/* Drawer Lateral Retrátil */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm sm:max-w-md bg-[#070b14]/95 border-l border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* CABEÇALHO DO GABARITO */}
            <div className="p-4 sm:p-5 border-b border-white/10 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400">
                    <Sparkles size={16} />
                  </div>
                  <h2 className="text-base font-black tracking-tight text-white">
                    Grade de Respostas
                  </h2>
                </div>

                <button
                  onClick={onClose}
                  type="button"
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Fechar Grade (ESC ou G)"
                >
                  <X size={16} />
                </button>
              </div>

              {/* CONTADORES RESUMIDOS */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <span className="block text-[10px] uppercase font-bold text-violet-300">
                    Respondidas
                  </span>
                  <span className="text-sm font-black text-violet-200">
                    {answeredCount}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="block text-[10px] uppercase font-bold text-amber-300">
                    Revisão
                  </span>
                  <span className="text-sm font-black text-amber-200">
                    {flaggedCount}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-800/40 border border-white/5">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Em Branco
                  </span>
                  <span className="text-sm font-black text-slate-300">
                    {pendingCount}
                  </span>
                </div>
              </div>

              {/* FILTROS RÁPIDOS */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1 text-[11px]">
                {(
                  [
                    { key: "all", label: `Todas (${totalQuestions})` },
                    { key: "pending", label: `Em Branco (${pendingCount})` },
                    { key: "flagged", label: `Revisão (${flaggedCount})` },
                    { key: "answered", label: `Feitas (${answeredCount})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilter(tab.key)}
                    className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                      filter === tab.key
                        ? "bg-violet-600 text-white shadow-xs"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* GRADE DE QUESTÕES [1] [2] ... [N] */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
                {filteredIndices.map((idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered =
                    selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== "";
                  const selectedAlt = selectedAnswers[idx];
                  const isFlagged = Boolean(flaggedQuestions[idx]);

                  // Determinação do visual do botão da questão
                  let badgeStyle =
                    "bg-white/[0.03] border-white/10 text-slate-400 hover:border-violet-500/40 hover:text-white";

                  if (isAnswered) {
                    badgeStyle =
                      "bg-violet-600/30 border-violet-500/60 text-violet-200 font-bold shadow-xs";
                  }

                  if (isFlagged) {
                    badgeStyle =
                      "bg-amber-500/20 border-amber-500/60 text-amber-200 font-bold shadow-amber-500/10";
                  }

                  if (isCurrent) {
                    badgeStyle +=
                      " ring-2 ring-violet-400 border-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.5)] scale-105";
                  }

                  return (
                    <button
                      key={`sheet-q-${idx}`}
                      type="button"
                      onClick={() => {
                        onSelectQuestion(idx);
                        onClose();
                      }}
                      className={`relative h-12 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${badgeStyle}`}
                    >
                      {/* Flag indicador superior */}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-amber-500 text-slate-950 shadow-xs">
                          <Flag size={9} className="fill-current" />
                        </span>
                      )}

                      <span className="text-xs font-black">{idx + 1}</span>

                      {/* Alternativa marcada, se houver */}
                      {isAnswered ? (
                        <span className="text-[10px] font-mono leading-none text-violet-300">
                          {selectedAlt}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-500 leading-none">•</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {filteredIndices.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs space-y-1">
                  <p>Nenhuma questão encontrada para este filtro.</p>
                </div>
              )}

              {/* LEGENDA VISUAL */}
              <div className="mt-8 pt-4 border-t border-white/5 space-y-2 text-[11px] text-slate-400">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Legenda dos Indicadores
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-violet-600/40 border border-violet-500/60" />
                  <span>Respondida (com alternativa escolhida)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400">
                    <Flag size={9} />
                  </div>
                  <span>Marcada para Revisão</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-white/[0.03] border border-white/10" />
                  <span>Não Respondida (Em Branco)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded border-2 border-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
                  <span>Questão Atual com Foco</span>
                </div>
              </div>
            </div>

            {/* RODAPÉ DO DRAWER: BOTÃO DE SUBMISSÃO */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#05070e]/80 shrink-0">
              <button
                onClick={() => {
                  onClose();
                  onRequestFinish();
                }}
                type="button"
                className="w-full py-3.5 px-4 rounded-xl bg-linear-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm tracking-wide transition-all shadow-xl shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>Finalizar Simulado</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
