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

  // 🧠 ESTADOS PARA A FILA DE REVISÃO DO SM-2
  const [reviewQueue, setReviewQueue] = useState<ReviewTopic[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [updatingTopicId, setUpdatingTopicId] = useState<string | null>(null);

  // ⚡ ESTADOS DA IA ADAPTATIVA
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);

  // 🟢 ESTADO DE SUGESTÕES E ESTATÍSTICAS DO BANCO DE DADOS
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Lista de matérias
  const [subjects, setSubjects] = useState<DashboardSubject[]>([]);

  // Estado para o nome do dia perdido (ex: "Domingo" ou "Ontem")
  const [missedDayName, setMissedDayName] = useState<string | null>(null);

  // 1. Carrega os dados do banco
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setIsLoadingQueue(true);

      const [resSubjects, resQueue, resStats, resWeek] = await Promise.all([
        fetch("/api/edital?mode=subjects", { cache: "no-store" }),
        fetch("/api/edital?mode=review", { cache: "no-store" }),
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

      if (
        resSubjects.status === 401 ||
        resQueue.status === 401 ||
        resStats.status === 401
      ) {
        window.location.href = "/login";
        return;
      }

      if (resSubjects.ok) {
        const jsonSubjects = await resSubjects.json();
        setSubjects(Array.isArray(jsonSubjects.data) ? jsonSubjects.data : []);
      }

      if (resQueue.ok) {
        const jsonQueue = await resQueue.json();
        setReviewQueue(Array.isArray(jsonQueue.data) ? jsonQueue.data : []);
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
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadDashboardData();
    };

    fetchData();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch("/api/edital/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar sugestões:", err);
    }
  };

  const handleReview = async (
    topicId: string,
    grade: "Bom" | "Difícil" | "Errei",
  ) => {
    try {
      setUpdatingTopicId(topicId);

      const performance = grade === "Bom" ? 100 : grade === "Difícil" ? 60 : 20;

      const response = await fetch("/api/edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          grade,
          performance,
        }),
      });

      if (response.ok) {
        setReviewQueue((prev) => prev.filter((topic) => topic.id !== topicId));
        await fetchSuggestions();
        const resStats = await fetch("/api/dashboard/stats", {
          cache: "no-store",
        });
        if (resStats.ok) setStats(await resStats.json());
      }
    } catch (err) {
      console.error("Erro ao enviar revisão:", err);
    } finally {
      setUpdatingTopicId(null);
    }
  };

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
    <div className="min-h-screen bg-[#02050e] text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ================= 1. CABEÇALHO PRINCIPAL ================= */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={openSidebar}
              className="p-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-slate-400 hover:text-white md:hidden transition-colors cursor-pointer"
            >
              <Menu size={18} />
            </button>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Dashboard
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Bem-vindo de volta,{" "}
                <span className="text-indigo-400 font-semibold">
                  {user.name || "parceiro"}
                </span>
                !
              </p>
            </div>
          </div>
        </div>

        {/* ================= 🟢 BANNER DE REMANEJAMENTO ================= */}
        {missedDayName && (
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
          {/* Ambient Lighting com Radial Gradient sutil */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 items-stretch">
            {/* COLUNA 1: TEMPO RESTANTE */}
            <div className="flex flex-col justify-between md:pr-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">
                  Tempo Restante
                </span>
                <div className="p-2.5 rounded-xl bg-linear-to-br from-indigo-500/20 to-indigo-500/5 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                  <Target size={18} />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-4xl font-black font-mono text-white tracking-tight">
                    {stats?.journey?.daysRemaining ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    dias restantes
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/6 pt-3">
                <span className="font-medium">Restante em semanas:</span>
                <strong className="text-slate-200 font-mono font-bold bg-white/4 px-2 py-0.5 rounded border border-white/6">
                  {stats?.journey?.weeksRemaining ?? 0} sem
                </strong>
              </div>
            </div>

            {/* DIVISOR 1 (Gradiente suave de luz) */}
            <div className="hidden md:block absolute left-1/3 top-4 bottom-4 w-px bg-linear-to-b from-transparent via-white/8 to-transparent pointer-events-none" />

            {/* COLUNA 2: RITMO SUGERIDO */}
            <div className="flex flex-col justify-between md:px-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-[0.2em]">
                  Ritmo Sugerido
                </span>
                <div className="p-2.5 rounded-xl bg-linear-to-br from-amber-500/20 to-amber-500/5 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <Zap size={18} className="fill-amber-400/20" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-mono text-amber-300 tracking-tight">
                    {stats?.journey?.topicsPerWeek ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    tópicos / sem
                  </span>
                </div>
              </div>

              {/* Rodapé Comparativo: Mostra a velocidade real executada pelo usuário */}
              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/6 pt-3">
                <span className="font-medium">Ritmo atual:</span>
                <strong className="text-amber-300 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {stats?.journey?.currentPace ?? 0.0} / sem
                </strong>
              </div>
            </div>

            {/* DIVISOR 2 */}
            <div className="hidden md:block absolute left-2/3 top-4 bottom-4 w-px bg-linear-to-b from-transparent via-white/8 to-transparent pointer-events-none" />

            {/* COLUNA 3: PROGRESSO GERAL */}
            <div className="flex flex-col justify-between md:pl-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">
                  Progresso Geral
                </span>
                <div className="p-2.5 rounded-xl bg-linear-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <TrendingUp size={18} />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-4xl font-black font-mono text-white tracking-tight">
                    {stats?.journey?.percentage ?? 0}%
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    <strong className="text-slate-100 font-bold">
                      {stats?.journey?.completedTopics ?? 0}
                    </strong>
                    /40 tópicos
                  </span>
                </div>

                {/* Barra Cyan Neon Profunda */}
                <div className="h-2 w-full bg-slate-950/80 rounded-full border border-white/10 p-0.5 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-linear-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                    style={{
                      width: `${Math.max(3, stats?.journey?.percentage ?? 0)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/6 pt-3">
                <span className="font-medium">Status atual:</span>
                <span className="inline-flex items-center gap-1.5 text-indigo-300 font-bold text-[11px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  {stats?.journey?.percentage === 100
                    ? "Concluído"
                    : "Em Progresso"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. GRADE PRINCIPAL DE CONTEÚDO ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CARD 1: Fila de Revisões (SM-2) */}
              <div className="bg-slate-900/30 backdrop-blur-2xl border border-white/10 hover:border-indigo-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-300 border-t-white/15 group">
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />

                {isLoadingQueue ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-10 text-slate-400 gap-3">
                    <Loader2
                      size={26}
                      className="animate-spin text-indigo-400"
                    />
                    <span className="text-xs font-medium tracking-wide">
                      Sincronizando curva de retenção...
                    </span>
                  </div>
                ) : reviewQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                    <div className="bg-emerald-500/10 text-emerald-400 p-3.5 rounded-2xl border border-emerald-500/20 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 size={28} />
                    </div>
                    <h3 className="font-bold text-slate-200 text-sm tracking-wide">
                      Revisões em dia!
                    </h3>
                    <p className="text-xs text-slate-400 max-w-60 mt-1.5 leading-relaxed">
                      Sua curva de esquecimento está devidamente estabilizada
                      para hoje.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full justify-between space-y-5">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3.5">
                      <span className="text-[11px] font-black text-indigo-400 flex items-center gap-2 uppercase tracking-widest">
                        <AlertCircle size={15} /> Revisões de Hoje
                      </span>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-mono font-bold shadow-xs">
                        {reviewQueue.length}{" "}
                        {reviewQueue.length === 1 ? "tópico" : "tópicos"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
                        {reviewQueue[0].subject?.name || "Matéria Principal"}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1 line-clamp-1 tracking-tight">
                        {reviewQueue[0].title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {reviewQueue[0].firstStudy === "Pendente"
                          ? "🌱 Assunto novo! Faça o estudo base e marque o nível de facilidade."
                          : "⏱️ Intervalo atingido! Faça a revisão ativa para fixação de memória."}
                      </p>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2.5">
                        Qual foi o nível de facilidade?
                      </p>

                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          disabled={updatingTopicId !== null}
                          onClick={() =>
                            handleReview(reviewQueue[0].id, "Errei")
                          }
                          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs py-2.5 rounded-2xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        >
                          {updatingTopicId === reviewQueue[0].id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            "Errei 👎"
                          )}
                        </button>

                        <button
                          disabled={updatingTopicId !== null}
                          onClick={() =>
                            handleReview(reviewQueue[0].id, "Difícil")
                          }
                          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs py-2.5 rounded-2xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        >
                          {updatingTopicId === reviewQueue[0].id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            "Difícil ✊"
                          )}
                        </button>

                        <button
                          disabled={updatingTopicId !== null}
                          onClick={() => handleReview(reviewQueue[0].id, "Bom")}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs py-2.5 rounded-2xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        >
                          {updatingTopicId === reviewQueue[0].id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            "Fácil 👍"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 2: Métricas de Desempenho */}
              <div className="bg-slate-900/30 backdrop-blur-2xl border border-white/10 hover:border-indigo-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between transition-all duration-300 border-t-white/15 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-emerald-500/30 to-transparent" />

                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                    Métricas de Desempenho
                  </span>
                  <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 rounded-full shadow-xs">
                    <Zap size={11} /> Live Stats
                  </span>
                </div>

                <div className="flex gap-6 mb-6">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1 tracking-wider">
                      Tempo Total
                    </span>
                    <span className="text-2xl md:text-3xl font-black text-white font-mono">
                      {stats?.metrics.totalTimeFormatted || "0h 30m"}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">
                      <span>Precisão</span>
                      <span className="text-emerald-400 font-mono">
                        {stats?.metrics.precision || "67%"}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/10 shadow-inner p-0.5">
                      <div
                        className="bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                        style={{ width: stats?.metrics.precision || "67%" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Submétricas */}
                <div className="grid grid-cols-3 gap-2.5 border-t border-white/10 pt-4 text-center">
                  <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-2.5 hover:border-white/20 transition-colors">
                    <span className="text-[10px] text-slate-300 uppercase font-bold block tracking-wider">
                      Sessões
                    </span>
                    <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
                      {stats?.metrics.sessionsCount ?? 5}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-2.5 hover:border-white/20 transition-colors">
                    <span className="text-[10px] text-slate-300 uppercase font-bold block tracking-wider">
                      Questões
                    </span>
                    <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
                      {stats?.metrics.questionsCount ?? 15}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-2.5 hover:border-white/20 transition-colors">
                    <span className="text-[10px] text-slate-300 uppercase font-bold block tracking-wider">
                      Méd/Dia
                    </span>
                    <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
                      {stats?.metrics.averageTimePerSession || "6min"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: Sugestões de Estudos com IA */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/30 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:border-cyan-500/40 border-t-white/15">
              <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-500/40 to-transparent" />
              <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-[90px] pointer-events-none" />

              <div className="relative flex justify-between items-center mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-cyan-500/10 p-2 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <Sparkles size={18} className="animate-pulse" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                    Sugestões de Estudos
                  </h3>
                </div>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                  Synapse Core v1
                </span>
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="wait">
                  {suggestions.length === 0 ? (
                    <div className="text-center py-7 border border-dashed border-white/10 rounded-2xl bg-slate-950/30">
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
                            className="flex items-start gap-3.5 flex-1"
                          >
                            <div
                              className={`p-2.5 rounded-xl border shrink-0 ${
                                item.icon === "brain"
                                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              }`}
                            >
                              {item.icon === "brain" ? (
                                <BrainCircuit size={18} />
                              ) : (
                                <ClipboardList size={18} />
                              )}
                            </div>

                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-slate-200 group-hover/item:text-indigo-300 transition-colors tracking-tight">
                                {item.title}
                              </h4>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          </Link>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[9px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-full border ${
                                item.type === "CRITICAL"
                                  ? "text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                                  : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
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
                              className="p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
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
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-linear-to-r from-cyan-500/15 via-indigo-500/10 to-cyan-500/15 py-3 text-xs font-bold text-cyan-300 transition-all hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-sm"
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
                      className="text-cyan-400 animate-pulse"
                    />
                    <span>Otimizar Cronograma com IA</span>
                  </>
                )}
              </button>
            </div>

            {/* CARD 4: Minhas Matérias */}
            <div className="bg-slate-900/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 border-t-white/15">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BookOpen size={18} className="text-indigo-400" />
                  <h3 className="font-bold text-xs text-slate-300 tracking-widest uppercase">
                    Minhas Matérias
                  </h3>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <SubjectCardSkeleton key={i} />
                  ))}
                </div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-8 bg-slate-950/40 border border-white/5 rounded-2xl">
                  <p className="text-xs text-slate-400">
                    Nenhuma matéria cadastrada ainda.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-2 text-xs text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    + Criar primeira matéria
                  </button>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
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
          <div className="lg:col-span-3 space-y-6">
            {/* CARD DE CONSTÂNCIA */}
            <Link
              href="/analytics"
              className="bg-slate-900/30 backdrop-blur-2xl border border-white/10 hover:border-amber-500/40 p-6 rounded-3xl transition-all duration-300 block group shadow-2xl relative overflow-hidden border-t-white/15"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-amber-400 transition-colors">
                    Constância
                  </h3>
                  <p className="text-3xl font-black text-white font-mono mt-1">
                    {stats?.streak.currentDays ?? 0} Dias
                  </p>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-2xl group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Flame size={20} />
                </div>
              </div>

              <div className="flex gap-1.5 justify-between pt-1">
                {(
                  stats?.streak.weekDays || [
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
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                        day.active
                          ? "bg-linear-to-br from-amber-500 to-orange-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                          : "bg-slate-950/80 border border-white/5 text-slate-600"
                      }`}
                    >
                      {day.dayLabel}
                    </div>
                  </div>
                ))}
              </div>
            </Link>

            {/* CARD DE META SEMANAL */}
            <Link
              href="/performance"
              className="bg-slate-900/30 backdrop-blur-2xl border border-white/10 hover:border-indigo-500/40 p-6 rounded-3xl transition-all duration-300 block group shadow-2xl border-t-white/15"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                    Meta Semanal
                  </h3>
                  <p className="text-3xl font-black text-white font-mono mt-1">
                    {stats?.weeklyGoal.percentage ?? 0}%
                  </p>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-2xl group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <BarChart3 size={20} />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="h-2.5 w-full bg-slate-950/80 rounded-full border border-white/10 p-0.5 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)] transition-all duration-700"
                    style={{
                      width: `${stats?.weeklyGoal.percentage ?? 0}%`,
                    }}
                  />
                </div>

                <span className="text-[10px] text-slate-400 font-mono block text-right font-semibold">
                  {stats?.weeklyGoal.current ?? 0} /{" "}
                  {stats?.weeklyGoal.target ?? 50} revisões
                </span>
              </div>
            </Link>

            {/* HEATMAP DE INTENSIFICAÇÃO */}
            <section className="bg-slate-900/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl border-t-white/15">
              <Heatmap />
            </section>

            {/* CRONÔMETRO POMODORO */}
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
    </div>
  );
}
