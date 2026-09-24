"use client";

import React, { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/lib/sidebar-context";
import {
  autoRebalanceFromPerformanceAction,
  resetScheduleToDefaultAction,
  RebalanceComparisonItem,
} from "@/actions/adaptive-actions";
import { EditalEmptyState } from "@/components/edital-empty-state";
import { ApprovalPredictorSection } from "@/components/performance/ApprovalPredictorSection";
import { AdaptiveRebalanceComparisonModal } from "@/components/performance/AdaptiveRebalanceComparisonModal";
import {
  Menu,
  TrendingUp,
  Calendar,
  CheckSquare,
  Loader2,
  AlertTriangle,
  Activity,
  Flame,
  ArrowRight,
  Zap,
  Sparkles,
  Brain,
  AlertCircle,
  BookOpen,
  Sliders,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Info,
  Layers,
  Clock,
  ShieldCheck,
  RotateCcw,
  Target,
  Search,
  Filter,
  BarChart3,
} from "lucide-react";

interface SubjectPerformance {
  subjectId?: string;
  subject: string;
  total: number;
  correct: number;
  accuracy: number | null;
  hasActivity?: boolean;
  baseWeeklyMinutes?: number;
  targetWeeklyMinutes?: number;
  isReinforced?: boolean;
  isOptimized?: boolean;
}

interface WeakTopic {
  id?: string;
  title: string;
  subject: string;
  accuracy: number;
  total: number;
}

interface CognitiveMasteryComponents {
  quizAccuracy: number | null;
  quizScore: number;
  memoryRetention: number;
  retentionScore: number;
  editalCoverage: number;
  coverageScore: number;
  studiedTopicsCount: number;
  totalTopics: number;
  totalQuizQuestions: number;
}

interface AnalyticsData {
  metrics: {
    totalTopics: number;
    completedReviews: number;
    estimatedRetention: string;
    retentionValue?: number;
    retentionStatus?: {
      status: string;
      label: string;
      description: string;
      color: "emerald" | "amber" | "rose" | "indigo";
      bgBadge?: string;
      textBadge?: string;
      borderBadge?: string;
    };
    avgEasiness: number;
    materiasPendentes: number;
    cognitiveMastery?: {
      score: number;
      level: string;
      badgeColor: "rose" | "amber" | "indigo" | "emerald";
      components: CognitiveMasteryComponents;
    };
    fsrsMaturity?: {
      totalCards: number;
      newCards: number;
      learningCards: number;
      matureCards: number;
      leechCards: number;
    };
  };
  chartDistribution: Array<{ day: string; quantidade: number }>;
  performanceSummary: {
    bom: number;
    dificil: number;
    errei: number;
    total?: number;
    source?: "mixed" | "quiz" | "flashcard" | "none";
  };
  subjectStats?: SubjectPerformance[];
  weakTopics?: WeakTopic[];
  rebalanceSuggestions?: {
    needsRebalance: boolean;
    isApplied?: boolean;
    highPriority: SubjectPerformance[];
    optimized: SubjectPerformance[];
    untestedCount: number;
  };
}

interface AnalyticsClientProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function AnalyticsClient({ user: _user }: AnalyticsClientProps) {
  const { openSidebar } = useSidebar();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDayName, setCurrentDayName] = useState<string>("");

  const [isRebalancing, startRebalanceTransition] = useTransition();
  const [rebalancedSuccess, setRebalancedSuccess] = useState(false);
  const [isResetting, startResetTransition] = useTransition();

  // Modal de Antes vs. Depois do Rebalanceamento
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [rebalanceComparison, setRebalanceComparison] = useState<
    RebalanceComparisonItem[]
  >([]);
  const [rebalanceTotalHours, setRebalanceTotalHours] = useState(10);

  // Expansão de detalhes de transparência do score
  const [showMasteryBreakdown, setShowMasteryBreakdown] = useState(false);

  // Navegação por abas
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"approval" | "edital" | "memory">(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "edital" || tabParam === "memory") return tabParam;
    return "approval";
  });

  const handleTabChange = (newTab: "approval" | "edital" | "memory") => {
    setActiveTab(newTab);
    const newUrl = newTab === "approval" ? window.location.pathname : `?tab=${newTab}`;
    window.history.replaceState(null, "", newUrl);
  };

  // Filtros da aba Edital (Aproveitamento por Disciplina)
  const [subjectFilter, setSubjectFilter] = useState<"all" | "active" | "critical" | "pending">("all");
  const [subjectSearch, setSubjectSearch] = useState("");

  // Expansão da lista de reforço do Adaptive Rebalancer
  const [isRebalanceListExpanded, setIsRebalanceListExpanded] = useState(false);

  // 1. Evita Hydration Mismatch definindo a data apenas no cliente
  useEffect(() => {
    const day = new Date()
      .toLocaleDateString("pt-BR", { weekday: "short" })
      .substring(0, 3)
      .toUpperCase();
    setCurrentDayName(day);
  }, []);

  // 2. Função de carregamento memorizada
  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/analytics/performance");

      if (!response.ok) throw new Error("Falha ao carregar estatísticas");
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // 3. Rebalanceamento adaptativo com IA e modal comparativo
  const handleApplyAdaptiveRebalance = () => {
    startRebalanceTransition(async () => {
      try {
        const res = await autoRebalanceFromPerformanceAction();

        if (res?.success) {
          if (res.comparison && res.comparison.length > 0) {
            setRebalanceComparison(res.comparison);
            setRebalanceTotalHours(res.totalWeeklyHours || 10);
            setIsComparisonOpen(true);
          }
          setRebalancedSuccess(true);
          await fetchAnalytics(); // Recarrega métricas atualizadas
          setTimeout(() => setRebalancedSuccess(false), 4000);
        } else if (res?.error) {
          console.error("Erro no rebalanceamento:", res.error);
        }
      } catch (err) {
        console.error("Erro ao aplicar rebalanceamento adaptativo:", err);
      }
    });
  };

  const handleResetSchedule = () => {
    startResetTransition(async () => {
      try {
        const res = await resetScheduleToDefaultAction();
        if (res?.success) {
          await fetchAnalytics();
        }
      } catch (err) {
        console.error("Erro ao restaurar metas do edital:", err);
      }
    });
  };

  const allSubjects = data?.subjectStats || [];
  const activeSubjectsCount = allSubjects.filter(
    (s) => s.hasActivity && s.accuracy !== null,
  ).length;
  const criticalSubjectsCount = allSubjects.filter(
    (s) => s.hasActivity && s.accuracy !== null && s.accuracy < 60,
  ).length;
  const pendingSubjectsCount = allSubjects.filter(
    (s) => !s.hasActivity || s.accuracy === null,
  ).length;

  const filteredSubjects = useMemo(() => {
    return allSubjects.filter((s) => {
      if (subjectSearch.trim()) {
        const q = subjectSearch.toLowerCase();
        if (!s.subject.toLowerCase().includes(q)) return false;
      }
      if (subjectFilter === "active") return s.hasActivity && s.accuracy !== null;
      if (subjectFilter === "critical")
        return s.hasActivity && s.accuracy !== null && s.accuracy < 60;
      if (subjectFilter === "pending")
        return !s.hasActivity || s.accuracy === null;
      return true;
    });
  }, [allSubjects, subjectSearch, subjectFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#02050e] text-slate-100 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          Consolidando inteligência cognitiva real...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#02050e] text-slate-100 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
          <AlertTriangle size={36} className="animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-white">Ops! Algo deu errado</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          {error || "Não foi possível carregar o painel de métricas."}
        </p>
      </div>
    );
  }

  const hasTopics = data.metrics.totalTopics > 0;

  const totalSummary =
    (data.performanceSummary.bom || 0) +
    (data.performanceSummary.dificil || 0) +
    (data.performanceSummary.errei || 0);

  const maxChartQty = Math.max(
    ...data.chartDistribution.map((d) => d.quantidade),
    1,
  );

  // Rebalance suggestions reais vindas da inteligência matemática
  const highPrioritySubjects = data.rebalanceSuggestions?.highPriority || [];
  const optimizedSubjects = data.rebalanceSuggestions?.optimized || [];
  const untestedCount = data.rebalanceSuggestions?.untestedCount || 0;
  const isRebalanceApplied = Boolean(data.rebalanceSuggestions?.isApplied);
  const hasRebalanceSuggestions =
    highPrioritySubjects.length > 0 || optimizedSubjects.length > 0;

  const mastery = data.metrics.cognitiveMastery;
  const fsrsMaturity = data.metrics.fsrsMaturity;
  const retentionStatus = data.metrics.retentionStatus;

  return (
    <div className="relative min-h-screen bg-[#02050e] text-slate-100 p-4 md:p-8 font-sans antialiased selection:bg-indigo-500/30 overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/4 h-125 w-125 rounded-full bg-indigo-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-100 w-100 rounded-full bg-purple-500/10 blur-[130px]" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={openSidebar}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white md:hidden transition-colors cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <Activity size={13} className="text-indigo-400" />
                <span>Analytics & Inteligência Cognitiva</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                Desempenho Cognitivo
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Acompanhamento com métricas 100% autênticas: algoritmos FSRS, simulados reais e cobertura do edital.
              </p>
            </div>
          </div>
        </div>

        {/* BANNER DE ONBOARDING SE NÃO HOUVER TÓPICOS */}
        {!hasTopics ? (
          <EditalEmptyState
            title="Mapeamento de Performance Inativo"
            description="Cadastre os tópicos do seu edital para começar a acompanhar seu grau de domínio, probabilidade de retenção e curva de esquecimento por matéria."
          />
        ) : (
          <>
            {/* 4 CARDS DE MÉTRICAS PRINCIPAIS (COCKPIT GLOBAL NO TOPO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Retenção Estimada FSRS */}
              <div className="relative group overflow-hidden bg-gradient-to-br from-[#090d16] to-[#05070e] border border-white/10 hover:border-emerald-500/40 rounded-3xl p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Retenção de Memória FSRS
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500 font-mono tracking-tight">
                      {data.metrics.estimatedRetention}
                    </span>
                    <span
                      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        retentionStatus?.color === "emerald"
                          ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                          : retentionStatus?.color === "amber"
                            ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                            : retentionStatus?.color === "rose"
                              ? "text-rose-300 bg-rose-500/10 border-rose-500/30"
                              : "text-indigo-300 bg-indigo-500/10 border-indigo-500/30"
                      }`}
                    >
                      {retentionStatus?.label || "Estável"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-1">
                    {retentionStatus?.description || "Curva de esquecimento FSRS calculada."}
                  </p>
                </div>
              </div>

              {/* Card 2: Grau de Domínio Cognitivo Real */}
              <div className="relative group overflow-hidden bg-gradient-to-br from-[#090d16] to-[#05070e] border border-white/10 hover:border-indigo-500/40 rounded-3xl p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Grau de Domínio Cognitivo
                  </span>
                  <button
                    onClick={() => setShowMasteryBreakdown((prev) => !prev)}
                    className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-white transition-colors cursor-pointer"
                    title="Ver fórmula transparente do score"
                  >
                    {showMasteryBreakdown ? <ChevronUp size={14} /> : <Info size={14} />}
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-indigo-500 font-mono tracking-tight flex items-baseline gap-1">
                      {mastery?.score.toFixed(1) ?? "0.0"}
                      <span className="text-xs font-semibold text-slate-500 font-sans">
                        / 10
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        mastery?.badgeColor === "emerald"
                          ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                          : mastery?.badgeColor === "indigo"
                            ? "text-indigo-300 bg-indigo-500/10 border-indigo-500/30"
                            : mastery?.badgeColor === "amber"
                              ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                              : "text-rose-300 bg-rose-500/10 border-rose-500/30"
                      }`}
                    >
                      {mastery?.level || "Fase Inicial"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Score real: 50% Questões + 30% FSRS + 20% Edital.
                  </p>
                </div>
              </div>

              {/* Card 3: Revisões Realizadas */}
              <div className="relative group overflow-hidden bg-gradient-to-br from-[#090d16] to-[#05070e] border border-white/10 hover:border-purple-500/40 rounded-3xl p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Revisões Realizadas
                  </span>
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <CheckSquare size={16} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-white font-mono tracking-tight">
                      {data.metrics.completedReviews}
                    </span>
                    <span className="inline-flex items-center text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                      Sessões
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Sessões de repetição concluídas.
                  </p>
                </div>
              </div>

              {/* Card 4: Tópicos Mapeados */}
              <div className="relative group overflow-hidden bg-gradient-to-br from-[#090d16] to-[#05070e] border border-white/10 hover:border-amber-500/40 rounded-3xl p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Tópicos do Edital
                  </span>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Calendar size={16} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 font-mono tracking-tight">
                      {data.metrics.totalTopics}
                    </span>
                    <span className="inline-flex items-center text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      {mastery?.components.studiedTopicsCount || 0} Ativos
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Conteúdos cadastrados na grade de estudos.
                  </p>
                </div>
              </div>
            </div>

            {/* DETALHAMENTO DE TRANSPARÊNCIA DO GRAU DE DOMÍNIO (EXPANSÍVEL) */}
            {showMasteryBreakdown && mastery && (
              <div className="bg-gradient-to-br from-[#0c1224] to-[#060a14] border border-indigo-500/30 rounded-3xl p-6 backdrop-blur-2xl space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Brain size={18} className="text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">
                      Transparência do Grau de Domínio ({mastery.score.toFixed(1)} / 10)
                    </h3>
                  </div>
                  <span className="text-xs text-indigo-300 font-mono">
                    Ponderação Multidimensional
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">1. Acurácia em Questões</span>
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        Peso 50%
                      </span>
                    </div>
                    <div className="text-2xl font-black font-mono text-white">
                      {mastery.components.quizAccuracy !== null
                        ? `${mastery.components.quizAccuracy}%`
                        : "Sem dados"}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {mastery.components.totalQuizQuestions} questões resolvidas em simulados. Parcela de score:{" "}
                      <strong className="text-indigo-300 font-mono">
                        {mastery.components.quizScore.toFixed(1)} / 10
                      </strong>
                      .
                    </p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">2. Retenção FSRS</span>
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        Peso 30%
                      </span>
                    </div>
                    <div className="text-2xl font-black font-mono text-white">
                      {mastery.components.memoryRetention}%
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Probabilidade de fixação na curva de Ebbinghaus. Parcela de score:{" "}
                      <strong className="text-indigo-300 font-mono">
                        {mastery.components.retentionScore.toFixed(1)} / 10
                      </strong>
                      .
                    </p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">3. Cobertura do Edital</span>
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        Peso 20%
                      </span>
                    </div>
                    <div className="text-2xl font-black font-mono text-white">
                      {mastery.components.editalCoverage}%
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {mastery.components.studiedTopicsCount} de {mastery.components.totalTopics} tópicos iniciados. Parcela de score:{" "}
                      <strong className="text-indigo-300 font-mono">
                        {mastery.components.coverageScore.toFixed(1)} / 10
                      </strong>
                      .
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SELETOR DE ABAS PRINCIPAL (TABS NAVEGADOR) */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#090d16]/80 border border-white/10 backdrop-blur-xl shadow-xl">
              <button
                type="button"
                onClick={() => handleTabChange("approval")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "approval"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Target size={14} />
                <span>Diagnóstico de Aprovação</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("edital")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "edital"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <BookOpen size={14} />
                <span>Edital &amp; Pontos Fracos</span>
                {data.weakTopics && data.weakTopics.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {data.weakTopics.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("memory")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "memory"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Brain size={14} />
                <span>Retenção &amp; Memória (FSRS)</span>
                {fsrsMaturity && fsrsMaturity.totalCards > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {fsrsMaturity.totalCards}
                  </span>
                )}
              </button>
            </div>

            {/* ABA 1: DIAGNÓSTICO DE APROVAÇÃO */}
            {activeTab === "approval" && (
              <motion.div
                key="tab-approval"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* BANNER DE REVISÕES OU CURVA ESTABILIZADA */}
                {data.metrics.materiasPendentes > 0 ? (
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-indigo-900/40 to-[#04060c] border border-indigo-500/40 p-6 shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-indigo-500/60 transition-all">
                    <div className="pointer-events-none absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        <Flame size={22} className="text-indigo-400 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          Revisões Prontas para Consolidação
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-mono font-black shadow-[0_0_12px_rgba(99,102,241,0.6)]">
                            {data.metrics.materiasPendentes}
                          </span>
                        </h3>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          Você tem {data.metrics.materiasPendentes} tópicos/cards atingindo o ponto ideal na curva de Ebbinghaus hoje.
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/edital"
                      className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95 shrink-0 cursor-pointer"
                    >
                      <span>Ir para o Planner</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#090d16] to-[#05070e] border border-white/10 p-5 backdrop-blur-2xl flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white">
                          Curva de Esquecimento Estabilizada
                        </h3>
                        <p className="text-slate-400 text-[11px]">
                          Você não possui nenhuma revisão pendente acumulada para hoje. Excelente constância!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PREDITOR DE APROVAÇÃO & NOTA DE CORTE DINÂMICA */}
                <ApprovalPredictorSection />

                {/* SUGESTÕES DE AJUSTE DO ALVO (ADAPTIVE REBALANCER) */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1021] to-[#050814] border border-cyan-500/30 p-6 backdrop-blur-2xl space-y-4 shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                        <Sliders size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          {isRebalanceApplied ? "Calibração Adaptativa em Vigor" : "Sugestões de Ajuste do Alvo"}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 border ${
                              isRebalanceApplied
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            }`}
                          >
                            {isRebalanceApplied ? (
                              <>
                                <Check size={11} /> Ativo no Cronograma Semanal
                              </>
                            ) : (
                              "Adaptive Rebalancer"
                            )}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {isRebalanceApplied
                            ? "O reforço de +25% de tempo já está ativo no seu Cronograma Semanal (/week) para sanar as matérias abaixo de 65%. Conforme você resolver novos simulados e subir a acurácia, a carga será normalizada."
                            : hasRebalanceSuggestions
                              ? "O motor adaptativo detectou assimetrias no seu desempenho e calculou a redistribuição exata das horas semanais."
                              : "Suas metas semanais estão perfeitamente equilibradas com seu rendimento atual."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isRebalanceApplied && (
                        <Link
                          href="/week"
                          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs transition-all cursor-pointer"
                        >
                          <Calendar size={14} />
                          <span>Ver na Semana</span>
                        </Link>
                      )}

                      <button
                        onClick={handleApplyAdaptiveRebalance}
                        disabled={isRebalancing}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {isRebalancing ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Calibrando...</span>
                          </>
                        ) : rebalancedSuccess ? (
                          <>
                            <Check size={14} />
                            <span>Metas Calibradas!</span>
                          </>
                        ) : isRebalanceApplied ? (
                          <>
                            <Sparkles size={14} />
                            <span>Recalibrar com IA</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Aplicar Recomendação Inteligente</span>
                          </>
                        )}
                      </button>

                      {isRebalanceApplied && (
                        <button
                          onClick={handleResetSchedule}
                          disabled={isResetting}
                          title="Restaurar prioridades para carga horária base do edital"
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isResetting ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <RotateCcw size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {hasRebalanceSuggestions ? (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {highPrioritySubjects.length > 0 && (
                          <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                                {isRebalanceApplied
                                  ? "⚡ Reforço Ativo no Cronograma (+25% de tempo)"
                                  : "⚡ Reforço Recomendado (+25% de tempo)"}
                              </span>
                              <span className="text-[10px] text-rose-400/80 font-mono">
                                {isRebalanceApplied ? "Em Vigor" : "Déficit < 65%"}
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {(isRebalanceListExpanded
                                ? highPrioritySubjects
                                : highPrioritySubjects.slice(0, 3)
                              ).map((s, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs p-2 rounded-xl bg-rose-500/5 border border-rose-500/10"
                                >
                                  <div className="space-y-0.5 min-w-0 pr-2">
                                    <span className="text-slate-200 font-medium block truncate">
                                      {s.subject}
                                    </span>
                                    <span className="text-[10px] text-rose-400/90 font-mono flex items-center gap-1">
                                      {isRebalanceApplied ? (
                                        <>
                                          <Check size={10} /> +25% de tempo ativo
                                        </>
                                      ) : (
                                        "Reforço sugerido"
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {s.total} q.
                                    </span>
                                    <span className="text-rose-400 font-mono font-bold">
                                      {s.accuracy}% acerto
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-white bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-lg">
                                      {s.targetWeeklyMinutes || 120}m/sem
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {highPrioritySubjects.length > 3 && (
                              <button
                                type="button"
                                onClick={() => setIsRebalanceListExpanded(!isRebalanceListExpanded)}
                                className="w-full py-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center justify-center gap-1 transition-colors pt-1 cursor-pointer"
                              >
                                <span>
                                  {isRebalanceListExpanded
                                    ? "Mostrar menos"
                                    : `Ver todas as ${highPrioritySubjects.length} matérias com reforço`}
                                </span>
                                {isRebalanceListExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            )}
                          </div>
                        )}

                        {optimizedSubjects.length > 0 && (
                          <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                {isRebalanceApplied
                                  ? "🎯 Manutenção Otimizada Ativa (-15% de tempo)"
                                  : "🎯 Manutenção Otimizada (-15% de tempo)"}
                              </span>
                              <span className="text-[10px] text-emerald-400/80 font-mono">
                                {isRebalanceApplied ? "Em Vigor" : "Domínio > 85%"}
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {optimizedSubjects.map((s, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
                                >
                                  <div className="space-y-0.5 min-w-0 pr-2">
                                    <span className="text-slate-200 font-medium block truncate">
                                      {s.subject}
                                    </span>
                                    <span className="text-[10px] text-emerald-400/90 font-mono flex items-center gap-1">
                                      {isRebalanceApplied ? (
                                        <>
                                          <Check size={10} /> -15% otimizado
                                        </>
                                      ) : (
                                        "Tempo otimizado"
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {s.total} q.
                                    </span>
                                    <span className="text-emerald-400 font-mono font-bold">
                                      {s.accuracy}% acerto
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-white bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                                      {s.targetWeeklyMinutes || 120}m/sem
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {untestedCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
                          <Info size={13} className="text-cyan-400 shrink-0" />
                          <span>
                            <strong>{untestedCount} disciplina(s)</strong> possuem menos de 3 questões resolvidas e permanecem com carga padrão sem penalização.
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                      <ShieldCheck size={20} className="text-cyan-400 shrink-0" />
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Seu cronograma atual está <strong>harmonizado</strong> com suas taxas de acerto. Continue praticando simulados para desbloquear calibrações micro-adaptativas contínuas.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ABA 2: EDITAL & PONTOS FRACOS */}
            {activeTab === "edital" && (
              <motion.div
                key="tab-edital"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* PONTOS FRACOS (< 60% COM PELO MENOS 3 QUESTÕES) */}
                {data.weakTopics && data.weakTopics.length > 0 && (
                  <div className="bg-gradient-to-br from-[#090d16] to-[#05070e] border border-rose-500/30 rounded-3xl p-6 backdrop-blur-2xl space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={18} className="text-rose-400" />
                        <h3 className="text-sm font-bold text-white">
                          Atenção Prioritária (Pontos Fracos Validados)
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                        {data.weakTopics.length} tópico(s) com taxa &lt; 60%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {data.weakTopics.map((topic, i) => (
                        <Link
                          key={`weak-${i}`}
                          href={`/questions?topicId=${encodeURIComponent(topic.id || topic.title)}`}
                          className="bg-white/[0.02] border border-white/5 hover:border-rose-500/40 p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-all hover:bg-white/[0.04] cursor-pointer group shadow-md"
                        >
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-rose-400 uppercase bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                              {topic.subject}
                            </span>
                            <h4 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-rose-300 transition-colors">
                              {topic.title}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {topic.total} questões
                            </span>
                            <span className="text-xs font-black text-rose-400 font-mono">
                              {topic.accuracy}% acerto
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* APROVEITAMENTO POR DISCIPLINA COM BUSCA E FILTROS */}
                {data.subjectStats && data.subjectStats.length > 0 && (
                  <div className="bg-gradient-to-br from-[#090d16] to-[#05070e] border border-white/10 rounded-3xl p-6 md:p-7 backdrop-blur-2xl space-y-5 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <BookOpen size={18} className="text-indigo-400" />
                        <h3 className="text-sm font-bold text-white">
                          Aproveitamento por Disciplina
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">
                          ({filteredSubjects.length} de {allSubjects.length})
                        </span>
                      </div>

                      {/* Campo de Busca de Disciplina */}
                      <div className="relative min-w-[200px] sm:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={subjectSearch}
                          onChange={(e) => setSubjectSearch(e.target.value)}
                          placeholder="Buscar disciplina..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Pills de Filtro Rápido */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSubjectFilter("all")}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          subjectFilter === "all"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        Todas ({allSubjects.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubjectFilter("active")}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          subjectFilter === "active"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        Com Questões ({activeSubjectsCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubjectFilter("critical")}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          subjectFilter === "critical"
                            ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        Abaixo de 60% ({criticalSubjectsCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubjectFilter("pending")}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          subjectFilter === "pending"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        Aguardando ({pendingSubjectsCount})
                      </button>
                    </div>

                    {/* Grid em 2 Colunas de Disciplinas */}
                    {filteredSubjects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                        {filteredSubjects.map((subj, i) => {
                          const hasData = subj.hasActivity && subj.accuracy !== null;

                          return (
                            <div
                              key={`subj-${i}`}
                              className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-slate-200 truncate">
                                    {subj.subject}
                                  </h4>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    Meta: {subj.targetWeeklyMinutes || 120}m/sem
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {hasData ? (
                                    <div className="text-right">
                                      <span
                                        className={`font-mono font-bold text-xs ${
                                          subj.accuracy! >= 80
                                            ? "text-emerald-400"
                                            : subj.accuracy! >= 60
                                              ? "text-amber-400"
                                              : "text-rose-400"
                                        }`}
                                      >
                                        {subj.accuracy}%
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono block">
                                        {subj.correct}/{subj.total} acertos
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-mono text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                      Sem simulados
                                    </span>
                                  )}

                                  <Link
                                    href={`/questions?subjectId=${encodeURIComponent(subj.subject)}`}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-indigo-600 hover:text-white text-slate-400 transition-all text-xs flex items-center gap-1 cursor-pointer"
                                    title={`Treinar questões de ${subj.subject}`}
                                  >
                                    <Zap size={13} />
                                    <span className="hidden sm:inline">Treinar</span>
                                  </Link>
                                </div>
                              </div>

                              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                <div
                                  style={{
                                    width: hasData ? `${Math.max(subj.accuracy!, 3)}%` : "0%",
                                  }}
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    !hasData
                                      ? "bg-slate-800"
                                      : subj.accuracy! >= 80
                                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                        : subj.accuracy! >= 60
                                          ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                          : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-white/[0.01] border border-white/5 text-center space-y-2">
                        <p className="text-xs text-slate-400">
                          Nenhuma disciplina encontrada para o filtro selecionado.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSubjectFilter("all");
                            setSubjectSearch("");
                          }}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                        >
                          Limpar filtros
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ABA 3: RETENÇÃO & MEMÓRIA (FSRS) */}
            {activeTab === "memory" && (
              <motion.div
                key="tab-memory"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* PIPELINE DE MATURIDADE FSRS (SE HOUVER FLASHCARDS) */}
                {fsrsMaturity && fsrsMaturity.totalCards > 0 && (
                  <div className="bg-gradient-to-br from-[#090d16] to-[#05070e] border border-white/10 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers size={18} className="text-cyan-400" />
                        <h3 className="text-sm font-bold text-white">
                          Pipeline de Maturidade de Memória (FSRS)
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {fsrsMaturity.totalCards} cards ativos no algoritmo
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                          🟢 Maduros (S &ge; 21d)
                        </span>
                        <span className="text-xl font-black text-emerald-300 font-mono">
                          {fsrsMaturity.matureCards}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Memória de longo prazo
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                          🟡 Em Fixação
                        </span>
                        <span className="text-xl font-black text-amber-300 font-mono">
                          {fsrsMaturity.learningCards}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Estabilidade intermediária
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                          🔵 Novos
                        </span>
                        <span className="text-xl font-black text-indigo-300 font-mono">
                          {fsrsMaturity.newCards}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Aguardando 1ª repetição
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-1">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                          🔴 Pontos Cegos (Leeches)
                        </span>
                        <span className="text-xl font-black text-rose-300 font-mono">
                          {fsrsMaturity.leechCards}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          3+ lapsos (precisa de mnemônico)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CARGA DE REVISÃO E QUALIDADE DE MEMORIZAÇÃO */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div className="lg:col-span-7 bg-gradient-to-br from-[#090d16] to-[#05070e] border border-white/10 rounded-3xl p-6 md:p-7 backdrop-blur-2xl shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight">
                          Carga de Revisão da Semana
                        </h3>
                        <p className="text-slate-400 text-xs mt-0.5">
                          Sessões de repetição realizadas ao longo dos dias.
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                        <Zap size={13} className="text-indigo-400" />
                        <span>Semana Atual</span>
                      </div>
                    </div>

                    <div className="h-56 w-full flex items-end justify-between gap-2 md:gap-3 pt-6 px-1">
                      {data.chartDistribution.map((item, idx) => {
                        const heightPercent = `${(item.quantidade / maxChartQty) * 100}%`;
                        const isToday = item.day.toUpperCase() === currentDayName;

                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                          >
                            <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950/90 border border-indigo-500/40 px-2 py-0.5 rounded-md shadow-xl pointer-events-none">
                              {item.quantidade}
                            </span>

                            <div
                              className={`w-full max-w-10 bg-slate-950/80 rounded-2xl h-full flex items-end overflow-hidden p-1 border transition-all ${
                                isToday
                                  ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.35)] bg-indigo-950/30"
                                  : "border-white/5 group-hover:border-white/20"
                              }`}
                            >
                              <div
                                style={{
                                  height: item.quantidade > 0 ? heightPercent : "8%",
                                }}
                                className={`w-full rounded-xl transition-all duration-700 ${
                                  item.quantidade > 0
                                    ? "bg-gradient-to-t from-indigo-600 via-purple-500 to-indigo-400 group-hover:brightness-125 shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                                    : "bg-slate-800/40"
                                }`}
                              />
                            </div>

                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                isToday
                                  ? "text-indigo-400 font-black"
                                  : "text-slate-500 group-hover:text-slate-300"
                              }`}
                            >
                              {item.day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-gradient-to-br from-[#090d16] to-[#05070e] border border-white/10 rounded-3xl p-6 md:p-7 backdrop-blur-2xl shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          Qualidade da Memorização
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                          {data.performanceSummary.source === "mixed"
                            ? "Flashcards + Simulados"
                            : data.performanceSummary.source === "flashcard"
                              ? "Flashcards FSRS"
                              : "Simulados Reais"}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Distribuição autêntica dos feedbacks registrados.
                      </p>
                    </div>

                    <div className="space-y-4 my-auto">
                      {[
                        {
                          label: "🚀 Excelente (Bom/Fácil)",
                          value: data.performanceSummary.bom,
                          barColor:
                            "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
                          textColor: "text-emerald-400",
                        },
                        {
                          label: "⚠️ Regular (Difícil)",
                          value: data.performanceSummary.dificil,
                          barColor:
                            "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
                          textColor: "text-amber-400",
                        },
                        {
                          label: "💥 Crítico (Errei)",
                          value: data.performanceSummary.errei,
                          barColor: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]",
                          textColor: "text-rose-400",
                        },
                      ].map((item, idx) => {
                        const percentage =
                          totalSummary > 0
                            ? Math.round((item.value / totalSummary) * 100)
                            : 0;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-slate-200">{item.label}</span>
                              <span className={`font-mono font-bold ${item.textColor}`}>
                                {item.value}x{" "}
                                <span className="text-[10px] text-slate-500 font-sans font-normal">
                                  ({percentage}%)
                                </span>
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-950/90 rounded-full overflow-hidden border border-white/5 p-0.5">
                              <div
                                style={{ width: `${percentage > 0 ? percentage : 2}%` }}
                                className={`h-full ${
                                  percentage > 0 ? item.barColor : "bg-slate-800/50"
                                } rounded-full transition-all duration-700`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-indigo-900/30 to-[#04060c] border border-indigo-500/30 backdrop-blur-2xl flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0">
                        <Brain size={20} className="text-indigo-400" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider block">
                          Insight Synapse AI
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {totalSummary === 0
                            ? "Comece a responder simulados e flashcards para mapear seu padrão cognitivo."
                            : data.performanceSummary.errei > data.performanceSummary.bom
                              ? "Atenção: índice elevado de erros detectado. O Adaptive Rebalancer priorizará essas matérias."
                              : "Excelente padrão de retenção! Os intervalos de revisão estão expandindo eficientemente."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* MODAL COMPARATIVO ANTES VS. DEPOIS DO REBALANCEAMENTO */}
      <AdaptiveRebalanceComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        comparison={rebalanceComparison}
        totalWeeklyHours={rebalanceTotalHours}
      />
    </div>
  );
}
