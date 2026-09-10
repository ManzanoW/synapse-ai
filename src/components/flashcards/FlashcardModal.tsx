"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Loader2,
  Sparkles,
  Eye,
  Edit3,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { Flashcard } from "@/types";

interface FlashcardModalProps {
  isOpen?: boolean;
  deckId: string;
  initialData?: Flashcard | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FlashcardModal({
  isOpen = true,
  deckId,
  initialData,
  onClose,
  onSuccess,
}: FlashcardModalProps) {
  // Inicialização segura
  const [front, setFront] = useState(() => {
    if (!initialData) return "";
    const raw = initialData as unknown as Record<string, string | undefined>;
    return raw.front || initialData.question || "";
  });

  const [back, setBack] = useState(() => {
    if (!initialData) return "";
    const raw = initialData as unknown as Record<string, string | undefined>;
    return raw.back || initialData.answer || "";
  });

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [submitting, setSubmitting] = useState(false);

  // Submissão do formulário
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!front.trim() || !back.trim() || submitting) return;

      setSubmitting(true);
      try {
        const isEditing = !!initialData?.id;
        const url = isEditing
          ? `/api/flashcards/${initialData.id}`
          : `/api/flashcards`;

        const method = isEditing ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deckId,
            front,
            back,
            question: front,
            answer: back,
          }),
        });

        if (!res.ok) throw new Error("Erro ao salvar flashcard");

        if (onSuccess) onSuccess();
        onClose();
      } catch (err) {
        console.error("Erro ao salvar flashcard:", err);
        alert("Não foi possível salvar o flashcard. Tente novamente.");
      } finally {
        setSubmitting(false);
      }
    },
    [front, back, submitting, initialData, deckId, onSuccess, onClose],
  );

  // Atalhos de teclado: Esc para fechar, Ctrl/Cmd + Enter para enviar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleSubmit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl relative">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {initialData ? "Editar Flashcard" : "Novo Flashcard"}
              </h2>
              <p className="text-xs text-slate-400">
                {initialData
                  ? "Atualize os termos deste card."
                  : "Adicione uma nova pergunta e resposta."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor Editar / Preview */}
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === "edit"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Edit3 size={13} /> Editar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === "preview"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye size={13} /> Preview
              </button>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 relative z-10">
          {activeTab === "edit" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1 text-indigo-400">
                    <HelpCircle size={13} /> Frente (Pergunta / Conceito)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Obrigatório
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Ex: O que é Coesão e Acoplamento em Arquitetura de Software?"
                  required
                  className="w-full bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none resize-none transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 size={13} /> Verso (Resposta / Explicação)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Obrigatório
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Ex: Coesão mede o grau de relação funcional das responsabilidades de um módulo. Acoplamento mede o nível de dependência entre diferentes módulos."
                  required
                  className="w-full bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none resize-none transition-all shadow-inner"
                />
              </div>

              {/* Rodapé do Form */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 hidden sm:inline-block">
                  Pressione{" "}
                  <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
                    Ctrl
                  </kbd>{" "}
                  +{" "}
                  <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
                    Enter
                  </kbd>{" "}
                  para salvar
                </span>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !front.trim() || !back.trim()}
                    className="flex items-center justify-center gap-2 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    <span>
                      {initialData ? "Salvar Alterações" : "Criar Flashcard"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Modo Preview */
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                    Frente / Pergunta
                  </span>
                  <p className="text-sm font-medium text-slate-100 mt-2 leading-relaxed">
                    {front || (
                      <span className="italic text-slate-600">
                        Escreva uma pergunta para visualizar...
                      </span>
                    )}
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-4">
                  <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    Verso / Resposta
                  </span>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {back || (
                      <span className="italic text-slate-600">
                        Escreva uma resposta para visualizar...
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className="text-xs text-indigo-400 hover:underline font-medium"
                >
                  Voltar para edição
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
