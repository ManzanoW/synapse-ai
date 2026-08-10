"use client";

import React from "react";
import { Play, X } from "lucide-react";
import { QuestaoIA } from "../page";

export interface PausedSession {
  quizId?: string | null;
  banca: string;
  questions: QuestaoIA[];
  selectedAnswers: Record<number, string>;
  checkedQuestions: Record<number, boolean>;
  createdFlashcards: Record<number, boolean>;
  timerSeconds?: number;
}

interface ResumeSessionCardProps {
  session: PausedSession;
  onResume: () => void;
  onDiscard: (e: React.MouseEvent) => void;
}

export function ResumeSessionCard({
  session,
  onResume,
  onDiscard,
}: ResumeSessionCardProps) {
  const answeredCount = Object.keys(session.checkedQuestions || {}).length;
  const totalCount = session.questions?.length || 0;

  return (
    <div className="relative overflow-hidden bg-linear-to-r from-emerald-950/40 via-[#090d16] to-[#090d16] border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 animate-in slide-in-from-top-3 duration-300">
      <div className="space-y-2 relative z-10 max-w-lg">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
            Simulado em Andamento
          </span>
        </div>
        <h3 className="text-base font-bold text-white">
          {session.banca} — {totalCount} Questões
        </h3>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>
            <strong className="text-emerald-300">{answeredCount}</strong> de{" "}
            {totalCount} respondidas
          </span>
          <span>•</span>
          <div className="w-24 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{
                width: `${totalCount > 0 ? (answeredCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto relative z-10">
        <button
          onClick={onResume}
          className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
        >
          <Play size={14} className="fill-slate-950" />
          Continuar de onde parou
        </button>
        <button
          onClick={onDiscard}
          className="p-2.5 bg-slate-900/80 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/40 text-slate-500 hover:text-rose-400 rounded-xl transition-all"
          title="Descartar simulado pausado"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
