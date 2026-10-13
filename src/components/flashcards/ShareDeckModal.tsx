// src/components/flashcards/ShareDeckModal.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Layers,
  Globe,
  MessageCircle,
  Send,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface ShareDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  deckTitle: string;
  totalCards: number;
}

export function ShareDeckModal({
  isOpen,
  onClose,
  deckId,
  deckTitle,
  totalCards,
}: ShareDeckModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/deck/${deckId}`
      : `/share/deck/${deckId}`;

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      triggerHaptic("medium");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `🔥 *Material de Estudo Gratuito • Synapse AI*\n\n` +
        `📚 *Baralho*: ${deckTitle}\n` +
        `⚡ *Total*: ${totalCards} Flashcards com algoritmo FSRS 4.5 e Estudo em Áudio!\n\n` +
        `Acesse gratuitamente para memorizar mais rápido no PC ou celular:\n${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleTelegram = () => {
    const text = encodeURIComponent(
      `📚 Baralho de Flashcards: "${deckTitle}" no Synapse AI`
    );
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 space-y-6 text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* TOPO DO MODAL */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Share2 size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Compartilhar Baralho
                </h3>
                <p className="text-xs text-slate-400">
                  Link público para grupos e amigos
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* PRÉVIA DO BARALHO */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0">
              <Layers size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate">
                {deckTitle}
              </h4>
              <p className="text-xs text-slate-400">
                {totalCards} cartões com suporte a FSRS 4.5
              </p>
            </div>
          </div>

          {/* CAMPO DE LINK PÚBLICO */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Link de Acesso Direto:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-300" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* BOTÕES DE COMPARTILHAMENTO SOCIAL */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Enviar para Grupos de Estudos:
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleTelegram}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/30 text-cyan-400 text-xs font-bold transition-all cursor-pointer"
              >
                <Send size={15} />
                <span>Telegram</span>
              </button>
            </div>
          </div>

          {/* INFO DE CRESCIMENTO VIRAL */}
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
            <Globe size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Qualquer pessoa poderá navegar nos flashcards interativamente. Ao
              clicar em &quot;Clonar Baralho&quot;, o material é copiado para a
              biblioteca pessoal dela!
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
