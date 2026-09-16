"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Maximize2,
  Minimize2,
  CheckCircle2,
  BookOpen,
  Layers,
  FileStack,
  Clock,
  Sparkles,
  Flame,
  Shield,
  Zap,
  BookOpenCheck,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSoundscape } from "@/hooks/useSoundscape";
import {
  finishFocusSessionAction,
  FinishFocusSessionResult,
  FocusMetricsData,
} from "@/actions/focus-session-actions";
import { SoundscapePlayer } from "./_components/SoundscapePlayer";
import {
  SessionTaskChecklist,
  SessionTask,
} from "./_components/SessionTaskChecklist";
import { FocusCelebrationModal } from "./_components/FocusCelebrationModal";

type TimerMode = "foco_25" | "foco_50" | "curta" | "longa";

interface StudyRoomClientProps {
  userId: string;
  user: {
    name?: string | null;
    email?: string | null;
  };
  initialSubjects: Array<{ id: string; name: string; color: string | null }>;
  initialMetrics: FocusMetricsData;
}

const MODE_CONFIG: Record<
  TimerMode,
  { label: string; minutes: number; type: "focus" | "break"; color: string }
> = {
  foco_25: {
    label: "Foco (25 min)",
    minutes: 25,
    type: "focus",
    color: "indigo",
  },
  foco_50: {
    label: "Foco Profundo (50 min)",
    minutes: 50,
    type: "focus",
    color: "violet",
  },
  curta: {
    label: "Pausa Curta (5 min)",
    minutes: 5,
    type: "break",
    color: "emerald",
  },
  longa: {
    label: "Pausa Longa (15 min)",
    minutes: 15,
    type: "break",
    color: "cyan",
  },
};

export default function StudyRoomClient({
  userId,
  user,
  initialSubjects,
  initialMetrics,
}: StudyRoomClientProps) {
  // Configurações do Timer
  const [mode, setMode] = useState<TimerMode>("foco_25");
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  // Métricas da Sessão
  const [metrics, setMetrics] = useState<FocusMetricsData>(initialMetrics);
  const [completedCycles, setCompletedCycles] = useState<number>(initialMetrics.todayCycles);
  const [elapsedFocusSeconds, setElapsedFocusSeconds] = useState<number>(0);

  // Micro-Metas
  const [tasks, setTasks] = useState<SessionTask[]>([]);

  // Modo Zen (Imersão Total)
  const [isZenMode, setIsZenMode] = useState(false);

  // Modal de Celebração
  const [celebrationResult, setCelebrationResult] =
    useState<FinishFocusSessionResult | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Hook de Áudio Procedural
  const soundscapeHook = useSoundscape();

  const isFocusMode = MODE_CONFIG[mode].type === "focus";
  const totalModeSeconds = MODE_CONFIG[mode].minutes * 60;
  const currentTotalSeconds = minutes * 60 + seconds;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((totalModeSeconds - currentTotalSeconds) / totalModeSeconds) * 100),
  );

  // Alterna o Timer
  const toggleTimer = () => {
    setIsActive((prev) => !prev);
  };

  // Reinicia o Timer do modo atual
  const resetTimer = () => {
    setIsActive(false);
    setMinutes(MODE_CONFIG[mode].minutes);
    setSeconds(0);
  };

  // Muda de modo
  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setMinutes(MODE_CONFIG[newMode].minutes);
    setSeconds(0);
  };

  // Pula para a próxima fase do ciclo Pomodoro
  const skipToNext = () => {
    setIsActive(false);
    if (isFocusMode) {
      // Se acabou de focar, vai para pausa curta (ou longa a cada 4 ciclos)
      const nextCycleCount = completedCycles + 1;
      setCompletedCycles(nextCycleCount);
      if (nextCycleCount % 4 === 0) {
        changeMode("longa");
      } else {
        changeMode("curta");
      }
    } else {
      // Se estava em pausa, volta para foco
      changeMode("foco_25");
    }
  };

  // Conclui a sessão no servidor e recompensa com XP
  const handleFinishSession = useCallback(
    async (isFullPomodoroCycle: boolean = false) => {
      // Mínimo de 1 minuto acumulado ou ciclo completo
      const durationMin = Math.max(
        1,
        Math.round(isFullPomodoroCycle ? MODE_CONFIG[mode].minutes : elapsedFocusSeconds / 60),
      );

      setIsFinishing(true);
      try {
        const completedTasksList = tasks
          .filter((t) => t.completed)
          .map((t) => t.text);

        const res = await finishFocusSessionAction({
          durationMinutes: durationMin,
          subjectId: selectedSubjectId || undefined,
          tasksCompleted: completedTasksList,
          isFullPomodoroCycle,
        });

        if (res.success && res.data) {
          setCelebrationResult(res.data);
          setIsCelebrationOpen(true);

          // Atualiza métricas locais
          setMetrics((prev) => ({
            ...prev,
            todayMinutes: prev.todayMinutes + durationMin,
            todayCycles: prev.todayCycles + (isFullPomodoroCycle ? 1 : 0),
            currentStreak: res.data!.streakDays,
          }));

          // Notifica avatar e sidebar para atualizar XP
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("xp-updated"));
          }

          // Reseta contadores de foco da rodada
          setElapsedFocusSeconds(0);
        }
      } catch (err) {
        console.error("Erro ao registrar sessão:", err);
      } finally {
        setIsFinishing(false);
      }
    },
    [elapsedFocusSeconds, mode, selectedSubjectId, tasks],
  );

  // Loop de contagem regressiva
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        // Se estiver em modo foco, acumula tempo de foco ativo
        if (isFocusMode) {
          setElapsedFocusSeconds((prev) => prev + 1);
        }

        if (seconds > 0) {
          setSeconds((s) => s - 1);
        } else if (seconds === 0) {
          if (minutes === 0) {
            // Bloco finalizado!
            setIsActive(false);
            soundscapeHook.playCompletionChime();

            if (isFocusMode) {
              const nextCycles = completedCycles + 1;
              setCompletedCycles(nextCycles);
              handleFinishSession(true);
              // Avança para pausa
              if (nextCycles % 4 === 0) {
                changeMode("longa");
              } else {
                changeMode("curta");
              }
            } else {
              // Pausa finalizada, convida a focar
              changeMode("foco_25");
            }
          } else {
            setMinutes((m) => m - 1);
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
  }, [isActive, minutes, seconds, isFocusMode, completedCycles, soundscapeHook, handleFinishSession]);

  // Alterna tela cheia nativa do navegador se suportado
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsZenMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsZenMode(false);
    }
  };

  // Gerenciamento de Micro-Tarefas
  const handleAddTask = (text: string) => {
    setTasks((prev) => [
      ...prev,
      { id: String(Date.now()), text, completed: false },
    ]);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const selectedSubject = useMemo(
    () => initialSubjects.find((s) => s.id === selectedSubjectId),
    [initialSubjects, selectedSubjectId],
  );

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        isZenMode
          ? "fixed inset-0 z-50 bg-[#030712] overflow-y-auto p-4 sm:p-8"
          : "max-w-6xl mx-auto space-y-6"
      }`}
    >
      {/* Barra de Ações do Topo */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-xl shadow-lg">
        {/* Lado Esquerdo: Seletor de Matéria & Título */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Sala de Foco
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold uppercase border border-indigo-500/30">
                Cockpit Zen
              </span>
            </h1>

            {/* Dropdown de Matérias */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">Disciplina:</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                aria-label="Selecionar matéria de foco"
                className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
              >
                <option value="">Geral / Sem vínculo</option>
                {initialSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lado Direito: Métricas Rápidas & Botão Zen */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5 text-indigo-300">
              <Clock size={14} className="text-indigo-400" />
              <span>
                Hoje: <strong>{metrics.todayMinutes}m</strong>
              </span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5 text-orange-400">
              <Flame size={14} />
              <span>
                <strong>{metrics.currentStreak}</strong> dias
              </span>
              {metrics.streakFreezes > 0 && (
                <Shield size={12} className="text-cyan-400 fill-cyan-400/20" />
              )}
            </div>
          </div>

          {/* Botão Modo Zen Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
              isZenMode
                ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/30"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/60"
            }`}
            title={isZenMode ? "Sair da Tela Cheia" : "Entrar em Modo Zen (Tela Cheia)"}
          >
            {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span className="hidden sm:inline">
              {isZenMode ? "Sair do Zen" : "Modo Zen"}
            </span>
          </button>
        </div>
      </div>

      {/* Grid Central: Cockpit Pomodoro + Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel do Pomodoro (2 Colunas no Desktop) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-between text-center relative overflow-hidden">
          {/* Efeito Glow de Fundo */}
          <div
            className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              isFocusMode ? "bg-indigo-600/10" : "bg-emerald-600/10"
            }`}
          />
          <div
            className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              isFocusMode ? "bg-violet-600/10" : "bg-cyan-600/10"
            }`}
          />

          {/* Abas de Modo (Foco 25m, Foco 50m, Pausa Curta, Pausa Longa) */}
          <div className="w-full flex flex-wrap justify-center gap-1.5 sm:gap-2 p-1 bg-slate-950/60 border border-slate-800/80 rounded-2xl max-w-lg mb-6">
            {(["foco_25", "foco_50", "curta", "longa"] as TimerMode[]).map((m) => {
              const conf = MODE_CONFIG[m];
              const isCurrent = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => changeMode(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isCurrent
                      ? conf.type === "focus"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                        : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {conf.label}
                </button>
              );
            })}
          </div>

          {/* Círculo do Timer SVG com Animação */}
          <div className="relative my-4 flex items-center justify-center">
            <motion.div
              animate={{
                boxShadow: isActive
                  ? [
                      `0 0 25px ${isFocusMode ? "rgba(99, 102, 241, 0.25)" : "rgba(16, 185, 129, 0.25)"}`,
                      `0 0 50px ${isFocusMode ? "rgba(99, 102, 241, 0.45)" : "rgba(16, 185, 129, 0.45)"}`,
                      `0 0 25px ${isFocusMode ? "rgba(99, 102, 241, 0.25)" : "rgba(16, 185, 129, 0.25)"}`,
                    ]
                  : "0 0 0px rgba(0, 0, 0, 0)",
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full flex items-center justify-center"
            >
              <svg className="w-full h-full -rotate-90">
                {/* Trilha de Fundo */}
                <circle
                  cx="50%"
                  cy="50%"
                  r="44%"
                  className="stroke-slate-800/80"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Arco de Progresso */}
                <circle
                  cx="50%"
                  cy="50%"
                  r="44%"
                  className="transition-all duration-1000 ease-linear"
                  stroke={
                    isActive
                      ? isFocusMode
                        ? "#6366f1"
                        : "#10b981"
                      : isFocusMode
                        ? "#4338ca"
                        : "#047857"
                  }
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 125}
                  strokeDashoffset={
                    2 * Math.PI * 125 * (1 - progressPercent / 100)
                  }
                  strokeLinecap="round"
                />
              </svg>

              {/* Informações Centrais do Display */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="font-mono text-5xl sm:text-6xl font-black tracking-widest text-white drop-shadow-md">
                  {String(minutes).padStart(2, "0")}:
                  {String(seconds).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-2">
                  {isFocusMode ? "Modo Concentração" : "Momento de Descanso"}
                </span>

                {/* Ciclos Diários */}
                <div className="flex items-center gap-1.5 mt-3" title={`${completedCycles} ciclo(s) hoje`}>
                  {[0, 1, 2, 3].map((dotIndex) => {
                    const isFilled = dotIndex < completedCycles % 4;
                    return (
                      <span
                        key={dotIndex}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          isFilled
                            ? "bg-indigo-400 shadow-sm shadow-indigo-400"
                            : "bg-slate-800 border border-slate-700"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Controles do Timer */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md mt-6">
            {/* Reset */}
            <button
              onClick={resetTimer}
              className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95 group"
              title="Reiniciar tempo"
            >
              <RotateCcw
                size={18}
                className="transition-transform duration-300 group-hover:-rotate-45"
              />
            </button>

            {/* Play/Pause Principal */}
            <button
              onClick={toggleTimer}
              className={`flex-1 min-w-40 py-3.5 px-6 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${
                isActive
                  ? isFocusMode
                    ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/30"
              }`}
            >
              {isActive ? <Pause size={18} /> : <Play size={18} />}
              <span>{isActive ? "Pausar" : "Iniciar Foco"}</span>
            </button>

            {/* Próxima Fase */}
            <button
              onClick={skipToNext}
              className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
              title="Pular para a próxima fase"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Botão de Concluir Bloco Manualmente */}
          {elapsedFocusSeconds >= 60 && (
            <div className="mt-4">
              <button
                onClick={() => handleFinishSession(false)}
                disabled={isFinishing}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <CheckCircle2 size={14} />
                <span>
                  {isFinishing
                    ? "Registrando..."
                    : `Concluir & Salvar XP (${Math.round(elapsedFocusSeconds / 60)} min)`}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Coluna da Direita: Micro-Metas & Atalhos de Estudo */}
        <div className="space-y-6 flex flex-col justify-between">
          <SessionTaskChecklist
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />

          {/* Dock de Atalhos Rápidos para Estudar em Foco */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-400" />
              Atalhos de Prática
            </h3>
            <p className="text-xs text-slate-400">
              Pratique enquanto o timer do bloco corre:
            </p>

            <div className="space-y-2">
              <Link
                href="/notebook"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/30 border border-slate-800/80 hover:border-indigo-500/40 transition-all text-xs text-slate-200 group"
              >
                <div className="flex items-center gap-2">
                  <BookOpenCheck size={16} className="text-violet-400" />
                  <span className="font-semibold">Caderno de Erros (IA)</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono font-bold">
                  VIP
                </span>
              </Link>

              <Link
                href="/questions"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/30 border border-slate-800/80 hover:border-indigo-500/40 transition-all text-xs text-slate-200 group"
              >
                <div className="flex items-center gap-2">
                  <FileStack size={16} className="text-indigo-400" />
                  <span className="font-semibold">Banco de Questões</span>
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-indigo-400">
                  Simulado
                </span>
              </Link>

              <Link
                href="/flashcards"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/30 border border-slate-800/80 hover:border-indigo-500/40 transition-all text-xs text-slate-200 group"
              >
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-emerald-400" />
                  <span className="font-semibold">Flashcards (FSRS)</span>
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-emerald-400">
                  Revisar
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Inferior: Player de Paisagens Sonoras Procedurais */}
      <SoundscapePlayer soundscapeHook={soundscapeHook} />

      {/* Modal de Celebração & Recompensa de XP */}
      <FocusCelebrationModal
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        result={celebrationResult}
        subjectName={selectedSubject?.name}
        tasksCompletedCount={tasks.filter((t) => t.completed).length}
      />
    </div>
  );
}
