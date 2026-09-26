// src/components/flashcards/AudioFlashcardPlayer.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Headphones,
  Sparkles,
  Volume2,
  Clock,
  RotateCcw,
  Zap,
} from "lucide-react";
import { useSound } from "@/hooks/useSound";
import { triggerHaptic } from "@/lib/sensory/haptics";

export interface AudioFlashcardItem {
  id: string;
  front?: string;
  back?: string;
  question?: string;
  answer?: string;
  details?: string | null;
}

interface AudioFlashcardPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  cards: AudioFlashcardItem[];
  deckTitle?: string;
  initialIndex?: number;
}

export function AudioFlashcardPlayer({
  isOpen,
  onClose,
  cards,
  deckTitle = "Flashcards FSRS",
  initialIndex = 0,
}: AudioFlashcardPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<"front" | "thinking" | "back" | "paused">("paused");
  const [thinkingTime, setThinkingTime] = useState(5); // 3s, 5s ou 8s
  const [playbackSpeed, setPlaybackSpeed] = useState(1.1); // 0.9x, 1.1x, 1.3x
  const [countdown, setCountdown] = useState(5);

  const { playChime, playClick, playFlip } = useSound();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);

  const currentCard = cards[currentIndex];

  const getFrontText = useCallback((card?: AudioFlashcardItem) => {
    if (!card) return "";
    return card.front || card.question || "";
  }, []);

  const getBackText = useCallback((card?: AudioFlashcardItem) => {
    if (!card) return "";
    const base = card.back || card.answer || "";
    const det = card.details ? ` Detalhe importante: ${card.details}` : "";
    return `${base}.${det}`;
  }, []);

  const stopAllSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // MediaSession API para fones bluetooth
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    if (isOpen && currentCard) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: getFrontText(currentCard).slice(0, 50),
        artist: "Synapse AI • Estudo Hands-Free",
        album: deckTitle,
      });

      navigator.mediaSession.setActionHandler("play", () => {
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        setIsPlaying(false);
        stopAllSpeech();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        handleNextCard();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        handlePrevCard();
      });
    }

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
      }
    };
  }, [isOpen, currentIndex, currentCard, deckTitle, getFrontText, stopAllSpeech]);

  // Função para falar um texto via Web Speech API
  const speakText = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          resolve();
          return;
        }

        stopAllSpeech();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "pt-BR";
        utterance.rate = playbackSpeed;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
      });
    },
    [playbackSpeed, stopAllSpeech]
  );

  // Ciclo principal de reprodução de um card
  const runCardCycle = useCallback(
    async (cardIndex: number) => {
      if (cardIndex >= cards.length) {
        setIsPlaying(false);
        setPhase("paused");
        playChime();
        return;
      }

      const card = cards[cardIndex];
      const front = getFrontText(card);
      const back = getBackText(card);

      // 1. Fala a frente / pergunta
      setPhase("front");
      await speakText(`Card ${cardIndex + 1}: ${front}`);
      if (isCancelledRef.current) return;

      // 2. Fase de reflexão mental
      setPhase("thinking");
      setCountdown(thinkingTime);

      for (let sec = thinkingTime; sec > 0; sec--) {
        setCountdown(sec);
        await new Promise((res) => {
          timerRef.current = setTimeout(res, 1000);
        });
        if (isCancelledRef.current) return;
      }

      // 3. Toca som de revelação e fala a resposta
      playFlip();
      triggerHaptic("medium");
      setPhase("back");
      await speakText(`Resposta: ${back}`);
      if (isCancelledRef.current) return;

      // 4. Pausa de 2 segundos antes do próximo
      await new Promise((res) => {
        timerRef.current = setTimeout(res, 2000);
      });
      if (isCancelledRef.current) return;

      // 5. Próximo card
      if (cardIndex + 1 < cards.length) {
        setCurrentIndex(cardIndex + 1);
      } else {
        setIsPlaying(false);
        setPhase("paused");
        playChime();
      }
    },
    [cards, getFrontText, getBackText, speakText, thinkingTime, playFlip, playChime]
  );

  // Efeito que reage ao estado de reprodução
  useEffect(() => {
    if (!isOpen) {
      stopAllSpeech();
      setIsPlaying(false);
      return;
    }

    if (isPlaying) {
      isCancelledRef.current = false;
      runCardCycle(currentIndex);
    } else {
      isCancelledRef.current = true;
      stopAllSpeech();
      setPhase("paused");
    }

    return () => {
      isCancelledRef.current = true;
      stopAllSpeech();
    };
  }, [isPlaying, currentIndex, isOpen, runCardCycle, stopAllSpeech]);

  const handleNextCard = () => {
    playClick();
    triggerHaptic("light");
    stopAllSpeech();
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevCard = () => {
    playClick();
    triggerHaptic("light");
    stopAllSpeech();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    stopAllSpeech();
    setIsPlaying(false);
    onClose();
  };

  if (!isOpen || cards.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/70 dark:bg-black/85 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#07090e] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden z-10 flex flex-col gap-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Luz Ambient Neon */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-cyan-500/15 blur-3xl" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Headphones size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Modo Estudo Hands-Free</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Fones BT
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {deckTitle} • Card {currentIndex + 1} de {cards.length}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Visualizador de Ondas Sonoras Neon */}
          <div className="relative z-10 py-4 flex flex-col items-center justify-center gap-3 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-3xl p-5">
            {/* Equalizador animado */}
            <div className="flex items-center gap-1.5 h-12">
              {[40, 75, 50, 95, 60, 85, 45, 100, 65, 80, 55, 90, 70, 45].map((h, i) => (
                <motion.div
                  key={`wave-${i}`}
                  animate={{
                    height: isPlaying ? [12, h * 0.45, 12] : 8,
                    opacity: isPlaying ? [0.6, 1, 0.6] : 0.3,
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8 + (i % 5) * 0.15,
                    ease: "easeInOut",
                  }}
                  className={`w-1.5 rounded-full ${
                    phase === "thinking"
                      ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                      : phase === "back"
                      ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                      : "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  }`}
                />
              ))}
            </div>

            {/* Status da Fase */}
            <div className="text-center space-y-1">
              <span
                className={`text-xs font-black uppercase tracking-wider ${
                  phase === "front"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : phase === "thinking"
                    ? "text-amber-600 dark:text-amber-400 animate-pulse"
                    : phase === "back"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400"
                }`}
              >
                {phase === "front" && "🔊 Lendo Pergunta..."}
                {phase === "thinking" && `🧠 Pense na resposta (${countdown}s)...`}
                {phase === "back" && "✅ Revelando Gabarito..."}
                {phase === "paused" && "⏸️ Pausado"}
              </span>
            </div>

            {/* Conteúdo Atual do Card */}
            <div className="text-center max-w-sm mt-2">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-3">
                {getFrontText(currentCard)}
              </p>
              {phase === "back" && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-emerald-600 dark:text-emerald-300 font-semibold mt-2 line-clamp-3"
                >
                  {getBackText(currentCard)}
                </motion.p>
              )}
            </div>
          </div>

          {/* Configurações Rápidas (Tempo de Reflexão e Velocidade) */}
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                <Clock size={12} /> Pausa para Pensar
              </span>
              <div className="flex items-center gap-1">
                {[3, 5, 8].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setThinkingTime(sec);
                      playClick();
                    }}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      thinkingTime === sec
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                <Zap size={12} /> Velocidade da Voz
              </span>
              <div className="flex items-center gap-1">
                {[1.0, 1.2, 1.4].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => {
                      setPlaybackSpeed(spd);
                      playClick();
                    }}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      playbackSpeed === spd
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Controles de Reprodução Principal */}
          <div className="flex items-center justify-center gap-4 relative z-10 pt-2 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={handlePrevCard}
              disabled={currentIndex === 0}
              className="p-3 rounded-2xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Card anterior"
            >
              <SkipBack size={20} />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("medium");
                setIsPlaying((prev) => !prev);
              }}
              className="p-5 rounded-3xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
              title={isPlaying ? "Pausar estudo" : "Iniciar estudo hands-free"}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="translate-x-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleNextCard}
              disabled={currentIndex + 1 >= cards.length}
              className="p-3 rounded-2xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Próximo card"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
