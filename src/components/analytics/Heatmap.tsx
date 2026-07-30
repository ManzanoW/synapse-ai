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

  // 35 dias organizados por semanas (5 linhas x 7 colunas)
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    return d.toISOString().split("T")[0];
  });

  const activeDaysCount = Object.values(data).filter((v) => v > 0).length;

  const getIntensityStyle = (count: number | undefined) => {
    const val = count || 0;
    if (val === 0)
      return "bg-slate-950/70 border border-white/10 hover:border-white/20 hover:bg-slate-900/50";
    if (val < 3)
      return "bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.25)] hover:border-indigo-400 hover:scale-105";
    if (val < 6)
      return "bg-indigo-600 border border-indigo-400 text-white shadow-[0_0_14px_rgba(99,102,241,0.55)] hover:scale-110";
    return "bg-indigo-400 border border-indigo-200 text-slate-950 shadow-[0_0_18px_rgba(129,140,248,0.9)] hover:scale-110";
  };

  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

  // Função auxiliar para posicionar o tooltip sem cortar nas bordas
  const getTooltipPositionClass = (colIndex: number) => {
    if (colIndex === 0) return "left-0 translate-x-0"; // Primeira coluna (Domingo)
    if (colIndex === 6) return "right-0 translate-x-0"; // Última coluna (Sábado)
    return "left-1/2 -translate-x-1/2"; // Colunas centrais
  };

  const getArrowPositionClass = (colIndex: number) => {
    if (colIndex === 0) return "left-3";
    if (colIndex === 6) return "right-3";
    return "left-1/2 -translate-x-1/2";
  };

  return (
    <div className="space-y-4 relative select-none">
      {/* 1. Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
            Intensidade de Estudos
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            <span className="font-mono font-bold text-indigo-400">
              {activeDaysCount}
            </span>{" "}
            dias ativos nos últimos 35 dias
          </p>
        </div>
      </div>

      {/* 2. Dias da Semana */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono text-slate-500 font-bold">
        {weekDays.map((day, idx) => (
          <span key={idx}>{day}</span>
        ))}
      </div>

      {/* 3. Grade de Blocos Horizontal */}
      <div className="grid grid-cols-7 gap-1.5 w-full">
        {days.map((day, index) => {
          const count = data?.[day] || 0;
          const colIndex = index % 7; // Identifica a coluna de 0 a 6

          return (
            <div
              key={day}
              className={`group relative aspect-square w-full rounded-sm transition-all duration-200 cursor-pointer ${getIntensityStyle(
                count,
              )}`}
            >
              {/* Tooltip Inteligente */}
              <div
                className={`absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-100 pointer-events-none ${getTooltipPositionClass(
                  colIndex,
                )}`}
              >
                <div className="px-2.5 py-1 bg-slate-900/95 backdrop-blur-md text-[10px] font-mono text-slate-100 rounded-lg border border-white/10 shadow-2xl whitespace-nowrap">
                  {day.split("-").reverse().slice(0, 2).join("/")}: {count}{" "}
                  {count === 1 ? "revisão" : "revisões"}
                </div>
                <div
                  className={`absolute -bottom-1 w-1.5 h-1.5 bg-slate-900 border-r border-b border-white/10 rotate-45 ${getArrowPositionClass(
                    colIndex,
                  )}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Legenda Inferior */}
      <div className="flex items-center justify-end gap-1.5 pt-1 text-[9px] font-mono text-slate-400">
        <span className="text-slate-500">Menos</span>
        <div className="w-2.5 h-2.5 rounded-xs bg-slate-950/70 border border-white/10" />
        <div className="w-2.5 h-2.5 rounded-xs bg-indigo-950/90 border border-indigo-500/40" />
        <div className="w-2.5 h-2.5 rounded-xs bg-indigo-600 border border-indigo-400" />
        <div className="w-2.5 h-2.5 rounded-xs bg-indigo-400 border border-indigo-200" />
        <span className="text-slate-400">Mais</span>
      </div>
    </div>
  );
}
