"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Target,
  BookOpen,
  FileText,
  Loader2,
  X,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface SubjectItem {
  id: string;
  name: string;
  topics?: { id: string; title: string }[];
}

interface GenerateAIModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  banca: string;
  materia: string;
  selectedTopicId: string;
  qtdQuestoes: string;
  fonteConteudo: "banca" | "texto" | "pdf";
  dificuldade: string;
  textoBase: string;
  subjects: SubjectItem[];
  availableTopics: { id: string; title: string }[];
  onClose: () => void;
  onBancaChange: (value: string) => void;
  onMateriaChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onFonteChange: (value: "banca" | "texto" | "pdf") => void;
  onTextoBaseChange: (value: string) => void;
  onDificuldadeChange: (value: string) => void;
  onQtdQuestoesChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function GenerateAIModal({
  isOpen,
  isGenerating,
  banca,
  materia,
  selectedTopicId,
  qtdQuestoes,
  fonteConteudo,
  dificuldade,
  subjects,
  availableTopics,
  onClose,
  onBancaChange,
  onMateriaChange,
  onTopicChange,
  onFonteChange,
  onDificuldadeChange,
  onQtdQuestoesChange,
  onSubmit,
}: GenerateAIModalProps) {
  if (!isOpen) return null;

  const hasNoSubjects = subjects.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#090d16] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 custom-scrollbar">
        {/* Handle visual no celular */}
        <div className="w-full flex justify-center pt-1 pb-2 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-700/80" />
        </div>

        <button
          onClick={() => !isGenerating && onClose()}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
          disabled={isGenerating}
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl animate-pulse shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0 pr-6">
            <h3 className="text-base font-bold text-slate-200 truncate">
              Gerador Cognitivo por IA
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              Configure o escopo para simular sua prova.
            </p>
          </div>
        </div>

        {hasNoSubjects ? (
          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center space-y-4 py-8 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                Edital não configurado
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Você precisa cadastrar matérias em seu edital primeiro para
                habilitar o gerador com IA.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/edital"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/10"
              >
                <BookOpen size={13} />
                <span>Configurar Edital</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Target size={12} className="text-indigo-400" /> Banca Alvo
                </label>
                <select
                  value={banca}
                  onChange={(e) => onBancaChange(e.target.value)}
                  disabled={isGenerating}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 cursor-pointer outline-none focus:border-indigo-500/50"
                >
                  <option value="Cebraspe">Cebraspe</option>
                  <option value="FGV">FGV</option>
                  <option value="FCC">FCC</option>
                  <option value="IBAM">IBAM</option>
                  <option value="Vunesp">Vunesp</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <BookOpen size={12} className="text-indigo-400" /> Matéria
                  Principal
                </label>
                <select
                  value={materia}
                  onChange={(e) => onMateriaChange(e.target.value)}
                  disabled={isGenerating}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 cursor-pointer outline-none focus:border-indigo-500/50"
                >
                  {subjects.map((sub) => (
                    <option key={`sub-${sub.id}`} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-slate-900 pt-3">
              <label className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <FileText size={12} className="text-indigo-400" /> Tópico
                Específico (Opcional)
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => onTopicChange(e.target.value)}
                disabled={isGenerating || availableTopics.length === 0}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 cursor-pointer disabled:opacity-50 outline-none focus:border-indigo-500/50"
              >
                <option value="">
                  {availableTopics.length === 0
                    ? "Nenhum tópico encontrado nesta matéria"
                    : "Todos os Tópicos da Matéria"}
                </option>
                {availableTopics.map((top, index) => {
                  const topicKey = top.id
                    ? `top-${top.id}`
                    : `top-idx-${index}-${top.title}`;
                  return (
                    <option key={topicKey} value={top.id || top.title}>
                      {top.title}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5 border-t border-slate-900 pt-3">
              <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                Origem do Conteúdo
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl min-h-10 items-center">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => onFonteChange("banca")}
                  className={`py-2 rounded-lg font-bold text-[10px] transition-all text-center cursor-pointer ${
                    fonteConteudo === "banca"
                      ? "bg-indigo-600 text-slate-100 shadow-sm"
                      : "text-slate-400"
                  }`}
                >
                  Histórico Banca
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => onFonteChange("texto")}
                  className={`py-2 rounded-lg font-bold text-[10px] transition-all text-center cursor-pointer ${
                    fonteConteudo === "texto"
                      ? "bg-indigo-600 text-slate-100 shadow-sm"
                      : "text-slate-400"
                  }`}
                >
                  Texto / Lei
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => onFonteChange("pdf")}
                  className={`py-2 rounded-lg font-bold text-[10px] transition-all text-center cursor-pointer ${
                    fonteConteudo === "pdf"
                      ? "bg-indigo-600 text-slate-100 shadow-sm"
                      : "text-slate-400"
                  }`}
                >
                  PDF
                </button>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-slate-900 pt-3">
              <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                Dificuldade
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {["Fácil", "Média", "Difícil", "Aleatória"].map((nivel) => (
                  <button
                    key={`diff-${nivel}`}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => onDificuldadeChange(nivel)}
                    className={`py-2.5 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                      dificuldade === nivel
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    {nivel}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 border-t border-slate-900 pt-3">
              <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                Volume
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {["5", "10", "15", "20"].map((num) => (
                  <button
                    key={`qtd-${num}`}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => onQtdQuestoesChange(num)}
                    className={`py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                      qtdQuestoes === num
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    {num} Q
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-slate-100 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all shadow-lg shadow-indigo-950/40 cursor-pointer min-h-11"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Sincronizando sinapses...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Gerar Simulado Inédito</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
