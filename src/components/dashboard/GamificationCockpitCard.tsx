"use client";

import React from "react";
import Link from "next/link";
import {
  Flame,
  Snowflake,
  Trophy,
  Zap,
  Target,
  ArrowRight,
} from "lucide-react";

export interface WeekDayStatus {
  dayLabel: string;
  active: boolean;
}

export interface GamificationCockpitCardProps {
  totalXp?: number;
  level?: number;
  levelTitle?: string;
  currentLevelXp?: number;
  nextLevelXp?: number;
  progressPercent?: number;
  streakDays?: number;
  streakFreezes?: number;
  weekDays?: WeekDayStatus[];
  weeklyGoalPercentage?: number;
  weeklyGoalTarget?: number;
  weeklyGoalCurrent?: number;
  onOpenStreakModal?: () => void;
  className?: string;
  getHref?: (url: string) => string;
}

const DEFAULT_DAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

export function GamificationCockpitCard({
  totalXp = 0,
  level = 1,
  levelTitle = "Iniciante Consciente",
  currentLevelXp = 0,
  nextLevelXp = 500,
  progressPercent = 0,
  streakDays = 0,
  streakFreezes = 0,
  weekDays = [],
  weeklyGoalPercentage = 0,
  weeklyGoalTarget = 50,
  weeklyGoalCurrent = 0,
  onOpenStreakModal,
  className = "",
  getHref = (url) => url,
}: GamificationCockpitCardProps) {
  // Multiplicador de XP baseado na ofensiva (1.0x até 1.5x)
  const streakBonus = Math.min(streakDays * 0.1, 0.5);
  const xpMultiplier = (1 + streakBonus).toFixed(1);

  // Dia de hoje mapeado para o índice de Segunda(0) a Domingo(6)
  const todayDayOfWeek = new Date().getDay();
  const todayIndex = (todayDayOfWeek + 6) % 7;

  // Normaliza os dias da semana para os 7 dias
  const displayWeekDays = DEFAULT_DAYS.map((label, idx) => {
    const fromServer = weekDays[idx];
    return {
      label,
      active: Boolean(fromServer?.active),
      isToday: idx === todayIndex,
      isPast: idx < todayIndex,
    };
  });

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-linear-to-br from-slate-950/80 via-[#0a0f1d]/90 to-slate-950/90 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-amber-500/30 ${className}`}
    >
      {/* Luz ambiente de fundo */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/40 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* ================= 1. CABEÇALHO DO NÍVEL / PATENTE ================= */}
      <div className="relative z-10 flex items-start justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3.5">
          {/* Insígnia do Nível */}
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/40 bg-linear-to-br from-amber-500/20 via-orange-500/10 to-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <span className="font-mono text-xl font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {level}
            </span>
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-slate-950 shadow-sm">
              ★
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                Nível {level}
              </span>
              {streakDays > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-black text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  <Flame size={10} className="fill-amber-400 text-amber-400 animate-pulse" />
                  {xpMultiplier}x XP
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-400">
                  1.0x XP
                </span>
              )}
            </div>
            <h3 className="truncate text-sm font-black tracking-tight text-white sm:text-base">
              {levelTitle}
            </h3>
          </div>
        </div>

        {/* Badge da Sequência & Botão do Gelo */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenStreakModal}
            title="Congelamento de Sequência — Clique para proteger ou gerenciar"
            className="group/freeze flex cursor-pointer items-center gap-1 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 font-mono text-[11px] font-bold text-cyan-300 shadow-sm transition-all hover:border-cyan-400/50 hover:bg-cyan-500/20 active:scale-95"
          >
            <Snowflake
              size={12}
              className="text-cyan-400 transition-transform group-hover/freeze:rotate-45"
            />
            <span>{streakFreezes}</span>
          </button>

          <Link
            href={getHref("/performance")}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 font-mono text-[11px] font-black text-amber-400 shadow-sm transition-all hover:bg-amber-500/20"
          >
            <Flame size={14} className="fill-amber-400 text-amber-400 animate-bounce" />
            <span>{streakDays}d</span>
          </Link>
        </div>
      </div>

      {/* ================= 2. BARRA DE XP / MAESTRIA ================= */}
      <div className="relative z-10 pt-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Zap size={13} className="text-amber-400" />
            XP: <strong className="text-white">{currentLevelXp}</strong>
            <span className="text-slate-500">/ {nextLevelXp}</span>
          </span>
          <span className="font-bold text-amber-400">{progressPercent}%</span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950 p-0.5">
          <div
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            className="h-full rounded-full bg-linear-to-r from-amber-500 via-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.6)] transition-all duration-500"
          />
        </div>
      </div>

      {/* ================= 3. RÉGUA SEMANAL DE CONSTÂNCIA ================= */}
      <div className="relative z-10 mt-4 rounded-2xl border border-white/5 bg-slate-950/50 p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Régua da Semana
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            {weekDays.filter((w) => w.active).length}/7 dias ativos
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {displayWeekDays.map((day, idx) => (
            <div
              key={idx}
              className={`group/day relative flex flex-col items-center justify-center rounded-xl border py-2 transition-all ${
                day.isToday
                  ? "border-amber-500/60 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30"
                  : day.active
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <span
                className={`font-mono text-[9px] font-bold ${
                  day.isToday
                    ? "text-amber-300 font-extrabold"
                    : day.active
                      ? "text-emerald-300"
                      : "text-slate-500"
                }`}
              >
                {day.label}
              </span>

              <div className="mt-1 flex h-4 w-4 items-center justify-center">
                {day.active ? (
                  <Flame
                    size={13}
                    className="fill-amber-400 text-amber-400 animate-pulse drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                  />
                ) : day.isToday ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                ) : (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      day.isPast ? "bg-slate-700" : "bg-slate-800"
                    }`}
                  />
                )}
              </div>

              {day.isToday && (
                <span className="absolute -top-1.5 rounded-full bg-amber-500 px-1 py-0.2 font-mono text-[7px] font-black uppercase text-slate-950 shadow-xs">
                  Hoje
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ================= 4. META SEMANAL INTEGRADA ================= */}
      <div className="relative z-10 mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <Link
            href={getHref("/performance")}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Target size={12} className="text-indigo-400" />
            <span>Meta Semanal</span>
          </Link>
          <span className="font-mono text-xs font-black text-indigo-400">
            {weeklyGoalPercentage}%
            <span className="text-[10px] font-normal text-slate-500 ml-1">
              ({weeklyGoalCurrent}/{weeklyGoalTarget})
            </span>
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950">
          <div
            className="h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-500"
            style={{ width: `${Math.min(100, weeklyGoalPercentage)}%` }}
          />
        </div>
      </div>

      {/* ================= 5. RODAPÉ DE CONQUISTAS ================= */}
      <div className="relative z-10 mt-4 pt-3 border-t border-white/5">
        <Link
          href={getHref("/achievements")}
          className="group/ach flex items-center justify-between rounded-xl p-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <Trophy size={14} className="text-amber-400 group-hover/ach:rotate-12 transition-transform" />
            <span className="font-semibold">Hall de Conquistas & Insígnias</span>
          </span>
          <ArrowRight size={13} className="text-slate-500 group-hover/ach:translate-x-1 group-hover/ach:text-white transition-all" />
        </Link>
      </div>
    </div>
  );
}
