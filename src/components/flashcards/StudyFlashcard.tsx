"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  HelpCircle,
  Check,
  ArrowLeft,
  RotateCw,
  Sparkles,
  Zap,
  Loader2,
  Brain,
  Award,
  Command,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface Flashcard {
  id: string;
  question?: string;
  answer?: string;
  front?: string;
  back?: string;
  details?: string | null;
  topicId?: string | null;
  deckId?: string | null;
}

interface StudyFlashcardProps {
  cards: Flashcard[];
  deckTitle?: string;
  deckId?: string;
}

export default function StudyFlashcard({
  cards,
  deckTitle,
}: StudyFlashcardProps) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  const [performanceStats, setPerformanceStats] = useState({
    erros: 0,
    acertos: 0,
  });

  const currentCard = cards[index];
  const progress = cards.length > 0 ? ((index + 1) / cards.length) * 100 : 0;

  const frontText = currentCard
    ? currentCard.question ||
      (currentCard as unknown as Record<string, string>).front ||
      "Sem pergunta"
    : "";

  const backText = currentCard
    ? currentCard.answer ||
      (currentCard as unknown as Record<string, string>).back ||
      "Sem resposta"
    : "";

  const handleAnswer = useCallback(
    async (grade: number) => {
      if (!currentCard || isSubmitting) return;

      setIsSubmitting(true);
      setSelectedGrade(grade);

      if (grade < 3) {
        setPerformanceStats((prev) => ({ ...prev, erros: prev.erros + 1 }));
      } else {
        setPerformanceStats((prev) => ({ ...prev, acertos: prev.acertos + 1 }));
      }

      // ⚡ Converte nota numérica em string para o motor de gamificação
      const gradeLabel =
        grade >= 5
          ? "Fácil"
          : grade >= 4
            ? "Bom"
            : grade >= 3
              ? "Difícil"
              : "Errei";

      try {
        // 1. Registra o ganho de XP na rota dedicada de gamificação de flashcards
        await fetch("/api/flashcards/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId: currentCard.id,
            grade: gradeLabel,
          }),
        });

        // 2. Atualiza os algoritmos de repetibilidade (SM-2)
        await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId: currentCard.id,
            flashcardId: currentCard.id,
            topicId:
              currentCard.topicId || currentCard.deckId || currentCard.id,
            grade,
            source: "FLASHCARD",
          }),
        });
      } catch (error) {
        console.error("Erro ao sincronizar revisão do flashcard:", error);
      } finally {
        setIsSubmitting(false);
        setSelectedGrade(null);
      }

      if (index < cards.length - 1) {
        setIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        setIsFinished(true);
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { x: 0.5, y: 0.55 },
          colors: ["#818cf8", "#c084fc", "#38bdf8", "#34d399", "#ffffff"],
        });
      }
    },
    [index, cards, currentCard, isSubmitting],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || !currentCard || isSubmitting) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === "1") handleAnswer(0);
        if (e.key === "2") handleAnswer(3);
        if (e.key === "3") handleAnswer(4);
        if (e.key === "4") handleAnswer(5);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, isFinished, currentCard, isSubmitting, handleAnswer]);

  if (!cards || cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[85vh] p-4">
        <div className="w-full max-w-md p-8 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-2xl text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-100">Baralho Vazio</h3>
          <p className="text-slate-400 text-xs">
            Adicione novos cards para continuar.
          </p>
          <Link
            href="/flashcards/decks"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs"
          >
            <ArrowLeft size={15} /> Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[88vh] p-4 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-162.5 h-112.5 bg-linear-to-r from-indigo-600/15 via-violet-600/20 to-indigo-500/15 rounded-full blur-[120px] opacity-80" />
        <div className="absolute top-1/3 w-75 h-50 bg-cyan-500/10 rounded-full blur-[90px]" />
      </div>

      <div className="w-full max-w-2xl p-6 md:p-9 bg-slate-950/80 border border-slate-800/80 rounded-[2.5rem] backdrop-blur-3xl shadow-[0_0_80px_-15px_rgba(99,102,241,0.25)] select-none transition-all relative overflow-hidden z-10">
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-indigo-500/50 to-transparent" />

        {isFinished ? (
          <div className="text-center py-8 space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 bg-linear-to-br from-emerald-500/20 via-indigo-500/20 to-slate-900 border border-emerald-500/40 rounded-3xl flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)] rotate-3">
                <Award size={42} strokeWidth={1.75} />
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/30 backdrop-blur-md">
                <Sparkles size={12} /> Sessão Concluída
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-transparent bg-linear-to-r from-white via-slate-100 to-indigo-200 bg-clip-text pt-2">
                Sinapses Reforçadas!
              </h2>
              <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                Você concluiu a revisão de{" "}
                <strong className="text-indigo-300 font-semibold">
                  {cards.length} cards
                </strong>{" "}
                com sucesso.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto bg-slate-900/40 border border-white/5 p-4 rounded-3xl backdrop-blur-md shadow-inner">
              <div className="border-r border-slate-800/80 pr-2">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Dominados
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono tracking-tight">
                  {performanceStats.acertos}
                </span>
              </div>
              <div className="pl-2">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Revisar
                </span>
                <span className="text-xl font-black text-rose-400 font-mono tracking-tight">
                  {performanceStats.erros}
                </span>
              </div>
            </div>

            <div className="text-xs text-indigo-300/90 bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 p-4 rounded-2xl max-w-md mx-auto flex items-center gap-3 text-left">
              <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shrink-0">
                <Brain size={20} />
              </div>
              <span className="text-[11px] leading-relaxed">
                <strong>Algoritmo SM-2 Ativo:</strong> O intervalo ideal para a
                próxima repetição foi ajustado para maximizar a retenção a longo
                prazo.
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => {
                  setIndex(0);
                  setIsFlipped(false);
                  setIsFinished(false);
                  setPerformanceStats({ erros: 0, acertos: 0 });
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-2xl font-semibold text-xs transition-all active:scale-95 shadow-md"
              >
                <RotateCw size={14} /> Recomeçar
              </button>

              <Link
                href="/flashcards/decks"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold text-xs transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] active:scale-95"
              >
                <ArrowLeft size={15} /> Finalizar
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5 relative z-10">
              <Link
                href="/flashcards/decks"
                className="group inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft
                  size={14}
                  className="group-hover:-translate-x-1 transition-transform text-indigo-400"
                />
                {deckTitle || "Sair do Estudo"}
              </Link>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-[11px] font-mono shadow-inner">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="font-bold text-indigo-400">{index + 1}</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400">{cards.length}</span>
              </div>
            </div>

            <div className="mb-6 relative z-10">
              <div className="h-2 w-full bg-slate-900/90 rounded-full overflow-hidden border border-slate-800/80 p-0.5 shadow-inner">
                <div
                  className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(99,102,241,0.8)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div
              className="relative w-full h-87.5 md:h-97.5 mb-6 cursor-pointer group"
              style={{ perspective: "1200px" }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={`w-full h-full relative transition-transform duration-700 ease-out ${
                  isFlipped ? "transform-[rotateY(180deg)]" : ""
                }`}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* FRENTE */}
                <div
                  className="absolute inset-0 w-full h-full bg-linear-to-b from-slate-900/95 via-slate-950/95 to-slate-950/98 border border-slate-800 group-hover:border-indigo-500/50 rounded-3xl p-7 md:p-9 flex flex-col justify-between text-center backdrop-blur-2xl shadow-2xl transition-all duration-300"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="w-full flex justify-between items-center relative z-10">
                    <span className="text-[9px] font-bold tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg uppercase backdrop-blur-md">
                      Pergunta
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                      CARD #{index + 1}
                    </span>
                  </div>

                  <div className="my-auto space-y-4 max-w-lg mx-auto relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <HelpCircle size={20} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-100 leading-relaxed tracking-tight">
                      {frontText}
                    </h2>
                  </div>

                  <div className="inline-flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-medium relative z-10">
                    <span>Aperte</span>
                    <kbd className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-200 border border-slate-700 text-[10px] font-mono shadow-md flex items-center gap-1">
                      <Command size={10} /> Espaço
                    </kbd>
                    <span>para virar</span>
                  </div>
                </div>

                {/* VERSO */}
                <div
                  className="absolute inset-0 w-full h-full bg-linear-to-b from-indigo-950/30 via-slate-950/95 to-slate-950/98 border border-indigo-500/40 rounded-3xl p-7 md:p-9 flex flex-col justify-between text-center backdrop-blur-2xl shadow-[0_0_40px_rgba(99,102,241,0.15)]"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="w-full flex justify-between items-center">
                    <span className="text-[9px] font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg uppercase backdrop-blur-md">
                      Resposta
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono tracking-wider">
                      EXPLICATIVO
                    </span>
                  </div>

                  <div className="my-auto space-y-3 max-w-lg mx-auto overflow-y-auto max-h-52 px-2 custom-scrollbar">
                    <h3 className="text-base md:text-lg font-medium text-slate-100 leading-relaxed">
                      {backText}
                    </h3>

                    {currentCard.details && (
                      <p className="text-xs text-slate-400 bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-2xl leading-relaxed text-left shadow-inner">
                        {currentCard.details}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-indigo-300/80 uppercase tracking-widest font-semibold">
                    Classifique sua facilidade
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`grid grid-cols-4 gap-2.5 transition-all duration-300 ${
                isFlipped
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3 pointer-events-none"
              }`}
            >
              {[
                {
                  label: "ERREI",
                  grade: 0,
                  key: "1",
                  icon: X,
                  style:
                    "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400 hover:border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
                },
                {
                  label: "DIFÍCIL",
                  grade: 3,
                  key: "2",
                  icon: HelpCircle,
                  style:
                    "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400 hover:border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
                },
                {
                  label: "BOM",
                  grade: 4,
                  key: "3",
                  icon: Check,
                  style:
                    "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
                },
                {
                  label: "FÁCIL",
                  grade: 5,
                  key: "4",
                  icon: Zap,
                  style:
                    "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-400 hover:border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.15)]",
                },
              ].map((btn) => (
                <button
                  key={btn.label}
                  disabled={isSubmitting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnswer(btn.grade);
                  }}
                  className={`group relative flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border font-bold text-[10px] tracking-widest transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${btn.style}`}
                >
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-slate-950/80 text-[9px] font-mono opacity-60 group-hover:opacity-100 transition-opacity border border-white/10">
                    {btn.key}
                  </span>
                  {isSubmitting && selectedGrade === btn.grade ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <btn.icon
                      size={17}
                      className="group-hover:scale-110 transition-transform"
                    />
                  )}
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
