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
  AlertTriangle,
} from "lucide-react";
import {
  MindMapNode,
  generateTopicMindMapAction,
} from "@/actions/mindmap-actions";
import { getAiQuotaStatusAction } from "@/actions/quota-actions";
import { RewardedAdModal } from "@/components/quota/RewardedAdModal";
import { Lock, Crown, Film } from "lucide-react";
import Link from "next/link";
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
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [showAdModal, setShowAdModal] = useState<boolean>(false);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState<boolean>(false);

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
    setIsQuotaExceeded(false);

    try {
      const res = await generateTopicMindMapAction({
        topicTitle,
        subjectName,
        topicId,
        forceRegenerate: force,
      });

      if (res.isQuotaExceeded) {
        setIsQuotaExceeded(true);
        setError(res.error || "Limite de mapas mentais atingido.");
        return;
      }

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
      getAiQuotaStatusAction().then((res) => {
        if (res.success && res.data) {
          setIsPro(res.data.isUnlimited);
        }
      });
      loadMindMap();
    } else {
      setData(null);
      setError(null);
      setIsQuotaExceeded(false);
    }
  }, [isOpen, topicTitle, subjectName]);

  const handleRewardClaimed = () => {
    setShowAdModal(false);
    setIsQuotaExceeded(false);
    loadMindMap(true);
  };

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
              onClick={() => setIsRegenerateConfirmOpen(true)}
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
                  A IA está mapeando a doutrina, ramificações de regras, prazos e macetes do tópico <strong>&ldquo;{topicTitle}&rdquo;</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-violet-300 font-mono">
                <Loader2 size={14} className="animate-spin" />
                <span>Calculando árvore vetorial hierárquica...</span>
              </div>
            </div>
          ) : isQuotaExceeded ? (
            <div className="h-[550px] flex flex-col items-center justify-center text-center p-6 space-y-5 animate-in fade-in duration-200">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
                  <Lock size={30} />
                </div>
                <div className="absolute -top-1 -right-1 p-1 rounded-lg bg-amber-500 text-slate-950 font-bold">
                  <Crown size={12} />
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Limite Diário Atingido (1/1)
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Você atingiu o limite gratuito de Mapas Mentais com IA
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Mapas mentais neurais gerados por IA exigem alta computação para sintetizar a doutrina e criar a árvore vetorial. Assista a um anúncio em vídeo para desbloquear um mapa bônus ou faça upgrade para o Synapse Pro.
                </p>
              </div>

              <div className="w-full max-w-sm space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdModal(true)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer group"
                >
                  <Film size={16} className="text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>Assistir Vídeo Curto (+1 Mapa Mental Bônus)</span>
                </button>

                <Link
                  href="/pricing"
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Crown size={15} />
                  <span>Desbloquear Mapas Ilimitados com Synapse Pro</span>
                </Link>
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
            <MindMapCanvas
              rootNode={data}
              subjectColor={subjectColor}
              isPro={isPro}
              topicTitle={topicTitle}
              subjectName={subjectName}
            />
          ) : null}
        </div>

        {/* MODAL DE CONFIRMAÇÃO PARA REGENERAR COM IA */}
        <AnimatePresence>
          {isRegenerateConfirmOpen && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-violet-500/30 rounded-3xl w-full max-w-md shadow-2xl p-5 sm:p-6 flex flex-col gap-4 text-center"
              >
                <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    Regenerar Mapa Mental com IA?
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    O mapa mental atual salvo para <strong>&ldquo;{topicTitle}&rdquo;</strong> será substituído por uma nova estrutura gerada pelo Gemini.
                  </p>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-3 text-left text-xs text-slate-300 border border-white/5 flex flex-col gap-1">
                  <div className="text-[10px] font-mono text-violet-400 uppercase font-bold">
                    {subjectName}
                  </div>
                  <div className="font-semibold text-white truncate">{topicTitle}</div>
                  <div className="text-[11px] text-amber-300/90 font-mono mt-1">
                    ⚡ Esta ação consumirá cota de IA para estruturar um novo mapa.
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsRegenerateConfirmOpen(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegenerateConfirmOpen(false);
                      loadMindMap(true);
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-950/60 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={13} />
                    <span>Sim, Regenerar</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      <RewardedAdModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        onRewardClaimed={handleRewardClaimed}
        feature="MINDMAP"
      />
    </div>
  );
}
