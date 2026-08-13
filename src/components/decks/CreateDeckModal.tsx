"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Sparkles, Wand2, AlertCircle } from "lucide-react";

interface CreateDeckModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const COLOR_OPTIONS = [
  {
    label: "Índigo",
    value: "bg-indigo-500",
    border: "border-indigo-500",
    glow: "shadow-indigo-500/20",
  },
  {
    label: "Púrpura",
    value: "bg-purple-500",
    border: "border-purple-500",
    glow: "shadow-purple-500/20",
  },
  {
    label: "Ciano",
    value: "bg-cyan-500",
    border: "border-cyan-500",
    glow: "shadow-cyan-500/20",
  },
  {
    label: "Esmeralda",
    value: "bg-emerald-500",
    border: "border-emerald-500",
    glow: "shadow-emerald-500/20",
  },
  {
    label: "Rosa",
    value: "bg-rose-500",
    border: "border-rose-500",
    glow: "shadow-rose-500/20",
  },
  {
    label: "Âmbar",
    value: "bg-amber-500",
    border: "border-amber-500",
    glow: "shadow-amber-500/20",
  },
];

export default function CreateDeckModal({
  onClose,
  onSuccess,
}: CreateDeckModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    color: "bg-indigo-500",
  });

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
        onSuccess();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(
          data.message || "Erro ao processar conteúdo com IA. Tente novamente.",
        );
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      setError("Falha na conexão com o servidor. Verifique sua rede.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-slate-950/90 border border-white/10 rounded-4xl p-6 md:p-8 shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] backdrop-blur-2xl overflow-hidden select-none">
        {/* Glow de Fundo Sutil */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header do Modal */}
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-wider uppercase">
              <Sparkles size={11} /> Gerador IA
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Criar Baralho com IA
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-all disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Título do Baralho
            </label>
            <input
              required
              disabled={loading}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all disabled:opacity-50"
              placeholder="Ex: Arquitetura de Software, Direito Penal..."
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {/* Campo Conteúdo Base */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Conteúdo Base para a IA
            </label>
            <textarea
              required
              disabled={loading}
              rows={4}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl p-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all resize-none disabled:opacity-50"
              placeholder="Cole aqui o resumo, lei, anotações de aula ou artigo..."
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
            />
            <p className="text-[10px] text-slate-500 mt-1.5">
              O Gemini extrairá os conceitos principais e gerará os flashcards
              em segundos.
            </p>
          </div>

          {/* Seletor de Cores */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Cor do Baralho
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((c) => {
                const isSelected = formData.color === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    disabled={loading}
                    onClick={() => setFormData({ ...formData, color: c.value })}
                    className={`w-7 h-7 rounded-full ${c.value} transition-all relative flex items-center justify-center ${
                      isSelected
                        ? `ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110 ${c.glow}`
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title={c.label}
                  />
                );
              })}
            </div>
          </div>

          {/* Botão de Envio */}
          <button
            disabled={loading || !formData.name || !formData.content}
            type="submit"
            className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin text-white" size={16} />
                <span>Processando com IA...</span>
              </>
            ) : (
              <>
                <Wand2 size={16} />
                <span>Gerar Flashcards</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
