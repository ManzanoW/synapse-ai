"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface CreateDeckModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDeckModal({
  onClose,
  onSuccess,
}: CreateDeckModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    color: "bg-indigo-500",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          content: formData.content,
          color: formData.color,
        }),
      });

      if (response.ok) {
        onSuccess(); // Fecha o modal e atualiza a listagem na página pai
      } else {
        console.error("Falha ao criar deck");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#090d16] border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Criar Novo Deck</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Título do Deck
            </label>
            <input
              required
              className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Ex: Direito Constitucional"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Conteúdo Base
            </label>
            <textarea
              required
              rows={5}
              className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Cole aqui o texto ou lei para gerar os flashcards..."
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Gerar e Salvar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
