"use client";

import { useState, useEffect, useCallback } from "react";
import {
  soundscapeEngine,
  SoundscapeType,
  SOUNDSCAPE_OPTIONS,
} from "@/lib/soundscapes";
import { useAudio } from "@/contexts/AudioContext";

export function useSoundscape() {
  const { isMuted } = useAudio();
  const [currentSoundscape, setCurrentSoundscape] =
    useState<SoundscapeType>("none");
  const [volume, setVolumeState] = useState<number>(50);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const isPlaying = !isMuted && currentSoundscape !== "none" && !isPaused;

  // Sincroniza áudio com o engine externo
  useEffect(() => {
    if (isMuted || currentSoundscape === "none" || isPaused) {
      soundscapeEngine.stop();
    } else {
      soundscapeEngine.play(currentSoundscape);
    }
  }, [isMuted, currentSoundscape, isPaused]);

  // Limpeza ao desmontar o componente
  useEffect(() => {
    return () => {
      soundscapeEngine.stop();
    };
  }, []);

  const selectSoundscape = useCallback(
    (type: SoundscapeType) => {
      if (type === "none" || isMuted) {
        soundscapeEngine.stop();
        setCurrentSoundscape("none");
        setIsPaused(false);
        return;
      }

      setCurrentSoundscape(type);
      setIsPaused(false);
    },
    [isMuted]
  );

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      soundscapeEngine.stop();
      setIsPaused(true);
    } else {
      setIsPaused(false);
      const target = currentSoundscape === "none" ? "alpha_binaural" : currentSoundscape;
      setCurrentSoundscape(target);
    }
  }, [isPlaying, currentSoundscape]);

  const setVolume = useCallback((val: number) => {
    const normalized = Math.max(0, Math.min(100, val));
    setVolumeState(normalized);
    soundscapeEngine.setVolume(normalized / 100);
  }, []);

  const playCompletionChime = useCallback(() => {
    if (!isMuted) {
      soundscapeEngine.playCompletionChime();
    }
  }, [isMuted]);

  return {
    currentSoundscape,
    options: SOUNDSCAPE_OPTIONS,
    volume,
    isPlaying,
    selectSoundscape,
    togglePlay,
    setVolume,
    playCompletionChime,
  };
}
