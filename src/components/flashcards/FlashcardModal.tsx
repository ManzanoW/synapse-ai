"use client";

import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
}

export default function FlashcardModal({
  isOpen,
  onClose,
  topicId,
}: ModalProps) {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await fetch("/api/flashcards", {
      method: "POST",
      body: JSON.stringify({
        topicId,
        question: formData.get("question"),
        answer: formData.get("answer"),
        details: formData.get("details"),
      }),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">Novo Flashcard</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="question"
            placeholder="Pergunta"
            required
            className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white"
          />
          <input
            name="answer"
            placeholder="Resposta"
            required
            className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white"
          />
          <textarea
            name="details"
            placeholder="Detalhes (opcional)"
            className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white"
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all"
          >
            Salvar Card
          </button>
        </form>
      </div>
    </div>
  );
}
