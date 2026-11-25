"use client";

import Link from "next/link";
import { BookOpen, ArrowRight, UploadCloud } from "lucide-react";
import { StarterEditalSelector } from "@/components/edital/StarterEditalSelector";

interface EditalEmptyStateProps {
  title?: string;
  description?: string;
  badge?: string;
  onSuccess?: () => void;
}

export function EditalEmptyState({
  title = "Estruture seu Edital para Ativar o Planejamento",
  description = "Selecione uma carreira pré-mapeada abaixo em 1 clique ou envie o edital específico da sua banca.",
  badge = "Planejamento Inicial",
  onSuccess,
}: EditalEmptyStateProps) {
  return (
    <div className="relative rounded-2xl border border-slate-800/80 bg-[#0c121e]/90 p-5 sm:p-7 shadow-xl text-left">
      <div className="max-w-4xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              <BookOpen size={13} className="text-cyan-400" />
              <span>{badge}</span>
            </div>

            <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
              {title}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-400 max-w-2xl">
              {description}
            </p>
          </div>

          <Link
            href="/edital"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white transition-all shrink-0 self-start sm:self-center"
          >
            <UploadCloud size={14} className="text-indigo-400" />
            <span>Importar PDF / Manual</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="pt-1">
          <StarterEditalSelector onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
}
