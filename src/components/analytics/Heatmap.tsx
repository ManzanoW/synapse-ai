"use client";

import { useEffect, useState } from "react";

export default function Heatmap() {
  // Inicializamos com um objeto vazio explicitamente
  const [data, setData] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/analytics/history")
      .then((res) => res.json())
      .then((json) => {
        // Garantimos que recebemos um objeto
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
    const val = count || 0; // Se undefined, trata como 0
    if (val === 0) return "bg-slate-900";
    if (val < 3) return "bg-indigo-900";
    if (val < 6) return "bg-indigo-600";
    return "bg-indigo-400";
  };

  return (
    <div className="bg-[#090d16] border border-slate-800 p-6 rounded-2xl">
      <h3 className="text-sm font-bold text-slate-200 mb-4">
        Intensidade de Estudos
      </h3>
      <div className="flex gap-1.5 flex-wrap">
        {days.map((day) => (
          <div
            key={day}
            // Acessamos com segurança usando optional chaining e fallback
            className={`w-6 h-6 rounded-md ${getIntensity(data?.[day])}`}
            title={`${day}: ${data?.[day] || 0} revisões`}
          />
        ))}
      </div>
    </div>
  );
}
