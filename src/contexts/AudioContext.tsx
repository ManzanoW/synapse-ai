"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export interface AudioContextType {
  isMuted: boolean;
  setIsMuted: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleMute: () => void;
}

const STORAGE_KEY = "synapse_audio_muted";

export const AudioContext = createContext<AudioContextType | undefined>(
  undefined,
);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMutedState] = useState<boolean>(false);

  // Carrega a preferência salva no localStorage após a montagem do componente (evita hydration mismatch no SSR)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsMutedState(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Erro ao carregar preferência de áudio do localStorage:", error);
    }
  }, []);

  const setIsMuted = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setIsMutedState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (error) {
          console.error("Erro ao salvar preferência de áudio no localStorage:", error);
        }
        return next;
      });
    },
    [],
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, [setIsMuted]);

  return (
    <AudioContext.Provider
      value={{
        isMuted,
        setIsMuted,
        toggleMute,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio deve ser usado dentro de um AudioProvider");
  }
  return context;
}

export const useAudioContext = useAudio;

