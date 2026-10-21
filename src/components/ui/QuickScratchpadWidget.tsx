"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileEdit,
  X,
  Copy,
  Check,
  Trash2,
  Minimize2,
  Maximize2,
  Sparkles,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

const STORAGE_KEY = "synapse_quick_scratchpad";

export function QuickScratchpadWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carrega nota salva no localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setNoteContent(saved);
    }
  }, []);

  // Atalho Alt + N para abrir/fechar o rascunho
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        triggerHaptic("medium");
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
      triggerHaptic("medium");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-quick-scratchpad", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-quick-scratchpad", handleCustomOpen);
    };
  }, []);

  // Foco no textarea quando abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteContent(val);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, val);
    }
  };

  const handleCopy = () => {
    if (!noteContent) return;
    triggerHaptic("success");
    navigator.clipboard.writeText(noteContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClear = () => {
    if (!noteContent) return;
    triggerHaptic("light");
    setNoteContent("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const hasContent = noteContent.trim().length > 0;

  return (
    <div className="fixed bottom-24 left-4 sm:bottom-6 sm:left-6 z-40 print:hidden select-none">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`flex flex-col rounded-3xl border border-indigo-500/30 bg-[#070b14]/95 shadow-2xl shadow-indigo-950/60 backdrop-blur-2xl overflow-hidden font-sans transition-all duration-200 ${
              isExpanded
                ? "w-[90vw] sm:w-[480px] h-[70vh] sm:h-[480px]"
                : "w-[85vw] sm:w-[340px] h-[340px]"
            }`}
          >
            {/* Header do Rascunho */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-slate-900/70">
              <div className="flex items-center gap-2">
                <FileEdit size={16} className="text-indigo-400" />
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  Rascunho Rápido
                  <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400">
                    Alt+N
                  </kbd>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setIsExpanded((prev) => !prev);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title={isExpanded ? "Reduzir" : "Expandir"}
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setIsOpen(false);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Fechar Rascunho"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Área de Digitação */}
            <div className="flex-1 p-3 bg-transparent">
              <textarea
                ref={textareaRef}
                value={noteContent}
                onChange={handleChange}
                placeholder="Anote mnemônicos, regras, fórmulas ou dúvidas enquanto estuda..."
                className="w-full h-full resize-none bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none custom-scrollbar leading-relaxed"
              />
            </div>

            {/* Rodapé com Contador e Ações */}
            <div className="flex items-center justify-between border-t border-white/10 px-3.5 py-2 bg-slate-950/70 text-[11px] text-slate-400">
              <span>{noteContent.length} caracteres</span>

              <div className="flex items-center gap-1.5">
                {hasContent && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Limpar rascunho"
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!hasContent}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isCopied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{isCopied ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Botão Circular Flutuante Fechado */
          <motion.button
            type="button"
            onClick={() => {
              triggerHaptic("medium");
              setIsOpen(true);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Abrir bloco de rascunho rápido"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-indigo-500/30 bg-[#070b14]/90 text-indigo-300 shadow-xl shadow-indigo-950/50 backdrop-blur-md transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-600 hover:text-white cursor-pointer"
            title="Rascunho Rápido (Alt+N)"
          >
            <FileEdit size={18} />

            {/* Ponto indicador de nota existente */}
            {hasContent && (
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 border border-slate-900" />
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
