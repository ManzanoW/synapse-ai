"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { getErrorNotebookItemsAction } from "@/actions/error-notebook-actions";
import { ErrorNotebookItem } from "@/types/quiz";

export function RecentErrorsCard() {
  const [errors, setErrors] = useState<ErrorNotebookItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadErrors() {
      try {
        const res = await getErrorNotebookItemsAction({ status: "PENDING" });
        if (!ignore && res.success && res.data) {
          setErrors(res.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Erro ao carregar erros recentes no dashboard:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadErrors();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-950/60 p-5 animate-pulse space-y-3">
        <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  // Se não houver erros pendentes, exibe estado de alta performance
  if (errors.length === 0) {
    return (
      <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-slate-950/60 p-5 shadow-xs dark:shadow-2xl backdrop-blur-2xl transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Caderno de Erros Zerado!
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Você não possui questões com revisão pendente no momento.
              </p>
            </div>
          </div>
          <Link
            href="/questions"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
          >
            Treinar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-slate-950/60 p-5 sm:p-6 shadow-xs dark:shadow-2xl backdrop-blur-2xl transition-all hover:border-rose-500/30">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-rose-500/40 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertTriangle size={14} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Erros Recentes em Simulados
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Questões que exigem remediação cognitiva
            </span>
          </div>
        </div>

        <Link
          href="/notebook"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
        >
          <span>Ver Caderno</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      {/* Lista das 3 últimas questões erradas */}
      <div className="space-y-2 mb-4">
        {errors.map((item, idx) => {
          const cleanText = item.questionText
            ? item.questionText.replace(/\*\*/g, "").slice(0, 95) +
              (item.questionText.length > 95 ? "..." : "")
            : "Questão de concurso";

          return (
            <div
              key={item.id || idx}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 hover:border-rose-500/30 transition-all flex flex-col justify-between gap-1.5"
            >
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider truncate max-w-[150px]">
                  {item.subject?.name || "Geral"}
                </span>
                {item.errorReason && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 font-mono text-[9px]">
                    {item.errorReason}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">
                {cleanText}
              </p>
            </div>
          );
        })}
      </div>

      {/* Botão de ação rápida: Ir ao Caderno para Revanche */}
      <Link
        href="/notebook"
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs font-bold transition-all active:scale-98 shadow-xs cursor-pointer"
      >
        <RotateCcw size={13} className="text-rose-500" />
        <span>Abrir Caderno de Erros para Revanche</span>
      </Link>
    </div>
  );
}
export default RecentErrorsCard;
