"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Sparkles, CheckCircle2, Gift, Flame, Trophy } from "lucide-react";
import {
  getDailyQuestsAction,
  claimQuestRewardAction,
  QuestItem,
} from "@/actions/quest-actions";
import { useGamification } from "@/context/GamificationContext";

export function DailyQuestsPanel() {
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { refreshStats } = useGamification();

  const loadQuests = async () => {
    setLoading(true);
    const res = await getDailyQuestsAction();
    if (res.success && res.data) {
      setQuests(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuests();
  }, []);

  const handleClaim = (questId: string) => {
    startTransition(async () => {
      const res = await claimQuestRewardAction(questId);
      if (res.success) {
        setQuests((prev) =>
          prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
        );
        if (refreshStats) await refreshStats();
      }
    });
  };

  const completedCount = quests.filter((q) => q.completed).length;

  return (
    <div className="bg-[#090d16] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Trophy size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Missões Diárias
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {completedCount}/{quests.length} Concluídas
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Complete os objetivos do dia para acelerar seus ganhos de XP.
            </p>
          </div>
        </div>
      </div>

      {/* Quest List */}
      {loading ? (
        <div className="py-6 flex justify-center text-xs text-slate-500">
          <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {quests.map((quest) => {
            const progress = Math.min(
              100,
              Math.round((quest.currentCount / Math.max(1, quest.targetCount)) * 100)
            );

            return (
              <div
                key={quest.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  quest.claimed
                    ? "bg-white/[0.02] border-white/5 opacity-60"
                    : quest.completed
                    ? "bg-violet-950/20 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                    : "bg-[#060911] border-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        {quest.title}
                      </span>
                      <span className="text-[10px] font-mono font-extrabold text-amber-400 flex items-center gap-0.5">
                        <Flame size={11} /> +{quest.xpReward} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {quest.description}
                    </p>
                  </div>

                  {/* Botão de Resgate / Status */}
                  <div className="shrink-0 pt-0.5">
                    {quest.claimed ? (
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 size={12} /> Resgatado
                      </span>
                    ) : quest.completed ? (
                      <button
                        onClick={() => handleClaim(quest.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-[11px] rounded-lg shadow-lg shadow-violet-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Gift size={12} /> Resgatar
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-1 rounded-md">
                        {quest.currentCount}/{quest.targetCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {!quest.claimed && (
                  <div className="mt-2.5 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-white/5">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        quest.completed
                          ? "bg-linear-to-r from-violet-500 to-emerald-400"
                          : "bg-linear-to-r from-indigo-500 to-violet-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
