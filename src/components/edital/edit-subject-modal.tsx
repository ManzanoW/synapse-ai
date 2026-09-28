"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, Loader2, Save, Sparkles, Sliders } from "lucide-react";
import { updateSubjectAction } from "@/actions/subject-actions";

export interface EditSubjectData {
  id: string;
  name: string;
  color?: string | null;
  weight?: number;
}

interface EditSubjectModalProps {
  isOpen: boolean;
  subject: EditSubjectData | null;
  onClose: () => void;
  onSuccess?: () => void;
  onSubjectUpdated?: () => void;
}

const COLOR_OPTIONS = [
  { hex: "#3B82F6", label: "Azul (Dev / Exatas)" },
  { hex: "#10B981", label: "Verde (Testes / Qualidade)" },
  { hex: "#8B5CF6", label: "Roxo (Gestão / Processos)" },
  { hex: "#F59E0B", label: "Âmbar (Frontend / UX / Gerais)" },
  { hex: "#EC4899", label: "Rosa (Segurança / Redes)" },
  { hex: "#06B6D4", label: "Ciano (Dados / Cloud)" },
  { hex: "#EF4444", label: "Vermelho (Legislação / Direito)" },
  { hex: "#6366F1", label: "Índigo (Constitucional / Adm)" },
];

function getWeightBadge(weight: number) {
  if (weight >= 9) {
    return {
      label: "Crítico / Máximo",
      desc: "Bloco principal de questões da prova ou peso 3",
      colorClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    };
  }
  if (weight >= 7) {
    return {
      label: "Alto / Específica",
      desc: "Conhecimentos específicos de alta pontuação",
      colorClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    };
  }
  if (weight >= 4) {
    return {
      label: "Médio / Padrão",
      desc: "Conhecimentos gerais com pontuação intermediária",
      colorClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    };
  }
  return {
    label: "Baixo / Básico",
    desc: "Poucas questões ou peso complementar",
    colorClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };
}

export function EditSubjectModal({
  isOpen,
  subject,
  onClose,
  onSuccess,
  onSubjectUpdated,
}: EditSubjectModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [weight, setWeight] = useState(5.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subject) {
      setName(subject.name || "");
      setColor(subject.color || "#3B82F6");
      setWeight(
        typeof subject.weight === "number" && !isNaN(subject.weight)
          ? subject.weight
          : 5.0,
      );
      setError(null);
    }
  }, [subject]);

  if (!isOpen || !subject) return null;

  const badgeInfo = getWeightBadge(weight);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome da matéria é obrigatório.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await updateSubjectAction({
        subjectId: subject.id,
        name: name.trim(),
        color,
        weight: Number(weight),
      });

      if (!res.success) {
        setError(res.error || "Falha ao atualizar matéria.");
        return;
      }

      onSuccess?.();
      onSubjectUpdated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#090d16] border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-7 relative shadow-2xl space-y-6">
        {/* Glow de fundo */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: color }}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner transition-colors"
              style={{
                backgroundColor: `${color}20`,
                borderColor: `${color}40`,
                color: color,
              }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                Editar Disciplina
              </h2>
              <p className="text-xs text-slate-400">
                Calibre o peso no concurso e a identidade visual da matéria.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome da Matéria */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Nome da Disciplina
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Direito Constitucional, Banco de Dados..."
              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all font-medium"
            />
          </div>

          {/* Seletor de Cores */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Cor de Identificação
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  title={c.label}
                  className={`h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    color === c.hex
                      ? "ring-2 ring-white scale-110 shadow-lg"
                      : "opacity-60 hover:opacity-100 hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: `${c.hex}30`,
                    borderColor: c.hex,
                  }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: c.hex }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Slider de Peso no Edital (1 a 10) */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Peso no Edital / Concurso
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-indigo-400">
                  {Number(weight).toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">/ 10.0</span>
              </div>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
            />

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>1.0 (Menor peso)</span>
              <span>5.0 (Padrão)</span>
              <span>10.0 (Peso Máximo)</span>
            </div>

            {/* Badge explicativo */}
            <div className={`mt-2 p-2.5 rounded-xl border flex items-center justify-between text-xs ${badgeInfo.colorClass}`}>
              <div>
                <strong className="font-bold">{badgeInfo.label}</strong>
                <p className="text-[11px] opacity-80 mt-0.5">{badgeInfo.desc}</p>
              </div>
              <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-black/30 border border-white/10 shrink-0">
                Radar: {Math.round(weight * 10)}%
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3 justify-end pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
