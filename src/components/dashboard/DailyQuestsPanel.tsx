"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Gift,
  Flame,
  Trophy,
  ArrowRight,
  Layers,
  Target,
  BrainCircuit,
  Clock,
  Sparkles,
  Lock,
  Crown,
  Timer,
} from "lucide-react";
import {
  getDailyQuestsAction,
  claimQuestRewardAction,
  claimDailyChestAction,
  QuestItem,
  DailyChestStatus,
} from "@/actions/quest-actions";
import { useGamification } from "@/context/GamificationContext";

// Síntese de áudio harmônico suave via Web Audio API (zero dependências de arquivos externos)
function playRewardSound(isBigReward = false) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const notes = isBigReward
      ? [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6 (Fanfarra dourada)
      : [659.25, 880.0, 1046.5]; // E5, A5, C6 (Chime suave)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  } catch {
    // Silencioso se bloqueado por políticas de áudio do navegador
  }
}

// Disparo de confetes festivos
function triggerRewardConfetti(isGrand = false) {
  try {
    if (typeof confetti === "function") {
      confetti({
        particleCount: isGrand ? 80 : 40,
        spread: isGrand ? 100 : 60,
        origin: { y: 0.7 },
        colors: isGrand
          ? ["#F59E0B", "#FBBF24", "#EC4899", "#8B5CF6", "#10B981"]
          : ["#8B5CF6", "#A78BFA", "#38BDF8", "#F59E0B"],
        disableForReducedMotion: true,
      });
    }
  } catch {
    // Fallback gracioso
  }
}

// Hook de contagem regressiva até a meia-noite
function useDailyCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calculateTime() {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);

      const diffMs = Math.max(0, midnight.getTime() - now.getTime());
      const totalSeconds = Math.floor(diffMs / 1000);

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(timeLeft.hours)}h ${pad(timeLeft.minutes)}m ${pad(timeLeft.seconds)}s`;
}

function getQuestIcon(iconType?: string) {
  switch (iconType) {
    case "cards":
      return (
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shrink-0">
          <Layers size={14} />
        </div>
      );
    case "notebook":
      return (
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 shrink-0">
          <BrainCircuit size={14} />
        </div>
      );
    case "focus":
      return (
        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 shrink-0">
          <Clock size={14} />
        </div>
      );
    case "questions":
    default:
      return (
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 shrink-0">
          <Target size={14} />
        </div>
      );
  }
}

export function DailyQuestsPanel() {
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [dailyChest, setDailyChest] = useState<DailyChestStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [floatingXp, setFloatingXp] = useState<{ id: string; xp: number } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const { refreshStats } = useGamification();
  const resetCountdown = useDailyCountdown();

  const loadQuests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDailyQuestsAction();
      if (res.success && res.data) {
        // Garantia de desduplicação por título e limite estrito a 3 missões
        const seen = new Set<string>();
        const unique = res.data.filter((q) => {
          if (seen.has(q.title)) return false;
          seen.add(q.title);
          return true;
        });
        const capped = unique.slice(0, 3);
        setQuests(capped);
        if (res.dailyChest) {
          setDailyChest({
            ...res.dailyChest,
            totalQuests: Math.min(3, capped.length || 3),
            completedQuests: capped.filter((q) => q.completed).length,
          });
        }
      }
    } catch (err) {
      console.error("Erro ao carregar missões diárias:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  const handleClaim = (questId: string, xpReward: number) => {
    startTransition(async () => {
      const res = await claimQuestRewardAction(questId);
      if (res.success) {
        playRewardSound(false);
        triggerRewardConfetti(false);
        setFloatingXp({ id: questId, xp: xpReward });
        setTimeout(() => setFloatingXp(null), 2000);

        setQuests((prev) =>
          prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q)),
        );

        if (refreshStats) await refreshStats();
        await loadQuests();
      }
    });
  };

  const handleClaimChest = () => {
    startTransition(async () => {
      const res = await claimDailyChestAction();
      if (res.success) {
        playRewardSound(true);
        triggerRewardConfetti(true);
        setFloatingXp({ id: "chest", xp: 100 });
        setTimeout(() => setFloatingXp(null), 2500);

        setDailyChest((prev) => (prev ? { ...prev, claimed: true } : null));

        if (refreshStats) await refreshStats();
      }
    });
  };

  const completedCount = quests.filter((q) => q.completed).length;

  return (
    <div className="relative flex flex-col justify-start overflow-hidden rounded-3xl border border-violet-500/20 bg-white dark:bg-linear-to-br dark:from-[#0c0f1d] dark:via-[#080b16] dark:to-[#04060d] p-4 sm:p-5 shadow-2xl backdrop-blur-2xl transition-all duration-300 group hover:border-violet-500/35">
      {/* Glow de ambientação no topo */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-violet-500/50 to-transparent" />
      <div className="pointer-events-none absolute -top-20 -left-20 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-600 dark:text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.2)] group-hover:scale-105 transition-transform">
            <Trophy size={16} className="text-violet-600 dark:text-violet-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase">
                Missões Diárias
              </h3>
              <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-300 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30">
                {completedCount}/{Math.min(3, quests.length || 3)} Feito
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
              Metas diárias para acelerar seu ganho de XP e patentes
            </p>
          </div>
        </div>

        {/* Timer regressivo dinâmico */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-950/70 px-2.5 py-1 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-400">
          <Timer size={12} className="text-violet-600 dark:text-violet-400 animate-pulse" />
          <span className="text-slate-800 dark:text-slate-300">{resetCountdown}</span>
        </div>
      </div>

      {/* Lista de Missões */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
          <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <span>Carregando missões de hoje...</span>
        </div>
      ) : (
        <div className="space-y-2 pt-2.5">
          {quests.slice(0, 3).map((quest) => {
            const progress = Math.min(
              100,
              Math.round(
                (quest.currentCount / Math.max(1, quest.targetCount)) * 100,
              ),
            );

            return (
              <div
                key={quest.id}
                className={`relative overflow-hidden p-2.5 sm:p-3 rounded-xl border transition-all duration-300 ${
                  quest.claimed
                    ? "bg-slate-100/70 dark:bg-white/[0.015] border-slate-200 dark:border-white/5 opacity-60"
                    : quest.completed
                      ? "bg-violet-50 dark:bg-linear-to-r dark:from-violet-950/30 dark:via-slate-900/60 dark:to-indigo-950/20 border-violet-300 dark:border-violet-500/40 shadow-xs dark:shadow-[0_0_20px_rgba(139,92,246,0.12)]"
                      : "bg-white hover:bg-slate-50 dark:bg-[#060911]/80 dark:hover:bg-[#070b16] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-xs"
                }`}
              >
                {/* Floating XP Toast */}
                <AnimatePresence>
                  {floatingXp?.id === quest.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: [0, 1, 1, 0], y: -24, scale: 1.1 }}
                      transition={{ duration: 1.6, ease: "easeOut" }}
                      className="pointer-events-none absolute right-4 top-2 z-20 flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 font-mono text-xs font-black text-amber-300 shadow-lg backdrop-blur-md"
                    >
                      <Sparkles size={12} className="text-amber-400" />
                      <span>+{floatingXp.xp} XP</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    {getQuestIcon(quest.iconType)}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                          {quest.title}
                        </span>
                        <span className="text-[9px] font-mono font-black text-amber-700 dark:text-amber-400 flex items-center gap-0.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.2 rounded-md">
                          <Flame size={10} className="fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
                          +{quest.xpReward} XP
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
                        {quest.description}
                      </p>

                      {/* Botão de Atalho Rápido ("Fazer Agora") se ainda pendente */}
                      {!quest.completed && !quest.claimed && quest.actionUrl && (
                        <div className="pt-1.5">
                          <Link
                            href={quest.actionUrl}
                            className="inline-flex items-center gap-1 text-[9px] font-extrabold text-violet-700 hover:text-violet-900 dark:text-violet-300 dark:hover:text-white bg-violet-100 hover:bg-violet-200 dark:bg-violet-500/10 dark:hover:bg-violet-500/20 border border-violet-300 dark:border-violet-500/25 px-2 py-0.5 rounded-md transition-all duration-200 group/btn"
                          >
                            <span>{quest.actionLabel || "Iniciar"}</span>
                            <ArrowRight
                              size={9}
                              className="group-hover/btn:translate-x-0.5 transition-transform"
                            />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ação de Resgate ou Status */}
                  <div className="shrink-0 pt-0.5">
                    {quest.claimed ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-2 py-0.5 rounded-lg">
                        <CheckCircle2 size={11} className="text-emerald-500 dark:text-emerald-400" />
                        <span>Resgatado</span>
                      </span>
                    ) : quest.completed ? (
                      <button
                        onClick={() => handleClaim(quest.id, quest.xpReward)}
                        disabled={isPending}
                        className="px-3 py-1 bg-linear-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-[10px] rounded-lg shadow-md shadow-violet-600/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                      >
                        <Gift size={12} />
                        <span>Resgatar</span>
                      </button>
                    ) : (
                      <span className="font-mono text-[9px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-2 py-0.5 rounded-md">
                        {quest.currentCount}/{quest.targetCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra de Progresso com Gradiente Fluido */}
                {!quest.claimed && (
                  <div className="mt-2 w-full bg-slate-200 dark:bg-slate-950/80 rounded-full h-1 overflow-hidden border border-slate-300/40 dark:border-white/5">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        quest.completed
                          ? "bg-linear-to-r from-violet-500 via-fuchsia-400 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          : "bg-linear-to-r from-indigo-500 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]"
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

      {/* ================= BAÚ DE MAESTRIA DIÁRIA (BÔNUS 3/3) ================= */}
      {dailyChest && (
        <div className="pt-2.5 border-t border-slate-200 dark:border-white/5">
          {dailyChest.claimed ? (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 flex items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/25">
                  <Crown size={14} />
                </div>
                <div>
                  <span className="font-black text-emerald-900 dark:text-emerald-300 text-[11px] block">
                    Baú de Maestria Resgatado!
                  </span>
                  <span className="text-[9px] text-emerald-700 dark:text-slate-400 font-medium">
                    100% das missões de hoje concluídas (+100 XP coletados).
                  </span>
                </div>
              </div>
              <span className="font-mono text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-2 py-0.5 rounded-md">
                ✓ 3/3 Feito
              </span>
            </div>
          ) : dailyChest.unlocked ? (
            <div className="relative overflow-hidden rounded-xl border border-amber-500/40 bg-linear-to-r from-amber-500/10 via-amber-100/50 to-amber-500/10 dark:from-amber-950/40 dark:via-[#181308] dark:to-amber-900/30 p-2.5 shadow-sm dark:shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 shadow-xs animate-pulse">
                  <Sparkles size={15} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-amber-900 dark:text-amber-200 text-[11px] tracking-tight">
                      Baú Desbloqueado!
                    </span>
                    <span className="text-[9px] font-mono font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-1 py-0.2 rounded-sm border border-amber-300 dark:border-amber-500/30">
                      +100 XP
                    </span>
                  </div>
                  <p className="text-[9px] text-amber-800 dark:text-amber-200/70 truncate">
                    Todas as 3 missões foram concluídas hoje.
                  </p>
                </div>
              </div>

              <button
                onClick={handleClaimChest}
                disabled={isPending}
                className="shrink-0 px-3 py-1 bg-linear-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[10px] rounded-lg shadow-md shadow-amber-500/30 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Gift size={12} className="text-slate-950" />
                <span>Abrir Baú</span>
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50 p-2.5 flex items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 rounded-lg bg-slate-200/80 dark:bg-white/5 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-white/5">
                  <Lock size={12} />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-800 dark:text-slate-300 text-[10px] block truncate">
                    Baú de Maestria Diária (+100 XP)
                  </span>
                  <span className="text-[9px] text-slate-600 dark:text-slate-500 font-medium block truncate">
                    Complete todas as missões de hoje para abrir.
                  </span>
                </div>
              </div>
              <span className="font-mono text-[9px] font-bold text-slate-700 dark:text-slate-400 bg-slate-200/80 dark:bg-white/5 border border-slate-300 dark:border-white/5 px-2 py-0.5 rounded-md shrink-0">
                {dailyChest.completedQuests}/{dailyChest.totalQuests}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
