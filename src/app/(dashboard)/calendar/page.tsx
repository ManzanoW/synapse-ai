"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Topic } from "@/types";

export default function CalendarPage() {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);

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

  useEffect(() => {
    async function loadCalendarData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/calendar?month=${monthParam}`);
        if (!res.ok) throw new Error("Falha na API");
        const json = await res.json();
        setData(json.data || {});
      } catch (err) {
        console.error("Erro ao carregar calendário:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCalendarData();
  }, [monthParam]);

  async function handleDayClick(dateStr: string, day: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/details?date=${dateStr}`);
      const json = await res.json();

      setSelectedTopics(json.data || []);
      setSelectedDay(day);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Cálculos da grade mensal
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOffset = new Date(currentYear, currentMonth, 1).getDay();

  const totalMonthRevisions = Object.values(data).reduce(
    (acc, curr) => acc + curr,
    0,
  );

  // Formatação do dia de hoje (ex: "2026-08-11")
  const realTodayStr = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  const todayCount = data[realTodayStr] || 0;

  return (
    <div className="relative min-h-screen bg-[#02050e] text-slate-100 p-4 md:p-8 font-sans antialiased selection:bg-indigo-500/30 overflow-hidden">
      {/* Luz Ambient Neon de Fundo */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[130px]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        {/* NAVEGAÇÃO DE VOLTA */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group cursor-pointer"
          >
            <ArrowLeft
              size={14}
              className="transition-transform group-hover:-translate-x-1 text-indigo-400"
            />
            <span>Voltar para a Dashboard</span>
          </Link>
        </div>

        {/* KPIS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#090d16] to-[#05070e] border border-white/10 p-5 rounded-3xl backdrop-blur-2xl shadow-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                Total Este Mês
              </p>
              <p className="text-2xl font-black text-white font-mono mt-1">
                {totalMonthRevisions}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles size={18} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#090d16] to-[#05070e] border border-white/10 p-5 rounded-3xl backdrop-blur-2xl shadow-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                Revisões de Hoje
              </p>
              <p className="text-2xl font-black text-indigo-400 font-mono mt-1">
                {todayCount}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Clock size={18} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#090d16] to-[#05070e] border border-white/10 p-5 rounded-3xl backdrop-blur-2xl shadow-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                Revisões Atrasadas
              </p>
              <p className="text-2xl font-black text-rose-400 font-mono mt-1">
                0
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertCircle size={18} />
            </div>
          </div>
        </div>

        {/* CABEÇALHO DO CALENDÁRIO */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Calendário de Revisões
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Visão temporal das suas sessões agendadas pelo algoritmo SM-2.
              </p>
            </div>
          </div>

          {/* Controle de Mês */}
          <div className="flex items-center gap-2 bg-[#090d16] border border-white/10 p-1.5 rounded-2xl shadow-lg">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
              title="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold px-2 text-slate-200 capitalize min-w-[120px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
              title="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* GRADE DO CALENDÁRIO */}
        <div className="bg-gradient-to-br from-[#090d16] to-[#05070e] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-indigo-400 font-bold">
              <Loader2 size={14} className="animate-spin" /> Sincronizando
              agenda...
            </div>
          )}

          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2.5">
            {/* Espaços vazios iniciais */}
            {Array.from({ length: firstDayOffset }).map((_, idx) => (
              <div key={`offset-${idx}`} className="h-24 rounded-2xl bg-transparent" />
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
                  className={`h-24 p-3 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer group relative overflow-hidden ${
                    isToday
                      ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                      : count > 0
                        ? "border-white/10 bg-slate-950/80 hover:border-indigo-500/40 hover:bg-[#0c101d]"
                        : "border-white/5 bg-slate-950/40 opacity-60 hover:opacity-100 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono ${
                        isToday
                          ? "text-indigo-400 font-extrabold"
                          : "text-slate-400 group-hover:text-white"
                      }`}
                    >
                      {day}
                    </span>

                    {isToday && (
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/20 px-1.5 py-0.2 rounded-full border border-indigo-500/30">
                        Hoje
                      </span>
                    )}
                  </div>

                  {count > 0 && (
                    <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-xl w-fit">
                      <span className="flex h-1.5 w-1.5 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-indigo-300">
                        {count} {count === 1 ? "revisão" : "revisões"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES DO DIA */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-[#090d16] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Revisões do Dia
                  </h2>
                  <p className="text-xs text-indigo-400 font-semibold mt-0.5">
                    {selectedDay} de {monthName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {selectedTopics.length > 0 ? (
                selectedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="p-3.5 bg-slate-950/80 border border-white/10 hover:border-indigo-500/30 rounded-2xl flex items-center justify-between gap-3 group transition-all"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block truncate">
                        {topic.subject?.name || "Sem Matéria"}
                      </span>
                      <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white">
                        {topic.title}
                      </p>
                    </div>

                    <Link
                      href={`/revisar/${topic.id}`}
                      className="text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 shrink-0 cursor-pointer"
                    >
                      Revisar
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center space-y-1">
                  <p className="text-xs text-slate-400 font-medium">
                    Nenhuma revisão agendada para este dia.
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
