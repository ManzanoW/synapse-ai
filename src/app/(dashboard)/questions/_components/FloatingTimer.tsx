"use client";

import React from "react";
import { Clock } from "lucide-react";

interface FloatingTimerProps {
  seconds: number;
  isRunning: boolean;
}

export function FloatingTimer({ seconds, isRunning }: FloatingTimerProps) {
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
      <div className="bg-[#090d16]/90 border border-indigo-500/40 backdrop-blur-md px-4 py-2 rounded-full text-xs font-mono font-bold text-indigo-300 shadow-2xl flex items-center gap-2">
        <Clock
          size={14}
          className={
            isRunning ? "animate-pulse text-emerald-400" : "text-slate-500"
          }
        />
        <span>{formatTimer(seconds)}</span>
      </div>
    </div>
  );
}
