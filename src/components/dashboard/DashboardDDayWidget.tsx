"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Sparkles,
  Target,
  ArrowRight,
  TrendingUp,
  Edit3,
  Check,
  X,
  Flame,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface DashboardDDayWidgetProps {
  targetRole?: string | null;
  careerFocus?: string | null;
  dailyGoalHours?: number;
}

export function DashboardDDayWidget({
  targetRole,
  careerFocus,
  dailyGoalHours = 3,
}: DashboardDDayWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [examName, setExamName] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("synapse_dday_exam_name");
      if (saved) return saved;
    }
    return targetRole || "Meu Concurso Alvo";
  });

  const [examDateStr, setExamDateStr] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("synapse_dday_target_date");
      if (saved) return saved;
    }
    // Padrão: 60 dias no futuro
    const target = new Date();
    target.setDate(target.getDate() + 60);
    return target.toISOString().split("T")[0];
  });

  const [tempDate, setTempDate] = useState(examDateStr);
  const [tempName, setTempName] = useState(examName);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(examDateStr + "T00:00:00");
    const diffTime = targetDate.getTime() - today.getTime();
    const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Cálculo estimado de horas restantes com base na meta diária
    const estimatedHours = Math.round(daysRemaining * dailyGoalHours);

    return {
      daysRemaining,
      estimatedHours,
      formattedDate: targetDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
  }, [examDateStr, dailyGoalHours]);

  const handleSaveDate = () => {
    setExamDateStr(tempDate);
    setExamName(tempName);
    try {
      localStorage.setItem("synapse_dday_target_date", tempDate);
      localStorage.setItem("synapse_dday_exam_name", tempName);
    } catch {}
    setIsEditing(false);
    triggerHaptic("medium");
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/25 bg-gradient-to-r from-[#0b0f19] via-[#0e1424] to-[#0b0f19] p-4 sm:p-5 shadow-xl">
      {/* Background Glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Lado Esquerdo: Contagem Regressiva & Título */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex flex-col items-center justify-center h-16 w-16 sm:h-18 sm:w-18 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 shrink-0 shadow-inner">
            <span className="text-xl sm:text-2xl font-black text-white leading-none">
              {stats.daysRemaining}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 mt-1">
              Dias
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                ⏱️ RETA FINAL • D-DAY
              </span>
              <span className="text-xs text-slate-400">
                Prova: <strong className="text-slate-200">{stats.formattedDate}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setTempDate(examDateStr);
                  setTempName(examName);
                  setIsEditing(true);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                title="Editar data ou nome do concurso"
              >
                <Edit3 size={13} />
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              {examName}
            </h3>

            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>
                Meta: <strong>{dailyGoalHours}h por dia</strong> (~{stats.estimatedHours}h líquidas até a prova)
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Flame size={12} />
                <span>Ritmo Consistente</span>
              </span>
            </p>
          </div>
        </div>

        {/* Lado Direito: Ação Rápida de Cronograma */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            href="/week"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-900/30 cursor-pointer active:scale-95"
          >
            <span>Ver Cronograma da Semana</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Modal/Barra de Edição Inline */}
      {isEditing && (
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] text-slate-400 mb-1">
              Nome do Concurso:
            </label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Ex: Polícia Federal, TJ-SP, INSS..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="w-44">
            <label className="block text-[11px] text-slate-400 mb-1">
              Data da Prova:
            </label>
            <input
              type="date"
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end mt-2 sm:mt-0">
            <button
              type="button"
              onClick={handleSaveDate}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Check size={13} />
              <span>Salvar</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
