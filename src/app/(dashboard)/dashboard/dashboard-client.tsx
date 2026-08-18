"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  startTransition,
} from "react";
import Link from "next/link";
import { motion, Variants, AnimatePresence } from "framer-motion";
import PomodoroTimer from "@/components/pomodoro-timer";
import SubjectCard from "@/components/subject-card";
import { NewContentModal } from "@/components/create-subject-modal";
import SubjectCardSkeleton from "@/components/subject-card-skeleton";
import { RescheduleBanner } from "@/components/week/reschedule-banner";
import { useSidebar } from "@/lib/sidebar-context";
import { DashboardSubject } from "@/types";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import { useGamification } from "@/context/GamificationContext";
import {
  Menu,
  BookOpen,
  Flame,
  Sparkles,
  CheckCircle2,
  BarChart3,
  ClipboardList,
  BrainCircuit,
  Target,
  RefreshCw,
  X,
  Zap,
  TrendingUp,
  ArrowRight,
  Layers,
  HelpCircle,
  Trophy,
  Award,
  Lock,
} from "lucide-react";
import Heatmap from "@/components/analytics/Heatmap";

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

  const [levelUpData, setLevelUpData] = useState<{
    isOpen: boolean;
    level: number;
    title: string;
  }>({ isOpen: false, level: 1, title: "" });

  const [missedDayName, setMissedDayName] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [resSubjects, resStats, resWeek] = await Promise.all([
        fetch("/api/edital?mode=subjects", { cache: "no-store" }),
        fetch("/api/dashboard/stats", { cache: "no-store" }),
        fetch("/api/week", { cache: "no-store" }),
      ]);

      const resSuggestions = await fetch("/api/edital/rebalance", {
        method: "POST",
      }).catch(() => null);

      if (resSuggestions && resSuggestions.ok) {
        const jsonSuggestions = await resSuggestions.json();
        if (jsonSuggestions.suggestions?.length) {
          setSuggestions(jsonSuggestions.suggestions);
        }
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
      const response = await fetch("/api/edital/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Erro ao otimizar cronograma");
      const data = await response.json();

      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }

      setIsOptimized(true);
      setTimeout(() => setIsOptimized(false), 4000);
    } catch (error) {
      console.error("Erro na otimização:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getSuggestionUrl = (item: Suggestion) => {
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

  return (
    <div className="min-h-screen w-full bg-[#02050e] p-4 font-sans text-slate-100 selection:bg-indigo-500/30 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ================= 1. CABEÇALHO PRINCIPAL ================= */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={openSidebar}
              className="cursor-pointer rounded-xl border border-white/10 bg-slate-900/80 p-2.5 text-slate-400 transition-colors hover:text-white md:hidden"
            >
              <Menu size={18} />
            </button>

            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-white">
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

          <Link
            href={hasEditalSubjects ? "/flashcards" : "/edital"}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-600/25 transition-all hover:from-indigo-500 hover:to-purple-500 active:scale-95"
          >
            <Zap size={14} className="fill-white" />
            <span>
              {hasEditalSubjects
                ? "Iniciar Estudos do Dia"
                : "Configurar Edital"}
            </span>
          </Link>
        </div>

        {/* ================= ATALHOS RÁPIDOS ================= */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              badge: !hasEditalSubjects ? "Passo 1" : undefined,
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
                className={`relative flex items-center justify-between gap-3 rounded-2xl border p-3 backdrop-blur-xl transition-all duration-200 active:scale-95 ${item.bg}`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className={`shrink-0 rounded-xl p-2 ${item.color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="truncate text-xs font-bold text-slate-200">
                    {item.title}
                  </span>
                </div>
                {item.badge && (
                  <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[9px] font-extrabold text-amber-300 uppercase">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* ================= BANNER DE REMANEJAMENTO ================= */}
        {missedDayName && (stats?.journey?.completedTopics ?? 0) > 0 && (
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
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#0a0f1d] via-[#070b16] to-[#04060c] p-6 shadow-2xl backdrop-blur-2xl">
          <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

          <div className="relative z-10 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 md:gap-0">
            {/* COLUNA 1: TEMPO RESTANTE */}
            <div className="flex flex-col justify-between space-y-4 md:pr-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                  Tempo Restante
                </span>
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
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

            <div className="pointer-events-none absolute top-4 bottom-4 left-1/3 hidden w-px bg-linear-to-b from-transparent via-white/10 to-transparent md:block" />

            {/* COLUNA 2: RITMO SUGERIDO */}
            <div className="flex flex-col justify-between space-y-4 md:px-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">
                  Ritmo Sugerido
                </span>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Zap size={18} className="fill-amber-400/20" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-black tracking-tight text-amber-300">
                    {hasEditalSubjects
                      ? stats?.journey?.topicsPerWeek ?? 0
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

            <div className="pointer-events-none absolute top-4 bottom-4 left-2/3 hidden w-px bg-linear-to-b from-transparent via-white/10 to-transparent md:block" />

            {/* COLUNA 3: PROGRESSO GERAL */}
            <div className="flex flex-col justify-between space-y-4 md:pl-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                  Progresso do Edital
                </span>
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
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
                    className="h-full rounded-full bg-linear-to-r from-cyan-500 to-emerald-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] transition-all duration-1000 ease-out"
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

        {/* ================= 3. LAYOUT PRINCIPAL (PERFEITAMENTE SIMÉTRICO) ================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* COLUNA ESQUERDA - FOCO EM AÇÃO E CONTEÚDO (`lg:col-span-8`) */}
          <div className="space-y-6 lg:col-span-8">
            {/* BANNER DE ONBOARDING REQUERIDO (QUANDO NÃO HÁ EDITAL) */}
            {!hasEditalSubjects && (
              <div className="group relative overflow-hidden rounded-3xl border border-amber-500/30 bg-linear-to-br from-[#0c101d] via-[#080b14] to-[#04060c] p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 sm:p-8">
                <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
                <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                  <div className="max-w-lg space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                      <Lock size={12} /> Onboarding Requerido
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-white">
                      Configure seu Edital para Ativar a IA
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Cadastre as disciplinas do seu concurso para desbloquear
                      sugestões inteligentes de revisão, cálculo automático de
                      ritmo e plano de estudos personalizado.
                    </p>
                  </div>
                  <Link
                    href="/edital"
                    className="inline-flex cursor-pointer items-center gap-2 shrink-0 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 active:scale-95"
                  >
                    <BookOpen size={15} />
                    <span>Cadastrar Edital</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* CARD 1: Missões do Dia */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-indigo-500/30">
                <div className="flex h-full flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-400">
                        <Target size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          Missões de Hoje
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          Garanta seu bônus de XP diário
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                      +50 XP
                    </span>
                  </div>

                  {/* Lista de Missões */}
                  <div className="space-y-2.5">
                    {[
                      {
                        id: "q1",
                        title: "Responder Questões",
                        target: 10,
                        current: stats?.metrics?.questionsCount ?? 0,
                        unit: "questões",
                        actionUrl: "/questions",
                        completed: (stats?.metrics?.questionsCount ?? 0) >= 10,
                      },
                      {
                        id: "q2",
                        title: "Revisar Flashcards",
                        target: 15,
                        current: stats?.metrics?.totalFlashcards ?? 0,
                        unit: "flashcards",
                        actionUrl: "/flashcards",
                        completed: (stats?.metrics?.totalFlashcards ?? 0) >= 15,
                      },
                      {
                        id: "q3",
                        title: "Avançar no Edital",
                        target: 1,
                        current:
                          (stats?.metrics?.sessionsCount ?? 0) > 0 ? 1 : 0,
                        unit: "tópico",
                        actionUrl: "/edital",
                        completed: (stats?.metrics?.sessionsCount ?? 0) > 0,
                      },
                    ].map((quest) => {
                      const progress = Math.min(
                        100,
                        Math.round((quest.current / quest.target) * 100),
                      );

                      return (
                        <div
                          key={quest.id}
                          className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all ${
                            quest.completed
                              ? "border-emerald-500/20 bg-emerald-500/5"
                              : "border-white/5 bg-slate-950/40 hover:border-white/10"
                          }`}
                        >
                          <div className="flex flex-1 items-center gap-3">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                                quest.completed
                                  ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                                  : "border-white/10 bg-slate-900 text-slate-500"
                              }`}
                            >
                              {quest.completed ? (
                                <CheckCircle2 size={16} />
                              ) : (
                                <Zap size={14} className="text-amber-400" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center justify-between">
                                <h4
                                  className={`truncate text-xs font-bold ${
                                    quest.completed
                                      ? "text-slate-400 line-through"
                                      : "text-slate-200"
                                  }`}
                                >
                                  {quest.title}
                                </h4>
                                <span className="shrink-0 font-mono text-[10px] text-slate-400">
                                  {quest.current}/{quest.target}
                                </span>
                              </div>

                              <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    quest.completed
                                      ? "bg-emerald-400"
                                      : "bg-indigo-500"
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {!quest.completed && (
                            <Link
                              href={quest.actionUrl}
                              className="shrink-0 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-bold text-indigo-300 transition-all hover:bg-indigo-500/20 active:scale-95"
                            >
                              Ir
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* CARD 2: Métricas de Desempenho */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-indigo-500/30">
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
                    <span className="font-mono text-2xl font-black text-white md:text-3xl">
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
                        className="rounded-full bg-linear-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.6)] transition-all duration-700"
                        style={{ width: stats?.metrics?.precision || "0%" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 border-t border-white/10 pt-4 text-center">
                  <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-2.5">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Sessões
                    </span>
                    <span className="mt-0.5 block font-mono text-base font-extrabold text-white">
                      {stats?.metrics?.sessionsCount ?? 0}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-2.5">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Questões
                    </span>
                    <span className="mt-0.5 block font-mono text-base font-extrabold text-white">
                      {stats?.metrics?.questionsCount ?? 0}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-2.5">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Méd/Dia
                    </span>
                    <span className="mt-0.5 block font-mono text-base font-extrabold text-white">
                      {stats?.metrics?.averageTimePerSession || "0min"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: Sugestões com IA */}
            {hasEditalSubjects && (
              <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-cyan-500/30">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                      <Sparkles size={18} className="animate-pulse" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Sugestões Inteligentes da IA
                    </h3>
                  </div>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] font-bold uppercase text-cyan-300">
                    Synapse Neural
                  </span>
                </div>

                <div className="space-y-3">
                  <AnimatePresence mode="wait">
                    {suggestions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 py-6 text-center">
                        <p className="text-xs text-slate-400">
                          Nenhuma pendência crítica. Seu cronograma está 100%
                          otimizado!
                        </p>
                      </div>
                    ) : (
                      suggestions.map((item: Suggestion) => {
                        const targetUrl = getSuggestionUrl(item);

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3 }}
                            className={`group/item relative flex items-center justify-between gap-4 rounded-2xl border bg-slate-950/60 p-4 transition-all duration-200 hover:-translate-y-0.5 ${
                              item.type === "CRITICAL"
                                ? "border-rose-500/20 hover:border-rose-500/40"
                                : "border-white/5 hover:border-emerald-500/30"
                            }`}
                          >
                            <Link
                              href={targetUrl}
                              className="flex flex-1 items-start gap-3.5"
                            >
                              <div
                                className={`shrink-0 rounded-xl border p-2.5 ${
                                  item.icon === "brain"
                                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                }`}
                              >
                                {item.icon === "brain" ? (
                                  <BrainCircuit size={18} />
                                ) : (
                                  <ClipboardList size={18} />
                                )}
                              </div>

                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-200 transition-colors group-hover/item:text-indigo-300">
                                  {item.title}
                                </h4>
                                <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </Link>

                            <div className="flex shrink-0 items-center gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold ${
                                  item.type === "CRITICAL"
                                    ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                }`}
                              >
                                {item.type === "CRITICAL"
                                  ? "CRÍTICO"
                                  : "SUGERIDO"}
                              </span>

                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setSuggestions((prev) =>
                                    prev.filter((s) => s.id !== item.id),
                                  );

                                  if (item.topicId) {
                                    await fetch(
                                      "/api/edital/complete-suggestion",
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          topicId: item.topicId,
                                          type: "DISMISSED",
                                        }),
                                      },
                                    ).catch(console.error);
                                  }
                                }}
                                className="cursor-pointer rounded-xl p-1.5 text-slate-500 transition-colors hover:bg-slate-800/60 hover:text-white"
                                title="Dispensar sugestão"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleOptimizeSchedule}
                  disabled={isOptimizing}
                  className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-linear-to-r from-cyan-500/15 via-indigo-500/10 to-cyan-500/15 py-3 text-xs font-bold text-cyan-300 transition-all hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] active:scale-[0.99] disabled:opacity-50"
                >
                  {isOptimizing ? (
                    <>
                      <RefreshCw
                        size={14}
                        className="animate-spin text-cyan-400"
                      />
                      <span>Otimizando seu ciclo de estudos...</span>
                    </>
                  ) : isOptimized ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span className="text-emerald-400">
                        Cronograma Rebalanceado!
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles
                        size={14}
                        className="animate-pulse text-cyan-400"
                      />
                      <span>Otimizar Cronograma com IA</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* CARD 4: Minhas Matérias */}
            <div className="space-y-4 rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-6 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BookOpen size={18} className="text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Minhas Matérias
                  </h3>
                </div>
                <Link
                  href="/edital"
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
                >
                  <span>Ver todas</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                    <SubjectCardSkeleton key={i} />
                  ))}
                </div>
              ) : subjects.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-slate-950/40 py-8 text-center">
                  <p className="text-xs text-slate-400">
                    Nenhuma matéria cadastrada ainda.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-2 cursor-pointer text-xs font-bold text-indigo-400 hover:underline"
                  >
                    + Criar primeira matéria
                  </button>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                  {subjects.map((sub) => (
                    <motion.div key={sub.id} variants={itemVariants}>
                      <Link href={`/edital?subjectId=${sub.id}`}>
                        <SubjectCard
                          title={sub.name}
                          colorClass={sub.color || "#3B82F6"}
                          progress={sub.progress ?? 0}
                          accuracy={sub.accuracy ?? 0}
                          timeSpent={sub.timeSpent ?? "0min"}
                          totalCards={sub._count?.topics ?? 0}
                        />
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* BARRA LATERAL DIREITA PERFEITA (`lg:col-span-4`) */}
          <div className="space-y-6 lg:col-span-4">
            {/* WIDGET 1: GAMIFICAÇÃO & NÍVEL */}
            <Link
              href="/achievements"
              className="group relative block overflow-hidden rounded-3xl border border-amber-500/20 bg-linear-to-br from-[#090d16] via-[#0b1021] to-[#05070e] p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/40"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 font-black text-lg text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    {level}
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Nível Atual
                    </span>
                    <h3 className="text-sm font-bold tracking-tight text-white transition-colors group-hover:text-amber-300">
                      {levelTitle}
                    </h3>
                  </div>
                </div>

                <div className="shrink-0 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-amber-400">
                  <Award size={18} />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Zap size={13} className="fill-amber-400 text-amber-400" />{" "}
                    XP: <strong className="text-white">{currentXp}</strong>
                  </span>
                  <span className="font-bold text-amber-400">
                    {levelProgressPercent}%
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950 p-0.5">
                  <div
                    style={{ width: `${levelProgressPercent}%` }}
                    className="h-full rounded-full bg-linear-to-r from-amber-500 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-500"
                  />
                </div>

                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                  <span>Nível {level}</span>
                  <span>Próximo: {nextLevelXp} XP</span>
                </div>
              </div>
            </Link>

            {/* WIDGET 2: POMODORO TIMER */}
            <div id="pomodoro">
              <PomodoroTimer />
            </div>

            {/* WIDGET 3: META SEMANAL & CONSTÂNCIA (CARD UNIFICADO) */}
            <div className="space-y-4 rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-6 shadow-2xl backdrop-blur-2xl">
              {/* Meta Semanal */}
              <Link href="/performance" className="group block space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors group-hover:text-indigo-400">
                    Meta Semanal
                  </span>
                  <span className="font-mono text-xs font-black text-indigo-400">
                    {stats?.weeklyGoal?.percentage ?? 0}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-slate-950 p-0.5">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.6)] transition-all duration-700"
                    style={{
                      width: `${stats?.weeklyGoal?.percentage ?? 0}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                  <span>Concluído</span>
                  <span>
                    {stats?.weeklyGoal?.current ?? 0} /{" "}
                    {stats?.weeklyGoal?.target ?? 50} revisões
                  </span>
                </div>
              </Link>

              <div className="my-2 border-t border-white/5" />

              {/* Constância / Streak */}
              <Link href="/performance" className="group block space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors group-hover:text-amber-400">
                    Constância
                  </span>
                  <span className="flex items-center gap-1 font-mono text-xs font-black text-amber-400">
                    <Flame size={14} className="fill-amber-400 text-amber-400" />
                    {Number(
                      gStats.streakDays ??
                        globalGamification?.streak?.currentDays ??
                        0,
                    )}{" "}
                    Dias
                  </span>
                </div>

                <div className="flex justify-between gap-1">
                  {(
                    globalGamification?.streak?.weekDays || [
                      { dayLabel: "S", active: false },
                      { dayLabel: "T", active: false },
                      { dayLabel: "Q", active: false },
                      { dayLabel: "Q", active: false },
                      { dayLabel: "S", active: false },
                      { dayLabel: "S", active: false },
                      { dayLabel: "D", active: false },
                    ]
                  ).map((day, idx) => (
                    <div
                      key={idx}
                      className={`flex h-7 w-7 items-center justify-center rounded-xl font-mono text-[10px] font-bold transition-all ${
                        day.active
                          ? "bg-linear-to-br from-amber-500 to-orange-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                          : "border border-white/5 bg-slate-950/80 text-slate-600"
                      }`}
                    >
                      {day.dayLabel}
                    </div>
                  ))}
                </div>
              </Link>
            </div>

            {/* WIDGET 4: HEATMAP ORIGINAL (DENTRO DA BARRA LATERAL COM PROPORÇÃO PERFEITA) */}
            <div className="rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-6 shadow-2xl backdrop-blur-2xl">
              <Heatmap />
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
