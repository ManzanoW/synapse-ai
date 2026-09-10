"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Topic } from "@/types";

interface PendingSubjectsProps {
  onReviewClick: (topic: Topic) => void;
}

const INITIAL_LIMIT = 3; // 🟢 Compacto: Apenas 1 linha de 3 itens por padrão

export default function PendingSubjects({
  onReviewClick,
}: PendingSubjectsProps) {
  const [pendings, setPendings] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(INITIAL_LIMIT);

  useEffect(() => {
    async function fetchPendings() {
      try {
        setLoading(true);
        const res = await fetch("/api/edital?type=pending");
        const json = (await res.json()) as { data: Topic[] };

        setPendings(json.data || []);
      } catch (error) {
        console.error("Erro ao buscar pendências:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPendings();
  }, []);

  if (loading)
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-slate-400 font-medium">
        <Loader2 className="animate-spin text-indigo-400" size={13} />{" "}
        Carregando urgentes...
      </div>
    );

  if (pendings.length === 0) return null;

  const visiblePendings = pendings.slice(0, limit);
  const hasMore = pendings.length > limit;

  return (
    <div className="space-y-2 mb-6 font-sans">
      {/* Cabeçalho Compacto */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">
            Pendentes Hoje:{" "}
            <strong className="text-indigo-400 font-bold">
              {pendings.length}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
          <Clock size={11} className="text-indigo-400" />
          <span>SM-2 Agendado</span>
        </div>
      </div>

      {/* Grid Ultra-Compacto (Cards em pílula fina) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {visiblePendings.map((topic) => (
          <div
            key={topic.id}
            className="group relative bg-[#090d16]/90 hover:bg-[#0c101d] border border-white/8 hover:border-indigo-500/30 px-3.5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between gap-3 shadow-md"
          >
            {/* Lado Esquerdo: Badge + Título em linha única */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[9px] font-bold tracking-wider text-indigo-400 uppercase truncate">
                  {topic.subject?.name || "Geral"}
                </span>
              </div>

              <h4 className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors truncate">
                {topic.title}
              </h4>
            </div>

            {/* Lado Direito: Botão Direto */}
            <button
              onClick={() => onReviewClick(topic)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm shadow-indigo-600/20 shrink-0 cursor-pointer"
            >
              Revisar
            </button>
          </div>
        ))}
      </div>

      {/* Botões de Expandir / Recolher Compactos */}
      {pendings.length > INITIAL_LIMIT && (
        <div className="flex justify-end pt-0.5">
          {hasMore ? (
            <button
              onClick={() => setLimit((prev) => prev + 3)}
              className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-all cursor-pointer"
            >
              <span>+ Ver mais ({pendings.length - limit} restantes)</span>
              <ChevronDown size={12} />
            </button>
          ) : (
            <button
              onClick={() => setLimit(INITIAL_LIMIT)}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-400 font-medium transition-all cursor-pointer"
            >
              <span>Recolher</span>
              <ChevronUp size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
