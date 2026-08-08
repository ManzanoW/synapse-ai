import { useState, useEffect, useRef, useCallback } from "react";

interface UseStudyTimerOptions {
  autoStart?: boolean;
  storageKey?: string;
}

export function useStudyTimer({
  autoStart = true,
  storageKey = "study_timer_seconds",
}: UseStudyTimerOptions = {}) {
  // Inicializa com o valor salvo no sessionStorage (se existir)
  const [seconds, setSeconds] = useState<number>(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [isRunning, setIsRunning] = useState<boolean>(autoStart);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Inicia ou pausa o timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (storageKey) {
            sessionStorage.setItem(storageKey, next.toString());
          }
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, storageKey]);

  // Funções de controle
  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);
  const toggle = useCallback(() => setIsRunning((prev) => !prev), []);

  const reset = useCallback(() => {
    setSeconds(0);
    if (storageKey) {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Formatação amigável (HH:MM:SS ou MM:SS)
  const formatTime = useCallback(() => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (num: number) => String(num).padStart(2, "0");

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }, [seconds]);

  return {
    seconds,
    isRunning,
    formattedTime: formatTime(),
    pause,
    resume,
    toggle,
    reset,
  };
}
