"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Zap,
  Timer,
  CheckCircle2,
  XCircle,
  X,
  Flame,
  Award,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { QuestaoIA } from "@/app/(dashboard)/questions/page";

interface SpeedQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestaoIA[];
  onFinish?: (stats: { correctCount: number; totalXp: number }) => void;
}

const QUESTION_TIME_LIMIT = 45; // 45 segundos por questão

export function SpeedQuizModal({
  isOpen,
  onClose,
  questions,
  onFinish,
}: SpeedQuizModalProps) {
  // Pega até 5 questões para o desafio relâmpago
  const quizItems = React.useMemo(() => {
    return questions.slice(0, 5);
  }, [questions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reseta o estado quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setTimeLeft(QUESTION_TIME_LIMIT);
      setSelectedOption(null);
      setIsAnswered(false);
      setStreak(0);
      setMaxStreak(0);
      setCorrectCount(0);
      setEarnedXp(0);
      setIsCompleted(false);
    }
  }, [isOpen]);

  const currentQuestion = quizItems[currentIndex];

  const getMultiplier = (currentStreak: number) => {
    if (currentStreak >= 4) return 2.0;
    if (currentStreak === 3) return 1.5;
    if (currentStreak === 2) return 1.25;
    return 1.0;
  };

  const handleAnswer = (altId: string | null, isTimeout = false) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(altId);

    const isCorrect = !isTimeout && altId === currentQuestion?.gabaritoCorreto;

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setCorrectCount((prev) => prev + 1);

      const multiplier = getMultiplier(newStreak);
      const questionXp = Math.round(30 * multiplier);
      setEarnedXp((prev) => prev + questionXp);
    } else {
      setStreak(0);
    }

    // Avança automaticamente após 1.5s
    setTimeout(() => {
      if (currentIndex + 1 < quizItems.length) {
        setCurrentIndex((prev) => prev + 1);
        setTimeLeft(QUESTION_TIME_LIMIT);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        setIsCompleted(true);
        if (isCorrect || correctCount >= 3) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        onFinish?.({
          correctCount: isCorrect ? correctCount + 1 : correctCount,
          totalXp: earnedXp,
        });
      }
    }, 1400);
  };

  // Contagem regressiva de 45s
  useEffect(() => {
    if (!isOpen || isCompleted || isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Tempo esgotado para a questão atual
          handleAnswer(null, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentIndex, isAnswered, isCompleted]);

  if (!isOpen || quizItems.length === 0) return null;

  const multiplier = getMultiplier(streak);
  const timeProgressPercent = (timeLeft / QUESTION_TIME_LIMIT) * 100;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl rounded-3xl border border-amber-500/40 bg-[#090c16] shadow-2xl shadow-amber-950/30 overflow-hidden font-sans flex flex-col"
        >
          {/* HEADER DO SPEED QUIZ */}
          <div className="flex items-center justify-between border-b border-amber-500/20 bg-linear-to-r from-amber-950/40 via-orange-950/30 to-slate-950 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/20 text-amber-400 shadow-md shadow-amber-500/10">
                <Zap size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                  Desafio Relâmpago ⚡
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Speed Run 45s
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400 font-medium">
                  Responda rápido para acumular combo e multiplicar XP
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {!isCompleted ? (
            <>
              {/* BARRA DE COMBO & MULTIPLICADOR */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-950/70 border-b border-white/5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Questão:</span>
                  <span className="font-bold text-white">
                    {currentIndex + 1} / {quizItems.length}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {streak > 1 && (
                    <div className="flex items-center gap-1 text-orange-400 font-black animate-bounce">
                      <Flame size={14} className="fill-orange-400" />
                      <span>{streak}x Combo!</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-amber-300 font-bold text-[10px]">
                    <Sparkles size={11} />
                    <span>Multiplicador: {multiplier}x XP</span>
                  </div>
                </div>
              </div>

              {/* BARRA DE PROGRESSO DO TEMPO REGRESSIVO */}
              <div className="relative h-1.5 w-full bg-slate-900">
                <motion.div
                  className={`h-full transition-all duration-300 ${
                    timeLeft <= 10
                      ? "bg-rose-500"
                      : timeLeft <= 20
                        ? "bg-amber-400"
                        : "bg-indigo-500"
                  }`}
                  style={{ width: `${timeProgressPercent}%` }}
                />
              </div>

              {/* CONTEÚDO DA QUESTÃO */}
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-400">Tempo restante:</span>
                  <span
                    className={`font-mono font-black text-sm ${
                      timeLeft <= 10 ? "text-rose-400 animate-ping" : "text-amber-300"
                    }`}
                  >
                    ⏱️ {timeLeft}s
                  </span>
                </div>

                <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
                  {currentQuestion?.enunciado}
                </p>

                {/* LISTA DE ALTERNATIVAS */}
                <div className="space-y-2.5 pt-2">
                  {currentQuestion?.formato === "certo_errado" ||
                  (!currentQuestion?.alternativas &&
                    ["Certo", "Errado"].includes(currentQuestion?.gabaritoCorreto || ""))
                    ? ["Certo", "Errado"].map((opt) => {
                        const isChosen = selectedOption === opt;
                        const isCorrectOption = opt === currentQuestion?.gabaritoCorreto;

                        let style =
                          "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-amber-500/40 hover:bg-slate-900";

                        if (isAnswered) {
                          if (isCorrectOption) {
                            style = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-950/30";
                          } else if (isChosen) {
                            style = "bg-rose-500/20 border-rose-500 text-rose-300 font-bold";
                          } else {
                            style = "opacity-40 border-slate-900 text-slate-600";
                          }
                        }

                        return (
                          <button
                            key={opt}
                            disabled={isAnswered}
                            type="button"
                            onClick={() => handleAnswer(opt)}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer disabled:cursor-default active:scale-[0.99] ${style}`}
                          >
                            <span>{opt}</span>
                            {isAnswered && isCorrectOption && (
                              <CheckCircle2 size={16} className="text-emerald-400" />
                            )}
                            {isAnswered && isChosen && !isCorrectOption && (
                              <XCircle size={16} className="text-rose-400" />
                            )}
                          </button>
                        );
                      })
                    : currentQuestion?.alternativas?.map((alt) => {
                        const isChosen = selectedOption === alt.id;
                        const isCorrectOption = alt.id === currentQuestion?.gabaritoCorreto;

                        let style =
                          "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-amber-500/40 hover:bg-slate-900";

                        if (isAnswered) {
                          if (isCorrectOption) {
                            style = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-950/30";
                          } else if (isChosen) {
                            style = "bg-rose-500/20 border-rose-500 text-rose-300 font-bold";
                          } else {
                            style = "opacity-40 border-slate-900 text-slate-600";
                          }
                        }

                        return (
                          <button
                            key={alt.id}
                            disabled={isAnswered}
                            type="button"
                            onClick={() => handleAnswer(alt.id)}
                            className={`w-full text-left p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 cursor-pointer disabled:cursor-default active:scale-[0.99] ${style}`}
                          >
                            <span className="font-bold text-amber-400 shrink-0 font-mono">
                              {alt.id})
                            </span>
                            <span className="flex-1 leading-snug">{alt.texto}</span>
                            {isAnswered && isCorrectOption && (
                              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                            )}
                            {isAnswered && isChosen && !isCorrectOption && (
                              <XCircle size={16} className="text-rose-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                </div>
              </div>
            </>
          ) : (
            /* TELA FINAL DE RESULTADO DO SPEED RUN */
            <div className="p-6 sm:p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                <Award size={32} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Desafio Concluído! ⚡
                </h3>
                <p className="text-xs text-zinc-400">
                  Excelente treino de reflexo e agilidade de prova
                </p>
              </div>

              {/* CARD DE PLACAR */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Acertos</span>
                  <span className="text-lg font-black text-emerald-400">
                    {correctCount} / {quizItems.length}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Maior Combo</span>
                  <span className="text-lg font-black text-orange-400">
                    {maxStreak}x 🔥
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">XP Ganho</span>
                  <span className="text-lg font-black text-amber-400">
                    +{earnedXp} XP
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex(0);
                    setTimeLeft(QUESTION_TIME_LIMIT);
                    setSelectedOption(null);
                    setIsAnswered(false);
                    setStreak(0);
                    setMaxStreak(0);
                    setCorrectCount(0);
                    setEarnedXp(0);
                    setIsCompleted(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-xs font-bold text-zinc-200 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Jogar Novamente</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-950/40"
                >
                  Concluir
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
