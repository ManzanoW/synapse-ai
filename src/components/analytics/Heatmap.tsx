"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export default function Heatmap() {
  const [data, setData] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/analytics/history")
      .then((res) => res.json())
      .then((json) => setData(json.data || {}))
      .catch((err) => console.error("Erro ao carregar heatmap:", err));
  }, []);

  // 70 dias = 10 semanas (tamanho perfeito para caber na coluna lateral de 4 colunas)
  const days = Array.from({ length: 70 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (69 - i));
    return d.toISOString().split("T")[0];
  });

  const activeDaysCount = Object.values(data).filter((v) => v > 0).length;

  const getIntensityStyle = (count: number | undefined) => {
    const val = count || 0;
    if (val === 0)
      return "bg-slate-900/90 border border-white/5 hover:border-indigo-400/50 hover:bg-slate-800";
    if (val < 3)
      return "bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.25)] hover:border-indigo-400 hover:scale-110";
    if (val < 6)
      return "bg-indigo-600 border border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)] hover:scale-110";
    return "bg-indigo-400 border border-indigo-200 text-slate-950 shadow-[0_0_16px_rgba(129,140,248,0.8)] hover:scale-110";
  };

  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
  const weeks = Array.from({ length: 10 }, (_, i) =>
    days.slice(i * 7, i * 7 + 7)
  );

  return (
    <div className="space-y-4">
      {/* 1. Cabeçalho Compacto */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)] shrink-0">
            <Activity size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate">
              Intensidade
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              <strong className="font-mono font-bold text-indigo-400">
                {activeDaysCount}
              </strong>{" "}
              dias ativos (10 sem)
            </p>
          </div>
        </div>

        {/* Legenda Compacta */}
        <div className="flex items-center gap-1 text-[8px] font-mono text-slate-400 shrink-0">
          <span className="h-2 w-2 rounded-xs bg-slate-900 border border-white/5" />
          <span className="h-2 w-2 rounded-xs bg-indigo-950 border border-indigo-500/40" />
          <span className="h-2 w-2 rounded-xs bg-indigo-600" />
          <span className="h-2 w-2 rounded-xs bg-indigo-400" />
        </div>
      </div>

      {/* 2. Matriz Ajustada para Sidebar */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Coluna dos Dias */}
        <div className="flex flex-col justify-between py-0.5 text-[9px] font-mono font-bold text-slate-500 shrink-0 h-28">
          {weekDays.map((d, idx) => (
            <span key={idx} className="leading-3">
              {d}
            </span>
          ))}
        </div>

        {/* 10 Semanas distribuídas proporcionalmente */}
        <div className="flex flex-1 justify-between gap-1">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col justify-between gap-1">
              {week.map((day) => {
                const count = data?.[day] || 0;
                const formattedDate = day.split("-").reverse().join("/");

                return (
                  <div
                    key={day}
                    className="group relative flex items-center justify-center"
                  >
                    {/* Bloco Interativo */}
                    <div
                      className={`h-3 w-3 shrink-0 rounded-xs transition-all duration-200 cursor-pointer ${getIntensityStyle(
                        count
                      )}`}
                    />

                    {/* Tooltip Flutuante */}
                    <div className="pointer-events-none absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-50">
                      <div className="whitespace-nowrap rounded-lg border border-white/10 bg-slate-900/95 px-2.5 py-1 font-mono text-[10px] text-slate-100 shadow-2xl backdrop-blur-md">
                        <strong className="text-indigo-400">
                          {formattedDate}
                        </strong>
                        : {count} {count === 1 ? "revisão" : "revisões"}
                      </div>
                      <div className="-mt-1 h-1.5 w-1.5 rotate-45 border-r border-b border-white/10 bg-slate-900" />
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
