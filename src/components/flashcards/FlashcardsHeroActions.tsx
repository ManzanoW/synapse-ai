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
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { useOfflineSync } from "@/lib/offline-sync";
import { TurboFlashcardExtractorModal } from "./TurboFlashcardExtractorModal";
import { PdfFlashcardImportModal } from "./PdfFlashcardImportModal";
import { AudioFlashcardPlayerModal } from "./AudioFlashcardPlayerModal";
import { FlashcardSpeedRunModal } from "./FlashcardSpeedRunModal";
import { AudioFlashcardItem } from "@/hooks/useAudioFlashcards";

interface FlashcardsHeroActionsProps {
  totalCards: number;
  totalDecks: number;
  dueCardsCount?: number;
  decks: Array<{ id: string; title: string }>;
  audioCards: AudioFlashcardItem[];
}

export function FlashcardsHeroActions({
  totalCards,
  totalDecks,
  dueCardsCount = 0,
  decks,
  audioCards,
}: FlashcardsHeroActionsProps) {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExtractorOpen, setIsExtractorOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isSpeedRunOpen, setIsSpeedRunOpen] = useState(false);
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();

  return (
    <>
      <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full sm:w-auto">
        {(!isOnline || pendingCount > 0) && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-[11px] text-amber-300 shadow-md">
            <div className="flex items-center gap-1.5">
              <WifiOff size={13} className="text-amber-400 shrink-0" />
              <span>
                {!isOnline ? "Modo Offline Ativo" : "Revisões em Fila"}
              </span>
            </div>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={triggerSync}
                disabled={isSyncing || !isOnline}
                className="flex items-center gap-1 font-mono text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50 cursor-pointer"
                title="Sincronizar com o servidor"
              >
                <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
                <span>{pendingCount} salvos</span>
              </button>
            )}
          </div>
        )}

        {totalCards > 0 ? (
          <Link
            href="/flashcards/study/all"
            className={`group relative inline-flex items-center justify-center gap-2.5 text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-xl transition-all duration-300 shadow-xl active:scale-95 border cursor-pointer w-full sm:w-auto ${
              dueCardsCount > 0
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 border-amber-300/40 shadow-amber-500/25 animate-pulse"
                : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-indigo-400/30 shadow-indigo-600/30"
            }`}
          >
            <Zap
              size={16}
              className={`fill-white transition-transform ${
                dueCardsCount > 0 ? "scale-110" : "group-hover:scale-110"
              }`}
            />
            <span>
              {dueCardsCount > 0
                ? `Revisar ${dueCardsCount} Cards Vencidos Hoje`
                : "Iniciar Revisão Geral"}
            </span>
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