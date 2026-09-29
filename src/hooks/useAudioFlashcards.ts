"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface AudioFlashcardItem {
  id: string;
  question: string;
  answer: string;
  details?: string | null;
}

export type StudyPhase =
  "idle" | "question" | "thinking" | "answer" | "finished";

export interface NeuralVoiceOption {
  voiceURI: string;
  name: string;
  gender: "female" | "male";
  isNeural: boolean;
}

interface UseAudioFlashcardsProps {
  cards: AudioFlashcardItem[];
  deckTitle?: string;
  initialPauseDuration?: number; // em segundos
}

// Opções de vozes neurais de estúdio disponíveis via /api/tts
export const NEURAL_VOICE_OPTIONS: NeuralVoiceOption[] = [
  {
    voiceURI: "pt-BR-ThalitaNeural",
    name: "Thalita (Didática • Tutora)",
    gender: "female",
    isNeural: true,
  },
  {
    voiceURI: "pt-BR-FranciscaNeural",
    name: "Francisca (Clara • Narradora)",
    gender: "female",
    isNeural: true,
  },
  {
    voiceURI: "pt-BR-AntonioNeural",
    name: "Antônio (Firme • Concursos)",
    gender: "male",
    isNeural: true,
  },
  {
    voiceURI: "pt-BR-NicolauNeural",
    name: "Nicolau (Pausado • Professor)",
    gender: "male",
    isNeural: true,
  },
];

function formatTextForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(/\[\.\.\.\]/g, "lacuna")
    .replace(/[*_#`~>]/g, "")
    .replace(/(\d+)\.\s+/g, "$1, ")
    .replace(
      /(Portanto|Logo|Assim|Dessa forma|Por conseguinte|Nesse sentido),?/gi,
      "$1, ",
    )
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
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
  const [countdownRemaining, setCountdownRemaining] =
    useState(initialPauseDuration);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(
    "pt-BR-FranciscaNeural",
  );

  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const currentPhaseRef = useRef(currentPhase);
  currentPhaseRef.current = currentPhase;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const pendingFetchesRef = useRef<Set<string>>(new Set());

  // Inicializa Web Audio para os bipes de reflexão cognitiva
  const getAudioCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Recupera voz salva no localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("synapse_audio_voice");
      if (saved && NEURAL_VOICE_OPTIONS.some((v) => v.voiceURI === saved)) {
        setSelectedVoiceURI(saved);
      }
    } catch {}
  }, []);

  const handleSetSelectedVoiceURI = useCallback((uri: string) => {
    setSelectedVoiceURI(uri);
    try {
      localStorage.setItem("synapse_audio_voice", uri);
    } catch {}
  }, []);

  // Bipes suaves durante o intervalo reflexivo
  const playReflexBeep = useCallback(
    (freq = 432, duration = 0.12) => {
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + duration,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration + 0.05);
      } catch {}
    },
    [getAudioCtx],
  );

  // Limpa áudios e timers em execução
  const stopPlayback = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Fallback caso a API offline/indisponível
  const speakFallback = useCallback(
    (rawText: string, onEnd?: () => void) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        if (onEnd) onEnd();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        formatTextForSpeech(rawText),
      );
      utterance.lang = "pt-BR";
      utterance.rate = playbackSpeed;
      utterance.onend = () => {
        if (isPlayingRef.current && onEnd) onEnd();
      };
      utterance.onerror = () => {
        if (isPlayingRef.current && onEnd) onEnd();
      };
      window.speechSynthesis.speak(utterance);
    },
    [playbackSpeed],
  );

  // Pré-carregamento silencioso em background
  const preloadAudio = useCallback(
    async (text: string) => {
      const clean = formatTextForSpeech(text);
      if (!clean) return;

      const cacheKey = `${selectedVoiceURI}_${clean}`;
      if (
        audioCacheRef.current.has(cacheKey) ||
        pendingFetchesRef.current.has(cacheKey)
      ) {
        return;
      }

      pendingFetchesRef.current.add(cacheKey);

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: clean,
            voice: selectedVoiceURI,
          }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const audioUrl = URL.createObjectURL(blob);
          audioCacheRef.current.set(cacheKey, audioUrl);
        }
      } catch {
        // Falha silenciosa no prefetch
      } finally {
        pendingFetchesRef.current.delete(cacheKey);
      }
    },
    [selectedVoiceURI],
  );

  // Síntese principal via rota /api/tts com vozes neurais e cache instantâneo
  const speakText = useCallback(
    async (text: string, onEnd?: () => void) => {
      const clean = formatTextForSpeech(text);
      if (!clean) {
        if (onEnd) onEnd();
        return;
      }

      stopPlayback();

      try {
        const cacheKey = `${selectedVoiceURI}_${clean}`;
        let audioUrl = audioCacheRef.current.get(cacheKey);

        if (!audioUrl) {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: clean,
              voice: selectedVoiceURI,
            }),
          });

          if (!res.ok) throw new Error("Falha na rota /api/tts");

          const blob = await res.blob();
          audioUrl = URL.createObjectURL(blob);
          audioCacheRef.current.set(cacheKey, audioUrl);
        }

        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        audio.playbackRate = playbackSpeed;

        audio.onended = () => {
          currentAudioRef.current = null;
          if (isPlayingRef.current && onEnd) onEnd();
        };

        audio.onerror = () => {
          currentAudioRef.current = null;
          speakFallback(clean, onEnd);
        };

        await audio.play();
      } catch (err) {
        console.warn("Erro no TTS neural, usando fallback local:", err);
        speakFallback(clean, onEnd);
      }
    },
    [selectedVoiceURI, playbackSpeed, stopPlayback, speakFallback],
  );

  // Ciclo do Flashcard: Pergunta -> Reflexão -> Resposta -> Próximo
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

      // Monta o texto de resposta para o prefetch antecipado
      const answerPrompt = `Resposta: ${card.answer}. ${
        card.details ? `Dica de fixação: ${card.details}` : ""
      }`;

      // ⚡ PRELOAD ANTECIPADO: Baixa o áudio da resposta enquanto o aluno ainda está ouvindo a pergunta!
      preloadAudio(answerPrompt);

      // (Opcional) Também pré-carrega a pergunta do próximo card se existir
      if (index + 1 < cards.length) {
        preloadAudio(
          `Pergunta número ${index + 2}. ${cards[index + 1].question}`,
        );
      }

      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: `Card ${index + 1}: ${card.question.slice(0, 50)}...`,
            artist: deckTitle,
            album: "Synapse AI • Flashcards Neurais",
          });
        } catch {}
      }

      // 1. Enunciação da pergunta
      speakText(`Pergunta número ${index + 1}. ${card.question}`, () => {
        if (!isPlayingRef.current) return;

        // 2. Intervalo de reflexão
        setCurrentPhase("thinking");
        setCountdownRemaining(pauseDuration);
        playReflexBeep(330, 0.15);

        let remaining = pauseDuration;
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
          remaining -= 1;
          setCountdownRemaining(remaining);

          if (remaining > 0 && isPlayingRef.current) {
            playReflexBeep(440, 0.06);
          }

          if (remaining <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;

            if (!isPlayingRef.current) return;

            // 3. Revelação imediata da resposta (áudio já está em cache)
            setCurrentPhase("answer");
            playReflexBeep(528, 0.2);

            speakText(answerPrompt, () => {
              if (!isPlayingRef.current) return;

              // 4. Pausa de acomodação (1.4s) antes do próximo card
              timerRef.current = setTimeout(() => {
                if (isPlayingRef.current) {
                  runCardCycle(index + 1);
                }
              }, 1400);
            });
          }
        }, 1000);
      });
    },
    [cards, deckTitle, pauseDuration, speakText, playReflexBeep, preloadAudio],
  );

  const play = useCallback(() => {
    if (cards.length === 0) return;
    setIsPlaying(true);
    isPlayingRef.current = true;
    const startIndex =
      currentPhaseRef.current === "finished" ? 0 : currentIndexRef.current;
    runCardCycle(startIndex);
  }, [cards.length, runCardCycle]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    stopPlayback();
  }, [stopPlayback]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const next = useCallback(() => {
    stopPlayback();
    const nextIdx = Math.min(cards.length - 1, currentIndex + 1);
    setCurrentIndex(nextIdx);
    if (isPlaying) {
      runCardCycle(nextIdx);
    }
  }, [cards.length, currentIndex, isPlaying, stopPlayback, runCardCycle]);

  const prev = useCallback(() => {
    stopPlayback();
    const prevIdx = Math.max(0, currentIndex - 1);
    setCurrentIndex(prevIdx);
    if (isPlaying) {
      runCardCycle(prevIdx);
    }
  }, [currentIndex, isPlaying, stopPlayback, runCardCycle]);

  // Controles de hardware / Bluetooth
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;

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
      } catch {}
    };
  }, [play, pause, next, prev]);

  // Limpeza de recursos
  useEffect(() => {
    return () => {
      stopPlayback();
      audioCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      audioCacheRef.current.clear();
      pendingFetchesRef.current.clear();
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
    availableVoices: NEURAL_VOICE_OPTIONS,
    selectedVoiceURI,
    setSelectedVoiceURI: handleSetSelectedVoiceURI,
  };
}
