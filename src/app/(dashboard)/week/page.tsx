"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  RefreshCw,
  Sparkles,
  Info,
  Settings2,
  Clock,
  Loader2,
  CheckCircle2,
  Calendar,
  BookOpen,
  Target,
  Flame,
  TrendingUp,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { formatMinutes, CycleBlock } from "@/lib/study-cycle";
import { CycleView } from "@/components/week/cycle-view";
import { RescheduleBanner } from "@/components/week/reschedule-banner";

const HIGH_CONTRAST_PALETTE = [
  "#f43f5e",
  "#06b6d4",
  "#a855f7",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#84cc16",
  "#6366f1",
  "#f97316",
  "#00f5d4",
];

interface Topic {
  id: string;
  title: string;
  firstStudy?: string;
  relevance?: string;
  performance?: number;
}

interface SubjectOverview {
  id: string;
  name: string;
  priority: number;
  color?: string | null;
  weeklyMinutesAllocated: number;
  percentageOfTotal: number;
}

interface ScheduledSubject extends SubjectOverview {
  dailyMinutesAllocated: number;
  assignedTopics: Topic[];
}

interface DaySchedule {
  dayIndex: number;
  dayName: string;
  totalMinutes: number;
  subjects: ScheduledSubject[];
}

interface CycleData {
  blocks: CycleBlock[];
  totalBlocks: number;
  totalMinutes: number;
  completedBlocks: number;
  currentProgress: number;
  subjectBreakdown: {
    id: string;
    name: string;
    color: string;
    allocatedMinutes: number;
    percentage: number;
  }[];
}

interface WeekData {
  userId?: string;
  studyMode: "WEEKLY" | "CYCLE";
  weeklyGoalHours: number;
  activeDaysPerWeek: number;
  cycleCurrentIndex: number;
  cycleLap: number;
  missedDayName?: string | null;
  scheduleByDay: DaySchedule[];
  subjectOverview: SubjectOverview[];
  cycle: CycleData;
}

export default function WeekPage() {
  const [data, setData] = useState<WeekData | null>(null);
  const [studyMode, setStudyMode] = useState<"WEEKLY" | "CYCLE">("WEEKLY");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  const [goalHours, setGoalHours] = useState(10);
  const [activeDays, setActiveDays] = useState(5);

  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [subjectToSwap, setSubjectToSwap] = useState<ScheduledSubject | null>(
    null,
  );

  const getSubjectColor = (
    subject: { color?: string | null },
    index: number,
  ) => {
    if (
      subject.color &&
      subject.color.startsWith("#") &&
      subject.color.length >= 4
    ) {
      return subject.color;
    }
    return HIGH_CONTRAST_PALETTE[index % HIGH_CONTRAST_PALETTE.length];
  };

  const loadWeekData = async (controllerSignal?: AbortSignal) => {
    try {
      const res = await fetch("/api/week", {
        signal: controllerSignal,
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store",
        },
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error("❌ Resposta de erro da API:", res.status, errorText);
        throw new Error(`Erro na requisição: ${res.status}`);
      }

      const json = await res.json();

      if (json.data) {
        setData(json.data);
        setStudyMode(json.data.studyMode ?? "WEEKLY");
        setGoalHours(json.data.weeklyGoalHours ?? 10);
        setActiveDays(json.data.activeDaysPerWeek ?? 5);

        if (json.data.scheduleByDay && json.data.scheduleByDay.length > 0) {
          setSelectedDayIndex((prev) => {
            const exists = json.data.scheduleByDay.some(
              (d: DaySchedule) => d.dayIndex === prev,
            );
            return exists ? prev : json.data.scheduleByDay[0].dayIndex;
          });
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.warn("⏱️ A requisição excedeu o tempo limite e foi cancelada.");
      } else {
        console.error("❌ Erro de conexão ao buscar /api/week:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Função interna autoexecutável para evitar chamadas de setState síncronas no corpo do Effect
    const fetchData = async () => {
      await loadWeekData(controller.signal);
      clearTimeout(timeoutId);
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, []);

  const handleToggleMode = (mode: "WEEKLY" | "CYCLE") => {
    setStudyMode(mode);

    startTransition(async () => {
      try {
        const res = await fetch("/api/week", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studyMode: mode }),
        });

        if (!res.ok) throw new Error("Erro ao trocar modo");
        const json = await res.json();
        if (json.data) setData(json.data);
      } catch (err) {
        console.error("❌ Erro ao alternar modo:", err);
      }
    });
  };

  const handleCompleteBlock = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/week", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cycleAction: "NEXT_BLOCK" }),
        });
        if (!res.ok) throw new Error("Erro ao avançar ciclo");
        const json = await res.json();
        if (json.data) setData(json.data);
      } catch (err) {
        console.error("Erro ao avançar bloco:", err);
      }
    });
  };

  const handleUndoBlock = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/week", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cycleAction: "PREV_BLOCK" }),
        });
        if (!res.ok) throw new Error("Erro ao retroceder ciclo");
        const json = await res.json();
        if (json.data) setData(json.data);
      } catch (err) {
        console.error("Erro ao desfazer bloco:", err);
      }
    });
  };

  // ⚡ FUNÇÃO DE SWAP UNIFICADA PARA AMBAS AS VISÕES
  const handleSwapSubject = ({
    currentSubjectId,
    targetSubjectId,
    blockNumber,
  }: {
    currentSubjectId?: string;
    targetSubjectId: string;
    blockNumber?: number;
  }) => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/week", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cycleAction: "SWAP_BLOCK",
            currentSubjectId,
            targetSubjectId,
            blockNumber,
          }),
        });

        if (!res.ok) throw new Error("Erro ao trocar matérias");
        const json = await res.json();

        if (json.data) {
          setData(json.data);
          setSwapModalOpen(false);
          setSubjectToSwap(null);
        }
      } catch (err) {
        console.error("❌ Erro ao realizar swap de matérias:", err);
      }
    });
  };

  const handleSaveSettings = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/week", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weeklyGoalHours: goalHours,
            activeDaysPerWeek: activeDays,
          }),
        });

        if (!res.ok) throw new Error("Erro ao salvar configurações");
        const json = await res.json();

        if (json.data) {
          setData(json.data);
          setIsModalOpen(false);
          if (json.data.scheduleByDay && json.data.scheduleByDay.length > 0) {
            setSelectedDayIndex(json.data.scheduleByDay[0].dayIndex);
          }
        }
      } catch (err) {
        console.error("Erro ao salvar meta:", err);
      }
    });
  };

  const handleToggleTopic = async (topicId: string, currentStatus?: string) => {
    const isCompleted = currentStatus === "Em Revisão";
    const newFirstStudy = isCompleted ? "Pendente" : "Em Revisão";
    const newPerformance = isCompleted ? 0 : 100;

    setData((prev) => {
      if (!prev) return null;

      const updatedScheduleByDay = prev.scheduleByDay.map((day) => ({
        ...day,
        subjects: day.subjects.map((sub) => ({
          ...sub,
          assignedTopics: sub.assignedTopics.map((top) =>
            top.id === topicId
              ? {
                  ...top,
                  firstStudy: newFirstStudy,
                  performance: newPerformance,
                }
              : top,
          ),
        })),
      }));

      return { ...prev, scheduleByDay: updatedScheduleByDay };
    });

    try {
      const res = await fetch(`/api/topics/${topicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstStudy: newFirstStudy,
          performance: newPerformance,
        }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar status do tópico");
    } catch (err) {
      console.error("Erro ao salvar progresso do tópico:", err);
      const res = await fetch("/api/week");
      const json = await res.json();
      if (json.data) setData(json.data);
    }
  };

  const activeDaySchedule =
    data?.scheduleByDay?.find((d) => d.dayIndex === selectedDayIndex) ||
    data?.scheduleByDay?.[0];

  const activeDayCompletedTopicsCount =
    activeDaySchedule?.subjects.reduce((acc, sub) => {
      return (
        acc +
        sub.assignedTopics.filter((t) => t.firstStudy === "Em Revisão").length
      );
    }, 0) || 0;

  const activeDayTotalTopicsCount =
    activeDaySchedule?.subjects.reduce((acc, sub) => {
      return acc + sub.assignedTopics.length;
    }, 0) || 0;

  const activeDayProgressPercent =
    activeDayTotalTopicsCount > 0
      ? Math.round(
          (activeDayCompletedTopicsCount / activeDayTotalTopicsCount) * 100,
        )
      : 0;

  const donutSegments = (() => {
    if (!data?.subjectOverview) return [];
    let accumulated = 0;
    return data.subjectOverview.map((subject, index) => {
      const color = getSubjectColor(subject, index);
      const strokeDasharray = `${subject.percentageOfTotal} ${
        100 - subject.percentageOfTotal
      }`;
      const strokeDashoffset = -accumulated;
      accumulated += subject.percentageOfTotal;

      return {
        ...subject,
        color,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  })();

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-8 font-sans antialiased selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 shadow-sm"
          >
            <ArrowLeft
              size={14}
              className="transition-transform group-hover:-translate-x-1"
            />
            <span>Voltar para Dashboard</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-xs font-semibold bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <Settings2 size={14} />
            <span>Editar Configurações</span>
          </button>
        </div>

        {/* Sub-Header Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-2 bg-slate-950/80 border border-slate-800/60 rounded-2xl backdrop-blur-xl shadow-2xl">
          <div className="inline-flex items-center bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 w-full md:w-auto">
            <button
              onClick={() => handleToggleMode("WEEKLY")}
              className={`relative flex items-center justify-center gap-2.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 flex-1 md:flex-none cursor-pointer ${
                studyMode === "WEEKLY"
                  ? "bg-slate-800/90 text-white font-semibold shadow-lg shadow-indigo-950/20 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              {studyMode === "WEEKLY" && (
                <span className="relative flex h-2 w-2 mr-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </span>
              )}
              <CalendarDays
                size={14}
                className={
                  studyMode === "WEEKLY" ? "text-cyan-400" : "text-slate-500"
                }
              />
              <span>Cronograma Semanal</span>
            </button>

            <button
              onClick={() => handleToggleMode("CYCLE")}
              className={`relative flex items-center justify-center gap-2.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 flex-1 md:flex-none cursor-pointer ${
                studyMode === "CYCLE"
                  ? "bg-slate-800/90 text-white font-semibold shadow-lg shadow-indigo-950/20 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              {studyMode === "CYCLE" && (
                <span className="relative flex h-2 w-2 mr-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                </span>
              )}
              <RefreshCw
                size={13}
                className={
                  studyMode === "CYCLE" ? "text-indigo-400" : "text-slate-500"
                }
              />
              <span>Ciclo de Estudos</span>
            </button>
          </div>

          <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900/40 rounded-xl border border-slate-800/50 text-xs font-mono text-slate-400 self-end md:self-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-sans tracking-wider uppercase">
                Meta
              </span>
              <span className="text-slate-200 font-bold">
                {data?.weeklyGoalHours ?? 10}h
              </span>
              <span className="text-slate-600 text-[10px]">/sem</span>
            </div>

            <span className="text-slate-800">|</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-200 font-bold">
                {data?.activeDaysPerWeek ?? 5}
              </span>
              <span className="text-[10px] text-slate-500 font-sans tracking-wider uppercase">
                dias úteis
              </span>
            </div>
          </div>
        </div>

        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              {studyMode === "CYCLE"
                ? "Seu Ciclo de Estudos"
                : "Seu Planejamento Semanal"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {studyMode === "CYCLE"
                ? `${data?.cycle?.totalBlocks || 0} blocos • Total: ${formatMinutes(
                    data?.cycle?.totalMinutes || 0,
                  )}`
                : "Selecione o dia do planejamento e execute seus alvos com prioridade dinâmica."}
            </p>
          </div>
          <span className="self-start sm:self-auto text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm">
            <Sparkles size={13} className="text-indigo-400 animate-pulse" />
            Sugestões Ativas da IA
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="text-xs font-medium">
              Carregando planejamento de estudos...
            </p>
          </div>
        ) : studyMode === "CYCLE" ? (
          <CycleView
            blocks={data?.cycle?.blocks || []}
            totalBlocks={data?.cycle?.totalBlocks || 0}
            completedBlocks={data?.cycle?.completedBlocks || 0}
            currentProgress={data?.cycle?.currentProgress || 0}
            totalMinutes={data?.cycle?.totalMinutes || 0}
            cycleLap={data?.cycleLap || 1}
            subjectBreakdown={data?.cycle?.subjectBreakdown || []}
            onCompleteBlock={handleCompleteBlock}
            onUndoBlock={handleUndoBlock}
            onSwapBlockSubject={(
              currentSubjectId,
              targetSubjectId,
              blockNumber,
            ) =>
              handleSwapSubject({
                currentSubjectId,
                targetSubjectId,
                blockNumber,
              })
            }
          />
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* 🟢 BANNER DE REMANEJAMENTO NA VISÃO SEMANAL */}
            {data?.missedDayName && (
              <RescheduleBanner
                missedDayName={data.missedDayName}
                userId={data?.userId}
                onActionCompleted={() => {
                  setLoading(true);
                  loadWeekData();
                }}
              />
            )}

            {/* Seleção de Dias da Semana */}
            <div className="flex items-center gap-3 overflow-x-auto p-1.5 pt-2 pb-3 scrollbar-none">
              {data?.scheduleByDay?.map((day) => {
                const isSelected = day.dayIndex === selectedDayIndex;
                const completedCount = day.subjects.reduce(
                  (acc, sub) =>
                    acc +
                    sub.assignedTopics.filter(
                      (t) => t.firstStudy === "Em Revisão",
                    ).length,
                  0,
                );
                const totalCount = day.subjects.reduce(
                  (acc, sub) => acc + sub.assignedTopics.length,
                  0,
                );
                const isDayDone =
                  totalCount > 0 && completedCount === totalCount;

                return (
                  <button
                    key={day.dayIndex}
                    onClick={() => setSelectedDayIndex(day.dayIndex)}
                    className={`flex flex-col items-start min-w-35 p-3.5 rounded-2xl border transition-all duration-200 relative text-left shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/80 text-white ring-1 ring-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                        : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-900/70 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span
                        className={`text-xs font-black uppercase tracking-wider ${
                          isSelected ? "text-white" : "text-slate-300"
                        }`}
                      >
                        {day.dayName}
                      </span>
                      {isDayDone && (
                        <CheckCircle2 size={13} className="text-emerald-400" />
                      )}
                    </div>

                    <span className="text-[10px] font-mono font-semibold text-slate-400">
                      {formatMinutes(day.totalMinutes)}
                    </span>

                    <div className="w-full h-1 bg-slate-950 rounded-full mt-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isSelected ? "bg-indigo-400" : "bg-indigo-500/60"
                        }`}
                        style={{
                          width: `${
                            totalCount > 0
                              ? (completedCount / totalCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
                {activeDaySchedule && (
                  <div className="bg-linear-to-br from-slate-900/90 via-slate-950 to-indigo-950/30 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5 relative z-10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Flame
                              size={11}
                              className="text-indigo-400 animate-pulse"
                            />
                            Foco do Dia
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            Meta:{" "}
                            {formatMinutes(activeDaySchedule.totalMinutes)}
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                          <Target size={22} className="text-indigo-400" />
                          {activeDaySchedule.dayName}
                        </h2>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-indigo-400 block">
                            {activeDayCompletedTopicsCount}/
                            {activeDayTotalTopicsCount} tópicos
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase">
                            Concluídos ({activeDayProgressPercent}%)
                          </span>
                        </div>
                        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/40 flex items-center justify-center font-mono text-[10px] font-bold text-indigo-300">
                          {activeDayProgressPercent}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen size={14} className="text-indigo-400" />
                        Matérias Alocadas para {activeDaySchedule.dayName}
                      </h3>

                      <div className="grid grid-cols-1 gap-4">
                        {activeDaySchedule.subjects.map((subject, sIdx) => {
                          const subjectColor = getSubjectColor(subject, sIdx);
                          const hasTopics =
                            subject.assignedTopics &&
                            subject.assignedTopics.length > 0;

                          return (
                            <div
                              key={subject.id}
                              className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-3 relative overflow-hidden group/card hover:border-slate-700 transition-all shadow-md"
                            >
                              <div
                                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                                style={{
                                  backgroundColor: subjectColor,
                                  boxShadow: `0 0 10px ${subjectColor}`,
                                }}
                              />

                              <div className="flex items-center justify-between pl-2">
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor: subjectColor,
                                      boxShadow: `0 0 8px ${subjectColor}`,
                                    }}
                                  />
                                  <h4 className="text-base font-bold text-white tracking-tight">
                                    {subject.name}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSubjectToSwap(subject);
                                      setSwapModalOpen(true);
                                    }}
                                    title="Adiar / Trocar por matéria de outro dia"
                                    className="p-1.5 rounded-lg bg-slate-900/80 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 border border-slate-800/80 transition-all active:scale-95 flex items-center gap-1.5 text-[11px] font-medium cursor-pointer"
                                  >
                                    <ArrowRightLeft size={13} />
                                    <span className="hidden sm:inline">
                                      Adiar
                                    </span>
                                  </button>

                                  <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-3 py-1 rounded-xl">
                                    {formatMinutes(
                                      subject.dailyMinutesAllocated,
                                    )}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2 pl-2 pt-1">
                                {hasTopics ? (
                                  subject.assignedTopics.map((topic) => {
                                    const isDone =
                                      topic.firstStudy === "Em Revisão";

                                    return (
                                      <div
                                        key={topic.id}
                                        onClick={() =>
                                          handleToggleTopic(
                                            topic.id,
                                            topic.firstStudy,
                                          )
                                        }
                                        className={`flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer group/topic ${
                                          isDone
                                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                                            : "bg-slate-900/60 border-slate-800/60 hover:bg-slate-800/50 text-slate-200"
                                        }`}
                                      >
                                        <span
                                          className={`truncate pr-2 font-medium transition-all ${
                                            isDone
                                              ? "line-through text-slate-500"
                                              : "group-hover/topic:text-white"
                                          }`}
                                        >
                                          • {topic.title}
                                        </span>

                                        <button
                                          type="button"
                                          title={
                                            isDone
                                              ? "Marcar como pendente"
                                              : "Marcar como concluído"
                                          }
                                          className={`transition-colors shrink-0 ${
                                            isDone
                                              ? "text-emerald-400 hover:text-emerald-300"
                                              : "text-slate-600 hover:text-emerald-400"
                                          }`}
                                        >
                                          <CheckCircle2
                                            size={16}
                                            className={
                                              isDone
                                                ? "fill-emerald-500/20"
                                                : ""
                                            }
                                          />
                                        </button>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="flex items-center justify-between text-xs text-slate-500 italic py-2 bg-slate-900/20 px-3 rounded-xl border border-slate-900">
                                    <span>Nenhum tópico mapeado</span>
                                    <Link
                                      href="/edital"
                                      className="text-indigo-400 hover:underline not-italic font-sans text-xs font-semibold"
                                    >
                                      + Gerenciar Edital
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-6 lg:sticky lg:top-8 backdrop-blur-md shadow-2xl">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-400" />
                    Distribuição Semanal de Carga
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Proporção calculada automaticamente com base nas prioridades
                    das matérias.
                  </p>
                </div>

                <div className="flex justify-center py-2 relative">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <path
                        className="text-slate-950"
                        strokeWidth="3.8"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />

                      {donutSegments.map((seg) => (
                        <circle
                          key={seg.id}
                          className="transition-all duration-700 ease-out"
                          stroke={seg.color}
                          strokeWidth="3.8"
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          strokeLinecap="round"
                          fill="none"
                          cx="18"
                          cy="18"
                          r="15.9155"
                        />
                      ))}
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-white font-mono tracking-tight">
                        {data?.weeklyGoalHours}h
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                        na semana
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800/80 max-h-64 overflow-y-auto pr-1">
                  {data?.subjectOverview?.map((subject, sIdx) => {
                    const subjectColor = getSubjectColor(subject, sIdx);

                    return (
                      <div key={subject.id} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-medium">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                              style={{
                                backgroundColor: subjectColor,
                                boxShadow: `0 0 8px ${subjectColor}`,
                              }}
                            />
                            <span className="text-slate-300 font-semibold truncate">
                              {subject.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono">
                            <span className="text-slate-400 text-[11px]">
                              {subject.percentageOfTotal}%
                            </span>
                            <span className="text-slate-100 font-semibold">
                              {formatMinutes(subject.weeklyMinutesAllocated)}
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${subject.percentageOfTotal}%`,
                              backgroundColor: subjectColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3.5 flex gap-2.5 items-start">
                  <Info size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Para reajustar o peso ou tempo alocado de cada matéria,
                    edite a{" "}
                    <strong className="text-slate-200">prioridade</strong> no
                    módulo do Edital.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIGURAÇÕES DE META */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#090d16] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings2 size={18} className="text-indigo-400" />
                Configurar Meta de Estudo
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ajuste sua disponibilidade semanal para recalcular o cronograma
                dinâmico.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" /> Meta Semanal
                    (Horas)
                  </label>
                  <span className="text-indigo-400 font-bold font-mono text-sm">
                    {goalHours}h / semana
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={60}
                  step={1}
                  value={goalHours}
                  onChange={(e) => setGoalHours(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>2h</span>
                  <span>30h</span>
                  <span>60h</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" /> Dias
                    Ativos na Semana
                  </label>
                  <span className="text-indigo-400 font-bold font-mono text-sm">
                    {activeDays} dias
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setActiveDays(num)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        activeDays === num
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {num}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isPending}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Calculando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Aplicar Novo Cronograma</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SWAP NO CRONOGRAMA SEMANAL */}
      {swapModalOpen && subjectToSwap && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#090d16] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-indigo-400" />
                  Reorganizar Matéria
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Escolha por qual matéria você quer trocar{" "}
                  <strong className="text-indigo-300">
                    {subjectToSwap.name}
                  </strong>
                  .
                </p>
              </div>
              <button
                onClick={() => {
                  setSwapModalOpen(false);
                  setSubjectToSwap(null);
                }}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Selecione a matéria para trocar de posição:
              </span>

              {data?.subjectOverview
                ?.filter((s) => s.id !== subjectToSwap.id)
                .map((s, idx) => {
                  const color = getSubjectColor(s, idx);
                  return (
                    <button
                      key={s.id}
                      disabled={isPending}
                      onClick={() =>
                        handleSwapSubject({
                          currentSubjectId: subjectToSwap.id,
                          targetSubjectId: s.id,
                        })
                      }
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/50 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                          {s.name}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                        Trocar →
                      </span>
                    </button>
                  );
                })}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSwapModalOpen(false);
                  setSubjectToSwap(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
