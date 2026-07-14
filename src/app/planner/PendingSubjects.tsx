"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Topic } from "@/types";

interface PendingSubjectsProps {
  onReviewClick: (topic: Topic) => void;
}

export default function PendingSubjects({
  onReviewClick,
}: PendingSubjectsProps) {
  // 2. Usando o tipo no estado
  const [pendings, setPendings] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPendings() {
      try {
        setLoading(true);
        const res = await fetch("/api/planner?type=pending");

        // 3. Tipagem da resposta (Casting)
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      {pendings.map((topic) => (
        <div
          key={topic.id}
          className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl flex justify-between items-center"
        >
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              {topic.subject?.name || "Sem Matéria"}
            </p>
            <h4 className="text-xs font-semibold text-slate-200">
              {topic.title}
            </h4>
          </div>
          <button
            onClick={() => onReviewClick(topic)}
            className="bg-indigo-600 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Revisar
          </button>
        </div>
      ))}
    </div>
  );
}
