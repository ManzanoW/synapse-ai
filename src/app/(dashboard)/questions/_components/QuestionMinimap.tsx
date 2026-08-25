"use client";

import React from "react";
import { Flag } from "lucide-react";
import { QuestaoIA } from "../page";

interface QuestionMinimapProps {
  questions: QuestaoIA[];
  checkedQuestions: Record<number, boolean>;
  selectedAnswers: Record<number, string>;
  flaggedQuestions?: Record<number, boolean>;
  focusedIndex: number;
  onSelectQuestion: (index: number) => void;
}

export function QuestionMinimap({
  questions,
  checkedQuestions,
  selectedAnswers,
  flaggedQuestions = {},
  focusedIndex,
  onSelectQuestion,
}: QuestionMinimapProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-full px-4">
      <div className="bg-[#090d16]/95 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl px-4 py-2.5 flex items-center gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[80vw] sm:max-w-md md:max-w-lg scrollbar-none py-0.5">
          {questions.map((q, idx) => {
            const isChecked = Boolean(checkedQuestions[idx]);
            const isFlagged = Boolean(flaggedQuestions[idx]);
            const isFocused = idx === focusedIndex;
            const userAnswer = selectedAnswers[idx];
            const isCorrect = isChecked && userAnswer === q.gabaritoCorreto;

            let statusStyles = "bg-white/5 border-white/10 text-slate-400 hover:border-white/30";

            if (isChecked) {
              if (isCorrect) {
                statusStyles = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold";
              } else {
                statusStyles = "bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold";
              }
            } else if (userAnswer) {
              statusStyles = "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-bold";
            }

            return (
              <button
                key={`minimap-item-${idx}`}
                type="button"
                onClick={() => onSelectQuestion(idx)}
                className={`relative shrink-0 w-8 h-8 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center border cursor-pointer ${statusStyles} ${
                  isFocused ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#02050e] scale-105" : ""
                }`}
              >
                <span>{idx + 1}</span>

                {/* ÍCONE DE BANDEIRA / DÚVIDA */}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 border border-[#02050e] rounded-full flex items-center justify-center shadow-xs">
                    <Flag size={7} className="text-slate-950 fill-slate-950" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* MENSAGEM DE NAVEGAÇÃO */}
        <div className="hidden lg:flex items-center gap-1.5 border-l border-white/10 pl-3 text-[10px] text-slate-400 font-mono">
          <span className="bg-white/10 px-1.5 py-0.5 rounded text-slate-300">↑↓</span>
          <span>Navegar</span>
        </div>
      </div>
    </div>
  );
}
