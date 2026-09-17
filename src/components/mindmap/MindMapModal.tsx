"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  X,
  Loader2,
  RefreshCw,
  Share2,
  BookOpen,
} from "lucide-react";
import {
  MindMapNode,
  generateTopicMindMapAction,
} from "@/actions/mindmap-actions";
import { MindMapCanvas } from "./MindMapCanvas";

export interface MindMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  subjectName: string;
  topicId?: string;
  subjectColor?: string;
}

export function MindMapModal({
  isOpen,
  onClose,
  topicTitle,
  subjectName,
  topicId,
  subjectColor = "#8b5cf6",
}: MindMapModalProps) {
  const [data, setData] = useState<MindMapNode | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fecha com ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Carrega ou gera o mapa mental (com cache automático no banco de dados)
  const loadMindMap = async (force: boolean = false) => {
    if (!topicTitle) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await generateTopicMindMapAction({
        topicTitle,
        subjectName,
        topicId,
        forceRegenerate: force,
      });

      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || "Não foi possível estruturar o mapa mental.");
      }
    } catch (err) {
      console.error("Erro ao gerar mapa mental:", err);
      setError("Falha na comunicação com o motor neural de mapas mentais.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMindMap();
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, topicTitle, subjectName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop escuro com blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
      />

      {/* MODAL CONTAINER */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-6xl bg-[#060914] border border-violet-500/30 rounded-3xl shadow-2xl shadow-violet-950/40 flex flex-col overflow-hidden z-10 max-h-[95vh]"
      >
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-80 h-80 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-cyan-600/10 blur-[120px]" />

        {/* CABEÇALHO DO MODAL */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#090d1c]/90 backdrop-blur-md flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 ring-2 ring-violet-400/30 shrink-0">
              <Brain className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-400 bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 rounded-full">
                  {subjectName}
                </span>
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                  SVG Interativo
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate mt-0.5">
                {topicTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadMindMap(true)}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
              title="Regenerar Mapa Mental com IA"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Fechar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CORPO DO MODAL */}
        <div className="flex-1 p-3 sm:p-5 relative z-10 overflow-hidden">
          {isLoading ? (
            <div className="h-[550px] flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 animate-pulse">
                  <Brain size={32} />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles size={18} className="text-cyan-400 animate-bounce" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200">
                  Sintetizando Mapa Mental Neural...
                </h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  A IA está mapeando a doutrina, ramificações de regras, prazos e mnemônicos do tópico <strong>&ldquo;{topicTitle}&rdquo;</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-violet-300 font-mono">
                <Loader2 size={14} className="animate-spin" />
                <span>Calculando árvore vetorial hierárquica...</span>
              </div>
            </div>
          ) : error ? (
            <div className="h-[550px] flex flex-col items-center justify-center text-center p-6 space-y-3">
              <p className="text-sm text-rose-400 font-medium">{error}</p>
              <button
                type="button"
                onClick={() => loadMindMap(false)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Tentar Novamente
              </button>
            </div>
          ) : data ? (
            <MindMapCanvas rootNode={data} subjectColor={subjectColor} />
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
