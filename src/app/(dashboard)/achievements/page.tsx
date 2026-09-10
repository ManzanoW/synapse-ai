"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Award,
  Lock,
  Sparkles,
  Flame,
  Zap,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ACHIEVEMENTS, UserAchievementProgress } from "@/lib/achievements";
import { useGamification } from "@/context/GamificationContext";

// Configuração de Raridades das Badges
const RARITY_CONFIG: Record<
  string,
  { label: string; border: string; bg: string; text: string; glow: string }
> = {
  first_step: {
    label: "COMUM",
    border: "border-slate-500/30",
    bg: "bg-slate-500/10",
    text: "text-slate-300",
    glow: "shadow-[0_0_15px_rgba(148,163,184,0.15)]",
  },
  fire_starter: {
    label: "RARA",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.2)]",
  },
  fire_master: {
    label: "ÉPICA",
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.25)]",
  },
  card_master: {
    label: "ÉPICA",
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.25)]",
  },
  xp_rookie: {
    label: "LENDÁRIA",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.3)]",
  },
  level_5: {
    label: "LENDÁRIA",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.3)]",
  },
};

export default function AchievementsPage() {
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<UserAchievementProgress[]>(
    [],
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const { refreshStats } = useGamification();

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const res = await fetch("/api/achievements");
        if (res.ok) {
          const data = await res.json();
          setProgressData(data.progress || []);
        }
      } catch (err) {
        console.error("Erro ao carregar conquistas:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, []);

  // Handler para processar o resgate de XP da conquista
  const handleClaimXp = async (achievementId: string) => {
    setClaimingId(achievementId);
    try {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievementId }),
      });

      if (res.ok) {
        // Marca como resgatado no estado local
        setProgressData((prev) =>
          prev.map((item) =>
            item.achievementId === achievementId
              ? { ...item, isClaimed: true }
              : item,
          ),
        );

        // Atualiza as estatísticas globais (Sidebar / XP)
        if (refreshStats) {
          await refreshStats();
        }
      }
    } catch (err) {
      console.error("Erro ao resgatar XP da conquista:", err);
    } finally {
      setClaimingId(null);
    }
  };

  const combinedAchievements = ACHIEVEMENTS.map((badge) => {
    const userProgress = progressData.find((p) => p.achievementId === badge.id);
    return {
      ...badge,
      currentValue: userProgress?.currentValue ?? 0,
      isUnlocked: userProgress?.isUnlocked ?? false,
      isClaimed: userProgress?.isClaimed ?? false,
      unlockedAt: userProgress?.unlockedAt,
    };
  });

  const unlockedList = combinedAchievements.filter((a) => a.isUnlocked);
  const unlockedCount = unlockedList.length;
  const totalCount = ACHIEVEMENTS.length;

  // Soma de XP de todas as conquistas resgatadas
  const totalXpEarned = combinedAchievements
    .filter((a) => a.isClaimed)
    .reduce((acc, curr) => acc + curr.xpReward, 0);

  const latestUnlocked =
    unlockedList.length > 0 ? unlockedList[unlockedList.length - 1] : null;

  const filteredAchievements = combinedAchievements.filter((a) => {
    if (selectedCategory === "ALL") return true;
    return a.category === selectedCategory;
  });

  return (
    <div className="relative min-h-screen bg-[#02050e] p-4 text-slate-100 selection:bg-amber-500/30 md:p-8 font-sans antialiased overflow-hidden">
      {/* Luz Ambiente Neon de Fundo */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-125 w-125 rounded-full bg-amber-500/10 blur-[150px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-100 w-100 rounded-full bg-purple-500/10 blur-[130px]" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        {/* ================= 1. CABEÇALHO ================= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors mb-2 cursor-pointer group"
            >
              <ArrowLeft
                size={14}
                className="text-amber-400 transition-transform group-hover:-translate-x-1"
              />{" "}
              Dashboard
            </Link>
            <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-black tracking-tight text-white">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                <Trophy size={22} />
              </div>
              Hall de Conquistas
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Desbloqueie insígnias conforme fortalece sua rotina de estudos e
              evolui na plataforma.
            </p>
          </div>

          {/* BADGE TOTAL XP DE CONQUISTAS */}
          <div className="flex items-center gap-3.5 rounded-3xl border border-amber-500/30 bg-linear-to-r from-amber-500/10 to-transparent p-4 shadow-2xl backdrop-blur-2xl">
            <div className="rounded-2xl bg-amber-500/20 p-3 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                XP de Conquistas Resgatado
              </span>
              <span className="font-mono text-2xl font-black text-white">
                +{totalXpEarned} XP
              </span>
            </div>
          </div>
        </div>

        {/* ================= 2. HERO CARD: ÚLTIMA CONQUISTA DESBLOQUEADA ================= */}
        {latestUnlocked && (
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-linear-to-r from-amber-500/10 via-[#070b16] to-purple-500/10 p-6 backdrop-blur-2xl shadow-2xl">
            <div className="pointer-events-none absolute top-0 right-0 left-0 h-px bg-linear-to-r from-transparent via-amber-400/60 to-transparent" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/20 text-3xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  {latestUnlocked.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-[9px] font-mono font-bold text-amber-300 uppercase tracking-widest">
                      Última Conquista
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar size={11} /> Recente
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">
                    {latestUnlocked.title}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {latestUnlocked.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                {latestUnlocked.isClaimed ? (
                  <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 font-mono text-xs font-bold text-emerald-400 flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={14} /> +{latestUnlocked.xpReward} XP
                    Recompensados
                  </span>
                ) : (
                  <button
                    onClick={() => handleClaimXp(latestUnlocked.id)}
                    disabled={claimingId === latestUnlocked.id}
                    className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs py-2 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    {claimingId === latestUnlocked.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Resgatar +{latestUnlocked.xpReward} XP</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. MÉTRICAS DE PROGRESSO GERAL ================= */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-5 backdrop-blur-2xl shadow-xl">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Conquistas Desbloqueadas
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-black text-amber-400">
                {unlockedCount}
              </span>
              <span className="font-mono text-xs font-semibold text-slate-500">
                / {totalCount}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-5 backdrop-blur-2xl shadow-xl">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Taxa de Conclusão
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-black text-emerald-400">
                {Math.round((unlockedCount / totalCount) * 100)}%
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-5 backdrop-blur-2xl shadow-xl">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Próximo Marco
            </span>
            <p className="mt-2 truncate text-sm font-bold text-slate-200">
              {combinedAchievements.find((a) => !a.isUnlocked)?.title ||
                "Todas Desbloqueadas!"}
            </p>
          </div>
        </div>

        {/* ================= 4. FILTROS / CATEGORIAS ================= */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {[
            { id: "ALL", label: "Todas", icon: ShieldCheck },
            { id: "STREAK", label: "Constância", icon: Flame },
            { id: "REVIEWS", label: "Revisões", icon: Award },
            { id: "XP", label: "Experiência (XP)", icon: Zap },
            { id: "MASTERY", label: "Domínio", icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                  isActive
                    ? "border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "border-white/5 bg-slate-950/40 text-slate-400 hover:border-white/10 hover:text-white"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ================= 5. GRID DE BADGES ================= */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin text-amber-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredAchievements.map((badge) => {
                const percent = Math.min(
                  100,
                  Math.round((badge.currentValue / badge.targetValue) * 100),
                );

                const rarity = RARITY_CONFIG[badge.id] || {
                  label: "COMUM",
                  border: "border-slate-500/30",
                  bg: "bg-slate-500/10",
                  text: "text-slate-300",
                  glow: "",
                };

                return (
                  <motion.div
                    key={badge.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`relative overflow-hidden rounded-3xl border p-5 backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between ${
                      badge.isUnlocked
                        ? `border-amber-500/30 bg-linear-to-br from-[#090d16] to-[#05070e] ${rarity.glow} hover:border-amber-500/50`
                        : "border-white/5 bg-slate-950/40 opacity-60 hover:opacity-90"
                    }`}
                  >
                    {badge.isUnlocked && (
                      <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-amber-500/10 blur-xl" />
                    )}

                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-3xl shadow-md ${
                            badge.isUnlocked
                              ? "border-amber-500/40 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                              : "border-white/10 bg-slate-900/80 text-slate-500"
                          }`}
                        >
                          {badge.isUnlocked ? (
                            badge.icon
                          ) : (
                            <Lock size={20} className="text-slate-500" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold tracking-widest ${rarity.border} ${rarity.bg} ${rarity.text}`}
                          >
                            {rarity.label}
                          </span>

                          <span
                            className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold ${
                              badge.isUnlocked
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                                : "border-white/5 bg-slate-900 text-slate-500"
                            }`}
                          >
                            +{badge.xpReward} XP
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">
                            {badge.title}
                          </h3>
                          {badge.isUnlocked && (
                            <CheckCircle2
                              size={15}
                              className="text-emerald-400"
                            />
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-400 leading-relaxed min-h-9">
                          {badge.description}
                        </p>
                      </div>
                    </div>

                    {/* BARRA DE PROGRESSO E AÇÃO DE RESGATE */}
                    <div className="mt-4 border-t border-white/5 pt-3 space-y-3">
                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span>Progresso</span>
                          <span className="font-bold">
                            {badge.currentValue}/{badge.targetValue}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-950 p-0.5 border border-white/5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              badge.isUnlocked
                                ? "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                                : "bg-indigo-500/50"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* BOTÃO DINÂMICO DE RESGATE */}
                      {badge.isUnlocked && !badge.isClaimed ? (
                        <button
                          onClick={() => handleClaimXp(badge.id)}
                          disabled={claimingId === badge.id}
                          className="w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs py-2 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {claimingId === badge.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <Sparkles size={14} />
                              <span>Resgatar +{badge.xpReward} XP</span>
                            </>
                          )}
                        </button>
                      ) : badge.isClaimed ? (
                        <div className="w-full text-center py-1.5 text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          ✓ XP Resgatado
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
