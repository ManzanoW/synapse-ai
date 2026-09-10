"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, Calendar, Loader2, CheckCircle2 } from "lucide-react";

interface ProfileTargetFormProps {
  initialTargetDate?: Date | null;
}

export default function ProfileTargetForm({
  initialTargetDate,
}: ProfileTargetFormProps) {
  const router = useRouter();

  // Converte a data do banco (Date) para o formato YYYY-MM-DD aceito pelo <input type="date" />
  const formatDateForInput = (date?: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  const [targetDate, setTargetDate] = useState<string>(
    formatDateForInput(initialTargetDate),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSaveObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSuccess(false);

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetExamDate: targetDate ? targetDate : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar a data do objetivo.");
      }

      setSuccess(true);
      // Revalida a página atual e componentes conectados
      router.refresh();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Erro na atualização:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#090d16] border border-slate-800/60 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 border-b border-slate-800/60 pb-3">
        <Target size={18} className="text-indigo-400" />
        <h2 className="text-base font-bold text-slate-100">
          Objetivo da Jornada
        </h2>
      </div>

      <form onSubmit={handleSaveObjective} className="space-y-4">
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Data da Prova Alvo
          </label>
          <div className="relative">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-200 font-medium font-mono focus:outline-none focus:border-indigo-500/80 transition-colors"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Usado para calcular a contagem regressiva inteligente no seu
            Dashboard.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md active:scale-95"
        >
          {isSaving ? (
            <>
              <Loader2 size={14} className="animate-spin text-indigo-200" />
              <span>Atualizando...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-300" />
              <span>Objetivo Atualizado!</span>
            </>
          ) : (
            <span>Salvar Data Alvo</span>
          )}
        </button>
      </form>
    </div>
  );
}
