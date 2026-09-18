"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SubjectCard from "@/components/subject-card";
import { NewContentModal } from "@/components/create-subject-modal";
import SubjectCardSkeleton from "@/components/subject-card-skeleton";
import { RescheduleBanner } from "@/components/week/reschedule-banner";
import { useSidebar } from "@/lib/sidebar-context";
import { DashboardSubject } from "@/types";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import { DailyQuestsPanel } from "@/components/dashboard/DailyQuestsPanel";
import { GamificationCockpitCard } from "@/components/dashboard/GamificationCockpitCard";
import { KeyMetricsCard } from "@/components/dashboard/KeyMetricsCard";
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
  Headphones,
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  SlidersHorizontal,
  Settings2,
  CheckSquare,
  Square,
  Eye,
} from "lucide-react";
import Heatmap from "@/components/analytics/Heatmap";
import DomainRadarChart from "@/components/dashboard/DomainRadarChart";
import { StreakFreezeModal } from "@/components/dashboard/StreakFreezeModal";
import { ApprovalOddsCard } from "@/components/dashboard/ApprovalOddsCard";
import type { ApprovalOddsData } from "@/actions/analytics-actions";
import { TutorialModal } from "@/components/tutorial/TutorialModal";
import { CustomizeCardsModal } from "@/components/dashboard/CustomizeCardsModal";
import { autoRebalanceFromPerformanceAction } from "@/actions/adaptive-actions";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";

interface JourneyData {
  hasObjective: boolean;
  daysRemaining: number;
  weeksRemaining: number;
  daysLeftInWeek: number;
  percentage: number;
  totalTopics: number;
  completedTopics: number;
  remainingTopics?: number;
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

export interface DashboardCardVisibility {
  heroJourney: boolean;
  quickActions: boolean;
  dailyQuests: boolean;
  keyMetrics: boolean;
  radarDomain: boolean;
  aiSuggestions: boolean;
  subjects: boolean;
  approvalOdds: boolean;
  gamification: boolean;
  focusRoom: boolean;
  heatmap: boolean;
}

export const DEFAULT_FULL_CARDS: DashboardCardVisibility = {
  heroJourney: true,
  quickActions: true,
  dailyQuests: true,
  keyMetrics: true,
  radarDomain: true,
  aiSuggestions: true,
  subjects: true,
  approvalOdds: true,
  gamification: true,
  focusRoom: true,
  heatmap: true,
};

export const DEFAULT_MINIMAL_CARDS: DashboardCardVisibility = {
  heroJourney: true,
  quickActions: true,
  dailyQuests: true,
  keyMetrics: false,
  radarDomain: false,
  aiSuggestions: false,
  subjects: true,
  approvalOdds: false,
  gamification: false,
  focusRoom: false,
  heatmap: false,
};

interface DashboardClientProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  initialApprovalOdds?: ApprovalOddsData | null;
}

export default function DashboardClient({
  user,
  initialApprovalOdds,
}: DashboardClientProps) {
  const { openSidebar } = useSidebar();
  const searchParams = useSearchParams();

  const isDemo =
    searchParams?.get("demo") === "true" ||
    (typeof window !== "undefined" &&
      (window.location.search.includes("demo=true") ||
        localStorage.getItem("synapse_demo_active") === "true"));

  const getHref = useCallback(
    (href: string) => {
      if (!isDemo) return href;
      const sep = href.includes("?") ? "&" : "?";
      return `${href}${sep}demo=true`;
    },
    [isDemo],
  );

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modo de Exibição do Dashboard (Minimalista vs Completo vs Personalizado)
  const [dashboardMode, setDashboardMode] = useState<"full" | "minimal" | "custom">("full");
  const [visibleCards, setVisibleCards] = useState<DashboardCardVisibility>(DEFAULT_FULL_CARDS);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);

  // Carrega preferências salvas e exibe tutorial automaticamente no 1º acesso para qualquer usuário
  useEffect(() => {
    try {
      const seen = localStorage.getItem("synapse_tutorial_seen");
      if (!seen) {
        setIsTutorialOpen(true);
      } else {
        setHasCompletedTutorial(true);
      }

      const savedMode = localStorage.getItem("synapse_dashboard_mode") as "full" | "minimal" | "custom" | null;
      const savedCards = localStorage.getItem("synapse_dashboard_cards");
      if (savedMode === "minimal") {
        setDashboardMode("minimal");
        setVisibleCards(DEFAULT_MINIMAL_CARDS);
      } else if (savedMode === "custom" && savedCards) {
        setDashboardMode("custom");
        setVisibleCards({ ...DEFAULT_FULL_CARDS, ...JSON.parse(savedCards) });
      } else {
        setDashboardMode("full");
        setVisibleCards(DEFAULT_FULL_CARDS);
      }
    } catch {}
  }, []);

  const handleSwitchMode = (mode: "full" | "minimal") => {
    setDashboardMode(mode);
    const nextCards = mode === "minimal" ? DEFAULT_MINIMAL_CARDS : DEFAULT_FULL_CARDS;
    setVisibleCards(nextCards);
    try {
      localStorage.setItem("synapse_dashboard_mode", mode);
      localStorage.setItem("synapse_dashboard_cards", JSON.stringify(nextCards));
    } catch {}
  };

  const handleToggleCard = (key: keyof DashboardCardVisibility) => {
    const updated = { ...visibleCards, [key]: !visibleCards[key] };
    setVisibleCards(updated);
    setDashboardMode("custom");
    try {
      localStorage.setItem("synapse_dashboard_mode", "custom");
      localStorage.setItem("synapse_dashboard_cards", JSON.stringify(updated));
    } catch {}
  };

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
    let url = "/edital";
    if (item.actionUrl) {
      url = item.actionUrl;
    } else if (item.actionType === "QUIZ" || item.actionType === "SIMULADO") {
      url = item.topicId ? `/questions?topicId=${item.topicId}` : "/questions";
    } else if (item.actionType === "EDITAL" || item.actionType === "PLANNER") {
      url = item.subjectId ? `/edital?subjectId=${item.subjectId}` : "/edital";
    } else if (item.actionType === "CARDS" || item.actionType === "FLASHCARDS") {
      url = "/flashcards";
    } else {
      const titleLower = item.title?.toLowerCase() || "";
      if (
        titleLower.includes("simulado") ||
        titleLower.includes("quiz") ||
        titleLower.includes("questõ")
      ) {
        url = item.topicId ? `/questions?topicId=${item.topicId}` : "/questions";
      } else if (
        titleLower.includes("edital") ||
        titleLower.includes("avançar") ||
        titleLower.includes("estudo")
      ) {
        url = item.subjectId ? `/edital?subjectId=${item.subjectId}` : "/edital";
      } else if (titleLower.includes("card") || titleLower.includes("flashcard")) {
        url = "/flashcards";
      }
    }

    return getHref(url);
  };

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadDashboardData = useCallback(async (isMountedCheck: () => boolean = () => true) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoading(true);

      const isDemoMode =
        typeof window !== "undefined" &&
        (window.location.search.includes("demo=true") ||
          localStorage.getItem("synapse_demo_active") === "true");

      const authHeaders: Record<string, string> = isDemoMode
        ? { "x-synapse-demo": "true" }
        : {};

      const appendDemoParam = (endpoint: string) => {
        if (!isDemoMode) return endpoint;
        const sep = endpoint.includes("?") ? "&" : "?";
        return `${endpoint}${sep}demo=true`;
      };

      const [resSubjects, resStats, resWeek, resSuggestions, resFreezes] =
        await Promise.all([
          fetch(appendDemoParam("/api/edital?mode=subjects"), {
            cache: "no-store",
            headers: authHeaders,
            signal: controller.signal,
          }).catch(() => null),
          fetch(appendDemoParam("/api/dashboard/stats"), {
            cache: "no-store",
            headers: authHeaders,
            signal: controller.signal,
          }).catch(() => null),
          fetch(appendDemoParam("/api/week"), {
            cache: "no-store",
            headers: authHeaders,
            signal: controller.signal,
          }).catch(() => null),
          fetch(appendDemoParam("/api/ai/suggestions"), {
            cache: "no-store",
            headers: authHeaders,
            signal: controller.signal,
          }).catch(() => null),
          fetch(appendDemoParam("/api/gamification/streak-freeze"), {
            cache: "no-store",
            headers: authHeaders,
            signal: controller.signal,
          }).catch(() => null),
        ]);

      if (controller.signal.aborted || !isMountedCheck()) return;

      if (resSuggestions && resSuggestions.ok) {
        const jsonSuggestions = await resSuggestions.json();
        if (jsonSuggestions.data?.length && isMountedCheck()) {
          setSuggestions(jsonSuggestions.data);
        }
      }

      if (resFreezes && resFreezes.ok) {
        const jsonFreezes = await resFreezes.json();
        if (isMountedCheck()) {
          setStreakFreezeCount(jsonFreezes.streakFreezes ?? 0);
        }
      }

      if (
        !isDemoMode &&
        ((resSubjects && resSubjects.status === 401) ||
          (resStats && resStats.status === 401))
      ) {
        if (isMountedCheck()) {
          window.location.href = "/login";
        }
        return;
      }

      if (resSubjects && resSubjects.ok) {
        const jsonSubjects = await resSubjects.json();
        if (isMountedCheck()) {
          setSubjects(Array.isArray(jsonSubjects.data) ? jsonSubjects.data : []);
        }
      } else if (isMountedCheck()) {
        setSubjects([]);
      }

      if (resStats && resStats.ok) {
        const jsonStats = await resStats.json();
        if (isMountedCheck()) {
          setStats(jsonStats);
        }
      } else if (isMountedCheck()) {
        setStats({
          journey: {
            hasObjective: false,
            daysRemaining: 0,
            weeksRemaining: 0,
            daysLeftInWeek: 0,
            percentage: 0,
            totalTopics: 0,
            completedTopics: 0,
            remainingTopics: 0,
            topicsPerWeek: 0,
          },
          metrics: {
            totalTimeFormatted: "0h 0m",
            precision: "0%",
            sessionsCount: 0,
            questionsCount: 0,
            totalFlashcards: 0,
            averageTimePerSession: "0min",
          },
          streak: {
            currentDays: 0,
            weekDays: [
              { dayLabel: "S", active: false },
              { dayLabel: "T", active: false },
              { dayLabel: "Q", active: false },
              { dayLabel: "Q", active: false },
              { dayLabel: "S", active: false },
              { dayLabel: "S", active: false },
              { dayLabel: "D", active: false },
            ],
          },
          weeklyGoal: { percentage: 0, target: 50, current: 0 },
          heatmap: [],
        });
      }

      if (resWeek && resWeek.ok) {
        const jsonWeek = await resWeek.json();
        if (isMountedCheck()) {
          setMissedDayName(jsonWeek.data?.missedDayName || null);
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        console.error("Erro ao carregar dados do Dashboard:", err);
      }
    } finally {
      if (isMountedCheck()) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadDashboardData(() => isMounted);

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
      // 1. Executa algoritmo adaptativo real para balancear metas e prioridades por desempenho
      try {
        await autoRebalanceFromPerformanceAction();
      } catch (rebalanceErr) {
        console.warn("Aviso ao rebalancear cronograma adaptativo:", rebalanceErr);
      }

      // 2. Busca novas sugestões inteligentes atualizadas
      const response = await fetch("/api/ai/suggestions", {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setSuggestions(data.data);
        }
      }

      // 3. Recarrega métricas do dashboard
      await loadDashboardData();

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
  const hasRightColumnCards =
    visibleCards.approvalOdds ||
    visibleCards.gamification ||
    visibleCards.focusRoom ||
    visibleCards.heatmap;

  return (
    <div className="min-h-screen w-full bg-transparent p-4 sm:p-6 md:p-8 font-sans text-slate-100 selection:bg-indigo-500/30">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* ================= 1. CABEÇALHO PRINCIPAL ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={openSidebar}
              className="cursor-pointer rounded-xl border border-white/10 bg-slate-900/60 p-2.5 text-slate-400 transition-colors hover:text-white md:hidden"
            >
              <Menu size={18} />
            </button>

            <div className="md:hidden flex items-center">
              <NotificationsPopover />
            </div>

            <div>
              <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-black tracking-tight text-white">
                Dashboard
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Bem-vindo de volta,{" "}
                <strong className="font-bold text-slate-200">
                  {user.name || "Estudante"}
                </strong>
              </p>
            </div>
          </div>

          {/* Ações e Controles Superiores do Dashboard */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Seletor de Modo: Minimalista (Essencial) vs Completo vs Personalizado */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => handleSwitchMode("minimal")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dashboardMode === "minimal"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Modo Foco Essencial: apenas metas do dia e matérias, sem sobrecarga de gráficos"
              >
                <span>🌟 Essencial</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode("full")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dashboardMode === "full"
                    ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Modo Completo: exibe todos os indicadores, predição de aprovação e métricas neurais"
              >
                <span>🚀 Completo</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dashboardMode === "custom"
                    ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Escolha exatamente quais cards aparecem na tela"
              >
                <SlidersHorizontal size={13} />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            {/* Botão de Tour pelo Sistema */}
            <button
              type="button"
              onClick={() => setIsTutorialOpen(true)}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/50 px-3.5 py-2 text-xs font-bold text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all hover:border-indigo-400 active:scale-95 relative"
              title="Iniciar tour guiado pela plataforma"
            >
              <Compass size={15} className="text-indigo-400 animate-spin-slow" />
              <span>Tour do Sistema</span>
              {!hasCompletedTutorial && (
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>

            {/* Modo Zen */}
            <button
              onClick={() => setIsZenModeOpen(true)}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-300 backdrop-blur-xl transition-all hover:bg-white/[0.08] hover:border-white/20 active:scale-95"
              title="Tela cheia minimalista para estudo focado"
            >
              <Maximize2 size={13} className="text-violet-400" />
              <span className="hidden sm:inline">Modo Zen</span>
            </button>

            {/* Iniciar Estudos */}
            <Link
              href={getHref(!isLoading && hasEditalSubjects ? "/flashcards" : "/edital")}
              className="w-full sm:w-auto justify-center flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-indigo-600/20 transition-all hover:from-indigo-500 hover:to-violet-500 active:scale-95"
            >
              <Zap size={14} className="fill-white" />
              <span>
                {isLoading
                  ? "Carregando..."
                  : hasEditalSubjects
                    ? "Iniciar Estudos"
                    : "Configurar Edital"}
              </span>
            </Link>
          </div>
        </div>

        {/* ================= ATALHOS RÁPIDOS ================= */}
        {visibleCards.quickActions && (
          <div className="hidden md:grid grid-cols-4 gap-3">
            {[
              {
                title: "Resolver Questões",
                icon: HelpCircle,
                color: "text-amber-400",
                href: "/questions",
              },
              {
                title: "Praticar Cards",
                icon: Layers,
                color: "text-indigo-400",
                href: "/flashcards",
              },
              {
                title: "Edital Verticalizado",
                icon: BookOpen,
                color: "text-cyan-400",
                href: "/edital",
                badge: !isLoading && !hasEditalSubjects ? "Passo 1" : undefined,
              },
              {
                title: "Hall de Conquistas",
                icon: Trophy,
                color: "text-emerald-400",
                href: "/achievements",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href={getHref(item.href)}
                  className="relative flex items-center justify-between gap-2 rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3.5 backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-slate-900/40 active:scale-[0.98]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className={`shrink-0 rounded-xl p-2 bg-white/[0.03] border border-white/5 ${item.color}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {item.title}
                    </span>
                  </div>
                  {item.badge && (
                    <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

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
        {visibleCards.heroJourney && (
          <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl">
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

          {/* LAYOUT MOBILE */}
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/5 md:hidden">
            <div className="px-1 flex flex-col items-center justify-center">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Dias
              </span>
              {isLoading ? (
                <div className="my-1 h-6 w-10 rounded bg-white/10 animate-pulse" />
              ) : stats?.journey?.hasObjective && (stats.journey.daysRemaining ?? 0) > 0 ? (
                <span className="font-mono text-xl font-black text-white">
                  {stats.journey.daysRemaining}
                </span>
              ) : (
                <Link
                  href={getHref("/edital")}
                  className="font-mono text-xs font-bold text-indigo-400 underline decoration-indigo-500/40 my-1 hover:text-indigo-300"
                >
                  Definir
                </Link>
              )}
              <span className="text-[9px] text-slate-500 block">restantes</span>
            </div>

            <div className="px-1 flex flex-col items-center justify-center">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-400 block">
                Ritmo
              </span>
              {isLoading ? (
                <div className="my-1 h-6 w-10 rounded bg-white/10 animate-pulse" />
              ) : stats?.journey?.hasObjective && (stats.journey.topicsPerWeek ?? 0) > 0 ? (
                <span className="font-mono text-xl font-black text-amber-300">
                  {stats.journey.topicsPerWeek}
                </span>
              ) : (
                <span className="font-mono text-xs font-bold text-amber-300/80 my-1">
                  —
                </span>
              )}
              <span className="text-[9px] text-slate-500 block">
                tópicos/sem
              </span>
            </div>

            <div className="px-1 flex flex-col items-center justify-center">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-400 block">
                Progresso
              </span>
              {isLoading ? (
                <div className="my-1 h-6 w-10 rounded bg-white/10 animate-pulse" />
              ) : (
                <span className="font-mono text-xl font-black text-cyan-300">
                  {stats?.journey?.percentage ?? 0}%
                </span>
              )}
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
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-400">
                  <Target size={18} />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  {isLoading ? (
                    <div className="h-10 w-24 rounded-lg bg-white/10 animate-pulse" />
                  ) : stats?.journey?.hasObjective && (stats.journey.daysRemaining ?? 0) > 0 ? (
                    <>
                      <span className="font-mono text-4xl font-black tracking-tight text-white">
                        {stats.journey.daysRemaining}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        dias restantes
                      </span>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <span className="font-sans text-sm font-bold text-slate-200 block">
                        Data não definida
                      </span>
                      <Link
                        href={getHref("/profile")}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <span>Definir data do concurso</span>
                        <ArrowUpRight size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-400">
                <span>Semanas até a prova:</span>
                {isLoading ? (
                  <div className="h-4 w-12 rounded bg-white/10 animate-pulse" />
                ) : (
                  <strong className="font-mono text-slate-200">
                    {stats?.journey?.hasObjective && (stats.journey.weeksRemaining ?? 0) > 0
                      ? `${stats.journey.weeksRemaining} sem`
                      : "—"}
                  </strong>
                )}
              </div>
            </div>

            <div className="pointer-events-none absolute top-4 bottom-4 left-1/3 w-px bg-linear-to-b from-transparent via-white/10 to-transparent" />

            <div className="flex flex-col justify-between space-y-4 px-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400/90">
                  Ritmo Sugerido
                </span>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-400">
                  <Zap size={18} className="fill-amber-400/20" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  {isLoading ? (
                    <div className="h-10 w-24 rounded-lg bg-amber-400/10 animate-pulse" />
                  ) : stats?.journey?.hasObjective && (stats.journey.topicsPerWeek ?? 0) > 0 ? (
                    <>
                      <span className="font-mono text-4xl font-black tracking-tight text-amber-300">
                        {stats.journey.topicsPerWeek}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        tópicos / sem
                      </span>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <span className="font-sans text-sm font-bold text-amber-300/90 block">
                        Calibrando Ritmo
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {hasEditalSubjects ? "Defina data para meta semanal" : "Aguardando matérias"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-400">
                <span>Ritmo atual:</span>
                {isLoading ? (
                  <div className="h-4 w-16 rounded bg-white/10 animate-pulse" />
                ) : (
                  <strong className="font-mono text-amber-300/90">
                    {hasEditalSubjects && stats?.journey?.currentPace && stats.journey.currentPace > 0
                      ? `${stats.journey.currentPace} / sem`
                      : "—"}
                  </strong>
                )}
              </div>
            </div>

            <div className="pointer-events-none absolute top-4 bottom-4 left-2/3 w-px bg-linear-to-b from-transparent via-white/10 to-transparent" />

            <div className="flex flex-col justify-between space-y-4 pl-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Progresso do Edital
                </span>
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-400">
                  <TrendingUp size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  {isLoading ? (
                    <div className="h-10 w-20 rounded-lg bg-cyan-400/10 animate-pulse" />
                  ) : (
                    <span className="font-mono text-4xl font-black tracking-tight text-white">
                      {stats?.journey?.percentage ?? 0}%
                    </span>
                  )}
                  {isLoading ? (
                    <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
                  ) : (
                    <span className="font-mono text-[11px] text-slate-400">
                      <strong className="font-bold text-slate-100">
                        {stats?.journey?.completedTopics ?? 0}
                      </strong>
                      /{stats?.journey?.totalTopics ?? 0} tópicos
                    </span>
                  )}
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950 p-0.5 border border-white/5">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    style={{
                      width: `${Math.max(3, stats?.journey?.percentage ?? 0)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-400">
                <span>Status:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-indigo-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
                  {isLoading
                    ? "Carregando..."
                    : !hasEditalSubjects
                      ? "Não Iniciado"
                      : stats?.journey?.percentage === 100
                        ? "Edital Completo"
                        : "Em Andamento"}
                </span>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* ================= 3. ONBOARDING DISCRETO ================= */}
        {!isLoading && !hasEditalSubjects && (
          <div className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/40 to-transparent" />
            <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="max-w-lg space-y-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-300">
                  <Lock size={12} /> Onboarding Requerido
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Configure seu Edital para Ativar a IA
                </h3>
                <p className="text-xs text-slate-400">
                  Cadastre suas matérias para destravar o cronograma semanal, simulados adaptativos e predição neural de aprovação.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsTutorialOpen(true)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/15 px-4 py-2.5 text-xs font-black text-indigo-300 shadow-md transition-all hover:bg-indigo-500/25 active:scale-95"
                >
                  <Sparkles size={14} className="text-indigo-400" />
                  <span>Modo Tutorial</span>
                </button>
                <Link
                  href={getHref("/edital")}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 shrink-0 hover:bg-amber-400 transition-all"
                >
                  <BookOpen size={15} />
                  <span>Cadastrar Edital</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ================= 4. SELETOR DE ABAS E CONTEÚDO EXCLUSIVO MOBILE ================= */}
        <div className="block md:hidden space-y-4">
          <div className="flex items-center p-1 bg-slate-950/60 border border-white/[0.08] rounded-2xl">
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
          {mobileTab === "missions" && <DailyQuestsPanel />}

          {mobileTab === "stats" && (
            <div className="space-y-4">
              {/* CHANCE DE APROVAÇÃO (PREDIÇÃO NEURAL) */}
              <ApprovalOddsCard initialData={initialApprovalOdds} />

              <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 p-5 shadow-2xl backdrop-blur-2xl">
                <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Estatísticas Chave
                  </span>
                  <span className="flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-indigo-400">
                    <Zap size={11} /> Tempo Real
                  </span>
                </div>

                <div className="mb-6 flex gap-6">
                  <div>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Tempo Total
                    </span>
                    {isLoading ? (
                      <div className="h-8 w-20 rounded bg-white/10 animate-pulse" />
                    ) : (
                      <span className="font-mono text-2xl font-black text-white">
                        {stats?.metrics?.totalTimeFormatted || "0h 0m"}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Precisão</span>
                      {isLoading ? (
                        <div className="h-3 w-8 rounded bg-emerald-400/20 animate-pulse" />
                      ) : (
                        <span className="font-mono font-bold text-emerald-400">
                          {stats?.metrics?.precision || "0%"}
                        </span>
                      )}
                    </div>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-950 p-0.5 border border-white/5">
                      <div
                        className="rounded-full bg-linear-to-r from-emerald-500 to-teal-400 h-full"
                        style={{ width: stats?.metrics?.precision || "0%" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4 text-center">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-2.5">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">
                      Sessões
                    </span>
                    {isLoading ? (
                      <div className="mx-auto my-0.5 h-5 w-8 rounded bg-white/10 animate-pulse" />
                    ) : (
                      <span className="font-mono text-sm font-extrabold text-white">
                        {stats?.metrics?.sessionsCount ?? 0}
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-2.5">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">
                      Questões
                    </span>
                    {isLoading ? (
                      <div className="mx-auto my-0.5 h-5 w-8 rounded bg-white/10 animate-pulse" />
                    ) : (
                      <span className="font-mono text-sm font-extrabold text-white">
                        {stats?.metrics?.questionsCount ?? 0}
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-2.5">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">
                      Méd/Dia
                    </span>
                    {isLoading ? (
                      <div className="mx-auto my-0.5 h-5 w-12 rounded bg-white/10 animate-pulse" />
                    ) : (
                      <span className="font-mono text-sm font-extrabold text-white">
                        {stats?.metrics?.averageTimePerSession || "0min"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 shadow-2xl backdrop-blur-2xl">
                <DomainRadarChart subjects={subjects} isLoading={isLoading} />
              </div>
            </div>
          )}

          {mobileTab === "gamification" && (
            <GamificationCockpitCard
              totalXp={currentXp}
              level={level}
              levelTitle={levelTitle}
              currentLevelXp={xpProgressInLevel}
              nextLevelXp={xpSpanForLevel}
              progressPercent={levelProgressPercent}
              streakDays={Number(
                gStats.streakDays ??
                  globalGamification?.streak?.currentDays ??
                  stats?.streak?.currentDays ??
                  0,
              )}
              streakFreezes={streakFreezeCount}
              weekDays={stats?.streak?.weekDays}
              weeklyGoalPercentage={stats?.weeklyGoal?.percentage ?? 0}
              weeklyGoalTarget={stats?.weeklyGoal?.target ?? 50}
              weeklyGoalCurrent={stats?.weeklyGoal?.current ?? 0}
              onOpenStreakModal={() => setIsStreakFreezeModalOpen(true)}
              getHref={getHref}
            />
          )}
        </div>

        {/* ================= 5. GRID PRINCIPAL (DESKTOP) ================= */}
        <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-12">
          
          {/* COLUNA ESQUERDA (expandida dinamicamente se a coluna direita estiver oculta) */}
          <div className={`space-y-6 ${hasRightColumnCards ? "lg:col-span-8" : "lg:col-span-12"}`}>
            
            {/* PAINEL DUPLO APENAS NO DESKTOP */}
            {(visibleCards.dailyQuests || visibleCards.keyMetrics) && (
              <div className={`hidden md:grid gap-6 ${visibleCards.dailyQuests && visibleCards.keyMetrics ? "grid-cols-2" : "grid-cols-1"}`}>
                {/* CARD 1: Missões do Dia */}
                {visibleCards.dailyQuests && <DailyQuestsPanel />}

                {/* CARD 2: Métricas de Desempenho & Ritmo Semanal */}
                {visibleCards.keyMetrics && (
                  <KeyMetricsCard
                    isLoading={isLoading}
                    totalTime={stats?.metrics?.totalTimeFormatted || "0h 0m"}
                    precision={stats?.metrics?.precision || "0%"}
                    sessionsCount={stats?.metrics?.sessionsCount ?? 0}
                    questionsCount={stats?.metrics?.questionsCount ?? 0}
                    averageTimePerSession={stats?.metrics?.averageTimePerSession || "0min"}
                    heatmap={stats?.heatmap}
                  />
                )}
              </div>
            )}

            {/* RADAR DE DOMÍNIO vs PESO DO EDITAL */}
            {visibleCards.radarDomain && (
              <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 shadow-2xl backdrop-blur-2xl">
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
                <DomainRadarChart subjects={subjects} isLoading={isLoading} />
              </div>
            )}

            {/* CARD 3: Sugestões com IA */}
            {!isLoading && hasEditalSubjects && (
              <div className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl">
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-500/40 to-transparent" />
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-400">
                      <Sparkles size={18} />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Sugestões Inteligentes da IA
                    </h3>
                  </div>
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[9px] font-bold text-cyan-300">
                    Synapse Neural
                  </span>
                </div>

                <div className="space-y-3">
                  {suggestions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-400">
                      Seu cronograma está 100% otimizado!
                    </div>
                  ) : (
                    suggestions.map((item: Suggestion) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 hover:border-white/10 transition-colors"
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
                  className={`mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border py-2.5 text-xs font-bold transition-all ${
                    isOptimized
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                      : "border-cyan-500/20 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                  }`}
                >
                  {isOptimizing ? (
                    <span>Otimizando Cronograma com IA...</span>
                  ) : isOptimized ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span>Cronograma e Metas Otimizados!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Otimizar Cronograma com IA</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* CARD 4: Minhas Matérias */}
            {visibleCards.subjects && (
              <div className="space-y-4 rounded-3xl border border-white/[0.08] bg-slate-950/60 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BookOpen size={18} className="text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Minhas Matérias
                    </h3>
                  </div>
                  <Link
                    href={getHref("/edital")}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
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
                      <Link key={sub.id} href={getHref(`/edital?subjectId=${sub.id}`)}>
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
            )}
          </div>

          {/* BARRA LATERAL DIREITA (`lg:col-span-4` - APENAS DESKTOP) */}
          {hasRightColumnCards && (
            <div className="hidden md:block space-y-6 lg:col-span-4">
              {/* CHANCE DE APROVAÇÃO (PREDIÇÃO NEURAL) */}
              {visibleCards.approvalOdds && (
                <ApprovalOddsCard initialData={initialApprovalOdds} />
              )}

              {/* COCKPIT DE GAMIFICAÇÃO & CONSTÂNCIA */}
              {visibleCards.gamification && (
                <GamificationCockpitCard
                  totalXp={currentXp}
                  level={level}
                  levelTitle={levelTitle}
                  currentLevelXp={xpProgressInLevel}
                  nextLevelXp={xpSpanForLevel}
                  progressPercent={levelProgressPercent}
                  streakDays={Number(
                    gStats.streakDays ??
                      globalGamification?.streak?.currentDays ??
                      stats?.streak?.currentDays ??
                      0,
                  )}
                  streakFreezes={streakFreezeCount}
                  weekDays={stats?.streak?.weekDays}
                  weeklyGoalPercentage={stats?.weeklyGoal?.percentage ?? 0}
                  weeklyGoalTarget={stats?.weeklyGoal?.target ?? 50}
                  weeklyGoalCurrent={stats?.weeklyGoal?.current ?? 0}
                  onOpenStreakModal={() => setIsStreakFreezeModalOpen(true)}
                  getHref={getHref}
                />
              )}

              {/* SALA DE FOCO & DEEP WORK (ZEN COCKPIT) */}
              {visibleCards.focusRoom && (
                <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-linear-to-br from-indigo-950/40 via-slate-950/70 to-purple-950/30 p-6 shadow-2xl backdrop-blur-2xl group hover:border-indigo-500/40 transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-400/50 to-transparent" />
                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.25)] group-hover:scale-105 transition-transform">
                          <Headphones size={20} className="animate-pulse text-indigo-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                              Sala de Foco
                            </h3>
                            <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-violet-300">
                              ZEN
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Deep Work & Bioacústica
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsZenModeOpen(true)}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-mono font-bold text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95"
                        title="Ativar tela cheia minimalista"
                      >
                        <Maximize2 size={11} className="text-violet-400" />
                        <span>Modo Zen</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-300/90 leading-relaxed">
                      Treine em estado de flow com sons binaurais procedurais (Alpha 10Hz), chuva, ruído marrom e timer pomodoro inteligente.
                    </p>

                    <div className="pt-1">
                      <Link
                        href={getHref("/study-room")}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-500/40 bg-linear-to-r from-indigo-600/80 via-purple-600/80 to-indigo-600/80 hover:from-indigo-500 hover:to-purple-500 py-3 px-4 text-xs font-bold text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-98 transition-all group/btn cursor-pointer"
                      >
                        <Headphones size={15} className="group-hover/btn:rotate-12 transition-transform" />
                        <span>Entrar na Sala de Foco</span>
                        <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* HEATMAP */}
              {visibleCards.heatmap && (
                <div className="rounded-3xl border border-white/[0.08] bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl relative">
                  <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
                  <Heatmap />
                </div>
              )}
            </div>
          )}
        </div>

        {/* SALA DE FOCO NO MOBILE */}
        <div className="block md:hidden rounded-3xl border border-indigo-500/20 bg-linear-to-br from-indigo-950/40 via-slate-950/70 to-purple-950/30 p-4 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-400">
                <Headphones size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate">Sala de Foco</h4>
                  <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-1 py-0.2 font-mono text-[8px] font-bold text-violet-300">ZEN</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">Sons binaurais & Pomodoro</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsZenModeOpen(true)}
                className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-mono font-bold text-slate-300 active:scale-95"
              >
                <Maximize2 size={11} className="text-violet-400" />
                <span>Zen</span>
              </button>

              <Link
                href={getHref("/study-room")}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/80 hover:bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-md active:scale-95"
              >
                <Headphones size={12} />
                <span>Entrar</span>
              </Link>
            </div>
          </div>
        </div>

        {/* HEATMAP NO MOBILE */}
        <div className="block md:hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 p-5 shadow-2xl backdrop-blur-2xl">
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

      {/* MODAL MODO TUTORIAL */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => {
          setIsTutorialOpen(false);
          setHasCompletedTutorial(true);
        }}
        isDemo={isDemo}
      />

      {/* MODAL DE PERSONALIZAÇÃO DE CARDS */}
      <CustomizeCardsModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        visibleCards={visibleCards}
        onToggleCard={handleToggleCard}
        onApplyPreset={handleSwitchMode}
        currentMode={dashboardMode}
      />
    </div>
  );
}
