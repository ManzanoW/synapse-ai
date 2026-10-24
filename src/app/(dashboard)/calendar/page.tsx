"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  AlertCircle,
  Sparkles,
  X,
  BookOpen,
  CheckCircle2,
  Target,
  Timer,
} from "lucide-react";
import { Topic } from "@/types";
import { triggerHaptic } from "@/lib/sensory/haptics";

type ReviewGrade = "ERREI" | "DIFICIL" | "BOM" | "FACIL";

export default function CalendarPage() {
  const [data, setData] = useState<Record<string, number>>({});
  const [overdueCount, setOverdueCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | "overdue" | null>(
    null,
  );
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [reviewingTopicId, setReviewingTopicId] = useState<string | null>(null);
  const [reviewedTopicIds, setReviewedTopicIds] = useState<Record<string, ReviewGrade>>({});

  // 1. Instância dinâmica da data atual do sistema
  const [now] = useState(() => new Date());

  // 2. Estado do mês/ano em exibição inicializado com o mês/ano ATUAL
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  const monthParam = `${currentYear}-${(currentMonth + 1)
    .toString()
    .padStart(2, "0")}`;

  const monthName = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/calendar?month=${monthParam}`);
      if (!res.ok) throw new Error("Falha na API");
      const json = await res.json();
      setData(json.data || {});
      setOverdueCount(typeof json.overdueCount === "number" ? json.overdueCount : 0);
    } catch (err) {
      console.error("Erro ao carregar calendário:", err);
    } finally {
      setLoading(false);
    }
  }, [monthParam]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  useEffect(() => {
    if (!selectedDay) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedDay(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDay]);

  async function handleDayClick(dateStr: string, day: number | "overdue") {
    triggerHaptic("light");
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/details?date=${dateStr}`);
      const json = await res.json();

      setSelectedTopics(json.data || []);
      setSelectedDateStr(dateStr);
      setSelectedDay(day);
      setReviewedTopicIds({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickReview(topicId: string, grade: ReviewGrade) {
    if (reviewingTopicId) return;
    triggerHaptic("medium");
    setReviewingTopicId(topicId);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, grade }),
      });
      if (!res.ok) throw new Error("Falha ao registrar revisão");
      triggerHaptic("success");
      setReviewedTopicIds((prev) => ({ ...prev, [topicId]: grade }));
      await loadCalendarData();
    } catch (err) {
      console.error("Erro ao registrar revisão:", err);
    } finally {
      setReviewingTopicId(null);
    }
  }

  const handlePrevMonth = () => {
    triggerHaptic("light");
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    triggerHaptic("light");
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Cálculos da grade mensal
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOffset = new Date(currentYear, currentMonth, 1).getDay();

  const totalMonthRevisions = Object.values(data).reduce(
    (acc, curr) => acc + curr,
    0,
  );

  // Formatação do dia de hoje (ex: "2026-08-28")
  const realTodayStr = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  const todayCount = data[realTodayStr] || 0;

  return (
    <div className="relative min-h-screen bg-slate-50/50 dark:bg-[#02050e] text-slate-900 dark:text-slate-100 p-3 sm:p-4 md:p-8 font-sans antialiased selection:bg-indigo-500/30 overflow-hidden">
      {/* Luz Ambient Neon de Fundo */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[130px]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* NAVEGAÇÃO DE VOLTA */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group cursor-pointer"
          >
            <ArrowLeft
              size={14}
              className="transition-transform group-hover:-translate-x-1 text-indigo-500 dark:text-indigo-400"
            />
            <span>Voltar para a Dashboard</span>
          </Link>
        </div>

        {/* KPIS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white/90 dark:bg-gradient-to-br dark:from-[#090d16] dark:to-[#05070e] border border-slate-200/80 dark:border-white/10 p-4 sm:p-5 rounded-3xl backdrop-blur-2xl shadow-sm dark:shadow-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider">
                Total Este Mês
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {totalMonthRevisions}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400">
              <Sparkles size={18} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleDayClick(realTodayStr, now.getDate())}
            className="text-left bg-white/90 dark:bg-gradient-to-br dark:from-[#090d16] dark:to-[#05070e] border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/40 p-4 sm:p-5 rounded-3xl backdrop-blur-2xl shadow-sm dark:shadow-2xl flex items-center justify-between transition-all cursor-pointer group"
          >
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider flex items-center gap-1.5">
                <span>Revisões de Hoje</span>
                <span className="text-[9px] text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  • Ver lista
                </span>
              </p>
              <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                {todayCount}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <Clock size={18} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleDayClick("overdue", "overdue")}
            className={`text-left bg-white/90 dark:bg-gradient-to-br dark:from-[#090d16] dark:to-[#05070e] border p-4 sm:p-5 rounded-3xl backdrop-blur-2xl shadow-sm dark:shadow-2xl flex items-center justify-between transition-all cursor-pointer group ${
              overdueCount > 0
                ? "border-rose-500/40 hover:border-rose-500"
                : "border-slate-200/80 dark:border-white/10 hover:border-rose-500/40"
            }`}
          >
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider flex items-center gap-1.5">
                <span>Revisões Atrasadas</span>
                <span className="text-[9px] text-rose-500 dark:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  • Regularizar
                </span>
              </p>
              <p className="text-xl sm:text-2xl font-black text-rose-500 dark:text-rose-400 font-mono mt-1">
                {overdueCount}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <AlertCircle size={18} />
            </div>
          </button>
        </div>

        {/* CABEÇALHO DO CALENDÁRIO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 shrink-0">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Calendário de Revisões
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Visão temporal das suas sessões agendadas para revisão inteligente.
              </p>
            </div>
          </div>

          {/* Controle de Mês */}
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-white/10 p-1.5 rounded-2xl shadow-sm dark:shadow-lg self-start sm:self-auto w-full sm:w-auto">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer active:scale-95"
              title="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold px-2 text-slate-800 dark:text-slate-200 capitalize min-w-[110px] sm:min-w-[120px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer active:scale-95"
              title="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* GRADE DO CALENDÁRIO */}
        <div className="bg-white/80 dark:bg-gradient-to-br dark:from-[#090d16] dark:to-[#05070e] border border-slate-200/80 dark:border-white/10 rounded-3xl p-3 sm:p-6 shadow-sm dark:shadow-2xl backdrop-blur-2xl">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-indigo-400 font-bold">
              <Loader2 size={14} className="animate-spin" /> Sincronizando
              agenda...
            </div>
          )}

          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
            {/* Espaços vazios iniciais */}
            {Array.from({ length: firstDayOffset }).map((_, idx) => (
              <div key={`offset-${idx}`} className="h-16 sm:h-24 rounded-xl sm:rounded-2xl bg-transparent" />
            ))}

            {/* Dias do Mês */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${(currentMonth + 1)
                .toString()
                .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

              // Comparação dinâmica e precisa do dia de hoje
              const isToday =
                day === now.getDate() &&
                currentMonth === now.getMonth() &&
                currentYear === now.getFullYear();

              const count = data[dateStr] || 0;

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(dateStr, day)}
                  className={`h-16 sm:h-24 p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border flex flex-col justify-between transition-all cursor-pointer group relative overflow-hidden ${
                    isToday
                      ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                      : count > 0
                        ? "border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-slate-950/80 hover:border-indigo-500/40 hover:bg-indigo-50/50 dark:hover:bg-[#0c101d]"
                        : "border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/40 opacity-70 hover:opacity-100 hover:border-slate-300 dark:hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-bold font-mono ${
                        isToday
                          ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                          : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                      }`}
                    >
                      {day}
                    </span>

                    {isToday && (
                      <span className="hidden sm:inline-block text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/20 px-1.5 py-0.2 rounded-full border border-indigo-500/30">
                        Hoje
                      </span>
                    )}
                  </div>

                  {count > 0 && (
                    <div className="flex items-center justify-center sm:justify-start gap-1 bg-indigo-500/10 border border-indigo-500/20 px-1 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl w-full sm:w-fit">
                      <span className="flex h-1.5 w-1.5 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-300 truncate">
                        <span className="sm:hidden">{count}</span>
                        <span className="hidden sm:inline">
                          {count} {count === 1 ? "revisão" : "revisões"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES DO DIA / ATRASADAS */}
      {selectedDay && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-modal-title"
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white dark:bg-[#090d16] border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl relative space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl border ${
                    selectedDay === "overdue"
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-500 dark:text-rose-400"
                      : "bg-indigo-500/10 border-indigo-500/20 text-indigo-500 dark:text-indigo-400"
                  }`}
                >
                  {selectedDay === "overdue" ? (
                    <AlertCircle size={18} />
                  ) : (
                    <BookOpen size={18} />
                  )}
                </div>
                <div>
                  <h2
                    id="calendar-modal-title"
                    className="text-sm font-bold text-slate-900 dark:text-white"
                  >
                    {selectedDay === "overdue"
                      ? "Revisões em Atraso"
                      : "Revisões do Dia"}
                  </h2>
                  <p
                    className={`text-xs font-semibold mt-0.5 ${
                      selectedDay === "overdue"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-indigo-600 dark:text-indigo-400"
                    }`}
                  >
                    {selectedDay === "overdue"
                      ? `${selectedTopics.length} tópico(s) aguardando regularização`
                      : selectedDateStr === realTodayStr
                        ? `Hoje (${now.getDate()} de ${now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })})`
                        : `${selectedDay} de ${monthName}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                aria-label="Fechar modal"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              {selectedTopics.length > 0 ? (
                selectedTopics.map((topic) => {
                  const isReviewed = Boolean(reviewedTopicIds[topic.id]);
                  const isReviewing = reviewingTopicId === topic.id;
                  const subjectName = topic.subject?.name || "Sem Matéria";
                  const subjectId = topic.subjectId || topic.subject?.id || "";

                  return (
                    <div
                      key={topic.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                        isReviewed
                          ? "bg-emerald-500/5 border-emerald-500/30"
                          : "bg-slate-50 dark:bg-slate-950/80 border-slate-200/80 dark:border-white/10 hover:border-indigo-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block truncate">
                            {subjectName}
                          </span>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                            {topic.title}
                          </p>
                        </div>

                        {/* Atalhos para Questões e Pomodoro */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link
                            href={`/questions?subjectId=${encodeURIComponent(subjectName)}&topic=${encodeURIComponent(topic.title)}&topicId=${encodeURIComponent(topic.id)}&autoStart=true`}
                            title="Praticar questões deste tópico"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            <Target size={11} />
                            <span>Questões</span>
                          </Link>
                          <Link
                            href={`/study-room?subjectId=${encodeURIComponent(subjectId)}&subject=${encodeURIComponent(subjectName)}&topicId=${encodeURIComponent(topic.id)}&topic=${encodeURIComponent(topic.title)}`}
                            title="Abrir tópico na Sala de Foco (Pomodoro)"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-600 dark:text-cyan-300 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            <Timer size={11} />
                            <span>Pomodoro</span>
                          </Link>
                        </div>
                      </div>

                      {/* Avaliação de Retenção 1-Clique (FSRS / SM-2) */}
                      <div className="pt-2 border-t border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-2">
                        {isReviewed ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                            <CheckCircle2 size={14} />
                            <span>
                              Revisão registrada ({reviewedTopicIds[topic.id]})! Próximo ciclo agendado.
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              Concluir revisão agora:
                            </span>
                            <div className="flex items-center gap-1.5">
                              {(
                                [
                                  {
                                    grade: "ERREI",
                                    label: "Errei",
                                    cls: "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-300",
                                  },
                                  {
                                    grade: "DIFICIL",
                                    label: "Difícil",
                                    cls: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-300",
                                  },
                                  {
                                    grade: "BOM",
                                    label: "Bom",
                                    cls: "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-600 dark:text-indigo-300",
                                  },
                                  {
                                    grade: "FACIL",
                                    label: "Fácil",
                                    cls: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-300",
                                  },
                                ] as const
                              ).map((btn) => (
                                <button
                                  key={btn.grade}
                                  type="button"
                                  disabled={isReviewing}
                                  onClick={() =>
                                    handleQuickReview(topic.id, btn.grade)
                                  }
                                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${btn.cls}`}
                                >
                                  {isReviewing ? "..." : btn.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {selectedDay === "overdue"
                      ? "Parabéns! Você não possui nenhuma revisão em atraso."
                      : "Nenhuma revisão agendada para este dia."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
