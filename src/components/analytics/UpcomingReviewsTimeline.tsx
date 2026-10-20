"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarClock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  TrendingUp,
  Brain,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  getUpcomingReviewsForecastAction,
  DailyReviewForecast,
  UpcomingReviewsForecastData,
} from "@/actions/analytics-actions";

interface UpcomingReviewsTimelineProps {
  className?: string;
  onSelectDay?: (day: DailyReviewForecast) => void;
}

export function UpcomingReviewsTimeline({
  className = "",
  onSelectDay,
}: UpcomingReviewsTimelineProps) {
  const [forecastData, setForecastData] =
    useState<UpcomingReviewsForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getUpcomingReviewsForecastAction()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setForecastData(res.data);
          // Auto seleciona o dia de hoje ou o primeiro dia
          const today = res.data.days.find((d) => d.isToday);
          if (today) {
            setSelectedDate(today.date);
          } else if (res.data.days.length > 0) {
            setSelectedDate(res.data.days[0].date);
          }
        } else {
          setError(res.error || "Não foi possível carregar a projeção de revisões.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao consultar revisões futuras.",
        );
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div
        className={`rounded-2xl border border-slate-800/80 bg-[#090d16]/90 p-4 sm:p-5 shadow-xl backdrop-blur-md flex items-center justify-center gap-2.5 ${className}`}
      >
        <Loader2 size={16} className="animate-spin text-indigo-400" />
        <span className="text-xs font-medium text-slate-400">
          Calculando projeção de revisões para os próximos 14 dias...
        </span>
      </div>
    );
  }

  if (error || !forecastData) {
    return (
      <div
        className={`rounded-2xl border border-slate-800/80 bg-[#090d16]/90 p-4 sm:p-5 shadow-xl ${className}`}
      >
        <div className="flex items-center gap-2 text-rose-400 text-xs">
          <AlertTriangle size={15} />
          <span>{error || "Dados de projeção indisponíveis."}</span>
        </div>
      </div>
    );
  }

  const { days, totalDue, overloadedDaysCount, peakDay, todaySummary } =
    forecastData;

  const maxDailyDue = Math.max(1, ...days.map((d) => d.totalDue));
  const selectedDayData = days.find((d) => d.date === selectedDate) || days[0];

  return (
    <div
      className={`rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#090d16]/95 to-[#060911]/90 p-4 sm:p-5 shadow-xl backdrop-blur-md relative overflow-hidden space-y-4 ${className}`}
    >
      {/* Decorative ambient glow */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-indigo-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-purple-500/5 blur-3xl" />

      {/* Header com KPIs Rápidos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
            <CalendarClock size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white tracking-tight">
                Linha do Tempo de Revisões Inteligentes
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                14 Dias
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Projeção de retenção e carga diária de revisões
            </p>
          </div>
        </div>

        {/* Badges de Resumo */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-1.5 text-slate-300">
            <Brain size={13} className="text-cyan-400" />
            <span>
              Total: <strong className="text-white font-mono">{totalDue}</strong> itens
            </span>
          </div>

          {overloadedDaysCount > 0 ? (
            <div className="px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 text-rose-300">
              <Flame size={13} className="text-rose-400 animate-pulse" />
              <span>
                <strong className="font-mono">{overloadedDaysCount}</strong> {overloadedDaysCount === 1 ? "dia com sobrecarga" : "dias com sobrecarga"}
              </span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 size={13} />
              <span>Carga Equilibrada</span>
            </div>
          )}

          {peakDay && peakDay.totalDue > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400">
              <span>Pico:</span>
              <strong className="text-slate-200 font-mono">
                {peakDay.formattedDate} ({peakDay.totalDue})
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Régua Horizontal com os 14 Dias */}
      <div className="relative z-10 pt-1">
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="grid grid-flow-col auto-cols-[minmax(68px,1fr)] sm:auto-cols-[minmax(76px,1fr)] gap-2 min-w-[700px] sm:min-w-0">
            {days.map((day) => {
              const isSelected = day.date === selectedDate;
              const fillPercentage = Math.round((day.totalDue / maxDailyDue) * 100);

              let badgeBg = "bg-slate-800/40 text-slate-400 border-slate-700/50";
              let meterColor = "bg-indigo-500";

              if (day.isOverloaded) {
                badgeBg = "bg-rose-500/20 text-rose-300 border-rose-500/40";
                meterColor = "bg-gradient-to-t from-rose-600 to-amber-500";
              } else if (day.urgencyLevel === "HIGH") {
                badgeBg = "bg-amber-500/20 text-amber-300 border-amber-500/40";
                meterColor = "bg-amber-500";
              } else if (day.totalDue > 0) {
                badgeBg = "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
                meterColor = "bg-indigo-500";
              }

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day.date);
                    if (onSelectDay) onSelectDay(day);
                  }}
                  className={`flex flex-col items-center justify-between p-2.5 rounded-xl border text-center transition-all cursor-pointer relative group ${
                    isSelected
                      ? "bg-slate-800/90 border-indigo-500 shadow-md shadow-indigo-500/20 scale-[1.02]"
                      : day.isToday
                        ? "bg-slate-900/90 border-cyan-500/50 hover:border-cyan-500/80"
                        : day.isOverloaded
                          ? "bg-slate-900/70 border-rose-500/30 hover:border-rose-500/60"
                          : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-850/60"
                  }`}
                >
                  {/* Tag Hoje ou Alerta de Sobrecarga */}
                  <div className="h-4 flex items-center justify-center mb-1">
                    {day.isToday ? (
                      <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/20 px-1.5 py-0.2 rounded-md border border-cyan-500/30">
                        Hoje
                      </span>
                    ) : day.isOverloaded ? (
                      <span className="text-[9px] font-bold text-rose-400 flex items-center gap-0.5">
                        <AlertTriangle size={10} />
                        &gt;15
                      </span>
                    ) : null}
                  </div>

                  {/* Nome do Dia da Semana */}
                  <span
                    className={`text-[11px] font-bold ${
                      day.isToday
                        ? "text-cyan-300"
                        : day.isOverloaded
                          ? "text-rose-300"
                          : "text-slate-300"
                    }`}
                  >
                    {day.dayOfWeek}
                  </span>

                  {/* Data DD/MM */}
                  <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {day.formattedDate}
                  </span>

                  {/* Barra Visual de Volume */}
                  <div className="w-full bg-slate-950/80 rounded-full h-1.5 my-2 overflow-hidden border border-slate-800/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${meterColor}`}
                      style={{
                        width: `${Math.max(day.totalDue > 0 ? 15 : 0, fillPercentage)}%`,
                      }}
                    />
                  </div>

                  {/* Contador com Badge de Urgência */}
                  <span
                    className={`text-[11px] font-mono font-black px-1.5 py-0.5 rounded-md border ${badgeBg}`}
                  >
                    {day.totalDue}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card de Detalhes do Dia Selecionado + Ação Recomendada */}
      {selectedDayData && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white flex items-center gap-1.5">
                {selectedDayData.isToday
                  ? "Hoje"
                  : `${selectedDayData.dayOfWeek} (${selectedDayData.formattedDate})`}
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-indigo-300 font-bold">
                {selectedDayData.totalDue} revisões previstas
              </span>

              {selectedDayData.isOverloaded && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle size={11} />
                  Sobrecarga identificada (&gt;15 revisões)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <strong>{selectedDayData.topicsDueCount}</strong> tópicos do edital
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <strong>{selectedDayData.flashcardsDueCount}</strong> flashcards programados
              </span>

              {selectedDayData.isOverloaded && (
                <span className="text-amber-400/90 font-medium">
                  💡 Dica: antecipe 5 a 10 cards nos dias anteriores para nivelar a curva!
                </span>
              )}
            </div>
          </div>

          {/* Atalho de Ação Rápida */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedDayData.totalDue > 0 ? (
              <Link
                href="/flashcards"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25 active:scale-95 cursor-pointer"
              >
                <span>Revisar Agora</span>
                <ArrowRight size={13} />
              </Link>
            ) : (
              <span className="text-[11px] text-emerald-400/80 font-medium">
                Nenhuma pendência neste dia
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
