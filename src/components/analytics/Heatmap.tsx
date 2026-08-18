"use client";

import { useEffect, useState } from "react";

export default function Heatmap() {
  const [data, setData] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/analytics/history")
      .then((res) => res.json())
      .then((json) => setData(json.data || {}))
      .catch((err) => console.error("Erro ao carregar heatmap:", err));
  }, []);

  // 35 dias (5 semanas) no formato compacto
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    return d.toISOString().split("T")[0];
  });

  const activeDaysCount = Object.values(data).filter((v) => v > 0).length;

  const getIntensityStyle = (count: number | undefined) => {
    const val = count || 0;
    if (val === 0) return "bg-slate-900/80 border border-white/5";
    if (val < 3) return "bg-indigo-950/80 border border-indigo-500/40 text-indigo-300";
    if (val < 6) return "bg-indigo-600 border border-indigo-400 text-white";
    return "bg-indigo-400 border border-indigo-200 text-slate-950";
  };

  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
  const weeks = Array.from({ length: 5 }, (_, i) => days.slice(i * 7, i * 7 + 7));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>
          <strong className="font-mono font-bold text-indigo-400">{activeDaysCount}</strong> dias ativos (últimos 35 dias)
        </span>
        <div className="flex items-center gap-1 text-[9px] font-mono">
          <span className="text-slate-500">Menos</span>
          <span className="h-2.5 w-2.5 rounded-xs bg-slate-900 border border-white/5" />
          <span className="h-2.5 w-2.5 rounded-xs bg-indigo-950 border border-indigo-500/40" />
          <span className="h-2.5 w-2.5 rounded-xs bg-indigo-600" />
          <span className="h-2.5 w-2.5 rounded-xs bg-indigo-400" />
          <span>Mais</span>
        </div>
      </div>

      <div className="flex items-start gap-2 justify-center">
        <div className="flex flex-col gap-1.5 pt-0.5 text-[10px] font-mono font-bold text-slate-500">
          {weekDays.map((d, i) => (
            <span key={i} className="h-3.5 leading-3.5">{d}</span>
          ))}
        </div>

        <div className="flex gap-1.5">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day) => {
                const count = data?.[day] || 0;
                return (
                  <div
                    key={day}
                    title={`${day}: ${count} revisões`}
                    className={`h-3.5 w-3.5 rounded-xs transition-all ${getIntensityStyle(count)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
