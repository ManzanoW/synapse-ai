"use client";

import React, { useEffect, useRef } from "react";
import { FileSpreadsheet, Zap, Camera } from "lucide-react";
import { QuestaoIA } from "../page";

interface QuestionMinimapProps {
  questions: QuestaoIA[];
  checkedQuestions: Record<number, boolean>;
  selectedAnswers: Record<number, string>;
  flaggedQuestions: Record<number, boolean>;
  focusedIndex: number;
  onSelectQuestion: (index: number) => void;
  onOpenOpticalSheet?: () => void;
  onOpenSpeedQuiz?: () => void;
  onOpenScanner?: () => void;
}

export function QuestionMinimap({
  questions,
  checkedQuestions,
  selectedAnswers,
  flaggedQuestions,
  focusedIndex,
  onSelectQuestion,
  onOpenOpticalSheet,
  onOpenSpeedQuiz,
  onOpenScanner,
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
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4.75rem)] sm:bottom-6 left-0 right-0 z-30 px-3 pointer-events-none flex justify-center">
      <div className="bg-[#090d16]/95 border border-white/10 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl flex items-center justify-between gap-2 pointer-events-auto max-w-lg w-full">
        {onOpenOpticalSheet && (
          <button
            type="button"
            onClick={onOpenOpticalSheet}
            className="shrink-0 px-2 sm:px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
            title="Abrir Folha Óptica de Respostas (Cartão-Resposta)"
          >
            <FileSpreadsheet size={14} className="text-indigo-400" />
            <span className="hidden sm:inline text-[11px]">Folha Óptica</span>
          </button>
        )}

        {onOpenSpeedQuiz && (
          <button
            type="button"
            onClick={onOpenSpeedQuiz}
            className="shrink-0 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
            title="Desafio Relâmpago 45s (Speed Quiz)"
          >
            <Zap size={14} className="text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline text-[11px]">Speed</span>
          </button>
        )}

        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="shrink-0 px-2 sm:px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
            title="Scanner OCR de Questões (Visão IA)"
          >
            <Camera size={14} className="text-cyan-400" />
            <span className="hidden sm:inline text-[11px]">Scanner</span>
          </button>
        )}

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
