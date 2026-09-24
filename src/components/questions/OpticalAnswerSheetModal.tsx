"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  X,
  CheckCircle2,
  XCircle,
  Flag,
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Scale,
} from "lucide-react";
import { QuestaoIA } from "@/app/(dashboard)/questions/page";

interface OpticalAnswerSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestaoIA[];
  selectedAnswers: Record<number, string>;
  checkedQuestions: Record<number, boolean>;
  flaggedQuestions: Record<number, boolean>;
  banca?: string;
  onSelectAnswer: (questionIndex: number, altId: string) => void;
  onJumpToQuestion: (questionIndex: number) => void;
}

export function OpticalAnswerSheetModal({
  isOpen,
  onClose,
  questions,
  selectedAnswers,
  checkedQuestions,
  flaggedQuestions,
  banca = "Banca Oficial",
  onSelectAnswer,
  onJumpToQuestion,
}: OpticalAnswerSheetModalProps) {
  const isCebraspe = useMemo(() => {
    const b = banca.toLowerCase();
    return b.includes("cebraspe") || b.includes("cespe");
  }, [banca]);

  // Cálculos estatísticos da folha óptica
  const stats = useMemo(() => {
    const total = questions.length;
    let answered = 0;
    let flagged = 0;
    let correct = 0;
    let incorrect = 0;

    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] !== undefined) {
        answered++;
      }
      if (flaggedQuestions[idx]) {
        flagged++;
      }
      if (checkedQuestions[idx]) {
        if (selectedAnswers[idx] === q.gabaritoCorreto) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    const blank = total - answered;
    const answeredChecked = correct + incorrect;

    // Se banca estilo Cebraspe (1 errada anula 1 certa)
    const liquidScore = isCebraspe
      ? Math.max(0, correct - incorrect)
      : correct;

    return {
      total,
      answered,
      blank,
      flagged,
      correct,
      incorrect,
      answeredChecked,
      liquidScore,
    };
  }, [questions, selectedAnswers, checkedQuestions, flaggedQuestions, isCebraspe]);

  // Encontra a primeira questão em branco para salto rápido
  const handleJumpToFirstBlank = () => {
    const firstBlankIdx = questions.findIndex(
      (_, idx) => selectedAnswers[idx] === undefined
    );
    if (firstBlankIdx !== -1) {
      onJumpToQuestion(firstBlankIdx);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-indigo-500/30 bg-[#090d18] shadow-2xl shadow-indigo-950/40 overflow-hidden font-sans"
        >
          {/* TOPO: CABEÇALHO OFICIAL DO CARTÃO-RESPOSTA */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 bg-linear-to-r from-indigo-950/40 via-slate-900/60 to-slate-950/80 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/40 bg-indigo-500/15 text-indigo-400 shadow-xs">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                    Folha Óptica de Respostas
                  </h3>
                  <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                    {banca}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Grade de preenchimento oficial do simulado • Modo Dia D
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Fechar Folha Óptica"
            >
              <X size={18} />
            </button>
          </div>

          {/* BARRA DE ESTATÍSTICAS E PLACAR LÍQUIDO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 border-b border-white/5 bg-slate-950/50 p-3 sm:px-6 text-xs">
            <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800 p-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Preenchidas</span>
                <span className="font-bold text-slate-200">
                  {stats.answered} / {stats.total}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800 p-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Em Branco</span>
                <span className="font-bold text-slate-400">
                  {stats.blank}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800 p-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Para Revisar</span>
                <span className="font-bold text-amber-300">
                  {stats.flagged}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-indigo-950/30 border border-indigo-500/30 p-2.5">
              <Scale size={14} className="text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] text-indigo-300 block uppercase font-mono">
                  {isCebraspe ? "Nota Líquida (Cespe)" : "Aproveitamento"}
                </span>
                <span className="font-bold text-indigo-200">
                  {stats.answeredChecked > 0
                    ? isCebraspe
                      ? `${stats.liquidScore} pts`
                      : `${stats.correct} / ${stats.answeredChecked}`
                    : "--"}
                </span>
              </div>
            </div>
          </div>

          {/* ÁREA CENTRAL: GRADE DAS BOLINHAS DE GABARITO (ESTILO CONCURSO REAL) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar max-h-[58vh]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {questions.map((q, idx) => {
                const isAnswered = checkedQuestions[idx];
                const selected = selectedAnswers[idx];
                const isFlagged = flaggedQuestions[idx];
                const isCorrect = selected === q.gabaritoCorreto;

                // Alternativas da questão
                const isCertoErrado =
                  q.formato === "certo_errado" ||
                  (!q.alternativas && ["Certo", "Errado"].includes(q.gabaritoCorreto));

                const optionsList = isCertoErrado
                  ? ["Certo", "Errado"]
                  : q.alternativas && q.alternativas.length > 0
                    ? q.alternativas.map((a) => a.id)
                    : ["A", "B", "C", "D", "E"];

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-xl border p-2.5 transition-all ${
                      isFlagged
                        ? "border-amber-500/40 bg-amber-500/5"
                        : selected !== undefined
                          ? "border-slate-800 bg-slate-900/60"
                          : "border-slate-800/60 bg-slate-950/40 opacity-70"
                    }`}
                  >
                    {/* NÚMERO DA QUESTÃO (CLIQUE PARA SALTAR) */}
                    <button
                      type="button"
                      onClick={() => {
                        onJumpToQuestion(idx);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-300 border border-white/5 text-xs font-mono font-bold text-slate-300 transition-colors cursor-pointer group"
                      title={`Ir para questão ${idx + 1}`}
                    >
                      <span>Q{String(idx + 1).padStart(2, "0")}</span>
                      {isFlagged && (
                        <Flag size={11} className="text-amber-400 fill-amber-400" />
                      )}
                    </button>

                    {/* BOLINHAS DE PREENCHIMENTO ÓPTICO */}
                    <div className="flex items-center gap-1.5">
                      {optionsList.map((opt) => {
                        const isChosen = selected === opt;
                        const isCorrectOption = opt === q.gabaritoCorreto;

                        let bubbleStyle =
                          "border-slate-700 text-slate-400 bg-slate-950 hover:border-slate-500 hover:text-slate-200";

                        if (isAnswered) {
                          if (isCorrectOption) {
                            bubbleStyle =
                              "border-emerald-500 bg-emerald-500 text-slate-950 font-black shadow-xs shadow-emerald-500/30 ring-1 ring-emerald-400";
                          } else if (isChosen) {
                            bubbleStyle =
                              "border-rose-500 bg-rose-500 text-white font-black shadow-xs shadow-rose-500/30";
                          } else {
                            bubbleStyle =
                              "border-slate-800 text-slate-600 bg-slate-950 opacity-40";
                          }
                        } else if (isChosen) {
                          bubbleStyle =
                            "border-indigo-400 bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/40 ring-2 ring-indigo-400/40";
                        }

                        return (
                          <button
                            key={opt}
                            disabled={isAnswered}
                            type="button"
                            onClick={() => onSelectAnswer(idx, opt)}
                            className={`w-7 h-7 rounded-full border text-[11px] font-mono flex items-center justify-center transition-all cursor-pointer disabled:cursor-default active:scale-90 ${bubbleStyle}`}
                            title={
                              isCertoErrado
                                ? opt === "Certo" ? "Marcar Certo" : "Marcar Errado"
                                : `Marcar alternativa ${opt}`
                            }
                          >
                            <span>
                              {isCertoErrado ? (opt === "Certo" ? "C" : "E") : opt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RODAPÉ DO MODAL */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/80 p-3 sm:px-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles size={13} className="text-amber-400" />
              <span>Clique no número da questão para navegar ou preencha as bolinhas diretamente.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
              {stats.blank > 0 && (
                <button
                  type="button"
                  onClick={handleJumpToFirstBlank}
                  className="px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <span>Ir p/ 1ª em Branco</span>
                  <ArrowRight size={13} />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-950/40"
              >
                Voltar à Prova
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
