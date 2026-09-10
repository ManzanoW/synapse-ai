"use client";

import React from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { useStudyTimer } from "@/hooks/useStudyTimer";

interface TimerWidgetProps {
  onReset?: () => void;
}

export function TimerWidget({ onReset }: TimerWidgetProps) {
  const { formattedTime, isRunning, toggle, reset } = useStudyTimer({
    autoStart: true,
    storageKey: "questoes_timer",
  });

  const handleReset = () => {
    reset();
    if (onReset) onReset();
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 font-mono text-base font-semibold text-slate-700 dark:text-slate-200">
        <Clock
          className={`h-4 w-4 ${isRunning ? "text-emerald-500 animate-pulse" : "text-slate-400"}`}
        />
        <span>{formattedTime}</span>
      </div>

      <div className="flex items-center gap-1 border-l border-slate-200 pl-2 dark:border-slate-800">
        <button
          onClick={toggle}
          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title={isRunning ? "Pausar tempo" : "Iniciar tempo"}
        >
          {isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={handleReset}
          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Reiniciar tempo"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
