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

interface UseAudioFlashcardsProps {
  cards: AudioFlashcardItem[];
  deckTitle?: string;
  initialPauseDuration?: number; // em segundos
}

// Lista de prioridade estrita para vozes neurais / de alta fidelidade
const NEURAL_PRIORITY_KEYWORDS = [
  "francisca online (natural)",
  "antonio online (natural)",
  "google português do brasil",
  "microsoft francisca",
  "microsoft antonio",
  "luciana",
  "felipe",
  "brenda",
  "donato",
  "yara",
];

function formatTextForSpeech(text: string): string {
  if (!text) return "";
  return (
    text
      // Trata lacunas e marcadores comuns
      .replace(/\[\.\.\.\]/g, "lacuna")
      .replace(/[*_#`~>]/g, "")
      // Evita leitura rápida de listas numeradas (ex: "1. Princípio" -> "Item 1, Princípio")
      .replace(/(\d+)\.\s+/g, "Item $1, ")
      // Adiciona respiração natural após conectivos de transição
      .replace(
        /(Portanto|Logo|Assim|Dessa forma|Por conseguinte|Nesse sentido),?/gi,
        "$1, ",
      )
      // Transforma quebras de linha em pausas suaves
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim()
  );
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
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");

  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const currentPhaseRef = useRef(currentPhase);
  currentPhaseRef.current = currentPhase;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Inicializa Web Audio para os bipes de reflexão
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

  // Carrega e ranqueia as vozes com preferência absoluta para modelos neurais
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (!allVoices || allVoices.length === 0) return;

      // Filtra apenas vozes em português
      const ptVoices = allVoices.filter((v) => {
        const lang = v.lang.toLowerCase().replace("_", "-");
        return lang.startsWith("pt");
      });

      // Sistema de pontuação para ordenar da mais humana para a mais mecânica
      const scoreVoice = (v: SpeechSynthesisVoice): number => {
        let score = 0;
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();

        if (lang.includes("br")) score += 20;

        // Bonificação por palavras-chave de síntese neural moderna
        if (name.includes("natural")) score += 60;
        if (name.includes("neural")) score += 50;
        if (name.includes("online")) score += 35;
        if (name.includes("google")) score += 30;

        // Checa se corresponde aos modelos específicos de alta qualidade conhecidos
        for (let i = 0; i < NEURAL_PRIORITY_KEYWORDS.length; i++) {
          if (name.includes(NEURAL_PRIORITY_KEYWORDS[i])) {
            score += 40 - i;
            break;
          }
        }

        return score;
      };

      const voicePool = ptVoices.length > 0 ? ptVoices : allVoices;
      const sorted = [...voicePool].sort(
        (a, b) => scoreVoice(b) - scoreVoice(a),
      );

      setAvailableVoices(sorted);

      // Resgata preferência salva ou define a melhor voz identificada
      try {
        const saved = localStorage.getItem("synapse_audio_voice");
        if (saved && sorted.some((v) => v.voiceURI === saved)) {
          setSelectedVoiceURI(saved);
          return;
        }
      } catch {}

      if (sorted.length > 0) {
        setSelectedVoiceURI(sorted[0].voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleSetSelectedVoiceURI = useCallback((uri: string) => {
    setSelectedVoiceURI(uri);
    try {
      localStorage.setItem("synapse_audio_voice", uri);
    } catch {}
  }, []);

  // Estímulos sonoros sutis em frequência harmônica
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
      } catch {
        // Ignora caso contexto esteja em suspense
      }
    },
    [getAudioCtx],
  );

  const getActiveVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !("speechSynthesis" in window))
      return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    if (selectedVoiceURI) {
      const match = voices.find((v) => v.voiceURI === selectedVoiceURI);
      if (match) return match;
    }

    // Fallback: primeira voz pt-BR ou primeira pt
    return (
      voices.find((v) =>
        v.lang.toLowerCase().replace("_", "-").includes("pt-br"),
      ) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("pt")) ||
      null
    );
  }, [selectedVoiceURI]);

  const stopPlayback = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Síntese de voz com cadência ajustada
  const speakText = useCallback(
    (text: string, onEnd?: () => void) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        if (onEnd) onEnd();
        return;
      }

      window.speechSynthesis.cancel();

      const naturalText = formatTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(naturalText);

      // Ritmo otimizado para evitar monotonia robótica
      utterance.rate = playbackSpeed * 1.03;
      utterance.pitch = 1.0;
      utterance.lang = "pt-BR";

      const voice = getActiveVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        if (isPlayingRef.current && onEnd) {
          onEnd();
        }
      };

      utterance.onerror = (e) => {
        if (e.error === "canceled" || e.error === "interrupted") return;
        if (isPlayingRef.current && onEnd) {
          onEnd();
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [playbackSpeed, getActiveVoice],
  );

  // Ciclo sequencial do Flashcard: Pergunta -> Reflexão -> Resposta -> Próximo
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

      // Atualiza o MediaSession (para controles Bluetooth e tela de bloqueio)
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: `Card ${index + 1}: ${card.question.slice(0, 50)}...`,
            artist: deckTitle,
            album: "Synapse AI • Flashcards Ativos",
          });
        } catch {}
      }

      // 1. Enuncia a pergunta com pausa natural
      speakText(`Pergunta número ${index + 1}. ${card.question}`, () => {
        if (!isPlayingRef.current) return;

        // 2. Transição para a Pausa de Reflexão
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

            // 3. Revela a resposta e o macete
            setCurrentPhase("answer");
            playReflexBeep(528, 0.2);

            const answerPrompt = `Resposta: ${card.answer}. ${
              card.details ? `Dica de fixação: ${card.details}` : ""
            }`;

            speakText(answerPrompt, () => {
              if (!isPlayingRef.current) return;

              // 4. Intervalo de acomodação cognitiva (1.4s) antes do próximo card
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
    [cards, deckTitle, pauseDuration, speakText, playReflexBeep],
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

  // Handlers para botões de fones de ouvido Bluetooth / Media keys
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

  // Cleanup ao desmontar o componente
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
    availableVoices,
    selectedVoiceURI,
    setSelectedVoiceURI: handleSetSelectedVoiceURI,
  };
}
