"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Headphones,
  Volume2,
  BrainCircuit,
  Sparkles,
  Clock,
  Gauge,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAudioFlashcards,
  AudioFlashcardItem,
} from "@/hooks/useAudioFlashcards";

interface AudioFlashcardPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: AudioFlashcardItem[];
  deckTitle?: string;
}

export function AudioFlashcardPlayerModal({
  isOpen,
  onClose,
  cards,
  deckTitle = "Flashcards",
}: AudioFlashcardPlayerModalProps) {
  const {
    isPlaying,
    currentIndex,
    currentCard,
    totalCards,
    currentPhase,
    countdownRemaining,
    pauseDuration,
    playbackSpeed,
    play,
    pause,
    togglePlay,
    next,
    prev,
    setPauseDuration,
    setPlaybackSpeed,
    availableVoices,
    selectedVoiceURI,
    setSelectedVoiceURI,
  } = useAudioFlashcards({
    cards,
    deckTitle,
    initialPauseDuration: 4,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Atalhos de teclado (Espaço = Play/Pause, Esc = Fechar)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "Escape") {
        pause();
        onClose();
      } else if (e.key === "ArrowRight") {
        next();
      } else if (e.key === "ArrowLeft") {
        prev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, togglePlay, pause, onClose, next, prev]);

  // Se fechar o modal, pausa o áudio
  const handleClose = () => {
    pause();
    onClose();
  };

  if (!mounted || !isOpen) return null;

  const progressPercent =
    totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl select-none overflow-y-auto">
      {/* Ambient Glow dinâmico dependendo da fase */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
          currentPhase === "thinking"
            ? "bg-amber-600/20"
            : currentPhase === "answer"
              ? "bg-emerald-600/20"
              : "bg-indigo-600/20"
        }`}
      />

      <div className="relative w-full max-w-2xl bg-[#060913]/95 border border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col justify-between my-auto max-h-[92vh] overflow-y-auto">
        {/* Topo do Player */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Headphones size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold tracking-widest text-indigo-400">
                  Synapse Audio
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-300 font-semibold truncate max-w-[200px]">
                  {deckTitle}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Card {currentIndex + 1} de {totalCards} ({Math.round(progressPercent)}%)
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Fechar player (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Progresso Fina */}
        <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden my-3 border border-slate-900">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Palco Central: Visualizador de Ondas & Conteúdo */}
        <div className="flex-1 flex flex-col items-center justify-center text-center my-4 space-y-6">
          {/* Equalizador de Ondas Sonoras */}
          <div className="flex items-center justify-center gap-1.5 h-12">
            {[12, 28, 44, 20, 36, 16].map((h, i) => (
              <motion.span
                key={i}
                animate={{
                  height: isPlaying ? [12, h, 8, h + 4, 12] : 8,
                  opacity: isPlaying ? 1 : 0.4,
                }}
                transition={{
                  duration: 0.8 + i * 0.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={`w-1.5 rounded-full transition-colors ${
                  currentPhase === "thinking"
                    ? "bg-amber-400"
                    : currentPhase === "answer"
                      ? "bg-emerald-400"
                      : "bg-indigo-400"
                }`}
              />
            ))}
          </div>

          {/* Badge de Fase Atual */}
          <div>
            {currentPhase === "question" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <Volume2 size={13} className="animate-pulse" />
                Lendo Pergunta...
              </span>
            )}
            {currentPhase === "thinking" && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                <BrainCircuit size={13} className="animate-spin" />
                Pausa Reflexiva ({countdownRemaining}s) - Formule sua resposta!
              </span>
            )}
            {currentPhase === "answer" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 size={13} />
                Revelando Gabarito & Macete
              </span>
            )}
            {currentPhase === "idle" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">
                Pronto para começar
              </span>
            )}
            {currentPhase === "finished" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold">
                <Sparkles size={13} />
                Revisão de Áudio Concluída!
              </span>
            )}
          </div>

          {/* Texto do Card em Foco */}
          {currentCard ? (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentCard.question}
              </h3>

              <AnimatePresence>
                {currentPhase === "answer" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm leading-relaxed"
                  >
                    <p className="font-semibold">{currentCard.answer}</p>
                    {currentCard.details && (
                      <p className="text-xs text-emerald-300/80 mt-2 italic pt-2 border-t border-emerald-500/20">
                        💡 {currentCard.details}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nenhum card selecionado.</p>
          )}
        </div>

        {/* Controles Principais de Áudio */}
        <div className="space-y-5 pt-4 border-t border-slate-800/80 shrink-0">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Card anterior (Seta esquerda)"
            >
              <SkipBack size={20} />
            </button>

            <button
              onClick={togglePlay}
              className="py-4 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer min-w-36"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              <span>{isPlaying ? "Pausar" : "Ouvir Agora"}</span>
            </button>

            <button
              onClick={next}
              disabled={currentIndex >= totalCards - 1}
              className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Próximo card (Seta direita)"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* Barra Inferior: Configurações de Voz, Velocidade & Pausa Reflexiva */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-slate-800/80">
            {/* Seletor de Voz Natural / Neural */}
            {availableVoices.length > 0 && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Volume2 size={13} className="text-emerald-400 shrink-0" />
                <span className="text-slate-400 font-semibold shrink-0">Voz:</span>
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 text-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[200px] truncate"
                  title="Selecione a voz de reprodução do navegador"
                >
                  {availableVoices.map((v) => {
                    const isNeural =
                      v.name.toLowerCase().includes("natural") ||
                      v.name.toLowerCase().includes("neural") ||
                      v.name.toLowerCase().includes("google") ||
                      v.name.toLowerCase().includes("online");
                    return (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {isNeural ? "✨ " : ""}
                        {v.name.replace(/Microsoft |Google /g, "").split(" - ")[0]}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Velocidade da Voz */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Gauge size={13} className="text-indigo-400" />
                Velocidade:
              </span>
              {[0.8, 1.0, 1.25, 1.5].map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`px-2 py-0.8 rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer ${
                    playbackSpeed === s
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Tempo de Reflexão */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Clock size={13} className="text-amber-400" />
                Pausa:
              </span>
              {[2, 3, 4, 5, 6].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setPauseDuration(sec)}
                  className={`px-2 py-0.8 rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer ${
                    pauseDuration === sec
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Dica de Fones Bluetooth */}
          <div className="text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Headphones size={13} className="text-indigo-400" />
              <span>
                Compatível com botões dos <strong>fones Bluetooth</strong> e tela bloqueada (MediaSession API).
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}