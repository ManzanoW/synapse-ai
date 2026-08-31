"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useGamification } from "@/context/GamificationContext";

interface ZenModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMinutes?: number;
}

const PRESET_MINUTES = [
  { label: "25m", minutes: 25, desc: "Pomodoro" },
  { label: "50m", minutes: 50, desc: "Foco Profundo" },
  { label: "90m", minutes: 90, desc: "Sprint de Prova" },
];

export function ZenModeOverlay({
  isOpen,
  onClose,
  defaultMinutes = 25,
}: ZenModeOverlayProps) {
  const [selectedMinutes, setSelectedMinutes] = useState(defaultMinutes);
  const [totalSeconds, setTotalSeconds] = useState(defaultMinutes * 60);
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [gainedXp, setGainedXp] = useState(0);

  const { refreshStats } = useGamification();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializa o áudio ambiente
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/zen-ambient.mp3");
      audioRef.current.loop = true;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const finalizeSession = useCallback(
    async (elapsedSeconds: number) => {
      const minutesSpent = Math.floor(elapsedSeconds / 60);
      if (minutesSpent < 1) return;

      try {
        setIsSaving(true);
        const res = await fetch("/api/gamification/focus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            durationMinutes: minutesSpent,
            notes: `Sessão Zen (${selectedMinutes}m)`,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setGainedXp(data.xpGained);
          setSessionCompleted(true);
          await refreshStats();
          window.dispatchEvent(new Event("xp-updated"));
        }
      } catch (err) {
        console.error("Erro ao salvar sessão de foco:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [refreshStats, selectedMinutes],
  );

  const toggleTimer = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  const handleManualExit = useCallback(() => {
    const elapsed = totalSeconds - timeLeft;
    if (elapsed >= 60 && !sessionCompleted) {
      finalizeSession(elapsed);
    }
    onClose();
  }, [totalSeconds, timeLeft, sessionCompleted, finalizeSession, onClose]);

  // Handler de Atalhos de Teclado (Espaço e Esc)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (!sessionCompleted) {
          toggleTimer();
        }
      } else if (e.code === "Escape") {
        e.preventDefault();
        handleManualExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, sessionCompleted, toggleTimer, handleManualExit]);

  // Handle session completion
  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      if (audioRef.current) audioRef.current.pause();
    }
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !isActive && !sessionCompleted) {
      const timer = setTimeout(() => {
        finalizeSession(totalSeconds);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isActive, sessionCompleted, totalSeconds, finalizeSession]);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      if (audioRef.current && !isMuted) {
        audioRef.current.play().catch(() => {});
      }
    } else if (timeLeft > 0) {
      if (audioRef.current) audioRef.current.pause();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, isMuted]);

  const selectPreset = (minutes: number) => {
    if (isActive) return;
    setSelectedMinutes(minutes);
    setTotalSeconds(minutes * 60);
    setTimeLeft(minutes * 60);
    setSessionCompleted(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(totalSeconds);
    setSessionCompleted(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const realtimeXp = Math.floor((totalSeconds - timeLeft) / 60) * 2;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col justify-between bg-[#020409] p-6 sm:p-12 text-slate-100 font-sans selection:bg-indigo-500 select-none"
      >
        {/* Breathing Glow Central (Respiração Guiada 4s) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              scale: isActive ? [1, 1.25, 1] : 1,
              opacity: isActive ? [0.15, 0.3, 0.15] : 0.15,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-[450px] w-[450px] rounded-full bg-violet-600 blur-[150px]"
          />
        </div>

        {/* Topo: Controles & Presets */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-3.5 py-1.5 text-xs font-mono font-bold text-violet-300 backdrop-blur-xl">
              <ShieldCheck size={14} className="text-violet-400" />
              Trava de Foco Ativa
            </span>

            {/* Seletores de Tempo Pré-configurados */}
            {!isActive && !sessionCompleted && (
              <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
                {PRESET_MINUTES.map((preset) => (
                  <button
                    key={preset.minutes}
                    onClick={() => selectPreset(preset.minutes)}
                    className={`cursor-pointer px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                      selectedMinutes === preset.minutes
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              className="cursor-pointer rounded-xl border border-white/10 bg-slate-900/60 p-2.5 text-slate-400 hover:text-white transition-all backdrop-blur-xl"
              title={isMuted ? "Ativar som ambiente" : "Mutar som ambiente"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={handleManualExit}
              className="cursor-pointer flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-all backdrop-blur-xl group"
            >
              <Minimize2 size={16} />
              <span>Sair</span>
              <kbd className="hidden sm:inline-block font-mono text-[9px] text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                Esc
              </kbd>
            </button>
          </div>
        </div>

        {/* Centro: Display do Timer */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
          {sessionCompleted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-4 max-w-sm rounded-3xl border border-emerald-500/30 bg-slate-950/80 p-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] backdrop-blur-2xl"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-white">
                Sessão Concluída!
              </h3>
              <p className="text-xs text-slate-400">
                Foco ininterrupto finalizado com sucesso. O XP foi creditado na
                sua conta.
              </p>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 px-4 py-2 text-amber-300 font-mono font-bold text-sm">
                <Zap size={16} className="fill-amber-400 text-amber-400" />+
                {gainedXp} XP Adquirido
              </div>
              <button
                onClick={resetTimer}
                className="cursor-pointer w-full mt-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/25"
              >
                Iniciar Novo Ciclo
              </button>
            </motion.div>
          ) : (
            <div className="relative flex flex-col items-center">
              {/* Anel SVG */}
              <div className="relative flex items-center justify-center">
                <svg className="h-72 w-72 sm:h-96 sm:w-96 -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="42%"
                    className="stroke-slate-900 fill-none"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="42%"
                    className="stroke-violet-500 fill-none transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(168,85,247,0.8)]"
                    strokeWidth="8"
                    strokeDasharray="264%"
                    strokeDashoffset={`${264 - (264 * progressPercent) / 100}%`}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-mono text-5xl sm:text-7xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                    {String(minutes).padStart(2, "0")}:
                    {String(seconds).padStart(2, "0")}
                  </span>
                  <span className="mt-2 text-xs font-mono uppercase tracking-widest text-slate-400">
                    {isActive ? "Foco Profundo em Andamento" : "Pausado"}
                  </span>
                </div>
              </div>

              {/* Tag de Rendimento */}
              <div className="mt-6 flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 font-mono text-xs font-bold text-amber-300">
                <Sparkles
                  size={14}
                  className="text-amber-400 animate-spin-slow"
                />
                <span>+2 XP / min</span>
                <span className="text-slate-500">•</span>
                <span>Rendimento: +{realtimeXp} XP</span>
              </div>

              {/* Botões de Ação */}
              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={toggleTimer}
                  className={`cursor-pointer flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-black uppercase tracking-wider text-white shadow-2xl transition-all duration-200 active:scale-95 ${
                    isActive
                      ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/25"
                      : "bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-600/30"
                  }`}
                >
                  {isActive ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} className="fill-white" />
                  )}
                  <span>{isActive ? "Pausar" : "Iniciar Foco"}</span>
                </button>

                <button
                  onClick={resetTimer}
                  className="cursor-pointer rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-slate-400 hover:text-white transition-all backdrop-blur-xl"
                  title="Reiniciar Timer"
                >
                  <RotateCcw size={18} />
                </button>
              </div>

              {/* Dica de Teclado Discreta */}
              <p className="mt-4 text-[10px] font-mono text-slate-500">
                Pressione{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                  Espaço
                </kbd>{" "}
                para alternar
              </p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Synapse AI • NeuroFocus Engine</span>
          <span>
            {isSaving ? "Sincronizando XP..." : "Gamificação Sincronizada"}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
