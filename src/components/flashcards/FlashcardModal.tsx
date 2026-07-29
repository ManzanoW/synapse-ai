"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
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
  // Inicialização segura sem type cast direto
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

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;

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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white">
            {initialData ? "Editar Flashcard" : "Novo Flashcard"}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Frente (Pergunta / Conceito)
            </label>
            <textarea
              rows={3}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Ex: O que é o algoritmo SM-2?"
              required
              className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none resize-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Verso (Resposta / Explicação)
            </label>
            <textarea
              rows={4}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Ex: Algoritmo de repetição espaçada que calcula o intervalo ideal de revisão."
              required
              className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none resize-none transition-colors"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <span>
                {initialData ? "Salvar Alterações" : "Criar Flashcard"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
