"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Trophy,
  Shield,
  ShieldCheck,
  Award,
  Crown,
  Sparkles,
  Flame,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
  Gift,
  HelpCircle,
  FileStack,
  Layers,
  PenTool,
  Headphones,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  LeagueTier,
  LEAGUE_TIERS,
  LeaderboardMember,
  WeeklyChallengeItem,
  WeeklyChestStatus,
} from "@/lib/gamification/leagues";
import {
  getUserLeagueDataAction,
  getWeeklyChallengesAction,
  claimWeeklyChallengeAction,
  claimWeeklyChestAction,
  UserLeagueData,
} from "@/actions/league-actions";
import { useGamification } from "@/context/GamificationContext";

// Síntese de áudio suave para celebração de conquistas
function playCelebrationSound(isGrand = false) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const notes = isGrand
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5] // Fanfarra estendida C5-E6
      : [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  } catch {
    // Ignora restrições do navegador
  }
}

function triggerConfetti(isGrand = false) {
  try {
    if (typeof confetti === "function") {
      confetti({
        particleCount: isGrand ? 90 : 45,
        spread: isGrand ? 100 : 65,
        origin: { y: 0.65 },
        colors: ["#F59E0B", "#FBBF24", "#06B6D4", "#8B5CF6", "#10B981"],
        disableForReducedMotion: true,
      });
    }
  } catch {
    // Silencioso
  }
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"ranking" | "challenges" | "rules">("ranking");
  const [leagueData, setLeagueData] = useState<UserLeagueData | null>(null);
  const [challenges, setChallenges] = useState<WeeklyChallengeItem[]>([]);
  const [chestStatus, setChestStatus] = useState<WeeklyChestStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimingChest, setClaimingChest] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  const { refreshStats } = useGamification();

  // Carrega dados iniciais
  const loadData = async () => {
    setLoading(true);
    try {
      const [leagueRes, challengesRes] = await Promise.all([
        getUserLeagueDataAction(),
        getWeeklyChallengesAction(),
      ]);

      if (leagueRes.success && leagueRes.data) {
        setLeagueData(leagueRes.data);
      }
      if (challengesRes.success && challengesRes.challenges) {
        setChallenges(challengesRes.challenges);
        setChestStatus(challengesRes.chestStatus || null);
      }
    } catch (err) {
      console.error("Erro ao carregar liga semanal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer regressivo até domingo 23:59:59
  useEffect(() => {
    if (!leagueData?.endOfWeekIso) return;

    function tick() {
      const diff = Math.max(0, new Date(leagueData!.endOfWeekIso).getTime() - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      setTimeLeft({ days, hours, minutes });
    }

    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [leagueData?.endOfWeekIso]);

  // Resgatar desafio individual
  const handleClaimChallenge = async (challengeId: string) => {
    setClaimingId(challengeId);
    try {
      const res = await claimWeeklyChallengeAction(challengeId);
      if (res.success) {
        playCelebrationSound(false);
        triggerConfetti(false);
        // Atualiza estado local
        setChallenges((prev) =>
          prev.map((c) => (c.id === challengeId ? { ...c, claimed: true } : c))
        );
        if (refreshStats) refreshStats();
        // Recarrega status dos desafios para atualizar baú
        const cRes = await getWeeklyChallengesAction();
        if (cRes.success && cRes.chestStatus) {
          setChestStatus(cRes.chestStatus);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaimingId(null);
    }
  };

  // Resgatar Baú Semanal Épico
  const handleClaimChest = async () => {
    setClaimingChest(true);
    try {
      const res = await claimWeeklyChestAction();
      if (res.success) {
        playCelebrationSound(true);
        triggerConfetti(true);
        setChestStatus((prev) => (prev ? { ...prev, isClaimed: true } : null));
        if (refreshStats) refreshStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaimingChest(false);
    }
  };

  const tier = leagueData?.tier || "BRONZE";
  const config = LEAGUE_TIERS[tier];
  const userRank = leagueData?.currentUserRank || 1;
  const userZone = leagueData?.currentUserZone || "MAINTENANCE";
  const leaderboard = leagueData?.leaderboard || [];

  // Pódio: os 3 primeiros colocados
  const top3 = leaderboard.slice(0, 3);
  const remainingRanks = leaderboard.slice(3);

  // Render do Ícone da Liga Atual
  const renderTierIcon = (t: LeagueTier, className = "h-8 w-8") => {
    switch (t) {
      case "DIAMOND":
        return <Crown className={`${className} text-cyan-400`} />;
      case "GOLD":
        return <Award className={`${className} text-amber-400`} />;
      case "SILVER":
        return <ShieldCheck className={`${className} text-slate-300`} />;
      default:
        return <Shield className={`${className} text-amber-600`} />;
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* ================= 1. HERO BANNER DA LIGA ATUAL ================= */}
      <div
        className={`relative overflow-hidden rounded-3xl border ${config.borderColor} bg-gradient-to-br ${config.gradient} p-6 sm:p-8 backdrop-blur-2xl shadow-2xl transition-all`}
      >
        {/* Glow de fundo */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: config.glowColor }}
        />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Brasão Flutuante */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border-2 ${config.borderColor} bg-slate-950/70 shadow-[0_0_30px_rgba(0,0,0,0.5)]`}
            >
              {renderTierIcon(tier, "h-11 w-11")}
              <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 border border-white/20 text-sm shadow">
                {config.badge}
              </div>
            </motion.div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-500 dark:text-amber-400">
                  Ciclo Semanal Ativo
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                  <Clock className="h-3 w-3 text-amber-500" />
                  Termina em {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                {config.name}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                {config.description}
              </p>
            </div>
          </div>

          {/* Cartão de Posição do Aluno */}
          <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-xl backdrop-blur-xl shrink-0">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Sua Classificação
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-black text-slate-900 dark:text-white">
                  #{userRank}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  / 20
                </span>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-200 dark:bg-white/10" />

            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                XP da Semana
              </span>
              <div className="flex items-center gap-1.5 text-lg font-black text-amber-600 dark:text-amber-400">
                <Sparkles className="h-4 w-4" />
                <span>+{(leagueData?.weeklyXp || 0).toLocaleString("pt-BR")} XP</span>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-200 dark:bg-white/10" />

            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Status Atual
              </span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                  userZone === "PROMOTION"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : userZone === "DEMOTION"
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                    : "bg-slate-500/20 text-slate-600 dark:text-slate-300"
                }`}
              >
                {userZone === "PROMOTION" ? "⬆️ Promoção" : userZone === "DEMOTION" ? "⬇️ Risco" : "⏸️ Estável"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. NAVEGAÇÃO DE ABAS ================= */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab("ranking")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === "ranking"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Tabela da Liga</span>
          </button>

          <button
            onClick={() => setActiveTab("challenges")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === "challenges"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            <Gift className="h-4 w-4" />
            <span>Desafios da Semana</span>
            {challenges.filter((c) => c.completed && !c.claimed).length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                {challenges.filter((c) => c.completed && !c.claimed).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === "rules"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Divisões & Regras</span>
          </button>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* ================= 3. CONTEÚDO DAS ABAS ================= */}

      {/* TAB 1: TABELA DA LIGA */}
      {activeTab === "ranking" && (
        <div className="space-y-8">
          {/* PÓDIO DOS 3 PRIMEIROS */}
          {top3.length === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              {/* #2 Lugar (Prata) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`relative flex flex-col items-center justify-between rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-200/50 via-slate-100/30 to-transparent dark:from-slate-800/50 dark:via-slate-900/40 p-6 text-center shadow-lg md:order-1 ${
                  top3[1].isCurrentUser ? "ring-2 ring-slate-400 dark:ring-slate-300" : ""
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-300 to-slate-400 text-2xl font-black text-slate-900 shadow-md">
                      {top3[1].name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-400 text-xs font-black text-slate-950 shadow">
                      2º
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {top3[1].isCurrentUser ? "Você" : top3[1].name}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                    {top3[1].targetRole}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 w-full flex items-center justify-center gap-1 text-sm font-black text-slate-700 dark:text-slate-300">
                  <Sparkles className="h-4 w-4 text-slate-400" />
                  <span>+{top3[1].weeklyXp.toLocaleString("pt-BR")} XP</span>
                </div>
              </motion.div>

              {/* #1 Lugar (Ouro) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative flex flex-col items-center justify-between rounded-3xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-500/20 via-amber-500/5 to-transparent p-6 text-center shadow-2xl md:order-2 md:-mt-4 ${
                  top3[0].isCurrentUser ? "ring-2 ring-amber-400" : ""
                }`}
              >
                <div className="absolute -top-4 flex items-center gap-1 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-black text-slate-950 shadow-md">
                  <Crown className="h-3.5 w-3.5" />
                  <span>Líder da Semana</span>
                </div>
                <div className="flex flex-col items-center mt-2">
                  <div className="relative mb-3">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-3xl font-black text-slate-950 shadow-xl shadow-amber-500/20">
                      {top3[0].name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-black text-slate-950 shadow-md">
                      1º
                    </div>
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white truncate max-w-[200px]">
                    {top3[0].isCurrentUser ? "Você" : top3[0].name}
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium truncate max-w-[180px]">
                    {top3[0].targetRole}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-500/20 w-full flex items-center justify-center gap-1.5 text-base font-black text-amber-600 dark:text-amber-400">
                  <Sparkles className="h-4 w-4" />
                  <span>+{top3[0].weeklyXp.toLocaleString("pt-BR")} XP</span>
                </div>
              </motion.div>

              {/* #3 Lugar (Bronze) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`relative flex flex-col items-center justify-between rounded-3xl border border-amber-700/30 dark:border-amber-700/40 bg-gradient-to-b from-amber-800/20 via-amber-900/10 to-transparent p-6 text-center shadow-lg md:order-3 ${
                  top3[2].isCurrentUser ? "ring-2 ring-amber-600" : ""
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-700 to-amber-800 text-2xl font-black text-amber-200 shadow-md">
                      {top3[2].name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-700 text-xs font-black text-white shadow">
                      3º
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {top3[2].isCurrentUser ? "Você" : top3[2].name}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                    {top3[2].targetRole}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-800/20 w-full flex items-center justify-center gap-1 text-sm font-black text-amber-700 dark:text-amber-400">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>+{top3[2].weeklyXp.toLocaleString("pt-BR")} XP</span>
                </div>
              </motion.div>
            </div>
          )}

          {/* TABELA COMPLETA (POSIÇÕES 1 A 20) */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-950/70 shadow-2xl backdrop-blur-xl">
            {/* Header da Tabela */}
            <div className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-slate-200 dark:border-white/10 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <div className="col-span-2 sm:col-span-1 text-center">Pos</div>
              <div className="col-span-7 sm:col-span-6">Concurseiro</div>
              <div className="hidden sm:block sm:col-span-3">Ofensiva</div>
              <div className="col-span-3 sm:col-span-2 text-right">XP Semanal</div>
            </div>

            {/* Linhas da Tabela */}
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {leaderboard.map((member, idx) => {
                // Divisória da Zona de Promoção
                const isPromoBoundary =
                  config.promotionTopPercent > 0 &&
                  idx + 1 === Math.round(leaderboard.length * config.promotionTopPercent);

                // Divisória da Zona de Rebaixamento
                const isDemoBoundary =
                  config.demotionBottomPercent > 0 &&
                  idx + 1 ===
                    leaderboard.length -
                      Math.round(leaderboard.length * config.demotionBottomPercent);

                return (
                  <React.Fragment key={member.id}>
                    <div
                      className={`grid grid-cols-12 gap-3 px-6 py-4 items-center transition-all ${
                        member.isCurrentUser
                          ? "bg-amber-500/15 dark:bg-amber-500/10 border-l-4 border-l-amber-500 font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Posição */}
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
                        <span
                          className={`font-mono text-base font-black ${
                            member.rank === 1
                              ? "text-amber-500"
                              : member.rank === 2
                              ? "text-slate-400"
                              : member.rank === 3
                              ? "text-amber-700 dark:text-amber-600"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          #{member.rank}
                        </span>
                      </div>

                      {/* Dados do Concurseiro */}
                      <div className="col-span-7 sm:col-span-6 flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm ${
                            member.isCurrentUser
                              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`truncate font-bold text-sm ${
                                member.isCurrentUser
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {member.name}
                            </span>
                            {member.isCurrentUser && (
                              <span className="rounded-full bg-amber-500/20 px-2 py-0.2 text-[10px] font-black text-amber-600 dark:text-amber-400">
                                VOCÊ
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {member.targetRole}
                          </p>
                        </div>
                      </div>

                      {/* Ofensiva */}
                      <div className="hidden sm:flex sm:col-span-3 items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                        {member.streakDays > 0 ? (
                          <>
                            <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                            <span>{member.streakDays} dias seguidos</span>
                          </>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>

                      {/* XP Semanal */}
                      <div className="col-span-3 sm:col-span-2 text-right">
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                          +{member.weeklyXp.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-semibold">XP</span>
                      </div>
                    </div>

                    {/* Linha Divisória de Promoção */}
                    {isPromoBoundary && (
                      <div className="bg-emerald-500/10 dark:bg-emerald-500/20 px-6 py-2 border-y border-emerald-500/30 flex items-center justify-between text-xs font-black text-emerald-600 dark:text-emerald-400">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-4 w-4" />
                          <span>ZONA DE PROMOÇÃO • TOP {Math.round(config.promotionTopPercent * 100)}% SOBEM DE LIGA</span>
                        </div>
                        <span className="hidden sm:inline text-[11px] opacity-80">
                          {tier === "GOLD" ? "Acesso à Liga Diamante" : tier === "SILVER" ? "Acesso à Liga Ouro" : "Acesso à Liga Prata"}
                        </span>
                      </div>
                    )}

                    {/* Linha Divisória de Rebaixamento */}
                    {isDemoBoundary && (
                      <div className="bg-rose-500/10 dark:bg-rose-500/20 px-6 py-2 border-y border-rose-500/30 flex items-center justify-between text-xs font-black text-rose-600 dark:text-rose-400">
                        <div className="flex items-center gap-2">
                          <ArrowDown className="h-4 w-4" />
                          <span>ZONA DE REBAIXAMENTO • ÚLTIMOS {Math.round(config.demotionBottomPercent * 100)}% CAEM</span>
                        </div>
                        <span className="hidden sm:inline text-[11px] opacity-80">
                          Estude mais questões e flashcards para subir!
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DESAFIOS DA SEMANA */}
      {activeTab === "challenges" && (
        <div className="space-y-8">
          {/* BANNER DO GRANDE BAÚ SEMANAL */}
          {chestStatus && (
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-purple-500/15 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-xl shadow-amber-500/25">
                    <Gift className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Recompensa Máxima
                      </span>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-black text-amber-600 dark:text-amber-400">
                        {chestStatus.completedChallenges} / {chestStatus.totalChallenges} Concluídos
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      Grande Baú Semanal dos Concurseiros
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Complete todos os 4 desafios desta semana para resgatar +500 XP bônus e 1x Congelamento de Ofensiva grátis!
                    </p>
                  </div>
                </div>

                <div>
                  {chestStatus.isClaimed ? (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/20 px-5 py-3 font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Baú Resgatado!</span>
                    </div>
                  ) : chestStatus.isUnlocked ? (
                    <button
                      onClick={handleClaimChest}
                      disabled={claimingChest}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 font-black text-slate-950 shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Sparkles className="h-5 w-5 animate-spin" />
                      <span>{claimingChest ? "Abrindo..." : "Abrir Baú Épico (+500 XP)"}</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 dark:bg-white/5 px-5 py-3 font-bold text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-white/10">
                      <span>Complete os 4 Desafios</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de Progresso do Baú */}
              <div className="mt-5 w-full bg-slate-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${(chestStatus.completedChallenges / chestStatus.totalChallenges) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* GRID COM OS 4 DESAFIOS SEMANAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {challenges.map((c) => {
              const progressPct = Math.min(100, Math.round((c.currentCount / c.targetCount) * 100));

              // Ícone e link de ação
              let Icon = FileStack;
              let actionHref = "/questions";
              let actionLabel = "Praticar Questões";

              if (c.iconName === "Layers") {
                Icon = Layers;
                actionHref = "/flashcards";
                actionLabel = "Revisar Flashcards";
              } else if (c.iconName === "PenTool") {
                Icon = PenTool;
                actionHref = "/redacao";
                actionLabel = "Escrever Redação";
              } else if (c.iconName === "Headphones") {
                Icon = Headphones;
                actionHref = "/study-room";
                actionLabel = "Ir para Sala de Foco";
              }

              return (
                <div
                  key={c.id}
                  className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 backdrop-blur-xl shadow-lg transition-all ${
                    c.claimed
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : c.completed
                      ? "border-amber-500/40 bg-amber-500/5 shadow-amber-500/10"
                      : "border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-950/70"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                            c.completed
                              ? "bg-amber-500 text-slate-950"
                              : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                            {c.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {c.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-black text-amber-600 dark:text-amber-400">
                        <Sparkles className="h-3 w-3" />
                        <span>+{c.xpReward} XP</span>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="mt-5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span>Progresso Semanal</span>
                        <span>
                          {c.currentCount} / {c.targetCount} {c.unit} ({progressPct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            c.completed ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ação: Resgatar ou Navegar */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    {c.claimed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Recompensa Resgatada
                      </span>
                    ) : c.completed ? (
                      <button
                        onClick={() => handleClaimChallenge(c.id)}
                        disabled={claimingId === c.id}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>{claimingId === c.id ? "Resgatando..." : `Resgatar +${c.xpReward} XP`}</span>
                      </button>
                    ) : (
                      <Link
                        href={actionHref}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 transition-colors ml-auto"
                      >
                        <span>{actionLabel}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DIVISÕES & REGRAS */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {(Object.keys(LEAGUE_TIERS) as LeagueTier[]).map((tKey) => {
              const lConfig = LEAGUE_TIERS[tKey];
              const isCurrent = tKey === tier;

              return (
                <div
                  key={tKey}
                  className={`relative flex flex-col justify-between rounded-3xl border p-6 backdrop-blur-xl shadow-lg transition-all ${
                    isCurrent
                      ? `${lConfig.borderColor} bg-gradient-to-br ${lConfig.gradient} ring-2 ring-amber-400`
                      : "border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-950/70"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{lConfig.badge}</div>
                        <div>
                          <h3 className="font-black text-base text-slate-900 dark:text-white">
                            {lConfig.name}
                          </h3>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Min. {lConfig.minTotalXp.toLocaleString("pt-BR")} XP Acumulado
                          </span>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-950">
                          ATUAL
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {lConfig.description}
                    </p>

                    <div className="space-y-2 border-t border-slate-200 dark:border-white/10 pt-3">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Benefícios da Divisão
                      </span>
                      <ul className="space-y-1.5">
                        {lConfig.weeklyPerks.map((perk, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>
                      {lConfig.promotionTopPercent > 0
                        ? `Top ${Math.round(lConfig.promotionTopPercent * 100)}% sobe`
                        : "Divisão Máxima"}
                    </span>
                    <span>
                      {lConfig.demotionBottomPercent > 0
                        ? `Últimos ${Math.round(lConfig.demotionBottomPercent * 100)}% caem`
                        : "Sem rebaixamento"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DICAS DE PONTUAÇÃO */}
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.02] p-6 space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>Como pontuar e subir de Liga na Synapse AI</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 p-4 space-y-1">
                <span className="font-extrabold text-amber-500 block">Simulados & Questões</span>
                <p className="text-slate-600 dark:text-slate-400">
                  +10 XP por acerto + 20 XP de bônus por simulado estruturado concluído.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 p-4 space-y-1">
                <span className="font-extrabold text-cyan-500 block">Flashcards FSRS</span>
                <p className="text-slate-600 dark:text-slate-400">
                  +15 XP por flashcard revisado no prazo da repetição espaçada.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 p-4 space-y-1">
                <span className="font-extrabold text-purple-500 block">Redação Oficial</span>
                <p className="text-slate-600 dark:text-slate-400">
                  +250 XP por redação com espelho oficial e cálculo de nota calibrado.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 p-4 space-y-1">
                <span className="font-extrabold text-emerald-500 block">Sala de Foco</span>
                <p className="text-slate-600 dark:text-slate-400">
                  +2 XP por minuto líquido estudado nas sessões de estudo imersivo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
