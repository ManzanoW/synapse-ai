"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  Plus,
  Layers,
  Headphones,
  Sparkles,
  FileUp,
} from "lucide-react";
import { TurboFlashcardExtractorModal } from "./TurboFlashcardExtractorModal";
import { PdfFlashcardImportModal } from "./PdfFlashcardImportModal";
import { AudioFlashcardPlayerModal } from "./AudioFlashcardPlayerModal";
import { FlashcardSpeedRunModal } from "./FlashcardSpeedRunModal";
import { AudioFlashcardItem } from "@/hooks/useAudioFlashcards";

interface FlashcardsHeroActionsProps {
  totalCards: number;
  totalDecks: number;
  decks: Array<{ id: string; title: string }>;
  audioCards: AudioFlashcardItem[];
}

export function FlashcardsHeroActions({
  totalCards,
  totalDecks,
  decks,
  audioCards,
}: FlashcardsHeroActionsProps) {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExtractorOpen, setIsExtractorOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isSpeedRunOpen, setIsSpeedRunOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full sm:w-auto">
        {totalCards > 0 ? (
          <Link
            href="/flashcards/study/all"
            className="group relative inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-600/30 active:scale-95 border border-indigo-400/30 cursor-pointer w-full sm:w-auto"
          >
            <Zap
              size={16}
              className="fill-white group-hover:scale-110 transition-transform"
            />
            <span>Iniciar Revisão Geral</span>
            <ArrowRight
              size={15}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        ) : (
          <Link
            href="/flashcards/decks?openModal=true"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer w-full sm:w-auto"
          >
            <Plus size={16} />
            <span>Criar Primeiro Baralho</span>
          </Link>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
          {/* Botão Gerador de Flashcards via PDF */}
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-950/70 via-teal-950/60 to-emerald-950/70 hover:from-emerald-900/80 hover:to-teal-900/80 text-emerald-200 border border-emerald-500/40 hover:border-emerald-400 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <FileUp size={14} className="text-emerald-400" />
            <span>Importar PDF com IA</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200">
              0 TOKENS
            </span>
          </button>

          {/* Botão Extrator Turbo por IA */}
          <button
            type="button"
            onClick={() => setIsExtractorOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-500/40 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all hover:border-indigo-400 active:scale-95 cursor-pointer shadow-sm"
          >
            <Sparkles size={14} className="text-indigo-400" />
            <span>Extrator Turbo IA</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200">
              NOVO
            </span>
          </button>

          {/* Botão Synapse Audio Hands-Free */}
          {totalCards > 0 && (
            <button
              type="button"
              onClick={() => setIsAudioOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all hover:border-slate-600 active:scale-95 cursor-pointer shadow-sm"
            >
              <Headphones size={14} className="text-indigo-400" />
              <span>Estudo em Áudio (Podcast)</span>
            </button>
          )}

          {/* Botão Speed Run Arcade (60s) */}
          {totalCards > 0 && (
            <button
              type="button"
              onClick={() => setIsSpeedRunOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 hover:from-amber-500/25 hover:to-orange-500/25 text-amber-300 border border-amber-500/30 hover:border-amber-400/60 text-xs font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Zap size={14} className="text-amber-400 fill-amber-400/40" />
              <span>Speed Run Arcade</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200">
                60s
              </span>
            </button>
          )}

          {/* Gerenciar Coleções */}
          <Link
            href="/flashcards/decks"
            className="inline-flex items-center justify-center gap-2 bg-slate-950/60 hover:bg-slate-900/80 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800/80 transition-colors w-full"
          >
            <Layers size={14} />
            <span>Gerenciar Coleções ({totalDecks})</span>
          </Link>
        </div>
      </div>

      {/* Modal Gerador de Flashcards via PDF */}
      <PdfFlashcardImportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        decks={decks}
      />

      {/* Modal Extrator Turbo de Flashcards */}
      <TurboFlashcardExtractorModal
        isOpen={isExtractorOpen}
        onClose={() => setIsExtractorOpen(false)}
        decks={decks}
      />

      {/* Modal Player de Estudo em Áudio */}
      <AudioFlashcardPlayerModal
        isOpen={isAudioOpen}
        onClose={() => setIsAudioOpen(false)}
        cards={audioCards}
        deckTitle="Revisão Rápida em Áudio"
      />

      {/* Modal Speed Run Arcade (60s) */}
      <FlashcardSpeedRunModal
        isOpen={isSpeedRunOpen}
        onClose={() => setIsSpeedRunOpen(false)}
        decks={decks}
      />
    </>
  );
}