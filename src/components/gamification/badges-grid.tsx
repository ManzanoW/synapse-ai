"use client";

import React from "react";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { Award, Lock } from "lucide-react";

interface BadgesGridProps {
  unlockedIds: string[];
}

export function BadgesGrid({ unlockedIds }: BadgesGridProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-6 backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-amber-400" />
          <h3 className="text-xs font-bold tracking-widest text-slate-300 uppercase">
            Conquistas
          </h3>
        </div>
        <span className="font-mono text-xs font-bold text-amber-400">
          {unlockedIds.length}/4
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACHIEVEMENTS.map((badge) => {
          const isUnlocked = unlockedIds.includes(badge.id);

          return (
            <div
              key={badge.id}
              className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                isUnlocked
                  ? "border-amber-500/30 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                  : "border-white/5 bg-slate-950/40 opacity-50"
              }`}
            >
              <div className="text-3xl mb-2">
                {isUnlocked ? (
                  badge.icon
                ) : (
                  <Lock size={20} className="text-slate-500" />
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-200">
                {badge.title}
              </h4>
              <p className="mt-1 text-[10px] text-slate-400 line-clamp-2">
                {badge.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
