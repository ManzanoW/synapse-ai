"use client";
import { useState } from "react";
import { X, HelpCircle, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export default function StudyFlashcard({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = cards[index];
  const progress = ((index + 1) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-6 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full space-y-8">
        {/* Barra de Progresso Estilizada */}
        <div className="space-y-2">
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

        {/* Link de Voltar */}
        <div className="flex justify-between items-center text-slate-500 text-sm">
          <Link
            href="/flashcards/decks"
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Voltar para a Dashboard
          </Link>
        </div>

        {/* Card com Efeito de Profundidade 3D */}
        <div className="[perspective:1000px] h-96 w-full">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full h-full relative transition-all duration-700 [transform-style:preserve-3d] cursor-pointer ${
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            {/* FRENTE */}
            <div className="absolute inset-0 bg-[#090d16] border border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center [backface-visibility:hidden] shadow-2xl hover:border-slate-700 transition-colors">
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

            {/* VERSO */}
            <div className="absolute inset-0 bg-indigo-950/20 border border-indigo-500/30 rounded-3xl p-10 flex flex-col items-center justify-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-2xl shadow-indigo-500/10">
              <h3 className="text-xl font-bold text-white mb-4">
                {currentCard.answer}
              </h3>
            </div>
          </div>
        </div>

        {/* Botões com Feedback Visual (Exibidos apenas ao virar o card) */}
        <div
          className={`grid grid-cols-3 gap-3 transition-opacity duration-300 ${
            isFlipped ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
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
                }
              }}
              className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border font-bold text-[10px] tracking-widest transition-all active:scale-95 ${btn.style}`}
            >
              <btn.icon size={18} />
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
