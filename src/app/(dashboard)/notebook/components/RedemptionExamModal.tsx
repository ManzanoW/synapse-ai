"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Zap,
  Trophy,
  Loader2,
  Flame,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import {
  RedemptionExamQuestion,
  submitRedemptionQuestionResultAction,
} from "@/actions/error-notebook-actions";
import { useSound } from "@/hooks/useSound";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface RedemptionExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: RedemptionExamQuestion[];
  onExamComplete?: () => void;
}

export function RedemptionExamModal({
  isOpen,
  onClose,
  questions,
  onExamComplete,
}: RedemptionExamModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Histórico de resultados na sessão
  const [results, setResults] = useState<
    Array<{
      questionIndex: number;
      isCorrect: boolean;
      userAnswer: string;
      errorId: string;
    }>
  >([]);

  const [totalXpGained, setTotalXpGained] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);

  const { playCorrect, playError, playLevelUp, playClick } = useSound();

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsFinished(false);
      setResults([]);
      setTotalXpGained(0);
      setMasteredCount(0);
    }
  }, [isOpen]);

  if (!isOpen || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(
    ((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100
  );

  const handleSelectOption = (optionId: string) => {
    if (isAnswered || isSubmitting) return;
    playClick();
    triggerHaptic("light");
    setSelectedOption(optionId);
  };

  const handleConfirmAnswer = async () => {
    if (!selectedOption || isAnswered || isSubmitting) return;

    setIsSubmitting(true);
    const isCorrect =
      selectedOption.trim().toUpperCase() ===
      currentQ.correctAnswer.trim().toUpperCase();

    try {
      if (isCorrect) {
        playCorrect();
        triggerHaptic("success");
      } else {
        playError();
        triggerHaptic("warning");
      }

      const res = await submitRedemptionQuestionResultAction({
        errorId: currentQ.errorId,
        userAnswer: selectedOption,
        isCorrect,
      });

      if (res.success && isCorrect) {
        setTotalXpGained((prev) => prev + (res.earnedXp || 35));
        setMasteredCount((prev) => prev + 1);
      }

      setResults((prev) => [
        ...prev,
        {
          questionIndex: currentIndex,
          isCorrect,
          userAnswer: selectedOption,
          errorId: currentQ.errorId,
        },
      ]);

      setIsAnswered(true);
    } catch (err) {
      console.error("Erro ao validar questão de redenção:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      playLevelUp();
      triggerHaptic("heavy");
      setIsFinished(true);
      if (onExamComplete) onExamComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Simulado de Redenção
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  Cicatrização Ativa
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Questões Gêmeas da IA para dominar as pegadinhas que te derrubaram
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progresso Superior */}
        {!isFinished && (
          <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!isFinished ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Meta da Questão */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Questão {currentIndex + 1} de {questions.length}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {currentQ.subjectName}
                    </span>
                    {currentQ.topicName && (
                      <span className="px-2 py-0.5 rounded-md font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                        {currentQ.topicName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                    <Flame className="w-4 h-4" />
                    <span>Conceito: {currentQ.conceptTested}</span>
                  </div>
                </div>

                {/* Bloco de Contexto do Erro Passado */}
                <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>O que você errou anteriormente:</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 italic">
                    &ldquo;{currentQ.originalQuestionSnippet}&rdquo;
                  </p>
                  <div className="flex gap-4 pt-1 text-[11px]">
                    <span className="text-rose-600 dark:text-rose-400">
                      Sua resposta anterior: <b>{currentQ.originalUserAnswer}</b>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Gabarito correto: <b>{currentQ.originalCorrectAnswer}</b>
                    </span>
                  </div>
                </div>

                {/* Enunciado da Questão Gêmea */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Questão Gêmea de Superação</span>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-100 font-medium whitespace-pre-line">
                    {currentQ.questionText}
                  </p>
                </div>

                {/* Alternativas */}
                <div className="space-y-2.5">
                  {currentQ.options.map((option) => {
                    const isSelected = selectedOption === option.id;
                    const isCorrectAnswer =
                      option.id.toUpperCase() ===
                      currentQ.correctAnswer.toUpperCase();

                    let optionStyle =
                      "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200";

                    if (!isAnswered && isSelected) {
                      optionStyle =
                        "border-rose-500 dark:border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100 shadow-sm";
                    } else if (isAnswered) {
                      if (isCorrectAnswer) {
                        optionStyle =
                          "border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 font-medium";
                      } else if (isSelected && !isCorrectAnswer) {
                        optionStyle =
                          "border-rose-500 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100 line-through";
                      } else {
                        optionStyle =
                          "opacity-40 border-slate-200 dark:border-slate-800";
                      }
                    }

                    return (
                      <button
                        key={option.id}
                        disabled={isAnswered || isSubmitting}
                        onClick={() => handleSelectOption(option.id)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 text-sm ${optionStyle}`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                            isSelected && !isAnswered
                              ? "bg-rose-500 text-white"
                              : isAnswered && isCorrectAnswer
                              ? "bg-emerald-500 text-white"
                              : isAnswered && isSelected && !isCorrectAnswer
                              ? "bg-rose-500 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {option.id}
                        </span>
                        <span className="flex-1 pt-0.5 leading-snug">
                          {option.texto}
                        </span>

                        {isAnswered && isCorrectAnswer && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                        {isAnswered && isSelected && !isCorrectAnswer && (
                          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback Explicativo Após Responder */}
                {isAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border space-y-3 text-sm ${
                      selectedOption?.toUpperCase() ===
                      currentQ.correctAnswer.toUpperCase()
                        ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                        : "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {selectedOption?.toUpperCase() ===
                      currentQ.correctAnswer.toUpperCase() ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          <span>
                            Erro Cicatrizado com Sucesso! (+35 XP de Domínio)
                          </span>
                        </>
                      ) : (
                        <>
                          <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          <span>
                            Ainda não foi dessa vez. Fixe a pegadinha abaixo:
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {currentQ.explanation}
                    </p>

                    {currentQ.mnemonic && (
                      <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-start gap-2 text-xs">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-700 dark:text-amber-300">
                            Mnemônico de Ancoragem:{" "}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {currentQ.mnemonic}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            /* Tela de Conclusão / Celebração da Redenção */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
                <Trophy className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Sessão de Redenção Concluída!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Você enfrentou e cicatrizou vulnerabilidades reais do seu
                  histórico. Cada falha convertida em domínio te deixa mais perto
                  da posse.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center">
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {masteredCount}
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    Erros Cicatrizados
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-center">
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    +{totalXpGained}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    XP de Superação
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-center">
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {Math.round((masteredCount / questions.length) * 100)}%
                  </div>
                  <div className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    Taxa de Resgate
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition active:scale-95"
                >
                  Voltar ao Caderno de Erros
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Rodapé com Ações */}
        {!isFinished && (
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isAnswered
                ? "Revise o mnemônico antes de prosseguir."
                : "Selecione uma alternativa e confirme."}
            </span>

            <div className="flex items-center gap-2">
              {!isAnswered ? (
                <button
                  disabled={!selectedOption || isSubmitting}
                  onClick={handleConfirmAnswer}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmar Resposta</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm transition flex items-center gap-2 active:scale-95"
                >
                  <span>
                    {currentIndex < questions.length - 1
                      ? "Próxima Questão"
                      : "Ver Resultado da Redenção"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
