"use client";

import React, { useState } from "react";
import { X, Loader2, Award, HelpCircle } from "lucide-react";

interface TopicOption {
  id: string;
  title: string;
  subjectName: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: TopicOption[];
  onSuccess?: () => void;
}

export function RegisterQuestionsModal({
  isOpen,
  onClose,
  topics,
  onSuccess,
}: ModalProps) {
  const [selectedTopic, setSelectedTopic] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState("");
  const [duration, setDuration] = useState("15");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !totalQuestions || !correctAnswers) return;

    try {
      setLoading(true);
      const res = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopic,
          totalQuestions: Number(totalQuestions),
          correctAnswers: Number(correctAnswers),
          durationMinutes: Number(duration),
        }),
      });

      if (res.ok) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Erro ao registrar bateria de questões:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
      <div className="relative w-full max-w-md rounded-3xl bg-[#090d16] border border-white/10 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <HelpCircle size={20} />
            </div>
            <h3 className="text-sm font-bold text-white">
              Registrar Questões Externas
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Tópico Estudado
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-indigo-500 outline-none"
              required
            >
              <option value="">Selecione o tópico...</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.subjectName} - {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Total de Questões
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 20"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-indigo-500 outline-none"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Nº de Acertos
              </label>
              <input
                type="number"
                min="0"
                max={totalQuestions || undefined}
                placeholder="Ex: 17"
                value={correctAnswers}
                onChange={(e) => setCorrectAnswers(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-indigo-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Tempo de Resolução (min)
            </label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Award size={16} />
            )}
            <span>Salvar Desempenho</span>
          </button>
        </form>
      </div>
    </div>
  );
}
