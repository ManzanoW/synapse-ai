"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface AudioFlashcardItem {
  id: string;
  question: string;
  answer: string;
  details?: string | null;
}

export type StudyPhase = "idle" | "question" | "thinking" | "answer" | "finished";

interface UseAudioFlashcardsProps {
  cards: AudioFlashcardItem[];
  deckTitle?: string;
  initialPauseDuration?: number; // em segundos (ex: 4s)
}

export function useAudioFlashcards({
  cards,
  deckTitle = "Flashcards",
  initialPauseDuration = 4,
}: UseAudioFlashcardsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<StudyPhase>("idle");
  const [pauseDuration, setPauseDuration] = useState(initialPauseDuration);
  const [countdownRemaining, setCountdownRemaining] = useState(initialPauseDuration);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const currentPhaseRef = useRef(currentPhase);
  currentPhaseRef.current = currentPhase;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Inicializa Web Audio para o estímulo sonoro de reflexão
  const getAudioCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Toca um bipe suave ou tom alfa durante o pensamento
  const playReflexBeep = useCallback((freq = 432, duration = 0.12) => {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.05);
    } catch {
      // Ignora erro em áudio suspenso
    }
  }, [getAudioCtx]);

  // Busca voz em português do navegador
  const getPortugueseVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang === "pt-BR" || v.lang === "pt_BR") ||
      voices.find((v) => v.lang.startsWith("pt")) ||
      null
    );
  }, []);

  // Limpa qualquer fala ou timer ativo
  const stopPlayback = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Fala um texto com voz e velocidade configuradas
  const speakText = useCallback(
    (text: string, onEnd?: () => void) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        if (onEnd) onEnd();
        return;
      }

      window.speechSynthesis.cancel();

      // Limpa tags markdown simples ou símbolos para fala natural
      const cleanText = text
        .replace(/\[\.\.\.\]/g, "lacuna")
        .replace(/[*_#`~]/g, "")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "pt-BR";
      utterance.rate = playbackSpeed;

      const voice = getPortugueseVoice();
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        if (isPlayingRef.current && onEnd) {
          onEnd();
        }
      };

      utterance.onerror = (e) => {
        // Se foi cancelado intencionalmente, ignora
        if (e.error === "canceled" || e.error === "interrupted") return;
        if (isPlayingRef.current && onEnd) {
          onEnd();
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [playbackSpeed, getPortugueseVoice]
  );

  // Executa o ciclo de um card: Pergunta -> Pausa -> Resposta -> Próximo
  const runCardCycle = useCallback(
    (index: number) => {
      if (!isPlayingRef.current || index >= cards.length) {
        if (index >= cards.length) {
          setCurrentPhase("finished");
          setIsPlaying(false);
          isPlayingRef.current = false;
        }
        return;
      }

      const card = cards[index];
      setCurrentIndex(index);
      setCurrentPhase("question");

      // Atualiza Metadados no MediaSession (Bluetooth / Lockscreen)
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: `Card #${index + 1}: ${card.question.slice(0, 60)}`,
            artist: deckTitle,
            album: "Synapse AI • Estudo Ativo",
          });
        } catch {
          // Ignora se não suportado
        }
      }

      // 1. Lê a pergunta
      speakText(`Pergunta número ${index + 1}. ${card.question}`, () => {
        if (!isPlayingRef.current) return;

        // 2. Inicia a Pausa Reflexiva
        setCurrentPhase("thinking");
        setCountdownRemaining(pauseDuration);
        playReflexBeep(330, 0.15); // Tom sutil de transição para o silêncio

        let remaining = pauseDuration;
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
          remaining -= 1;
          setCountdownRemaining(remaining);
          if (remaining > 0 && isPlayingRef.current) {
            playReflexBeep(440, 0.08); // Pulso sutil de contagem
          }

          if (remaining <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;

            if (!isPlayingRef.current) return;

            // 3. Lê a resposta e detalhes
            setCurrentPhase("answer");
            playReflexBeep(528, 0.2); // Solfeggio da verdade/revelação

            const answerText = `Resposta. ${card.answer}.${
              card.details ? ` Mnemônico ou dica: ${card.details}` : ""
            }`;

            speakText(answerText, () => {
              if (!isPlayingRef.current) return;

              // 4. Pausa de 1.5s antes do próximo card
              timerRef.current = setTimeout(() => {
                if (isPlayingRef.current) {
                  runCardCycle(index + 1);
                }
              }, 1500);
            });
          }
        }, 1000);
      });
    },
    [cards, deckTitle, pauseDuration, speakText, playReflexBeep]
  );

  // Iniciar reprodução
  const play = useCallback(() => {
    if (cards.length === 0) return;
    setIsPlaying(true);
    isPlayingRef.current = true;
    const startIndex = currentPhaseRef.current === "finished" ? 0 : currentIndexRef.current;
    runCardCycle(startIndex);
  }, [cards.length, runCardCycle]);

  // Pausar reprodução
  const pause = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    stopPlayback();
  }, [stopPlayback]);

  // Alternar Play/Pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Avançar para o próximo card
  const next = useCallback(() => {
    stopPlayback();
    const nextIdx = Math.min(cards.length - 1, currentIndex + 1);
    setCurrentIndex(nextIdx);
    if (isPlaying) {
      runCardCycle(nextIdx);
    }
  }, [cards.length, currentIndex, isPlaying, stopPlayback, runCardCycle]);

  // Voltar para o card anterior
  const prev = useCallback(() => {
    stopPlayback();
    const prevIdx = Math.max(0, currentIndex - 1);
    setCurrentIndex(prevIdx);
    if (isPlaying) {
      runCardCycle(prevIdx);
    }
  }, [currentIndex, isPlaying, stopPlayback, runCardCycle]);

  // Configurações do MediaSession API (controles nos fones Bluetooth)
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", () => play());
    navigator.mediaSession.setActionHandler("pause", () => pause());
    navigator.mediaSession.setActionHandler("nexttrack", () => next());
    navigator.mediaSession.setActionHandler("previoustrack", () => prev());

    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
      } catch {
        // Ignora limpeza
      }
    };
  }, [play, pause, next, prev]);

  // Limpa ao desmontar
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  return {
    isPlaying,
    currentIndex,
    currentCard: cards[currentIndex] || null,
    totalCards: cards.length,
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
  };
}