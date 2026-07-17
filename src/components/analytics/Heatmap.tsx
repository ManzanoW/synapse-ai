"use client";

import { useEffect, useState } from "react";

export default function Heatmap() {
  const [data, setData] = useState<Record<string, number>>({});
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    text: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/analytics/history")
      .then((res) => res.json())
      .then((json) => {
        setData(json.data || {});
      })
      .catch((err) => console.error("Erro ao carregar heatmap:", err));
  }, []);

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  const getIntensity = (count: number | undefined) => {
    const val = count || 0;
    if (val === 0) return "bg-slate-900";
    if (val < 3) return "bg-indigo-900";
    if (val < 6) return "bg-indigo-600";
    return "bg-indigo-400";
  };

  return (
    <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl relative shadow-xl">
      <h3 className="text-sm font-bold text-slate-200 mb-4">
        Intensidade de Estudos
      </h3>

      {/* Container do Grid */}
      <div className="flex gap-1.5 flex-wrap relative">
        {days.map((day) => (
          <div
            key={day}
            className={`w-6 h-6 rounded-md transition-all duration-200 hover:scale-110 cursor-pointer ${getIntensity(data?.[day])}`}
            onMouseEnter={(e) => {
              // Captura a posição relativa ao container pai
              const parentRect =
                e.currentTarget.parentElement?.getBoundingClientRect();
              const targetRect = e.currentTarget.getBoundingClientRect();

              setTooltip({
                visible: true,
                text: `${day}: ${data?.[day] || 0} revisões`,
                // Calcula a posição dentro do card
                x: targetRect.left - (parentRect?.left || 0),
                y: targetRect.top - (parentRect?.top || 0),
              });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>

      {/* Tooltip agora absoluto e garantido dentro do fluxo */}
      {tooltip && (
        <div
          className="absolute z-[100] px-3 py-1.5 bg-slate-800 text-[11px] text-white rounded border border-slate-700 shadow-xl pointer-events-none whitespace-nowrap"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y + 20,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
