"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Shield,
  ShieldCheck,
  Award,
  Crown,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import {
  LeagueTier,
  LEAGUE_TIERS,
} from "@/lib/gamification/leagues";
import { getUserLeagueDataAction, UserLeagueData } from "@/actions/league-actions";

interface LeagueWidgetCardProps {
  initialData?: UserLeagueData | null;
  className?: string;
}

export function LeagueWidgetCard({
  initialData,
  className = "",
}: LeagueWidgetCardProps) {
  const [data, setData] = useState<UserLeagueData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
  });

  useEffect(() => {
    if (!initialData) {
      getUserLeagueDataAction().then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        }
        setLoading(false);
      });
    }
  }, [initialData]);

  // Contagem regressiva até o fim do ciclo semanal (domingo 23:59)
  useEffect(() => {
    if (!data?.endOfWeekIso) return;

    function calculate() {
      const now = new Date().getTime();
      const target = new Date(data!.endOfWeekIso).getTime();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      setTimeLeft({ days, hours, minutes });
    }

    calculate();
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [data?.endOfWeekIso]);

  if (loading) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-950/70 sm:p-6 ${className}`}
      >
        <div className="flex animate-pulse items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-4 w-28 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-20 rounded-md bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
          <div className="h-7 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  const tier = data?.tier || "BRONZE";
  const config = LEAGUE_TIERS[tier];
  const rank = data?.currentUserRank || 1;
  const zone = data?.currentUserZone || "MAINTENANCE";
  const weeklyXp = data?.weeklyXp || 0;

  // Render do Ícone da Liga
  const renderLeagueIcon = () => {
    switch (tier) {
      case "DIAMOND":
        return <Crown className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />;
      case "GOLD":
        return <Award className="h-6 w-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />;
      case "SILVER":
        return <ShieldCheck className="h-6 w-6 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]" />;
      default:
        return <Shield className="h-6 w-6 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" />;
    }
  };

  const zoneBadgeConfig = {
    PROMOTION: {
      label: "Zona de Promoção",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      dot: "bg-emerald-500",
      icon: "⬆️",
    },
    MAINTENANCE: {
      label: "Zona Neutra",
      bg: "bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/30",
      dot: "bg-slate-400",
      icon: "⏸️",
    },
    DEMOTION: {
      label: "Zona de Risco",
      bg: "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30",
      dot: "bg-rose-500 animate-ping",
      icon: "⬇️",
    },
  }[zone];

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:shadow-2xl dark:border-white/[0.08] dark:bg-slate-950/80 sm:p-6 ${className}`}
    >
      {/* Luz ambiente de destaque com as cores da liga */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full blur-3xl opacity-40 dark:opacity-30"
        style={{ backgroundColor: config.glowColor }}
      />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent dark:via-amber-400/20" />

      {/* Cabeçalho */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          {/* Brasão */}
          <div
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${config.borderColor} bg-gradient-to-br ${config.gradient} shadow-lg shadow-black/5 dark:shadow-black/40`}
          >
            {renderLeagueIcon()}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] shadow">
              {config.badge}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-black uppercase tracking-wider ${config.textColor}`}>
                {config.name}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold">
                <Clock className="h-2.5 w-2.5 opacity-60" />
                {timeLeft.days}d {timeLeft.hours}h rest.
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                #{rank}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                de 20 concorrentes
              </span>
            </div>
          </div>
        </div>

        {/* Badge da Zona */}
        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${zoneBadgeConfig.bg}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${zoneBadgeConfig.dot}`} />
          <span>{zoneBadgeConfig.label}</span>
        </div>
      </div>

      {/* Dados Rápidos da Semana */}
      <div className="relative z-10 mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50/80 p-2.5 border border-slate-200/50 dark:bg-white/[0.03] dark:border-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            XP da Semana
          </span>
          <div className="flex items-center gap-1 text-sm font-black text-slate-800 dark:text-slate-100">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>+{weeklyXp.toLocaleString("pt-BR")} XP</span>
          </div>
        </div>

        <div className="flex flex-col border-l border-slate-200/60 dark:border-white/5 pl-2.5">
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Divisão Seguinte
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
            {tier === "DIAMOND" ? "🏆 Pódio Elite" : tier === "GOLD" ? "💎 Diamante" : tier === "SILVER" ? "🥇 Ouro" : "🥈 Prata"}
          </span>
        </div>
      </div>

      {/* Rodapé com Link Direto */}
      <div className="relative z-10 mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Reinicia Domingo às 23:59
        </span>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors"
        >
          <span>Ver Tabela Completa</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
