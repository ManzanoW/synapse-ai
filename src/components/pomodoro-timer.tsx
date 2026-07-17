"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export default function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"foco" | "curta" | "longa">("foco");

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

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (seconds === 0) {
          if (minutes === 0) {
            setIsActive(false);
            alert("Bloco de estudos concluído! Hora de descansar.");
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
  }, [isActive, minutes, seconds]);

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

      {/* Relógio do Timer */}
      <div className="my-4 relative flex items-center justify-center w-full group">
        {/* Círculo de Progresso SVG */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            {/* Círculo de Fundo (cinza) */}
            <circle
              cx="72"
              cy="72"
              r="68"
              className="stroke-slate-800"
              strokeWidth="4"
              fill="transparent"
            />
            {/* Círculo de Progresso (dinâmico) */}
            <circle
              cx="72"
              cy="72"
              r="68"
              className="transition-all duration-1000 ease-linear"
              // Aqui aplicamos a cor diretamente baseada no estado isFocus
              stroke={isActive ? (isFocus ? "#6366f1" : "#10b981") : "#334155"}
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={427}
              strokeDashoffset={
                isActive ? 427 - (progressPercentage / 100) * 427 : 427
              }
              strokeLinecap="round"
            />
          </svg>

          {/* Display Numérico (Centralizado sobre o SVG) */}
          <div className="absolute font-mono text-3xl font-bold tracking-widest text-slate-100">
            {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </div>
        </div>
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
