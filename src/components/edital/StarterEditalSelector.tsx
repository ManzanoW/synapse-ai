"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Loader2,
  Check,
  ArrowRight,
  BookOpen,
  FileText,
  ShieldAlert,
} from "lucide-react";
import {
  STARTER_EDITAL_TEMPLATES,
  EditalTemplate,
} from "@/lib/edital-templates";
import { importStarterEditalAction } from "@/actions/edital-templates-actions";

interface StarterEditalSelectorProps {
  onSuccess?: () => void;
  showCustomLink?: boolean;
  compact?: boolean;
}

export function StarterEditalSelector({
  onSuccess,
  showCustomLink = true,
  compact = false,
}: StarterEditalSelectorProps) {
  const router = useRouter();
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelectTemplate = async (templateId: string) => {
    setLoadingTemplateId(templateId);
    setErrorMessage(null);

    try {
      const res = await importStarterEditalAction(templateId);

      if (res.success && res.data) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });

        setSuccessMessage(
          `Edital de "${res.data.templateTitle}" ativado! (${res.data.subjectsCount} matérias e ${res.data.topicsCount} tópicos carregados)`
        );

        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 800);
        } else {
          setTimeout(() => {
            router.refresh();
          }, 800);
        }
      } else {
        setErrorMessage(res.error || "Ocorreu um erro ao carregar o edital.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Erro de conexão ao carregar modelo de edital.");
    } finally {
      setLoadingTemplateId(null);
    }
  };

  const templatesList = Object.values(STARTER_EDITAL_TEMPLATES);

  return (
    <div className="space-y-4 w-full">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2 font-bold animate-fade-in">
          <Check size={16} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div
        className={`grid gap-3 ${
          compact
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        {templatesList.map((tpl) => {
          const isLoading = loadingTemplateId === tpl.id;

          return (
            <div
              key={tpl.id}
              className="relative group p-4 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900/90 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tpl.icon}</span>
                    <span className="text-xs font-bold text-white leading-tight">
                      {tpl.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
                    {tpl.badge}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {tpl.shortDescription}
                </p>

                {/* Resumo das Matérias */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tpl.materias.map((m, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">
                  {tpl.materias.length} matérias mapeadas
                </span>

                <button
                  type="button"
                  disabled={loadingTemplateId !== null}
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-950/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Ativando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Ativar em 1 Clique</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showCustomLink && (
        <div className="pt-2 text-center">
          <a
            href="/edital"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors font-medium"
          >
            <FileText size={13} />
            <span>Já tem outro edital em PDF ou texto? Importe aqui com IA</span>
            <ArrowRight size={13} />
          </a>
        </div>
      )}
    </div>
  );
}
