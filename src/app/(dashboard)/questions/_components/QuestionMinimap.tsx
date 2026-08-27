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
    <div className="fixed bottom-18 sm:bottom-6 left-0 right-0 z-30 px-3 pointer-events-none flex justify-center">
      <div className="bg-[#090d16]/95 border border-white/10 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl flex items-center justify-between gap-2 pointer-events-auto max-w-md w-full">
        <div
          ref={containerRef}
          className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5 px-1 scroll-smooth w-full"
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
              btnStyle =
                "bg-indigo-500/30 text-indigo-300 border-indigo-500/50";
            }

            return (
              <button
                key={idx}
                ref={isFocused ? activeItemRef : null}
                onClick={() => onSelectQuestion(idx)}
                type="button"
                className={`relative shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold border transition-all flex items-center justify-center cursor-pointer ${btnStyle} ${
                  isFocused
                    ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#02050e] scale-105 shadow-lg z-10"
                    : ""
                }`}
              >
                <span>{idx + 1}</span>

                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-[#090d16]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
