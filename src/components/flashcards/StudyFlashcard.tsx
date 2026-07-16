"use client";
import { useState } from "react";
import { X, HelpCircle, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti"; // Importe no topo

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export default function StudyFlashcard({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = cards[index];
  const progress = (index / cards.length) * 100;

  return (
    <div className="flex items-center justify-center bg-[#030712] min-h-[90vh]">
      <div className="w-full max-w-2xl p-8 bg-[#050810] border border-slate-800/50 rounded-3xl shadow-[0_0_30px_-15px_rgba(79,70,229,0.3)]">
        {isFinished ? (
          // --- TELA DE CONCLUSÃO ---
          <div className="text-center py-20 space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-indigo-500" />
            </div>
            <h2 className="text-3xl font-bold text-white">
              Deck Concluído! 🎉
            </h2>
            <p className="text-slate-400">
              Você revisou todos os cards deste deck. Excelente trabalho!
            </p>
            <div className="pt-6">
              <Link
                href="/flashcards/decks"
                className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all"
              >
                <ArrowLeft size={18} /> Voltar para o Dashboard
              </Link>
            </div>
          </div>
        ) : (
          // --- BLOCO ORIGINAL: O FLUXO DOS CARDS ---
          <>
            {/* Link de Voltar */}
            <div className="flex items-center justify-between mb-8">
              <Link
                href="/flashcards/decks"
                className="group flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-all duration-300 opacity-60 hover:opacity-100"
              >
                <ArrowLeft
                  size={14}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                Voltar
              </Link>
            </div>
            {/* Barra de Progresso */}
            <div className="space-y-2 mb-8">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Progresso</span>
                <span>
                  Card {index + 1} de {cards.length}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Card com Efeito 3D */}
            <div className="perspective-[1000px] h-96 w-full mb-8">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`w-full h-full relative transition-all duration-700 transform-3d cursor-pointer ${isFlipped ? "transform-[rotateY(180deg)]" : ""}`}
              >
                {/* FRENTE e VERSO aqui dentro... */}
                <div className="absolute inset-0 bg-[#090d16] border border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center backface-hidden shadow-2xl hover:border-slate-700 transition-colors">
                  <span className="absolute top-6 left-6 text-[9px] font-bold tracking-widest text-indigo-400 bg-indigo-950/20 px-2 py-0.5 rounded uppercase">
                    Conceitos Técnicos
                  </span>
                  <HelpCircle size={32} className="text-slate-700 mb-6" />
                  <h2 className="text-2xl font-medium text-slate-200 leading-tight">
                    {currentCard.question}
                  </h2>
                  <p className="absolute bottom-6 text-[10px] text-slate-600 uppercase tracking-wider">
                    Clique no card para revelar a resposta
                  </p>
                </div>
                <div className="absolute inset-0 bg-indigo-950/20 border border-indigo-500/30 rounded-3xl p-10 flex flex-col items-center justify-center text-center transform-[rotateY(180deg)] backface-hidden shadow-2xl shadow-indigo-500/10">
                  <h3 className="text-xl font-bold text-white mb-4">
                    {currentCard.answer}
                  </h3>
                </div>
              </div>
            </div>

            {/* Botões com Feedback Visual (Exibidos apenas ao virar o card) */}
            <div
              className={`grid grid-cols-3 gap-3 transition-opacity duration-300 ${isFlipped ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              {[
                {
                  label: "ERREI",
                  icon: X,
                  style:
                    "bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-400",
                },
                {
                  label: "DIFÍCIL",
                  icon: HelpCircle,
                  style:
                    "bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 text-amber-400",
                },
                {
                  label: "BOM",
                  icon: Check,
                  style:
                    "bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
                },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (index < cards.length - 1) {
                      setIndex(index + 1);
                      setIsFlipped(false);
                    } else {
                      setIsFinished(true); // Marca como finalizado
                      confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { x: 0.56, y: 0.6 },
                        colors: ["#6366f1", "#a855f7", "#ffffff"], // Cores que combinam com seu tema
                      });
                    }
                  }}
                  className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border font-bold text-[10px] tracking-widest transition-all active:scale-95 ${btn.style}`}
                >
                  <btn.icon size={18} />
                  {btn.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
