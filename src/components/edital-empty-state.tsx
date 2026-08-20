"use client";

import Link from "next/link";
import { BookOpen, Sparkles, ArrowRight, Lock } from "lucide-react";

interface EditalEmptyStateProps {
  title?: string;
  description?: string;
  badge?: string;
}

export function EditalEmptyState({
  title = "Configuração do Edital Requerida",
  description = "Cadastre suas disciplinas e tópicos no edital para liberar o cronograma adaptativo, ciclo de estudos dinâmico e métricas com IA.",
  badge = "Onboarding Requerido",
}: EditalEmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-linear-to-br from-[#0c101d] via-[#080b14] to-[#04060c] p-8 text-center shadow-2xl backdrop-blur-2xl">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-md space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          <BookOpen size={28} />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
          <Lock size={12} /> {badge}
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black tracking-tight text-white">
            {title}
          </h3>
          <p className="text-xs leading-relaxed text-slate-300">
            {description}
          </p>
        </div>

        <Link
          href="/edital"
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 active:scale-95"
        >
          <Sparkles size={15} />
          <span>Configurar Edital Agora</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
