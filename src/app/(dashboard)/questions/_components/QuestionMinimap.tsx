"use client";

import React, { useEffect, useRef } from "react";
import { QuestaoIA } from "../page";

interface QuestionMinimapProps {
  questions: QuestaoIA[];
  checkedQuestions: Record<number, boolean>;
  selectedAnswers: Record<number, string>;
  flaggedQuestions: Record<number, boolean>;
  focusedIndex: number;
  onSelectQuestion: (index: number) => void;
}

export function QuestionMinimap({
  questions,
  checkedQuestions,
  selectedAnswers,
  flaggedQuestions,
  focusedIndex,
  onSelectQuestion,
}: QuestionMinimapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // EFETUA O AUTO-SCROLL PARA CENTRALIZAR O NÚMERO SELECIONADO
  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [focusedIndex]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[90vw] sm:max-w-xl w-full px-2">
      <div className="bg-[#090d16]/90 border border-white/10 backdrop-blur-xl p-2 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
        {/* CONTAINER COM ROLAGEM HORIZONTAL INVISÍVEL */}
        <div
          ref={containerRef}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1 scroll-smooth w-full"
        >
          {questions.map((q, idx) => {
            const isAnswered = Boolean(checkedQuestions[idx]);
            const isSelected = selectedAnswers[idx] !== undefined;
            const isFlagged = Boolean(flaggedQuestions[idx]);
            const isFocused = idx === focusedIndex;

            let btnStyle =
              "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white";

            if (isAnswered) {
              const isCorrect = selectedAnswers[idx] === q.gabaritoCorreto;
              btnStyle = isCorrect
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : "bg-rose-500/20 text-rose-400 border-rose-500/40";
            } else if (isSelected) {
              btnStyle = "bg-indigo-500/30 text-indigo-300 border-indigo-500/50";
            }

            return (
              <button
                key={idx}
                ref={isFocused ? activeItemRef : null}
                onClick={() => onSelectQuestion(idx)}
                type="button"
                className={`relative shrink-0 w-8 h-8 rounded-xl text-xs font-bold border transition-all flex items-center justify-center cursor-pointer ${btnStyle} ${
                  isFocused
                    ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#02050e] scale-105 shadow-lg shadow-indigo-500/30 z-10"
                    : ""
                }`}
              >
                <span>{idx + 1}</span>

                {/* INDICADOR DE FLAG (MARCADA) */}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-[#090d16]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-medium px-2 py-1 rounded-lg bg-white/5 border border-white/5 shrink-0">
          <span>↕</span>
          <span>Navegar</span>
        </div>
      </div>
    </div>
  );
}
