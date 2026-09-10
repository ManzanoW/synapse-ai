"use client";

import React from "react";
import { Zap, Flame } from "lucide-react";

interface GamificationCardProps {
  totalXp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  currentLevelXp: number;
  streakDays: number;
}

export function GamificationCard({
  totalXp = 0,
  level = 1,
  levelTitle = "Novato",
  nextLevelXp = 1000,
  currentLevelXp = 0,
  streakDays = 0,
}: GamificationCardProps) {
  const xpInCurrentLevel = totalXp - currentLevelXp;
  const xpNeededForNext = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(
    Math.round((xpInCurrentLevel / (xpNeededForNext || 1)) * 100),
    100,
  );

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#090d16] via-[#0b1021] to-[#05070e] border border-amber-500/20 p-6 shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-lg shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            {level}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Nível Atual
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              {levelTitle}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs font-bold shadow-sm">
          <Flame size={16} className="animate-bounce" />
          <span>{streakDays} dias seguidos</span>
        </div>
      </div>

      <div className="pt-4 space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            <Zap size={13} className="text-amber-400" /> XP Total:{" "}
            <strong className="text-white">{totalXp}</strong>
          </span>
          <span className="text-amber-400 font-bold">{progressPercent}%</span>
        </div>

        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-linear-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>{currentLevelXp} XP</span>
          <span>Próximo Nível: {nextLevelXp} XP</span>
        </div>
      </div>
    </div>
  );
}
