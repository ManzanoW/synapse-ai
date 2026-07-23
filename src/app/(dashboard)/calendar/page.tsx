"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Topic } from "@/types";

export default function CalendarPage() {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);

  useEffect(() => {
    async function loadCalendarData() {
      try {
        const res = await fetch("/api/calendar?month=2026-07");
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
  }, []);

  async function handleDayClick(dateStr: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/details?date=${dateStr}`);
      const json = await res.json();

      // Garante que se for undefined, vira um array vazio
      setSelectedTopics(json.data || []);
      setSelectedDay(parseInt(dateStr.split("-")[2]));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors group"
          >
            <ArrowLeft
              size={14}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            <span>Voltar para a Dashboard</span>
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#090d16] border border-slate-800 p-4 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold">
              Total este mês
            </p>
            <p className="text-xl font-bold text-white">24</p>
          </div>
          <div className="bg-[#090d16] border border-slate-800 p-4 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold">
              Hoje
            </p>
            <p className="text-xl font-bold text-indigo-400">4</p>
          </div>
          <div className="bg-[#090d16] border border-slate-800 p-4 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold">
              Atrasados
            </p>
            <p className="text-xl font-bold text-rose-400">1</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarIcon size={24} className="text-indigo-400" />
              Calendário de Revisões
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-900 p-1.5 rounded-xl">
            <button className="p-1 hover:text-indigo-400 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold px-2">Julho 2026</span>
            <button className="p-1 hover:text-indigo-400 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Container do Calendário */}
        <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-xl">
          {/* Cabeçalho da Grid (Dias da Semana) */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Grid dos Dias */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const dateStr = `2026-07-${day.toString().padStart(2, "0")}`;
              const isToday = day === 13;

              // 1. Buscamos a quantidade de revisões para este dia específico
              const count = data[dateStr] || 0;

              return (
                <div
                  key={day}
                  onClick={() => {
                    handleDayClick(dateStr);
                  }}
                  className={`h-24 p-3 border rounded-xl flex flex-col justify-between transition-all cursor-pointer group 
        ${
          isToday
            ? "border-indigo-500/50 bg-indigo-500/5"
            : "border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900"
        }
        ${count === 0 ? "opacity-50 hover:opacity-100" : ""}
      `}
                >
                  <span
                    className={`text-xs font-bold ${isToday ? "text-indigo-400" : "text-slate-500"}`}
                  >
                    {day}
                  </span>

                  {/* 2. Renderizamos o contador se houver revisões */}
                  {count > 0 && (
                    <div className="flex items-center gap-1.5 animate-in zoom-in duration-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      <span className="text-[10px] font-bold text-indigo-300">
                        {count}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedDay && (
        <div
          className="fixed inset-0 bg-[#030712]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho alinhado com o seu Dashboard */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-sm font-bold text-slate-200">
                  Revisões do dia
                </h2>
                <p className="text-xs text-indigo-400 font-semibold mt-0.5">
                  {selectedDay} de Julho, 2026
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-slate-500 hover:text-indigo-400 transition-colors"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            {/* Lista de tópicos no mesmo estilo do seu Planner/PendingSubjects */}
            <div className="space-y-3">
              {selectedTopics.length > 0 ? (
                selectedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        {topic.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {topic.subject?.name || "Sem Matéria"}
                      </p>
                    </div>
                    <Link
                      href={`/revisar/${topic.id}`}
                      className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Revisar
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">
                  Nenhuma revisão pendente.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
