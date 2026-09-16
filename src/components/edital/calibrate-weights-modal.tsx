"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Scale,
  Sliders,
  Check,
  Loader2,
  Sparkles,
  BookOpen,
  RotateCcw,
  Equal,
} from "lucide-react";
import { bulkUpdateSubjectWeightsAction } from "@/actions/subject-actions";

export interface CalibrateSubjectItem {
  id: string;
  name: string;
  color?: string | null;
  weight?: number;
  topicsCount?: number;
}

interface CalibrateWeightsModalProps {
  isOpen: boolean;
  subjects: CalibrateSubjectItem[];
  onClose: () => void;
  onSuccess?: () => void;
}

function getRelevanceTag(weight: number) {
  if (weight >= 8) {
    return {
      label: "Crítico / Máximo",
      colorClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    };
  }
  if (weight >= 6) {
    return {
      label: "Específica / Alto",
      colorClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    };
  }
  if (weight >= 4) {
    return {
      label: "Intermediário / Padrão",
      colorClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    };
  }
  return {
    label: "Básico / Complementar",
    colorClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };
}

export function CalibrateWeightsModal({
  isOpen,
  subjects,
  onClose,
  onSuccess,
}: CalibrateWeightsModalProps) {
  const [localWeights, setLocalWeights] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inicializa os pesos com os dados recebidos das disciplinas
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      const initial: Record<string, number> = {};
      subjects.forEach((s) => {
        initial[s.id] =
          typeof s.weight === "number" && !isNaN(s.weight)
            ? Math.max(1, Math.min(10, s.weight))
            : 5.0;
      });
      setLocalWeights(initial);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [subjects, isOpen]);

  // Soma total de todos os pesos para calcular a fatia percentual
  const totalWeightSum = useMemo(() => {
    return Object.values(localWeights).reduce((acc, w) => acc + (w || 1), 0);
  }, [localWeights]);

  if (!isOpen) return null;

  const handleSliderChange = (id: string, value: number) => {
    setLocalWeights((prev) => ({
      ...prev,
      [id]: Math.max(1, Math.min(10, value)),
    }));
  };

  const handleStepChange = (id: string, delta: number) => {
    setLocalWeights((prev) => {
      const current = prev[id] ?? 5.0;
      const next = Math.max(1, Math.min(10, Math.round((current + delta) * 10) / 10));
      return {
        ...prev,
        [id]: next,
      };
    });
  };

  const handleDistributeEqually = () => {
    const updated: Record<string, number> = {};
    subjects.forEach((s) => {
      updated[s.id] = 5.0;
    });
    setLocalWeights(updated);
  };

  const handleReset = () => {
    const initial: Record<string, number> = {};
    subjects.forEach((s) => {
      initial[s.id] =
        typeof s.weight === "number" && !isNaN(s.weight) ? s.weight : 5.0;
    });
    setLocalWeights(initial);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = Object.entries(localWeights).map(([subjectId, weight]) => ({
        subjectId,
        weight,
      }));

      const res = await bulkUpdateSubjectWeightsAction(payload);

      if (!res.success) {
        setErrorMessage(res.error || "Falha ao salvar calibragem de pesos.");
        return;
      }

      setSuccessMessage("Pesos calibrados com sucesso!");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] bg-linear-to-br from-[#090d16] via-[#070b14] to-[#04060c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Glow de ambientação no topo */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* ================= 1. CABEÇALHO DO MODAL ================= */}
        <div className="relative z-10 flex items-start justify-between p-5 sm:p-6 border-b border-white/5 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Scale size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Calibragem de Pesos do Edital
                </h2>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase text-amber-300">
                  Radar Neural
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Defina a importância de cada disciplina para calibrar o Radar de Domínio e o agendamento inteligente.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* ================= 2. BARRA DE ATALHOS & PRESETS ================= */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3 bg-slate-950/60 border-b border-white/5 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDistributeEqually}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 font-semibold text-slate-300 transition-all active:scale-95 cursor-pointer"
            >
              <Equal size={13} className="text-amber-400" />
              <span>Distribuir Igualmente (5.0)</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 font-semibold text-slate-300 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Resetar</span>
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span>Matérias: <strong className="text-white">{subjects.length}</strong></span>
            <span>•</span>
            <span>Soma dos Pesos: <strong className="text-amber-400">{totalWeightSum.toFixed(1)}</strong></span>
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {errorMessage && (
          <div className="mx-5 sm:mx-6 mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 font-medium">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mx-5 sm:mx-6 mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-medium flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ================= 3. LISTA DE DISCIPLINAS COM SLIDERS ================= */}
        <div className="relative z-10 flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 divide-y divide-white/5">
          {subjects.map((subject) => {
            const currentWeight = localWeights[subject.id] ?? 5.0;
            const percentage =
              totalWeightSum > 0
                ? Math.round((currentWeight / totalWeightSum) * 100)
                : 0;
            const relevance = getRelevanceTag(currentWeight);
            const subColor = subject.color || "#6366f1";

            return (
              <div
                key={subject.id}
                className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 group/item"
              >
                {/* Lado Esquerdo: Identificação da Matéria */}
                <div className="sm:w-2/5 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: subColor }}
                    />
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate tracking-tight">
                      {subject.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md border font-mono font-bold ${relevance.colorClass}`}
                    >
                      {relevance.label}
                    </span>
                    <span className="text-slate-400 font-mono">
                      ~{percentage}% da prova
                    </span>
                  </div>
                </div>

                {/* Lado Direito: Slider e Controles Finais */}
                <div className="sm:w-3/5 flex items-center gap-3">
                  {/* Botão Menos */}
                  <button
                    type="button"
                    onClick={() => handleStepChange(subject.id, -0.5)}
                    disabled={currentWeight <= 1.0}
                    className="h-7 w-7 shrink-0 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center font-mono font-black text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    -
                  </button>

                  {/* Slider Contínuo */}
                  <div className="flex-1 space-y-1">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={currentWeight}
                      onChange={(e) =>
                        handleSliderChange(subject.id, parseFloat(e.target.value) || 5)
                      }
                      className="w-full accent-amber-500 bg-slate-900 rounded-lg h-2 cursor-pointer transition-all"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-slate-500">
                      <span>1.0</span>
                      <span>5.0</span>
                      <span>10.0</span>
                    </div>
                  </div>

                  {/* Botão Mais */}
                  <button
                    type="button"
                    onClick={() => handleStepChange(subject.id, 0.5)}
                    disabled={currentWeight >= 10.0}
                    className="h-7 w-7 shrink-0 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center font-mono font-black text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    +
                  </button>

                  {/* Valor Numérico Destaque */}
                  <div className="w-14 shrink-0 text-right">
                    <span className="font-mono text-sm font-black text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-1 rounded-xl block text-center shadow-xs">
                      {currentWeight.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= 4. RODAPÉ DE AÇÕES ================= */}
        <div className="relative z-10 flex items-center justify-between p-4 sm:p-5 bg-slate-950/80 border-t border-white/5 gap-3">
          <p className="text-[11px] text-slate-400 hidden sm:block">
            💡 As alterações serão aplicadas diretamente ao <strong>Radar de Domínio</strong> na Dashboard.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 px-5 py-2.5 text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin text-slate-950" />
                  <span>Salvando Calibragem...</span>
                </>
              ) : (
                <>
                  <Check size={14} className="text-slate-950" />
                  <span>Salvar Pesos ({subjects.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
