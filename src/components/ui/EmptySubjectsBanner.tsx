// src/components/ui/EmptySubjectsBanner.tsx
import Link from "next/link";
import { AlertCircle, ArrowRight, BookOpen } from "lucide-react";

export function EmptySubjectsBanner() {
  return (
    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3">
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
            Nenhuma Matéria Cadastrada
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Para a IA gerar flashcards ou simulados personalizados, você precisa cadastrar seu edital primeiro.
          </p>
        </div>
      </div>

      <Link
        href="/edital"
        className="inline-flex items-center gap-2 text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-xl transition-all"
      >
        <BookOpen size={14} />
        <span>Cadastrar Edital Agora</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
