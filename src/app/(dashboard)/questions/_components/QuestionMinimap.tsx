"use client";

import React from "react";
import { QuestaoIA } from "../page";

interface QuestionMinimapProps {
  questions: QuestaoIA[];
  checkedQuestions: Record<number, boolean>;
  selectedAnswers: Record<number, string>;
  focusedIndex: number;
  onSelectQuestion: (index: number) => void;
}

export function QuestionMinimap({
  questions,
  checkedQuestions,
  selectedAnswers,
  focusedIndex,
  onSelectQuestion,
}: QuestionMinimapProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#090d16]/90 border border-white/15 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 max-w-[90vw] overflow-x-auto">
      {questions.map((q, idx) => {
        const isAnswered = Boolean(checkedQuestions[idx]);
        const isCorrect =
          isAnswered && selectedAnswers[idx] === q.gabaritoCorreto;
        const isWrong =
          isAnswered && selectedAnswers[idx] !== q.gabaritoCorreto;
        const isFocused = focusedIndex === idx;

        let stateStyles = "bg-white/5 border-white/10 text-slate-400 hover:border-white/30";

        if (isCorrect) {
          stateStyles = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300";
        } else if (isWrong) {
          stateStyles = "bg-rose-500/20 border-rose-500/50 text-rose-300";
        } else if (selectedAnswers[idx]) {
          stateStyles = "bg-indigo-500/30 border-indigo-500/60 text-indigo-200";
        }

        return (
          <button
            key={idx}
            onClick={() => onSelectQuestion(idx)}
            type="button"
            className={`w-8 h-8 rounded-xl font-mono text-xs font-bold border flex items-center justify-center transition-all cursor-pointer shrink-0 ${stateStyles} ${
              isFocused ? "ring-2 ring-indigo-400 scale-110 font-black shadow-lg shadow-indigo-500/20" : ""
            }`}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );
}
