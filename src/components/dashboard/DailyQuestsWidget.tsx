"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Target,
  CheckCircle2,
  Zap,
  Gift,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useGamification } from "@/context/GamificationContext";

interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  claimed: boolean;
}

export function DailyQuestsWidget() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const gamificationContext = useGamification() as unknown as Record<
    string,
    unknown
  >;

  useEffect(() => {
    let isMounted = true;

    async function loadQuests() {
      try {
        const res = await fetch("/api/gamification/quests", {
          cache: "no-store",
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setQuests(data.quests || []);
        }
      } catch (err) {
        console.error("Erro ao carregar quests:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadQuests();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClaim = async (questId: string) => {
    try {
      setClaimingId(questId);
      const res = await fetch("/api/gamification/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuests((prev) =>
          prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q)),
        );

        // Dispara atualização no contexto global caso algum método de recarregamento exista
        if (typeof gamificationContext.refreshStats === "function") {
          (gamificationContext.refreshStats as () => void)();
        } else if (typeof gamificationContext.loadStats === "function") {
          (gamificationContext.loadStats as () => void)();
        } else if (typeof gamificationContext.updateStats === "function") {
          (gamificationContext.updateStats as (val: unknown) => void)({
            totalXp: data.totalXp,
          });
        }
      }
    } catch (err) {
      console.error("Erro ao resgatar quest:", err);
    } finally {
      setClaimingId(null);
    }
  };

  const getActionUrl = (title: string) => {
    if (title.includes("Questões")) return "/questions";
    if (title.includes("Flashcards")) return "/flashcards";
    return "/edital";
  };

  const totalPossibleXp = quests.reduce((acc, q) => acc + q.xpReward, 0);
  const allClaimed = quests.length > 0 && quests.every((q) => q.claimed);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-5 sm:p-6 shadow-2xl backdrop-blur-2xl">
      {/* Header do Widget */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-400">
            <Target size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Missões de Hoje
            </h3>
            <p className="text-[10px] text-slate-400">
              Garanta seu bônus diário de retenção
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
          <Sparkles size={11} className="text-amber-400" />+{totalPossibleXp} XP
        </span>
      </div>

      {/* Lista de Missões */}
      <div className="space-y-3 pt-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse rounded-2xl border border-white/5 bg-slate-900/40"
              />
            ))}
          </div>
        ) : quests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-400">
            Nenhuma missão disponível no momento.
          </div>
        ) : (
          quests.map((quest) => {
            const progress = Math.min(
              100,
              Math.round((quest.currentCount / quest.targetCount) * 100),
            );

            return (
              <div
                key={quest.id}
                className={`relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border p-3.5 transition-all duration-300 ${
                  quest.claimed
                    ? "border-white/5 bg-slate-950/30 opacity-60"
                    : quest.completed
                      ? "border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                      : "border-white/5 bg-slate-950/40 hover:border-white/10"
                }`}
              >
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                      quest.claimed
                        ? "border-slate-800 bg-slate-900 text-slate-500"
                        : quest.completed
                          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                          : "border-white/10 bg-slate-900 text-amber-400"
                    }`}
                  >
                    {quest.claimed ? (
                      <CheckCircle2 size={16} className="text-slate-500" />
                    ) : quest.completed ? (
                      <Gift
                        size={16}
                        className="text-emerald-400 animate-bounce"
                      />
                    ) : (
                      <Zap
                        size={14}
                        className="fill-amber-400/20 text-amber-400"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <h4
                        className={`truncate text-xs font-bold ${
                          quest.claimed
                            ? "text-slate-400 line-through"
                            : "text-slate-200"
                        }`}
                      >
                        {quest.title}
                      </h4>
                      <span className="shrink-0 font-mono text-[10px] text-slate-400 pl-2">
                        {Math.min(quest.currentCount, quest.targetCount)}/
                        {quest.targetCount}
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950">
                      <motion.div
                        className={`h-full rounded-full transition-all ${
                          quest.claimed
                            ? "bg-slate-700"
                            : quest.completed
                              ? "bg-linear-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                              : "bg-linear-to-r from-indigo-500 to-purple-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Ação / Resgate */}
                <div className="shrink-0">
                  {quest.claimed ? (
                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      Resgatado
                    </span>
                  ) : quest.completed ? (
                    <button
                      onClick={() => handleClaim(quest.id)}
                      disabled={claimingId === quest.id}
                      className="cursor-pointer inline-flex items-center gap-1 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-3 py-1.5 font-mono text-[10px] font-black uppercase text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {claimingId === quest.id ? "..." : "Resgatar"}
                    </button>
                  ) : (
                    <Link
                      href={getActionUrl(quest.title)}
                      className="inline-flex items-center gap-1 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-[10px] font-bold text-indigo-300 transition-all hover:bg-indigo-500/20"
                    >
                      Ir <ArrowRight size={11} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {allClaimed && (
        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-center text-[11px] font-bold text-emerald-400">
          ✨ Todas as missões do dia foram concluídas e resgatadas!
        </div>
      )}
    </div>
  );
}
