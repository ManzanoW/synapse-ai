"use client";

import React, { useState } from "react";
import { Clock, Pause, Play, Eye, EyeOff } from "lucide-react";

interface FloatingTimerProps {
  seconds: number;
  isRunning: boolean;
  onToggleTimer: () => void;
}

export function FloatingTimer({
  seconds,
  isRunning,
  onToggleTimer,
}: FloatingTimerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return hrs > 0
      ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="fixed top-6 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-[#090d16]/90 border border-indigo-500/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-mono font-bold text-indigo-300 shadow-2xl flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Clock
            size={14}
            className={
              isRunning ? "animate-pulse text-emerald-400" : "text-slate-500"
            }
          />
          <span className="min-w-12 text-center">
            {isVisible ? formatTimer(seconds) : "••:••"}
          </span>
        </div>

        <div className="h-3.5 w-px bg-slate-800" />

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleTimer}
            type="button"
            className="p-1 hover:bg-slate-800/80 rounded-md text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
            title={isRunning ? "Pausar cronômetro" : "Retomar cronômetro"}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
          </button>

          <button
            onClick={() => setIsVisible((prev) => !prev)}
            type="button"
            className="p-1 hover:bg-slate-800/80 rounded-md text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
            title={isVisible ? "Ocultar tempo" : "Exibir tempo"}
          >
            {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}
