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
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Sincroniza com mute global
  useEffect(() => {
    if (isMuted) {
      soundscapeEngine.stop();
      setIsPlaying(false);
    } else if (currentSoundscape !== "none") {
      soundscapeEngine.play(currentSoundscape);
      setIsPlaying(true);
    }
  }, [isMuted, currentSoundscape]);

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
        setIsPlaying(false);
        return;
      }

      setCurrentSoundscape(type);
      soundscapeEngine.play(type);
      setIsPlaying(true);
    },
    [isMuted]
  );

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      soundscapeEngine.stop();
      setIsPlaying(false);
    } else {
      const target = currentSoundscape === "none" ? "alpha_binaural" : currentSoundscape;
      setCurrentSoundscape(target);
      soundscapeEngine.play(target);
      setIsPlaying(true);
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
