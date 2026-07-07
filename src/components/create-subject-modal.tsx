'use client';

import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet') => void;
}

export default function CreateSubjectModal({ isOpen, onClose, onCreate }: CreateSubjectModalProps) {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState<'indigo' | 'emerald' | 'amber' | 'rose' | 'violet'>('indigo');

  if (!isOpen) return null;

  const colors = [
    { id: 'indigo', bg: 'bg-indigo-500', border: 'border-indigo-400' },
    { id: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-400' },
    { id: 'amber', bg: 'bg-amber-500', border: 'border-amber-400' },
    { id: 'rose', bg: 'bg-rose-500', border: 'border-rose-400' },
    { id: 'violet', bg: 'bg-violet-500', border: 'border-violet-400' },
  ] as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onCreate(title, selectedColor); 
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop escuro com desfoque de fundo */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Caixa do Modal */}
      <div className="bg-[#090d16] border border-slate-900 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Botão de fechar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-900/60"
        >
          <X size={18} />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/10">
            <FolderPlus size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-200 text-base">Nova Matéria</h2>
            <p className="text-[11px] text-slate-500">Adicione uma nova disciplina ao seu painel de estudos</p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome da Matéria</label>
            <input 
              type="text"
              placeholder="Ex: Direito Constitucional, Álgebra Linear..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              autoFocus
            />
          </div>

          {/* Seletor de Cores */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Identidade Visual (Cor)</label>
            <div className="flex gap-3">
              {colors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setSelectedColor(color.id)}
                  className={`w-7 h-7 rounded-full ${color.bg} transition-all duration-200 relative ${
                    selectedColor === color.id 
                      ? 'scale-110 ring-4 ring-slate-950' 
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title={color.id}
                />
              ))}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-transparent hover:bg-slate-900 border border-slate-900 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white py-2 rounded-xl text-xs font-medium transition-colors shadow-lg shadow-indigo-600/10"
            >
              Criar Disciplina
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}