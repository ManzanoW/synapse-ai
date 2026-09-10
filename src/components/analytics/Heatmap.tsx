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

  // 98 dias = 14 semanas (preenche com perfeição o card na sidebar)
  const days = Array.from({ length: 98 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (97 - i));
    return d.toISOString().split("T")[0];
  });

  const activeDaysCount = Object.values(data).filter((v) => v > 0).length;

  const getIntensityStyle = (count: number | undefined) => {
    const val = count || 0;
    if (val === 0)
      return "bg-slate-900/90 border border-white/5 hover:border-indigo-400/60 hover:bg-slate-800/80";
    if (val < 3)
      return "bg-indigo-950/90 border border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:border-indigo-400 hover:scale-110";
    if (val < 6)
      return "bg-indigo-600 border border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.6)] hover:scale-110";
    return "bg-indigo-400 border border-indigo-200 text-slate-950 shadow-[0_0_16px_rgba(129,140,248,0.9)] hover:scale-110";
  };

  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
  const weeks = Array.from({ length: 14 }, (_, i) =>
    days.slice(i * 7, i * 7 + 7),
  );

  return (
    <div className="space-y-3.5">
      {/* 1. CABEÇALHO COMPACTO */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
            <Activity size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-xs font-bold uppercase tracking-wider text-slate-200">
              Intensidade
            </h3>
            <p className="truncate text-[10px] text-slate-400">
              <strong className="font-mono font-bold text-indigo-400">
                {activeDaysCount}
              </strong>{" "}
              dias ativos (14 sem)
            </p>
          </div>
        </div>

        {/* Legenda de Níveis */}
        <div className="flex shrink-0 items-center gap-1 font-mono text-[8px] text-slate-400">
          <span className="h-2 w-2 rounded-xs border border-white/5 bg-slate-900" />
          <span className="h-2 w-2 rounded-xs border border-indigo-500/40 bg-indigo-950" />
          <span className="h-2 w-2 rounded-xs bg-indigo-600" />
          <span className="h-2 w-2 rounded-xs bg-indigo-400" />
        </div>
      </div>

      {/* 2. MATRIZ COM ALINHAMENTO MILIMÉTRICO */}
      <div className="flex items-start justify-between gap-2 pt-1">
        {/* Rótulos dos Dias da Semana (Grid 7x1 perfeitamente sincronizado com os blocos) */}
        <div className="grid grid-rows-7 gap-1.5 shrink-0 text-[9px] font-mono font-bold text-slate-500">
          {weekDays.map((d, idx) => (
            <span
              key={idx}
              className="flex h-3.5 w-3.5 items-center justify-center leading-none"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Matriz de 14 Semanas */}
        <div className="flex flex-1 items-center justify-between gap-1">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-rows-7 gap-1.5">
              {week.map((day) => {
                const count = data?.[day] || 0;
                const formattedDate = day.split("-").reverse().join("/");

                return (
                  <div
                    key={day}
                    className="group relative flex items-center justify-center"
                  >
                    {/* Bloco do Dia */}
                    <div
                      className={`h-3.5 w-3.5 shrink-0 rounded-xs transition-all duration-200 cursor-pointer ${getIntensityStyle(
                        count,
                      )}`}
                    />

                    {/* Tooltip Inteligente (Aparece sem cortar no topo) */}
                    <div className="pointer-events-none absolute bottom-full mb-1.5 hidden flex-col items-center group-hover:flex z-50">
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
