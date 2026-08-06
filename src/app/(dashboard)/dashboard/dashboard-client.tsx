"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, Variants, AnimatePresence } from "framer-motion";
import PomodoroTimer from "@/components/pomodoro-timer";
import SubjectCard from "@/components/subject-card";
import { NewContentModal } from "@/components/create-subject-modal";
import SubjectCardSkeleton from "@/components/subject-card-skeleton";
import { RescheduleBanner } from "@/components/week/reschedule-banner";
import { useSidebar } from "@/lib/sidebar-context";
import { ReviewTopic, DashboardSubject } from "@/types";
import { calculateLevel, XP_REWARDS } from "@/lib/gamification";
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
  Loader2,
  AlertCircle,
  BrainCircuit,
  Target,
  RefreshCw,
  X,
  Zap,
  TrendingUp,
  Trophy,
  Layers,
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
  gamification?: {
    level: number;
    currentXp: number;
    nextLevelXp: number;
    title: string;
  };
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
  actionType?:
    | "QUIZ"
    | "SIMULADO"
    | "EDITAL"
    | "PLANNER"
    | "CARDS"
    | "FLASHCARDS"
    | string;
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
  const [isLoading, setIsLoading] = useState(false);

  // ⚡ ESTADOS DA IA ADAPTATIVA
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);

  // 🟢 ESTADO DE SUGESTÕES E ESTATÍSTICAS DO BANCO DE DADOS
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { stats: gamificationStats, refreshStats } = useGamification();

  // Lista de matérias
  const [subjects, setSubjects] = useState<DashboardSubject[]>([]);

  // Estado para o modal de Level Up
  const [levelUpData, setLevelUpData] = useState<{
    isOpen: boolean;
    level: number;
    title: string;
  }>({ isOpen: false, level: 1, title: "" });

  // Estado para o nome do dia perdido
  const [missedDayName, setMissedDayName] = useState<string | null>(null);

  // 1. Carrega os dados do banco
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const [resSubjects, resStats, resWeek] = await Promise.all([
        fetch("/api/edital?mode=subjects", { cache: "no-store" }),
        fetch("/api/dashboard/stats", { cache: "no-store" }),
        fetch("/api/week", { cache: "no-store" }),
      ]);

      const resSuggestions = await fetch("/api/edital/rebalance", {
        method: "POST",
      });

      if (resSuggestions.ok) {
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
        if (jsonWeek.data?.missedDayName) {
          setMissedDayName(jsonWeek.data.missedDayName);
        } else {
          setMissedDayName(null);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar os dados do Dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadDashboardData();
    };

    fetchData();
  }, []);

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
        console.error("Erro ao processar notificação de Level Up:", e);
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
      return "/cards";
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
      return "/cards";
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

  // Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#02050e] p-4 font-sans text-slate-100 selection:bg-indigo-500/30 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* ================= 1. CABEÇALHO PRINCIPAL ================= */}
        <div className="flex items-center justify-between pt-1">
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
              <p className="mt-0.5 text-xs text-slate-400">
                Bem-vindo de volta,{" "}
                <span className="font-semibold text-indigo-400">
                  {user.name || "parceiro"}
                </span>
                !
              </p>
            </div>
          </div>
        </div>

        {/* ================= 🟢 BANNER DE REMANEJAMENTO ================= */}
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
        <section className="relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-b from-[#111625]/90 to-[#0B0F17]/90 p-6 shadow-2xl backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/5 blur-[100px]" />
          <div className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-purple-600/5 blur-[100px]" />

          <div className="relative z-10 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 md:gap-0">
            {/* COLUNA 1: TEMPO RESTANTE */}
            <div className="flex flex-col justify-between space-y-4 md:pr-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-[0.2em] text-slate-400 uppercase">
                  Tempo Restante
                </span>
                <div className="rounded-xl border border-indigo-500/30 bg-linear-to-br from-indigo-500/20 to-indigo-500/5 p-2.5 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                  <Target size={18} />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-4xl font-black tracking-tight text-white">
                    {stats?.journey?.daysRemaining ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    dias restantes
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/6 pt-3 text-xs text-slate-400">
                <span className="font-medium">Restante em semanas:</span>
                <strong className="rounded border border-white/6 bg-white/4 px-2 py-0.5 font-mono font-bold text-slate-200">
                  {stats?.journey?.weeksRemaining ?? 0} sem
                </strong>
              </div>
            </div>

            <div className="pointer-events-none absolute top-4 bottom-4 left-1/3 hidden w-px bg-linear-to-b from-transparent via-white/8 to-transparent md:block" />

            {/* COLUNA 2: RITMO SUGERIDO */}
            <div className="flex flex-col justify-between space-y-4 md:px-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-[0.2em] text-amber-400 uppercase">
                  Ritmo Sugerido
                </span>
                <div className="rounded-xl border border-amber-500/30 bg-linear-to-br from-amber-500/20 to-amber-500/5 p-2.5 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <Zap size={18} className="fill-amber-400/20" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-black tracking-tight text-amber-300">
                    {stats?.journey?.topicsPerWeek ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    tópicos / sem
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/6 pt-3 text-xs text-slate-400">
                <span className="font-medium">Ritmo atual:</span>
                <strong className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono font-bold text-amber-300">
                  {stats?.journey?.currentPace ?? 0.0} / sem
                </strong>
              </div>
            </div>

            <div className="pointer-events-none absolute top-4 bottom-4 left-2/3 hidden w-px bg-linear-to-b from-transparent via-white/8 to-transparent md:block" />

            {/* COLUNA 3: PROGRESSO GERAL */}
            <div className="flex flex-col justify-between space-y-4 md:pl-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-[0.2em] text-slate-400 uppercase">
                  Progresso Geral
                </span>
                <div className="rounded-xl border border-cyan-500/30 bg-linear-to-br from-cyan-500/20 to-cyan-500/5 p-2.5 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <TrendingUp size={18} />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-4xl font-black tracking-tight text-white">
                    {stats?.journey?.percentage ?? 0}%
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    <strong className="font-bold text-slate-100">
                      {stats?.journey?.completedTopics ?? 0}
                    </strong>
                    /{stats?.journey?.totalTopics ?? 40} tópicos
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-slate-950/80 p-0.5 shadow-inner">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-cyan-500 to-emerald-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.max(3, stats?.journey?.percentage ?? 0)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/6 pt-3 text-xs text-slate-400">
                <span className="font-medium">Status atual:</span>
                <span className="inline-flex items-center gap-1.5 rounded border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-bold text-indigo-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
                  {stats?.journey?.percentage === 100
                    ? "Concluído"
                    : "Em Progresso"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. GRADE PRINCIPAL DE CONTEÚDO ================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-9">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* CARD 1: Daily Quest Log (Plano de Ataque do Dia) */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 border-t-white/15 bg-slate-900/30 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-indigo-500/40">
                <div className="absolute top-0 right-0 left-0 h-px bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />

                <div className="flex h-full flex-col justify-between space-y-4">
                  {/* Cabeçalho */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-400">
                        <Target size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold tracking-widest text-slate-200 uppercase">
                          Plano de Ataque do Dia
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          Complete as 3 missões para garantir bônus de XP
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-300 shadow-xs">
                      +50 XP BÔNUS
                    </span>
                  </div>

                  {/* Lista de Missões */}
                  <div className="space-y-2.5">
                    {[
                      {
                        id: "q1",
                        title: "Responder Questões Práticas",
                        target: 10,
                        current: stats?.metrics.questionsCount ?? 0,
                        unit: "questões",
                        actionUrl: "/questions",
                        completed: (stats?.metrics.questionsCount ?? 0) >= 10,
                      },
                      {
                        id: "q2",
                        title: "Revisar Cards da Fila",
                        target: 15,
                        current: stats?.metrics.totalFlashcards ?? 0,
                        unit: "cards",
                        actionUrl: "/cards",
                        completed: (stats?.metrics.totalFlashcards ?? 0) >= 15,
                      },
                      {
                        id: "q3",
                        title: "Sessão de Foco Ativo",
                        target: 1,
                        current: (stats?.metrics.sessionsCount ?? 0) > 0 ? 1 : 0,
                        unit: "sessão",
                        actionUrl: "#pomodoro",
                        completed: (stats?.metrics.sessionsCount ?? 0) > 0,
                      },
                    ].map((quest) => {
                      const progress = Math.min(
                        100,
                        Math.round((quest.current / quest.target) * 100)
                      );

                      return (
                        <div
                          key={quest.id}
                          className={`group/quest flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all ${
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
                                <Zap size={15} className="text-amber-400" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4
                                  className={`text-xs font-bold truncate ${
                                    quest.completed
                                      ? "text-slate-400 line-through"
                                      : "text-slate-200"
                                  }`}
                                >
                                  {quest.title}
                                </h4>
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                  {quest.current}/{quest.target} {quest.unit}
                                </span>
                              </div>

                              {/* Progress bar fina */}
                              <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    quest.completed
                                      ? "bg-emerald-400"
                                      : "bg-linear-to-r from-indigo-500 to-purple-500"
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
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 border-t-white/15 bg-slate-900/30 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-indigo-500/40">
                <div className="absolute top-0 right-0 left-0 h-px bg-linear-to-r from-transparent via-emerald-500/30 to-transparent" />

                <div className="mb-6 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">
                    Métricas de Desempenho
                  </span>
                  <span className="flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-indigo-400 uppercase shadow-xs">
                    <Zap size={11} /> Live Stats
                  </span>
                </div>

                <div className="mb-6 flex gap-6">
                  <div>
                    <span className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Tempo Total
                    </span>
                    <span className="font-mono text-2xl font-black text-white md:text-3xl">
                      {stats?.metrics.totalTimeFormatted || "0h 30m"}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      <span>Precisão</span>
                      <span className="font-mono text-emerald-400">
                        {stats?.metrics.precision || "67%"}
                      </span>
                    </div>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-slate-950 p-0.5 shadow-inner">
                      <div
                        className="rounded-full bg-linear-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.6)] transition-all duration-700"
                        style={{ width: stats?.metrics.precision || "67%" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Submétricas */}
                <div className="grid grid-cols-3 gap-2.5 border-t border-white/10 pt-4 text-center">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-2.5 transition-colors hover:border-white/20">
                    <span className="block text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                      Sessões
                    </span>
                    <span className="mt-0.5 block font-mono text-base font-extrabold text-white">
                      {stats?.metrics.sessionsCount ?? 5}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-2.5 transition-colors hover:border-white/20">
                    <span className="block text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                      Questões
                    </span>
                    <span className="mt-0.5 block font-mono text-base font-extrabold text-white">
                      {stats?.metrics.questionsCount ?? 15}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-2.5 transition-colors hover:border-white/20">
                    <span className="block text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                      Méd/Dia
                    </span>
                    <span className="mt-0.5 block font-mono text-base font-extrabold text-white">
                      {stats?.metrics.averageTimePerSession || "6min"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: Sugestões de Estudos com IA */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/10 border-t-white/15 bg-slate-900/30 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:border-cyan-500/40">
              <div className="absolute top-0 right-0 left-0 h-px bg-linear-to-r from-transparent via-cyan-500/40 to-transparent" />
              <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-[90px]" />

              <div className="relative mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <Sparkles size={18} className="animate-pulse" />
                  </div>
                  <h3 className="text-xs font-bold tracking-widest text-slate-200 uppercase">
                    Sugestões de Estudos
                  </h3>
                </div>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] font-bold tracking-widest text-cyan-300 uppercase">
                  Synapse Core v1
                </span>
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="wait">
                  {suggestions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 py-7 text-center">
                      <p className="text-xs text-slate-400">
                        Nenhuma sugestão pendente no momento. Seu ciclo de
                        revisão está 100% otimizado!
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
                          className={`group/item relative flex items-center justify-between gap-4 rounded-2xl border bg-slate-950/50 p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                            item.type === "CRITICAL"
                              ? "border-rose-500/20 hover:border-rose-500/40 hover:bg-slate-900/60"
                              : "border-white/5 hover:border-emerald-500/30 hover:bg-slate-900/60"
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
                              <h4 className="text-sm font-bold tracking-tight text-slate-200 transition-colors group-hover/item:text-indigo-300">
                                {item.title}
                              </h4>
                              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                                {item.description}
                              </p>
                            </div>
                          </Link>

                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold tracking-widest ${
                                item.type === "CRITICAL"
                                  ? "border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
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
                className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-linear-to-r from-cyan-500/15 via-indigo-500/10 to-cyan-500/15 py-3 text-xs font-bold text-cyan-300 shadow-sm transition-all hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] active:scale-[0.99] disabled:opacity-50"
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

            {/* CARD 4: Minhas Matérias */}
            <div className="space-y-6 rounded-3xl border border-white/10 border-t-white/15 bg-slate-900/30 p-6 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BookOpen size={18} className="text-indigo-400" />
                  <h3 className="text-xs font-bold tracking-widest text-slate-300 uppercase">
                    Minhas Matérias
                  </h3>
                </div>
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

          {/* ================= 4. BARRA LATERAL DIREITA ================= */}
          <div className="space-y-6 lg:col-span-3">
            {/* 1. CARD DE CONSTÂNCIA (STREAK GLOBAL) */}
            <Link
              href="/performance"
              className="group relative block overflow-hidden rounded-3xl border border-white/10 border-t-white/15 bg-slate-900/30 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-amber-500/40"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors group-hover:text-amber-400">
                    Constância
                  </h3>
                  <p className="mt-1 font-mono text-3xl font-black text-white">
                    {gamificationStats?.streak?.currentDays ?? 0} Dias
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-transform group-hover:scale-105">
                  <Flame
                    size={20}
                    className={
                      (gamificationStats?.streak?.currentDays ?? 0) > 0
                        ? "animate-pulse text-amber-400 fill-amber-400/30"
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="flex justify-between gap-1.5 pt-1">
                {(
                  gamificationStats?.streak?.weekDays || [
                    { dayLabel: "S", active: false },
                    { dayLabel: "T", active: false },
                    { dayLabel: "Q", active: false },
                    { dayLabel: "Q", active: false },
                    { dayLabel: "S", active: false },
                    { dayLabel: "S", active: false },
                    { dayLabel: "D", active: false },
                  ]
                ).map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-xl font-mono text-[10px] font-bold transition-all ${
                        day.active
                          ? "bg-linear-to-br from-amber-500 to-orange-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                          : "border border-white/5 bg-slate-950/80 text-slate-600"
                      }`}
                    >
                      {day.dayLabel}
                    </div>
                  </div>
                ))}
              </div>
            </Link>

            {/* 2. CARD DE META SEMANAL */}
            <Link
              href="/performance"
              className="group block rounded-3xl border border-white/10 border-t-white/15 bg-slate-900/30 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-indigo-500/40"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors group-hover:text-indigo-400">
                    Meta Semanal
                  </h3>
                  <p className="mt-1 font-mono text-3xl font-black text-white">
                    {stats?.weeklyGoal.percentage ?? 0}%
                  </p>
                </div>
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-transform group-hover:scale-105">
                  <BarChart3 size={20} />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-slate-950/80 p-0.5 shadow-inner">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.6)] transition-all duration-700"
                    style={{
                      width: `${stats?.weeklyGoal.percentage ?? 0}%`,
                    }}
                  />
                </div>

                <span className="block text-right font-mono text-[10px] font-semibold text-slate-400">
                  {stats?.weeklyGoal.current ?? 0} /{" "}
                  {stats?.weeklyGoal.target ?? 50} revisões
                </span>
              </div>
            </Link>

            {/* 3. HEATMAP */}
            <section className="rounded-3xl border border-white/10 border-t-white/15 bg-slate-900/30 p-5 shadow-2xl backdrop-blur-2xl">
              <Heatmap />
            </section>

            {/* 4. POMODORO TIMER */}
            <PomodoroTimer />
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
