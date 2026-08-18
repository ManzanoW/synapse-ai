"use client";

import { useEffect, useState } from "react";

export default function Heatmap() {
  const [data, setData] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/analytics/history")
      .then((res) => res.json())
      .then((json) => {
        setData(json.data || {});
      })
      .catch((err) => console.error("Erro ao carregar heatmap:", err));
  }, []);

  // 91 dias (13 semanas / ~3 meses) para preencher a largura de forma equilibrada
  const daysCount = 91;
  const days = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (daysCount - 1 - i));
    return d.toISOString().split("T")[0];
  });

  const activeDaysCount = Object.values(data).filter((v) => v > 0).length;

  const getIntensityStyle = (count: number | undefined) => {
    const val = count || 0;
    if (val === 0)
      return "bg-slate-950/70 border border-white/10 hover:border-white/30";
    if (val < 3)
      return "bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.25)] hover:border-indigo-400 hover:scale-125";
    if (val < 6)
      return "bg-indigo-600 border border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.55)] hover:scale-125";
    return "bg-indigo-400 border border-indigo-200 text-slate-950 shadow-[0_0_15px_rgba(129,140,248,0.9)] hover:scale-125";
  };

  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

  // Agrupa os dias em colunas de semanas (cada coluna tem 7 dias)
  const weeksCount = Math.ceil(daysCount / 7);
  const weeks = Array.from({ length: weeksCount }, (_, weekIdx) =>
    days.slice(weekIdx * 7, weekIdx * 7 + 7),
  );

  return (
    <div className="relative select-none space-y-3">
      {/* 1. Resumo da Atividade */}
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <p>
          <span className="font-mono font-bold text-indigo-400">
            {activeDaysCount}
          </span>{" "}
          dias ativos nos últimos 90 dias
        </p>

        {/* Legenda de Intensidade */}
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
          <span className="text-slate-500">Menos</span>
          <div className="h-2.5 w-2.5 rounded-xs border border-white/10 bg-slate-950/70" />
          <div className="h-2.5 w-2.5 rounded-xs border border-indigo-500/40 bg-indigo-950/90" />
          <div className="h-2.5 w-2.5 rounded-xs border border-indigo-400 bg-indigo-600" />
          <div className="h-2.5 w-2.5 rounded-xs border border-indigo-200 bg-indigo-400" />
          <span>Mais</span>
        </div>
      </div>

      {/* 2. Grid de Tamanho Fixo Distribuído na Horizontal */}
      <div className="flex items-start gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
        {/* Rótulo dos dias da semana (D, S, T, Q...) */}
        <div className="flex flex-col gap-1.5 pt-0.5 text-[10px] font-mono font-bold text-slate-500 shrink-0">
          {weekDays.map((day, idx) => (
            <span key={idx} className="h-3.5 leading-3.5">
              {day}
            </span>
          ))}
        </div>

        {/* Grade de Semanas */}
        <div className="flex gap-1.5 min-w-max justify-between flex-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1.5">
              {week.map((day) => {
                const count = data?.[day] || 0;

                return (
                  <div
                    key={day}
                    className={`group relative h-3.5 w-3.5 shrink-0 rounded-xs transition-all duration-150 cursor-pointer ${getIntensityStyle(
                      count,
                    )}`}
                  >
                    {/* Tooltip Inteligente */}
                    <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 flex-col items-center z-50 pointer-events-none group-hover:flex">
                      <div className="whitespace-nowrap rounded-lg border border-white/10 bg-slate-900/95 px-2.5 py-1 text-[10px] font-mono text-slate-100 shadow-2xl backdrop-blur-md">
                        {day.split("-").reverse().slice(0, 2).join("/")}:{" "}
                        {count} {count === 1 ? "revisão" : "revisões"}
                      </div>
                      <div className="h-1.5 w-1.5 -bottom-1 absolute rotate-45 border-r border-b border-white/10 bg-slate-900" />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
