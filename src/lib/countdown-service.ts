// src/lib/countdown-service.ts
"use client";

import { useState, useEffect } from "react";

export interface MidnightCountdown {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  formatted: string; // Ex: "08h 24m 12s"
  formattedDigital: string; // Ex: "08:24:12"
}

/**
 * Calcula os segundos e horas restantes até a próxima meia-noite (00:00:00 BRT)
 * no fuso horário oficial de Brasília (America/Sao_Paulo).
 */
export function getTimeUntilMidnightBRT(referenceDate = new Date()): MidnightCountdown {
  try {
    const brtFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour12: false,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });

    const parts = brtFormatter.formatToParts(referenceDate);
    const partMap: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== "literal") {
        partMap[part.type] = parseInt(part.value, 10);
      }
    }

    const hour = partMap.hour === 24 ? 0 : (partMap.hour ?? 0);
    const minute = partMap.minute ?? 0;
    const second = partMap.second ?? 0;

    const secondsPassedToday = hour * 3600 + minute * 60 + second;
    const SECONDS_IN_DAY = 86400;
    const totalSeconds = (SECONDS_IN_DAY - secondsPassedToday) % SECONDS_IN_DAY;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, "0");
    const formatted = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    const formattedDigital = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return {
      hours,
      minutes,
      seconds,
      totalSeconds,
      formatted,
      formattedDigital,
    };
  } catch (err) {
    // Fallback em caso de suporte incompleto a Intl em ambientes de teste
    const now = referenceDate;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diffSecs = Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
    const hours = Math.floor(diffSecs / 3600);
    const minutes = Math.floor((diffSecs % 3600) / 60);
    const seconds = diffSecs % 60;
    const pad = (n: number) => String(n).padStart(2, "0");

    return {
      hours,
      minutes,
      seconds,
      totalSeconds: diffSecs,
      formatted: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
      formattedDigital: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    };
  }
}

/**
 * Hook React que atualiza a contagem regressiva a cada segundo
 */
export function useMidnightCountdown(refreshIntervalMs = 1000): MidnightCountdown {
  const [countdown, setCountdown] = useState<MidnightCountdown>(() =>
    getTimeUntilMidnightBRT()
  );

  useEffect(() => {
    // Atualização imediata
    setCountdown(getTimeUntilMidnightBRT());

    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnightBRT());
    }, refreshIntervalMs);

    return () => clearInterval(timer);
  }, [refreshIntervalMs]);

  return countdown;
}
