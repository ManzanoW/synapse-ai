"use client";

import React, { useState } from "react";
import { X, FilePlus2, Loader2 } from "lucide-react";

export interface SubjectOption {
  id: string;
  name: string;
}

interface NewContentModalProps {
  isOpen: boolean;
  subjects: SubjectOption[];
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    subjectName: string;
    weight: string;
  }) => Promise<void> | void;
}

export function NewContentModal({
  isOpen,
  subjects,
  onClose,
  onSubmit,
}: NewContentModalProps) {
  const [title, setTitle] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [isCreatingNewSubject, setIsCreatingNewSubject] = useState(false);
  const [weight, setWeight] = useState("5/10");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = isCreatingNewSubject
      ? customSubject.trim()
      : selectedSubject;

    if (!title.trim() || !finalSubject) return;

    try {
      setLoading(true);
      await onSubmit({
        title: title.trim(),
        subjectName: finalSubject,
        weight,
      });

      // Reset
      setTitle("");
      setSelectedSubject("");
      setCustomSubject("");
      setIsCreatingNewSubject(false);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#090d16] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-900"
        >
          <X size={18} />
        </button>

        {/* Cabeçalho */}
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FilePlus2 size={18} className="text-indigo-400" />
            Adicionar Novo Conteúdo
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Insira as informações do edital para indexar no Planner.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Tópico */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">
              Nome do Tópico / Conteúdo:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Teoria da Enfermagem, Crase, Equações..."
              className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
              autoFocus
            />
          </div>

          {/* Select de Matéria Relacionada */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-400">
                Matéria Relacionada:
              </label>
              {isCreatingNewSubject && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNewSubject(false)}
                  className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                >
                  Usar existente
                </button>
              )}
            </div>

            {!isCreatingNewSubject ? (
              <select
                value={selectedSubject}
                onChange={(e) => {
                  if (e.target.value === "__NEW__") {
                    setIsCreatingNewSubject(true);
                    setSelectedSubject("");
                  } else {
                    setSelectedSubject(e.target.value);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
              >
                <option value="" disabled>
                  Selecione uma matéria...
                </option>
                {subjects.map((sub) => (
                  <option key={sub.id || sub.name} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
                <option
                  value="__NEW__"
                  className="text-indigo-400 font-bold bg-slate-900"
                >
                  ➕ Criar Nova Matéria...
                </option>
              </select>
            ) : (
              <input
                type="text"
                required
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Digite o nome da nova matéria..."
                className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
            )}
          </div>

          {/* Relevância */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">
              Relevância / Peso no Edital:
            </label>
            <select
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 cursor-pointer font-medium"
            >
              <option value="1/10">Peso 1.0 - Baixo / Poucas Questões</option>
              <option value="2/10">Peso 2.0 - Baixo</option>
              <option value="3/10">Peso 3.0 - Regular</option>
              <option value="4/10">Peso 4.0 - Regular</option>
              <option value="5/10">Peso 5.0 - Médio (Padrão)</option>
              <option value="6/10">Peso 6.0 - Médio-Alto</option>
              <option value="7/10">Peso 7.0 - Alto</option>
              <option value="8/10">Peso 8.0 - Muito Alto</option>
              <option value="9/10">Peso 9.0 - Crítico / Conhecimentos Específicos</option>
              <option value="10/10">Peso 10.0 - Máximo / Decisivo</option>
            </select>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !title.trim() ||
                (!selectedSubject && !customSubject.trim())
              }
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              <span>Salvar Conteúdo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
