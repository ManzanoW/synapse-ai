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
  description = "Selecione uma carreira abaixo para carregar a grade oficial calibrada ou importe o documento específico da sua banca.",
  onSuccess,
}: EditalEmptyStateProps) {
  return (
    <div className="relative rounded-lg border border-slate-800 bg-[#0B0F17] p-5 sm:p-6 shadow-lg text-left">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {title}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-400 max-w-2xl">
              {description}
            </p>
          </div>

          <Link
            href="/edital"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-all shrink-0 self-start sm:self-center"
          >
            <UploadCloud size={14} className="text-indigo-400" />
            <span>Importar Edital Oficial</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <StarterEditalSelector
          onSuccess={onSuccess}
          showCustomLink={false}
          hideHeader={true}
        />
      </div>
    </div>
  );
}
