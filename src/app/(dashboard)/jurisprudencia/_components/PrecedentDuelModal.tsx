"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Swords,
  Trophy,
  Scale,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Zap,
  Bookmark,
} from "lucide-react";
import confetti from "canvas-confetti";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { PRECEDENT_DUELS, PrecedentDuelRound } from "@/lib/precedent-duel-data";

interface PrecedentDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrecedentDuelModal({ isOpen, onClose }: PrecedentDuelModalProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | null>(null);
  const [score, setScore] = useState<{ correct: number; wrong: number }>({
    correct: 0,
    wrong: 0,
  });
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentRound: PrecedentDuelRound = PRECEDENT_DUELS[currentIndex];
  const totalRounds = PRECEDENT_DUELS.length;

  const handleSelect = (option: "A" | "B") => {
    if (selectedOption !== null) return; // já respondeu esta rodada
    setSelectedOption(option);

    const isOptionACorrect = currentRound.optionA.isCorrect;
    const isUserCorrect =
      (option === "A" && isOptionACorrect) ||
      (option === "B" && !isOptionACorrect);

    if (isUserCorrect) {
      triggerHaptic("success");
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      triggerHaptic("error");
      setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
    }
  };

  const handleNext = () => {
    triggerHaptic("light");
    if (currentIndex + 1 < totalRounds) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
      if (score.correct >= totalRounds - 1) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      }
    }
  };

  const handleRestart = () => {
    triggerHaptic("light");
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore({ correct: 0, wrong: 0 });
    setIsFinished(false);
  };

  const isUserCorrect =
    selectedOption !== null &&
    ((selectedOption === "A" && currentRound.optionA.isCorrect) ||
      (selectedOption === "B" && currentRound.optionB.isCorrect));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Duelo de Precedentes STF/STJ"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 text-slate-100 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* ================= BARRA SUPERIOR ================= */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-slate-950/60 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Swords size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Duelo de Precedentes STF / STJ
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Casos Práticos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Decida o caso real antes de ler o veredito oficial das cortes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ================= PLACAR E PROGRESSO ================= */}
        {!isFinished && (
          <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <span>Rodada {currentIndex + 1} de {totalRounds}</span>
              <div className="flex gap-1">
                {PRECEDENT_DUELS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i === currentIndex
                        ? "bg-amber-400 animate-pulse"
                        : i < currentIndex
                        ? "bg-indigo-500"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={13} /> {score.correct}
              </span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <XCircle size={13} /> {score.wrong}
              </span>
            </div>
          </div>
        )}

        {/* ================= CORPO DO DUELO ================= */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {!isFinished ? (
            <>
              {/* Badges de Identificação do Precedente */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-black tracking-wide border shadow-sm ${
                      currentRound.tribunal === "STF"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : currentRound.tribunal === "STJ"
                        ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                        : "bg-purple-500/15 text-purple-300 border-purple-500/30"
                    }`}
                  >
                    ⚖️ {currentRound.tribunal}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {currentRound.subject}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                  {currentRound.topicBadge}
                </span>
              </div>

              {/* Box do Caso Concreto / Narrativa */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400/90 flex items-center gap-1.5">
                  <Scale size={13} />
                  <span>Caso Concreto para Julgamento</span>
                </span>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
                  "{currentRound.scenario}"
                </p>
                <div className="pt-2 border-t border-white/5 text-xs font-semibold text-white">
                  Pergunta: {currentRound.question}
                </div>
              </div>

              {/* Botões de Decisão (Opção A vs Opção B) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={selectedOption !== null}
                  onClick={() => handleSelect("A")}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[90px] ${
                    selectedOption === null
                      ? "bg-white/5 border-white/10 hover:border-amber-400/50 hover:bg-white/10 text-slate-200"
                      : selectedOption === "A"
                      ? currentRound.optionA.isCorrect
                        ? "bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-rose-500/20 border-rose-400 text-white shadow-lg shadow-rose-500/20"
                      : currentRound.optionA.isCorrect
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 opacity-90"
                      : "bg-white/5 border-white/5 text-slate-500 opacity-50"
                  }`}
                >
                  <span className="text-[11px] font-mono font-bold text-slate-400 mb-1">
                    VOTO A
                  </span>
                  <span className="text-xs sm:text-sm font-bold leading-snug">
                    {currentRound.optionA.label}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={selectedOption !== null}
                  onClick={() => handleSelect("B")}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[90px] ${
                    selectedOption === null
                      ? "bg-white/5 border-white/10 hover:border-amber-400/50 hover:bg-white/10 text-slate-200"
                      : selectedOption === "B"
                      ? currentRound.optionB.isCorrect
                        ? "bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-rose-500/20 border-rose-400 text-white shadow-lg shadow-rose-500/20"
                      : currentRound.optionB.isCorrect
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 opacity-90"
                      : "bg-white/5 border-white/5 text-slate-500 opacity-50"
                  }`}
                >
                  <span className="text-[11px] font-mono font-bold text-slate-400 mb-1">
                    VOTO B
                  </span>
                  <span className="text-xs sm:text-sm font-bold leading-snug">
                    {currentRound.optionB.label}
                  </span>
                </button>
              </div>

              {/* Feedback e Fundamentação do Precedente */}
              {selectedOption !== null && (
                <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isUserCorrect ? (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Gabaritou o Precedente!
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5">
                          <XCircle size={14} /> O Tribunal decidiu o inverso!
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {currentRound.citation}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {currentRound.rationale}
                  </p>

                  {/* Regra Mnemônica de Ouro para Prova */}
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-2">
                    <Zap size={14} className="text-amber-400 shrink-0" />
                    <span>Regra para Prova: {currentRound.mnemonicRule}</span>
                  </div>

                  {/* Botão Próxima Rodada */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <span>
                        {currentIndex + 1 < totalRounds
                          ? "Próxima Rodada"
                          : "Ver Resultado Final"}
                      </span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ================= TELA FINAL DE RESULTADO ================= */
            <div className="py-8 text-center space-y-5 animate-in fade-in duration-300">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
                <Trophy size={32} />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Duelo Concluído!
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Você julgou os {totalRounds} casos mais cobrados da jurisprudência recente.
                </p>
              </div>

              {/* Estatísticas Finais */}
              <div className="inline-flex items-center gap-6 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 font-mono">
                <div>
                  <div className="text-2xl font-black text-emerald-400">
                    {score.correct}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans">
                    Acertos
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <div className="text-2xl font-black text-rose-400">
                    {score.wrong}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans">
                    Erros
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <div className="text-2xl font-black text-indigo-400">
                    +{score.correct * 15} XP
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans">
                    Experiência
                  </div>
                </div>
              </div>

              {/* Mensagem Motivacional */}
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {score.correct === totalRounds
                  ? "Incrível! Você dominou 100% dos precedentes chave. Sua percepção da jurisprudência do STF/STJ está em nível de aprovação!"
                  : score.correct >= totalRounds * 0.7
                  ? "Ótimo rendimento! A maioria das teses fixadas já está consolidada na sua memória."
                  : "Bom treino! Esses casos caem constantemente em provas discursivas e objetivas. Revise as regras de ouro no caderno."}
              </p>

              {/* Ações Finais */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Jogar Novamente</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Continuar Estudos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
