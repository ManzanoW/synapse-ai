"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { awardStudyMeritAction } from "@/actions/quota-actions";
import { triggerAiQuotaRefresh } from "@/lib/quota-events";

function playTibetanBellSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Frequências harmônicas do sino tibetano (fundamental 432 Hz e parciais harmônicos)
    const harmonics = [432, 864, 1296];
    harmonics.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      const peakGain = 0.15 / (idx + 1);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.6);
    });
  } catch {}
}

export default function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"foco" | "curta" | "longa">("foco");
  const [meritBanner, setMeritBanner] = useState<string | null>(null);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (mode === "foco") setMinutes(25);
    if (mode === "curta") setMinutes(5);
    if (mode === "longa") setMinutes(15);
    setSeconds(0);
  };

  const changeMode = (newMode: "foco" | "curta" | "longa") => {
    setMode(newMode);
    setIsActive(false);
    setSeconds(0);
    if (newMode === "foco") setMinutes(25);
    if (newMode === "curta") setMinutes(5);
    if (newMode === "longa") setMinutes(15);
  };

  // Atualiza o título da aba do navegador em tempo real com o tempo restante
  useEffect(() => {
    if (typeof document === "undefined") return;

    const originalTitle = "Synapse AI • Potência Cognitiva para Concursos";

    if (isActive) {
      const minStr = String(minutes).padStart(2, "0");
      const secStr = String(seconds).padStart(2, "0");
      const modeIcon = mode === "foco" ? "🍅" : "☕";
      const modeLabel = mode === "foco" ? "Foco" : "Pausa";
      document.title = `${modeIcon} ${minStr}:${secStr} (${modeLabel}) • Synapse AI`;
    } else {
      document.title = originalTitle;
    }

    return () => {
      document.title = originalTitle;
    };
  }, [isActive, minutes, seconds, mode]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (seconds === 0) {
          if (minutes === 0) {
            setIsActive(false);
            playTibetanBellSound();
            if (mode === "foco") {
              awardStudyMeritAction("POMODORO_FOCUS")
                .then((res) => {
                  if (res.success) {
                    triggerAiQuotaRefresh();
                    setMeritBanner(res.message || "+1⚡ de Energia Sináptica por Mérito de Estudo!");
                    setTimeout(() => setMeritBanner(null), 5000);
                  }
                })
                .catch(() => {});
            }
            resetTimer();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    } else if (!isActive && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds, mode]);

  // Calcula a porcentagem baseada no tempo atual e no tempo total do modo
  const totalSeconds = mode === "foco" ? 25 * 60 : 5 * 60; // Exemplo de tempos
  const currentSeconds = minutes * 60 + seconds;
  const progressPercentage = (currentSeconds / totalSeconds) * 100;

  // Define dinamicamente a cor do tema com base no modo (Foco vs Descanço)
  const isFocus = mode === "foco";
  const themeColor = isFocus ? "indigo" : "emerald";
  const themeActiveBg = isFocus
    ? "bg-indigo-600 hover:bg-indigo-500"
    : "bg-emerald-600 hover:bg-emerald-500";
  const themeText = isFocus ? "text-indigo-400" : "text-emerald-400";
  const themeBorder = isFocus ? "border-indigo-500" : "border-emerald-500";
  const themeShadow = isFocus
    ? "shadow-indigo-600/10"
    : "shadow-emerald-600/10";

  return (
    <div
      className={`bg-slate-900/40 border rounded-2xl p-5 shadow-xl flex flex-col items-center text-center justify-between min-h-65 transition-all duration-500 ${
        isActive
          ? isFocus
            ? "border-indigo-500/20 shadow-indigo-500/2"
            : "border-emerald-500/20 shadow-emerald-500/2"
          : "border-slate-800/60"
      }`}
    >
      {/* Abas de Modo */}
      <div className="w-full flex justify-between text-[11px] uppercase tracking-widest font-bold text-slate-500 border-b border-slate-800/60 pb-2">
        {(["foco", "curta", "longa"] as const).map((m) => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            className={`pb-2 -mb-2.5 transition-all duration-300 capitalize relative px-2 ${
              mode === m
                ? isFocus
                  ? "text-indigo-400"
                  : "text-emerald-400"
                : "hover:text-slate-300"
            }`}
          >
            {m === "curta" ? "Pausa Curta" : m === "longa" ? "Pausa Longa" : m}
            {/* Linha indicadora com transição suave de opacidade */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 origin-center ${
                mode === m
                  ? `${isFocus ? "bg-indigo-500" : "bg-emerald-500"} scale-x-100 opacity-100`
                  : "scale-x-0 opacity-0"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Banner de Mérito Sináptico */}
      <AnimatePresence>
        {meritBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="w-full mt-2.5 p-2 rounded-xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse"
          >
            <Zap size={13} className="text-cyan-400 fill-cyan-400" />
            <span>{meritBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relógio do Timer */}
      <div className="my-4 relative flex items-center justify-center w-full group">
        {/* Círculo de Progresso SVG */}
        <motion.div
          animate={{
            boxShadow: isActive
              ? [
                  `0 0 20px ${isFocus ? "rgba(99, 102, 241, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
                  `0 0 40px ${isFocus ? "rgba(99, 102, 241, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
                  `0 0 20px ${isFocus ? "rgba(99, 102, 241, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
                ]
              : "0 0 0px rgba(0, 0, 0, 0)",
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-36 h-36 flex items-center justify-center rounded-full"
        >
          <svg className="w-full h-full -rotate-90">
            {/* Seus círculos SVG permanecem inalterados aqui dentro */}
            <circle
              cx="72"
              cy="72"
              r="68"
              className="stroke-slate-800"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="72"
              cy="72"
              r="68"
              className="transition-all duration-1000 ease-linear"
              stroke={
                isActive
                  ? isFocus
                    ? minutes === 0 && seconds <= 60
                      ? "#f59e0b"
                      : "#6366f1"
                    : "#10b981"
                  : "#334155"
              }
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={427}
              strokeDashoffset={
                isActive ? 427 - (progressPercentage / 100) * 427 : 427
              }
              strokeLinecap="round"
            />
          </svg>

          {/* Display Numérico */}
          <div className="absolute flex flex-col items-center">
            <span
              className={`font-mono text-3xl font-bold tracking-widest transition-colors ${
                isActive && isFocus && minutes === 0 && seconds <= 60
                  ? "text-amber-300 animate-pulse"
                  : "text-slate-100"
              }`}
            >
              {String(minutes).padStart(2, "0")}:
              {String(seconds).padStart(2, "0")}
            </span>
            {isActive && isFocus && minutes === 0 && seconds <= 60 && (
              <span className="text-[8px] font-mono font-extrabold uppercase tracking-widest text-amber-400 mt-0.5">
                Reta Final
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3 w-full">
        {/* Botão de Reset */}
        <button
          onClick={resetTimer}
          className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-400 hover:text-slate-200 transition-all duration-200 flex items-center justify-center active:scale-95 group"
        >
          <RotateCcw
            size={16}
            className="transition-transform duration-300 group-hover:-rotate-45"
          />
        </button>

        {/* Botão Start/Pause */}
        <button
          onClick={toggleTimer}
          className={`flex-2 ${themeActiveBg} text-white font-medium p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md ${themeShadow} active:scale-95`}
        >
          <div className="transition-transform duration-200 group-hover:scale-110">
            {isActive ? <Pause size={16} /> : <Play size={16} />}
          </div>
          <span className="text-xs font-semibold tracking-wide">
            {isActive ? "Pausar" : "Iniciar"}
          </span>
        </button>
      </div>
    </div>
  );
}
