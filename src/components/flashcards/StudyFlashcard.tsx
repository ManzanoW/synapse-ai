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
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  details?: string | null;
  topicId?: string | null;
}

export default function StudyFlashcard({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Métrica visual de acertos para a tela final
  const [performanceStats, setPerformanceStats] = useState({
    erros: 0,
    acertos: 0,
  });

  const currentCard = cards[index];
  const progress = cards.length > 0 ? ((index + 1) / cards.length) * 100 : 0;

  // Processa a nota do SM-2 (Grade 0 a 5) e envia para a API
  const handleAnswer = useCallback(
    async (grade: number) => {
      if (!currentCard || isSubmitting) return;

      setIsSubmitting(true);

      // Atualiza métricas locais para o feedback visual no modal final
      if (grade < 3) {
        setPerformanceStats((prev) => ({ ...prev, erros: prev.erros + 1 }));
      } else {
        setPerformanceStats((prev) => ({ ...prev, acertos: prev.acertos + 1 }));
      }

      // Envia a revisão para a rota /api/review
      try {
        const topicIdToSend = currentCard.topicId || currentCard.id;
        await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId: topicIdToSend,
            grade,
            source: "FLASHCARD",
          }),
        });
      } catch (error) {
        console.error("Erro ao sincronizar revisão SM-2 do flashcard:", error);
      } finally {
        setIsSubmitting(false);
      }

      // Avança para o próximo card ou finaliza o baralho
      if (index < cards.length - 1) {
        setIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        setIsFinished(true);
        confetti({
          particleCount: 180,
          spread: 80,
          origin: { x: 0.56, y: 0.6 },
          colors: ["#818cf8", "#c084fc", "#38bdf8", "#ffffff"],
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
        if (e.key === "1") handleAnswer(0); // Errei
        if (e.key === "2") handleAnswer(3); // Difícil
        if (e.key === "3") handleAnswer(4); // Bom
        if (e.key === "4") handleAnswer(5); // Fácil
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, isFinished, currentCard, isSubmitting, handleAnswer]);

  if (!cards || cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[85vh]">
        <div className="w-full max-w-xl p-8 bg-slate-950/60 border border-white/10 rounded-3xl backdrop-blur-2xl text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-100">
            Este baralho está vazio
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
            Adicione ou gere novos flashcards para começar a praticar a
            memorização ativa.
          </p>
          <div className="pt-2">
            <Link
              href="/flashcards/decks"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              <ArrowLeft size={15} /> Voltar para Baralhos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[88vh] bg-[#030712] p-4">
      <div className="w-full max-w-2xl p-6 md:p-8 bg-slate-950/70 border border-white/10 rounded-[2.5rem] backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)] select-none transition-all">
        {isFinished ? (
          /* --- TELA DE CONCLUSÃO PREMIUM COM MÉTRICAS SM-2 --- */
          <div className="text-center py-12 space-y-6 animate-fade-in">
            <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
              <div className="relative w-20 h-20 bg-linear-to-b from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.3)]">
                <Check size={38} strokeWidth={2.5} />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-transparent bg-linear-to-r from-white via-slate-100 to-indigo-200 bg-clip-text">
                Sessão Concluída! 🎉
              </h2>
              <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                Você revisou todos os{" "}
                <span className="text-indigo-300 font-bold">
                  {cards.length} cards
                </span>{" "}
                deste baralho com maestria.
              </p>
            </div>

            {/* Painel Sintético do Algoritmo SM-2 */}
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto bg-slate-900/60 border border-white/10 p-3.5 rounded-2xl text-center">
              <div className="border-r border-white/10 pr-2">
                <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Retenção Alta
                </span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {performanceStats.acertos} cards
                </span>
              </div>
              <div className="pl-2">
                <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Para Reorganizar
                </span>
                <span className="text-base font-bold text-rose-400 font-mono">
                  {performanceStats.erros} cards
                </span>
              </div>
            </div>

            <p className="text-[11px] text-indigo-300/80 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl max-w-md mx-auto">
              🧠 <strong>Sinapses Atualizadas:</strong> O algoritmo recalculou o
              espaçamento das próximas revisões na sua grade semanal!
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  setIndex(0);
                  setIsFlipped(false);
                  setIsFinished(false);
                  setPerformanceStats({ erros: 0, acertos: 0 });
                }}
                className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 rounded-2xl font-semibold text-xs transition-all active:scale-95"
              >
                <RotateCw size={15} /> Reiniciar
              </button>

              <Link
                href="/flashcards/decks"
                className="inline-flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold text-xs transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95"
              >
                <ArrowLeft size={16} /> Meus Baralhos
              </Link>
            </div>
          </div>
        ) : (
          /* --- FLUXO PRINCIPAL DOS CARDS --- */
          <>
            {/* Header com Navegação e Contador */}
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/flashcards/decks"
                className="group inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft
                  size={14}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                Sair do Estudo
              </Link>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold tracking-wider">
                <Sparkles size={12} className="text-indigo-400" />
                <span>
                  {index + 1} de {cards.length}
                </span>
              </div>
            </div>

            {/* Barra de Progresso em Gradiente */}
            <div className="space-y-1.5 mb-8">
              <div className="h-1.5 w-full bg-slate-900/90 rounded-full overflow-hidden border border-white/5 p-px">
                <div
                  className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Card com Efeito 3D Glassmorphism */}
            <div className="perspective-distant h-96 w-full mb-6">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`w-full h-full relative transition-transform duration-700 transform-3d cursor-pointer ${
                  isFlipped ? "transform-[rotateY(180deg)]" : ""
                }`}
              >
                {/* FRENTE: Pergunta */}
                <div className="absolute inset-0 bg-linear-to-b from-slate-900/90 to-slate-950/90 border border-white/10 hover:border-indigo-500/40 rounded-4xl p-8 md:p-10 flex flex-col items-center justify-between text-center backface-hidden shadow-2xl transition-all group">
                  <div className="w-full flex justify-between items-center">
                    <span className="text-[9px] font-bold tracking-[0.2em] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase">
                      Memorização Ativa
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      FRENTE
                    </span>
                  </div>

                  <div className="my-auto space-y-4 max-w-lg">
                    <HelpCircle
                      size={28}
                      className="text-indigo-400/50 mx-auto group-hover:scale-110 transition-transform"
                    />
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-100 leading-relaxed tracking-tight">
                      {currentCard.question}
                    </h2>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-medium">
                    <span>Aperte</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/10 text-[9px] font-mono shadow-inner">
                      Espaço
                    </kbd>
                    <span>para virar</span>
                  </div>
                </div>

                {/* VERSO: Resposta */}
                <div className="absolute inset-0 bg-linear-to-b from-indigo-950/40 via-slate-900/95 to-slate-950/95 border border-indigo-500/40 rounded-4xl p-8 md:p-10 flex flex-col items-center justify-between text-center transform-[rotateY(180deg)] backface-hidden shadow-[0_0_35px_rgba(99,102,241,0.15)]">
                  <div className="w-full flex justify-between items-center">
                    <span className="text-[9px] font-bold tracking-[0.2em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">
                      Resposta
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      VERSO
                    </span>
                  </div>

                  <div className="my-auto space-y-3 max-w-lg overflow-y-auto max-h-50 px-2">
                    <h3 className="text-lg md:text-xl font-semibold text-slate-50 leading-relaxed">
                      {currentCard.answer}
                    </h3>

                    {currentCard.details && (
                      <p className="text-xs text-slate-400 bg-white/5 border border-white/5 p-3 rounded-2xl leading-relaxed text-left">
                        {currentCard.details}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-indigo-300/60 uppercase tracking-widest font-medium">
                    Como foi o seu desempenho?
                  </span>
                </div>
              </div>
            </div>

            {/* Botões de Ação com Indicadores de Tecla e Notas SM-2 */}
            <div
              className={`grid grid-cols-4 gap-2.5 transition-all duration-300 ${
                isFlipped
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 pointer-events-none"
              }`}
            >
              {[
                {
                  label: "ERREI",
                  grade: 0,
                  key: "1",
                  icon: X,
                  style:
                    "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-400 hover:border-rose-500/40 shadow-rose-500/5",
                },
                {
                  label: "DIFÍCIL",
                  grade: 3,
                  key: "2",
                  icon: HelpCircle,
                  style:
                    "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-400 hover:border-amber-500/40 shadow-amber-500/5",
                },
                {
                  label: "BOM",
                  grade: 4,
                  key: "3",
                  icon: Check,
                  style:
                    "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 shadow-emerald-500/5",
                },
                {
                  label: "FÁCIL",
                  grade: 5,
                  key: "4",
                  icon: Zap,
                  style:
                    "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40 shadow-indigo-500/5",
                },
              ].map((btn) => (
                <button
                  key={btn.label}
                  disabled={isSubmitting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnswer(btn.grade);
                  }}
                  className={`group relative flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl border font-bold text-[10px] tracking-widest transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${btn.style}`}
                >
                  <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded bg-black/40 text-[9px] font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                    {btn.key}
                  </span>
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <btn.icon
                      size={16}
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
