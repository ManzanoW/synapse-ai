"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  startTransition,
} from "react";
import Link from "next/link";
import { Variants } from "framer-motion";
import PomodoroTimer from "@/components/pomodoro-timer";
import SubjectCard from "@/components/subject-card";
import { NewContentModal } from "@/components/create-subject-modal";
import SubjectCardSkeleton from "@/components/subject-card-skeleton";
import { RescheduleBanner } from "@/components/week/reschedule-banner";
import { useSidebar } from "@/lib/sidebar-context";
import { DashboardSubject } from "@/types";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import { DailyQuestsWidget } from "@/components/dashboard/DailyQuestsWidget";
import { ZenModeOverlay } from "@/components/dashboard/ZenModeOverlay";
import { useGamification } from "@/context/GamificationContext";
import {
  Menu,
  BookOpen,
  Flame,
  Sparkles,
  BrainCircuit,
  Target,
  Zap,
  TrendingUp,
  Layers,
  HelpCircle,
  Trophy,
  Award,
  Lock,
  ChevronDown,
  ChevronUp,
  Snowflake,
  Maximize2,
} from "lucide-react";
import Heatmap from "@/components/analytics/Heatmap";
import DomainRadarChart from "@/components/dashboard/DomainRadarChart";
import { StreakFreezeModal } from "@/components/dashboard/StreakFreezeModal";

interface JourneyData {
  hasObjective: boolean;
  daysRemaining: number;
  weeksRemaining: number;
  daysLeftInWeek: number;
  percentage: number;
  totalTopics: number;
  completedTopics: number;
  topicsPerWeek?: number;
  currentPace?: number;
}

interface DashboardStats {
  journey?: JourneyData;
  metrics: {
    totalTimeFormatted: string;
    precision: string;
    sessionsCount: number;
    questionsCount: number;
    totalFlashcards: number;
    averageTimePerSession: string;
  };
  streak: {
    currentDays: number;
    weekDays: Array<{
      dayLabel: string;
      active: boolean;
    }>;
  };
  weeklyGoal: {
    percentage: number;
    target: number;
    current: number;
  };
  heatmap: Array<{
    date: string;
    count: number;
    level: number;
  }>;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  type: "CRITICAL" | "SUGGESTED" | string;
  icon?: "brain" | "clipboard" | string;
  actionType?: string;
  topicId?: string;
  subjectId?: string;
  actionUrl?: string;
}

interface DashboardClientProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const { openSidebar } = useSidebar();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const { stats: globalGamification } = useGamification();
  const [subjects, setSubjects] = useState<DashboardSubject[]>([]);

  // Estado para Abas em Dispositivos Móveis
  const [mobileTab, setMobileTab] = useState<
    "missions" | "stats" | "gamification"
  >("missions");
  const [isPomodoroOpenMobile, setIsPomodoroOpenMobile] = useState(false);

  // Modo Zen / Imersivo
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);

  const [levelUpData, setLevelUpData] = useState<{
    isOpen: boolean;
    level: number;
    title: string;
  }>({ isOpen: false, level: 1, title: "" });

  const [missedDayName, setMissedDayName] = useState<string | null>(null);

  // Streak Freeze Modal
  const [isStreakFreezeModalOpen, setIsStreakFreezeModalOpen] = useState(false);
  const [streakFreezeCount, setStreakFreezeCount] = useState(0);

  const getSuggestionUrl = (item: Suggestion): string => {
    if (item.actionUrl) return item.actionUrl;

    if (item.actionType === "QUIZ" || item.actionType === "SIMULADO") {
      return item.topicId ? `/questions?topicId=${item.topicId}` : "/questions";
    }
    if (item.actionType === "EDITAL" || item.actionType === "PLANNER") {
      return item.subjectId ? `/edital?subjectId=${item.subjectId}` : "/edital";
    }
    if (item.actionType === "CARDS" || item.actionType === "FLASHCARDS") {
      return "/flashcards";
    }

    const titleLower = item.title?.toLowerCase() || "";
    if (
      titleLower.includes("simulado") ||
      titleLower.includes("quiz") ||
      titleLower.includes("questõ")
    ) {
      return item.topicId ? `/questions?topicId=${item.topicId}` : "/questions";
    }
    if (
      titleLower.includes("edital") ||
      titleLower.includes("avançar") ||
      titleLower.includes("estudo")
    ) {
      return item.subjectId ? `/edital?subjectId=${item.subjectId}` : "/edital";
    }
    if (titleLower.includes("card") || titleLower.includes("flashcard")) {
      return "/flashcards";
    }

    return "/edital";
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [resSubjects, resStats, resWeek, resSuggestions, resFreezes] =
        await Promise.all([
          fetch("/api/edital?mode=subjects", { cache: "no-store" }),
          fetch("/api/dashboard/stats", { cache: "no-store" }),
          fetch("/api/week", { cache: "no-store" }),
          fetch("/api/ai/suggestions", { cache: "no-store" }).catch(() => null),
          fetch("/api/gamification/streak-freeze", { cache: "no-store" }).catch(
            () => null,
          ),
        ]);

      if (resSuggestions && resSuggestions.ok) {
        const jsonSuggestions = await resSuggestions.json();
        if (jsonSuggestions.data?.length) {
          setSuggestions(jsonSuggestions.data);
        }
      }

      if (resFreezes && resFreezes.ok) {
        const jsonFreezes = await resFreezes.json();
        setStreakFreezeCount(jsonFreezes.streakFreezes ?? 0);
      }

      if (resSubjects.status === 401 || resStats.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (resSubjects.ok) {
        const jsonSubjects = await resSubjects.json();
        setSubjects(Array.isArray(jsonSubjects.data) ? jsonSubjects.data : []);
      }

      if (resStats.ok) {
        const jsonStats = await resStats.json();
        setStats(jsonStats);
      }

      if (resWeek.ok) {
        const jsonWeek = await resWeek.json();
        setMissedDayName(jsonWeek.data?.missedDayName || null);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do Dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      loadDashboardData();
    });
  }, [loadDashboardData]);

  useEffect(() => {
    const pending = localStorage.getItem("pending_levelup_notification");
    if (pending) {
      try {
        const { level, title } = JSON.parse(pending);
        const t = setTimeout(() => {
          setLevelUpData({
            isOpen: true,
            level: level,
            title: title || "Gênio dos Estudos",
          });
          localStorage.removeItem("pending_levelup_notification");
        }, 0);
        return () => clearTimeout(t);
      } catch (e) {
        console.error("Erro no Level Up notification:", e);
      }
    }
  }, []);

  const handleOptimizeSchedule = async () => {
    try {
      setIsOptimizing(true);
      const response = await fetch("/api/ai/suggestions", {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Erro ao otimizar cronograma");
      const data = await response.json();

      if (data.data) {
        setSuggestions(data.data);
      }

      setIsOptimized(true);
      setTimeout(() => setIsOptimized(false), 4000);
    } catch (error) {
      console.error("Erro na otimização:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCreateContent = async (data: {
    title: string;
    subjectName: string;
    weight: string;
  }) => {
    try {
      const response = await fetch("/api/edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Erro ao criar conteúdo");

      setIsModalOpen(false);
      loadDashboardData();
    } catch (error) {
      console.error("Erro ao salvar tópico:", error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const gStats = (globalGamification?.gamification ||
    globalGamification ||
    {}) as Record<string, unknown>;

  const currentXp = Number(
    gStats.totalXp ?? gStats.xp ?? gStats.currentXp ?? 0,
  );
  const level = Number(gStats.level ?? gStats.currentLevel ?? 1);
  const levelTitle = String(
    gStats.title ?? gStats.levelTitle ?? "Mestre da Retenção",
  );
  const nextLevelXp = Number(gStats.nextLevelXp ?? gStats.targetXp ?? 1000);
  const currentLevelMinXp = Number(
    gStats.currentLevelXp ?? gStats.minLevelXp ?? 0,
  );

  const xpProgressInLevel = Math.max(0, currentXp - currentLevelMinXp);
  const xpSpanForLevel = Math.max(1, nextLevelXp - currentLevelMinXp);
  const levelProgressPercent = Math.min(
    100,
    Math.round((xpProgressInLevel / xpSpanForLevel) * 100),
  );

  const hasEditalSubjects = subjects.length > 0;
  const displayedSubjects = subjects.slice(0, 4);

  return (
    <div className="min-h-screen w-full bg-[#02050e] p-3 sm:p-4 md:p-8 font-sans text-slate-100 selection:bg-indigo-500/30">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* ================= 1. CABEÇALHO PRINCIPAL ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={openSidebar}
              className="cursor-pointer rounded-xl border border-white/10 bg-slate-900/80 p-2.5 text-slate-400 transition-colors hover:text-white md:hidden"
            >
              <Menu size={18} />
            </button>

            <div>
              <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-black tracking-tight text-white">
                Dashboard
              </h1>
              <p className="mt-0.5 text-xs text-slate-300">
                Bem-vindo de volta,{" "}
                <strong className="font-bold text-indigo-400">
                  {user.name || "Estudante"}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsZenModeOpen(true)}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-xs font-bold text-violet-300 backdrop-blur-xl transition-all hover:bg-violet-500/20 active:scale-95"
            >
              <Maximize2 size={14} className="text-violet-400" />
              <span>Modo Zen</span>
            </button>

            <Link
              href={!isLoading && hasEditalSubjects ? "/flashcards" : "/edital"}
              className="w-full sm:w-auto justify-center flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-600/25 transition-all hover:from-indigo-500 hover:to-purple-500 active:scale-95"
            >
              <Zap size={14} className="fill-white" />
              <span>
                {isLoading
                  ? "Carregando..."
                  : hasEditalSubjects
                    ? "Iniciar Estudos do Dia"
                    : "Configurar Edital"}
              </span>
            </Link>
          </div>
        </div>

        {/* ================= ATALHOS RÁPIDOS (APENAS DESKTOP) ================= */}
        <div className="hidden md:grid grid-cols-4 gap-3">
          {[
            {
              title: "Resolver Questões",
              icon: HelpCircle,
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40",
              href: "/questions",
            },
            {
              title: "Praticar Cards",
              icon: Layers,
              color: "text-indigo-400",
              bg: "bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40",
              href: "/flashcards",
            },
            {
              title: "Edital Verticalizado",
              icon: BookOpen,
              color: "text-cyan-400",
              bg: "bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40",
              href: "/edital",
              badge: !isLoading && !hasEditalSubjects ? "Passo 1" : undefined,
            },
            {
              title: "Hall de Conquistas",
              icon: Trophy,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40",
              href: "/achievements",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`relative flex items-center justify-between gap-2 rounded-2xl border p-3 backdrop-blur-xl transition-all duration-200 active:scale-95 ${item.bg}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className={`shrink-0 rounded-xl p-2 ${item.color}`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-200 leading-tight">
                    {item.title}
                  </span>
                </div>
                {item.badge && (
                  <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* BANNER DE REMANEJAMENTO */}
        {!isLoading &&
          missedDayName &&
          (stats?.journey?.completedTopics ?? 0) > 0 && (
            <RescheduleBanner
              missedDayName={missedDayName}
              userId={user.id}
              onActionCompleted={() => {
                setMissedDayName(null);
                loadDashboardData();
              }}
            />
          )}

        {/* ================= 2. BANNER HERO DE JORNADA ================= */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-linear-to-br from-[#0a0f1d] via-[#070b16] to-[#04060c] p-4 sm:p-6 shadow-2xl backdrop-blur-2xl">
          {/* LAYOUT MOBILE */}
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/10 md:hidden">
            <div className="px-1">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Dias
              </span>
              <span className="font-mono text-xl font-black text-white">
                {stats?.journey?.daysRemaining ?? 0}
              </span>
              <span className="text-[9px] text-slate-500 block">restantes</span>
            </div>

            <div className="px-1">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-400 block">
                Ritmo
              </span>
              <span className="font-mono text-xl font-black text-amber-300">
                {stats?.journey?.topicsPerWeek ?? 0}
              </span>
              <span className="text-[9px] text-slate-500 block">
                tópicos/sem
              </span>
            </div>

            <div className="px-1">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-400 block">
                Progresso
              </span>
              <span className="font-mono text-xl font-black text-cyan-300">
                {stats?.journey?.percentage ?? 0}%
              </span>
              <span className="text-[9px] text-slate-500 block">do edital</span>
            </div>
          </div>

          {/* LAYOUT DESKTOP */}
          <div className="hidden md:grid relative z-10 grid-cols-3 items-stretch gap-0">
            <div className="flex flex-col justify-between space-y-4 pr-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Tempo Restante
                </span>
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-400">
                  <Target size={18} />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-black tracking-tight text-white">
                    {stats?.journey?.daysRemaining ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    dias restantes
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
                <span className="font-medium">Semanas até a prova:</span>
                <strong className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono font-bold text-slate-200">
                  {stats?.journey?.weeksRemaining ?? 0} sem
                </strong>
              </div>
            </div>

            <div className="pointer-events-none absolute top-4 bottom-4 left-1/3 w-px bg-linear-to-b from-transparent via-white/10 to-transparent" />

            <div className="flex flex-col justify-between space-y-4 px-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                  Ritmo Sugerido
                </span>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-amber-400">
                  <Zap size={18} className="fill-amber-400/20" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-black tracking-tight text-amber-300">
                    {hasEditalSubjects
                      ? (stats?.journey?.topicsPerWeek ?? 0)
                      : "—"}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {hasEditalSubjects ? "tópicos / sem" : "Aguardando Edital"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
                <span className="font-medium">Ritmo atual:</span>
                <strong className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono font-bold text-amber-300">
                  {hasEditalSubjects
                    ? `${stats?.journey?.currentPace ?? 0.0} / sem`
                    : "—"}
                </strong>
              </div>
            </div>

            <div className="pointer-events-none absolute top-4 bottom-4 left-2/3 w-px bg-linear-to-b from-transparent via-white/10 to-transparent" />

            <div className="flex flex-col justify-between space-y-4 pl-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Progresso do Edital
                </span>
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-400">
                  <TrendingUp size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-4xl font-black tracking-tight text-white">
                    {stats?.journey?.percentage ?? 0}%
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    <strong className="font-bold text-slate-100">
                      {stats?.journey?.completedTopics ?? 0}
                    </strong>
                    /{stats?.journey?.totalTopics ?? 0} tópicos
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-slate-950/80 p-0.5">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-cyan-500 to-emerald-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                    style={{
                      width: `${Math.max(3, stats?.journey?.percentage ?? 0)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
                <span className="font-medium">Status:</span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-bold text-indigo-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
                  {!hasEditalSubjects
                    ? "Não Iniciado"
                    : stats?.journey?.percentage === 100
                      ? "Edital Completo"
                      : "Em Andamento"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. SELETOR DE ABAS E CONTEÚDO EXCLUSIVO MOBILE ================= */}
        <div className="block md:hidden space-y-4">
          <div className="flex items-center p-1 bg-[#090d16] border border-white/10 rounded-2xl">
            <button
              type="button"
              onClick={() => setMobileTab("missions")}
              className={`flex-1 py-2 text-center text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                mobileTab === "missions"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Missões
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("stats")}
              className={`flex-1 py-2 text-center text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                mobileTab === "stats"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Estatísticas
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("gamification")}
              className={`flex-1 py-2 text-center text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                mobileTab === "gamification"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Nível / Meta
            </button>
          </div>

          {/* CONTEÚDO DA ABA SELECIONADA */}
          {mobileTab === "missions" && <DailyQuestsWidget />}

          {mobileTab === "stats" && (
            <div className="space-y-4">
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Estatísticas Chave
                  </span>
                  <span className="flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-indigo-400">
                    <Zap size={11} /> Tempo Real
                  </span>
                </div>

                <div className="mb-6 flex gap-6">
                  <div>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Tempo Total
                    </span>
                    <span className="font-mono text-2xl font-black text-white">
                      {stats?.metrics?.totalTimeFormatted || "0h 0m"}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Precisão</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {stats?.metrics?.precision || "0%"}
                      </span>
                    </div>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-slate-950 p-0.5">
                      <div
                        className="rounded-full bg-linear-to-r from-emerald-500 to-teal-400 h-full"
                        style={{ width: stats?.metrics?.precision || "0%" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                  <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-2">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">
                      Sessões
                    </span>
                    <span className="font-mono text-sm font-extrabold text-white">
                      {stats?.metrics?.sessionsCount ?? 0}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-2">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">
                      Questões
                    </span>
                    <span className="font-mono text-sm font-extrabold text-white">
                      {stats?.metrics?.questionsCount ?? 0}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-2">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">
                      Méd/Dia
                    </span>
                    <span className="font-mono text-sm font-extrabold text-white">
                      {stats?.metrics?.averageTimePerSession || "0min"}
                    </span>
                  </div>
                </div>
              </div>

              <DomainRadarChart subjects={subjects} isLoading={isLoading} />
            </div>
          )}

          {mobileTab === "gamification" && (
            <div className="space-y-4">
              <Link
                href="/achievements"
                className="group relative block overflow-hidden rounded-3xl border border-amber-500/20 bg-linear-to-br from-[#090d16] to-[#05070e] p-5 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 font-black text-amber-400">
                      {level}
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold uppercase text-amber-400">
                        Nível Atual
                      </span>
                      <h3 className="text-xs font-bold text-white">
                        {levelTitle}
                      </h3>
                    </div>
                  </div>
                  <Award size={18} className="text-amber-400" />
                </div>

                <div className="space-y-2 pt-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-400">
                      XP: <strong className="text-white">{currentXp}</strong>
                    </span>
                    <span className="font-bold text-amber-400">
                      {levelProgressPercent}%
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950">
                    <div
                      style={{ width: `${levelProgressPercent}%` }}
                      className="h-full rounded-full bg-amber-500"
                    />
                  </div>
                </div>
              </Link>

              <div className="space-y-4 rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-5 shadow-2xl">
                <Link href="/performance" className="block space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400">
                      Meta Semanal
                    </span>
                    <span className="font-mono text-xs font-black text-indigo-400">
                      {stats?.weeklyGoal?.percentage ?? 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{
                        width: `${stats?.weeklyGoal?.percentage ?? 0}%`,
                      }}
                    />
                  </div>
                </Link>

                <div className="my-2 border-t border-white/5" />

                <div className="flex items-center justify-between">
                  <Link
                    href="/performance"
                    className="flex items-center gap-1 text-xs font-bold uppercase text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Constância
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsStreakFreezeModalOpen(true)}
                      title="Trava de Sequência"
                      className="cursor-pointer flex items-center gap-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400 transition-all hover:border-cyan-500/50 hover:bg-cyan-500/20"
                    >
                      <Snowflake size={11} className="animate-spin-slow" />
                      {streakFreezeCount}
                    </button>
                    <Link
                      href="/performance"
                      className="flex items-center gap-1 font-mono text-xs font-black text-amber-400"
                    >
                      <Flame
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                      {Number(
                        gStats.streakDays ??
                          globalGamification?.streak?.currentDays ??
                          0,
                      )}{" "}
                      Dias
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 4. LAYOUT DESKTOP & DEMAIS COMPONENTES ================= */}
        <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-12">
          {/* COLUNA ESQUERDA (`lg:col-span-8`) */}
          <div className="space-y-6 lg:col-span-8">
            {/* ONBOARDING BANNER */}
            {!isLoading && !hasEditalSubjects && (
              <div className="group relative overflow-hidden rounded-3xl border border-amber-500/30 bg-linear-to-br from-[#0c101d] via-[#080b14] to-[#04060c] p-6 shadow-2xl backdrop-blur-2xl">
                <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="max-w-lg space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-300">
                      <Lock size={12} /> Onboarding Requerido
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Configure seu Edital para Ativar a IA
                    </h3>
                  </div>
                  <Link
                    href="/edital"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shrink-0"
                  >
                    <BookOpen size={15} />
                    <span>Cadastrar Edital</span>
                  </Link>
                </div>
              </div>
            )}

            {/* PAINEL DUPLO APENAS NO DESKTOP */}
            <div className="hidden md:grid grid-cols-2 gap-6">
              {/* CARD 1: Missões do Dia */}
              <DailyQuestsWidget />

              {/* CARD 2: Métricas de Desempenho */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Estatísticas Chave
                  </span>
                  <span className="flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-indigo-400">
                    <Zap size={11} /> Tempo Real
                  </span>
                </div>

                <div className="mb-6 flex gap-6">
                  <div>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Tempo Total
                    </span>
                    <span className="font-mono text-2xl font-black text-white">
                      {stats?.metrics?.totalTimeFormatted || "0h 0m"}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Precisão</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {stats?.metrics?.precision || "0%"}
                      </span>
                    </div>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-slate-950 p-0.5">
                      <div
                        className="rounded-full bg-linear-to-r from-emerald-500 to-teal-400 h-full"
                        style={{ width: stats?.metrics?.precision || "0%" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                  <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-2">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">
                      Sessões
                    </span>
                    <span className="font-mono text-sm font-extrabold text-white">
                      {stats?.metrics?.sessionsCount ?? 0}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-2">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">
                      Questões
                    </span>
                    <span className="font-mono text-sm font-extrabold text-white">
                      {stats?.metrics?.questionsCount ?? 0}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-2">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">
                      Méd/Dia
                    </span>
                    <span className="font-mono text-sm font-extrabold text-white">
                      {stats?.metrics?.averageTimePerSession || "0min"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RADAR DE DOMÍNIO vs PESO DO EDITAL */}
            <DomainRadarChart subjects={subjects} isLoading={isLoading} />

            {/* CARD 3: Sugestões com IA */}
            {!isLoading && hasEditalSubjects && (
              <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-5 sm:p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-400">
                      <Sparkles size={18} className="animate-pulse" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Sugestões Inteligentes da IA
                    </h3>
                  </div>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[9px] font-bold text-cyan-300">
                    Synapse Neural
                  </span>
                </div>

                <div className="space-y-3">
                  {suggestions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 py-4 text-center">
                      <p className="text-xs text-slate-400">
                        Seu cronograma está 100% otimizado!
                      </p>
                    </div>
                  ) : (
                    suggestions.map((item: Suggestion) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-slate-950/60 p-3"
                      >
                        <Link
                          href={getSuggestionUrl(item)}
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          <div className="shrink-0 rounded-xl p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <BrainCircuit size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-200 truncate">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={handleOptimizeSchedule}
                  disabled={isOptimizing}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-xs font-bold text-cyan-300"
                >
                  {isOptimizing
                    ? "Otimizando..."
                    : "Otimizar Cronograma com IA"}
                </button>
              </div>
            )}

            {/* CARD 4: Minhas Matérias */}
            <div className="space-y-4 rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BookOpen size={18} className="text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Minhas Matérias
                  </h3>
                </div>
                <Link
                  href="/edital"
                  className="text-xs font-semibold text-indigo-400"
                >
                  Ver todas ({subjects.length})
                </Link>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[...Array(2)].map((_, i) => (
                    <SubjectCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {displayedSubjects.map((sub) => (
                    <Link key={sub.id} href={`/edital?subjectId=${sub.id}`}>
                      <SubjectCard
                        title={sub.name}
                        colorClass={sub.color || "#3B82F6"}
                        progress={sub.progress ?? 0}
                        accuracy={sub.accuracy ?? 0}
                        timeSpent={sub.timeSpent ?? "0min"}
                        totalCards={sub._count?.topics ?? 0}
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BARRA LATERAL DIREITA (`lg:col-span-4` - APENAS DESKTOP) */}
          <div className="hidden md:block space-y-6 lg:col-span-4">
            {/* GAMIFICAÇÃO & NÍVEL */}
            <Link
              href="/achievements"
              className="group relative block overflow-hidden rounded-3xl border border-amber-500/20 bg-linear-to-br from-[#090d16] to-[#05070e] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 font-black text-amber-400">
                    {level}
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold uppercase text-amber-400">
                      Nível Atual
                    </span>
                    <h3 className="text-xs font-bold text-white">
                      {levelTitle}
                    </h3>
                  </div>
                </div>
                <Award size={18} className="text-amber-400" />
              </div>

              <div className="space-y-2 pt-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400">
                    XP: <strong className="text-white">{currentXp}</strong>
                  </span>
                  <span className="font-bold text-amber-400">
                    {levelProgressPercent}%
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950">
                  <div
                    style={{ width: `${levelProgressPercent}%` }}
                    className="h-full rounded-full bg-amber-500"
                  />
                </div>
              </div>
            </Link>

            {/* META SEMANAL & CONSTÂNCIA */}
            <div className="space-y-4 rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-6 shadow-2xl">
              <Link href="/performance" className="block space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">
                    Meta Semanal
                  </span>
                  <span className="font-mono text-xs font-black text-indigo-400">
                    {stats?.weeklyGoal?.percentage ?? 0}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${stats?.weeklyGoal?.percentage ?? 0}%` }}
                  />
                </div>
              </Link>

              <div className="my-2 border-t border-white/5" />

              <div className="flex items-center justify-between">
                <Link
                  href="/performance"
                  className="flex items-center gap-1 text-xs font-bold uppercase text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Constância
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsStreakFreezeModalOpen(true)}
                    title="Trava de Sequência"
                    className="cursor-pointer flex items-center gap-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400 transition-all hover:border-cyan-500/50 hover:bg-cyan-500/20"
                  >
                    <Snowflake size={11} className="animate-spin-slow" />
                    {streakFreezeCount}
                  </button>
                  <Link
                    href="/performance"
                    className="flex items-center gap-1 font-mono text-xs font-black text-amber-400"
                  >
                    <Flame
                      size={14}
                      className="fill-amber-400 text-amber-400"
                    />
                    {Number(
                      gStats.streakDays ??
                        globalGamification?.streak?.currentDays ??
                        0,
                    )}{" "}
                    Dias
                  </Link>
                </div>
              </div>
            </div>

            {/* POMODORO TIMER COM GATILHO MODO ZEN */}
            <div
              id="pomodoro"
              className="rounded-3xl border border-white/10 bg-[#090d16] p-4 relative"
            >
              <div className="flex justify-end pb-2">
                <button
                  onClick={() => setIsZenModeOpen(true)}
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-mono font-bold text-violet-300 hover:bg-violet-500/20 transition-all active:scale-95"
                >
                  <Maximize2 size={12} className="text-violet-400" />
                  <span>Modo Zen</span>
                </button>
              </div>
              <PomodoroTimer />
            </div>

            {/* HEATMAP */}
            <div className="rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-6 shadow-2xl">
              <Heatmap />
            </div>
          </div>
        </div>

        {/* POMODORO DOBRÁVEL APENAS NO MOBILE */}
        <div
          id="pomodoro-mobile"
          className="block md:hidden rounded-3xl border border-white/10 bg-[#090d16] p-2 sm:p-4"
        >
          <div className="flex items-center justify-between p-2">
            <button
              onClick={() => setIsPomodoroOpenMobile((prev) => !prev)}
              className="flex items-center gap-2 text-xs font-bold text-slate-300"
            >
              <span>Pomodoro Timer</span>
              {isPomodoroOpenMobile ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            <button
              onClick={() => setIsZenModeOpen(true)}
              className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-violet-300"
            >
              <Maximize2 size={10} />
              <span>Zen</span>
            </button>
          </div>

          <div className={`${isPomodoroOpenMobile ? "block" : "hidden"}`}>
            <PomodoroTimer />
          </div>
        </div>

        {/* HEATMAP NO MOBILE */}
        <div className="block md:hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-5 shadow-2xl">
          <Heatmap />
        </div>
      </div>

      {/* MODAL MODO ZEN */}
      <ZenModeOverlay
        isOpen={isZenModeOpen}
        onClose={() => setIsZenModeOpen(false)}
        defaultMinutes={25}
      />

      <NewContentModal
        isOpen={isModalOpen}
        subjects={subjects.map((s) => ({ id: s.name, name: s.name }))}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateContent}
      />

      <LevelUpModal
        isOpen={levelUpData.isOpen}
        newLevel={levelUpData.level}
        newTitle={levelUpData.title}
        onClose={() => setLevelUpData((prev) => ({ ...prev, isOpen: false }))}
      />

      <StreakFreezeModal
        isOpen={isStreakFreezeModalOpen}
        onClose={() => setIsStreakFreezeModalOpen(false)}
        currentXp={currentXp}
        streakFreezes={streakFreezeCount}
        onPurchaseSuccess={(newXp, newFreezes) => {
          setStreakFreezeCount(newFreezes);
        }}
      />
    </div>
  );
}
