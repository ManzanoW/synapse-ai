"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenTool,
  Trash2,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface QuestionScratchpadProps {
  storageKey: string;
  isOpen: boolean;
  onClose: () => void;
  onNotesChange?: (hasNotes: boolean) => void;
}

export function QuestionScratchpad({
  storageKey,
  isOpen,
  onClose,
  onNotesChange,
}: QuestionScratchpadProps) {
  const [note, setNote] = useState<string>("");
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carrega nota salva no localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;
    try {
      const saved = localStorage.getItem(`synapse_scratchpad_${storageKey}`);
      if (saved) {
        setNote(saved);
        onNotesChange?.(saved.trim().length > 0);
      } else {
        setNote("");
        onNotesChange?.(false);
      }
    } catch {
      // Ignora erro de acesso ao localStorage (ex: navegação anônima restrita)
    }
  }, [storageKey, onNotesChange]);

  // Foco automático ao abrir
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Salva no localStorage com debounce
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNote(val);
    onNotesChange?.(val.trim().length > 0);

    try {
      if (val.trim()) {
        localStorage.setItem(`synapse_scratchpad_${storageKey}`, val);
      } else {
        localStorage.removeItem(`synapse_scratchpad_${storageKey}`);
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1200);
    } catch {
      // fallback
    }
  };

  const handleClear = () => {
    setNote("");
    onNotesChange?.(false);
    try {
      localStorage.removeItem(`synapse_scratchpad_${storageKey}`);
    } catch {
      // fallback
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, scale: 0.98 }}
        animate={{ opacity: 1, height: "auto", scale: 1 }}
        exit={{ opacity: 0, height: 0, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="my-3 overflow-hidden rounded-xl border border-indigo-500/30 bg-[#080c18]/95 shadow-xl shadow-indigo-950/20 backdrop-blur-md"
      >
        {/* CABEÇALHO DO RASCUNHO */}
        <div className="flex items-center justify-between border-b border-indigo-500/20 bg-indigo-950/30 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <PenTool size={13} className="text-indigo-400" />
            <span>Lousa de Rascunho da Questão</span>
            {isSaved && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium animate-pulse">
                <Check size={11} /> Salvo
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {note.trim().length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Limpar rascunho desta questão"
              >
                <Trash2 size={12} />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              title={isExpanded ? "Reduzir" : "Expandir"}
            >
              {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Fechar rascunho"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* CORPO DO RASCUNHO */}
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={note}
            onChange={handleTextChange}
            placeholder="Rascunho de prova real: anote cálculos, prazos da lei, esquemas rápidos ou elimine hipóteses... (Salvo automaticamente)"
            rows={isExpanded ? 8 : 4}
            className="w-full resize-y rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5 font-mono text-xs sm:text-[13px] leading-relaxed text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:bg-slate-950/90 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />

          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>💡 Rascunho exclusivo desta questão</span>
            <span>{note.length} caracteres</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
