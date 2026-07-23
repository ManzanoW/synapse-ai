"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Topic } from "@/types";

interface PendingSubjectsProps {
  onReviewClick: (topic: Topic) => void;
}

const INITIAL_LIMIT = 6; // Mostra apenas 6 cards inicialmente (2 linhas de 3)

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
        const res = await fetch("/api/planner?type=pending");
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
      <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
        <Loader2 className="animate-spin" size={14} /> Carregando urgentes...
      </div>
    );

  if (pendings.length === 0) return null;

  const visiblePendings = pendings.slice(0, limit);
  const hasMore = pendings.length > limit;

  return (
    <div className="space-y-3 mb-8">
      {/* Cabeçalho com o total acumulado */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Exibindo {visiblePendings.length} de {pendings.length} tópicos
          pendentes
        </span>
      </div>

      {/* Grid limitada */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {visiblePendings.map((topic) => (
          <div
            key={topic.id}
            className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl flex justify-between items-center hover:border-indigo-500/40 transition-all"
          >
            <div className="pr-2 min-w-0">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider truncate">
                {topic.subject?.name || "Sem Matéria"}
              </p>
              <h4 className="text-xs font-semibold text-slate-200 line-clamp-2">
                {topic.title}
              </h4>
            </div>
            <button
              onClick={() => onReviewClick(topic)}
              className="bg-indigo-600 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition-colors shrink-0"
            >
              Revisar
            </button>
          </div>
        ))}
      </div>

      {/* Botões de Expandir / Recolher */}
      <div className="flex justify-center pt-2">
        {hasMore ? (
          <button
            onClick={() => setLimit((prev) => prev + 6)}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-2 px-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
          >
            Ver mais pendentes ({pendings.length - limit} restantes)
            <ChevronDown size={14} />
          </button>
        ) : pendings.length > INITIAL_LIMIT ? (
          <button
            onClick={() => setLimit(INITIAL_LIMIT)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 font-medium py-2 px-4 rounded-lg bg-slate-800/40 transition-all"
          >
            Recolher lista
            <ChevronUp size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
