'use client';

import React from 'react';
import { Sparkles, Zap } from 'lucide-react';

interface SimulationPanelProps {
  subjects: { name: string; color: string }[];
  onSimulate: (name: string) => void;
}

export default function SimulationPanel({ subjects, onSimulate }: SimulationPanelProps) {
  return (
    <div className="bg-[#090d16] border border-dashed border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
        <Sparkles size={16} className="text-amber-400 animate-pulse" />
        <h3 className="font-semibold text-sm text-slate-200">Evolution Simulator (Dev)</h3>
      </div>
      
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Click on a subject below to simulate a complete study cycle (boosts progress, accuracy, and appends new flashcards).
      </p>

      <div className="space-y-2">
        {subjects.map((sub, idx) => (
          <button
            key={idx}
            onClick={() => onSimulate(sub.name)}
            className="w-full flex items-center justify-between bg-slate-950/40 hover:bg-slate-900/60 border border-slate-900 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-slate-100 transition-all active:scale-[0.99] group text-left"
          >
            <span className="truncate font-medium">{sub.name}</span>
            <div className="flex items-center gap-1 text-[10px] text-amber-500 opacity-60 group-hover:opacity-100 transition-opacity">
              <span>Study</span>
              <Zap size={12} className="fill-amber-500/20" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}