'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'foco' | 'curta' | 'longa'>('foco');

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'foco') setMinutes(25);
    if (mode === 'curta') setMinutes(5);
    if (mode === 'longa') setMinutes(15);
    setSeconds(0);
  };

  const changeMode = (newMode: 'foco' | 'curta' | 'longa') => {
    setMode(newMode);
    setIsActive(false);
    setSeconds(0);
    if (newMode === 'foco') setMinutes(25);
    if (newMode === 'curta') setMinutes(5);
    if (newMode === 'longa') setMinutes(15);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (seconds === 0) {
          if (minutes === 0) {
            // Timer chegou ao fim! Som de alerta ou reset
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



  return (
    <div className="bg-[#090d16] border border-slate-800/60 rounded-xl p-5 shadow-lg flex flex-col items-center text-center justify-between min-h-[260px]">
      {/* Abas de Modo */}
      <div className="w-full flex justify-between text-xs font-semibold text-slate-400 border-b border-slate-800/60 pb-2">
        <button 
          onClick={() => changeMode('foco')} 
          className={`pb-2 -mb-2.5 transition-colors ${mode === 'foco' ? 'text-indigo-400 border-b border-indigo-500' : 'hover:text-slate-300'}`}
        >
          Foco
        </button>
        <button 
          onClick={() => changeMode('curta')} 
          className={`pb-2 -mb-2.5 transition-colors ${mode === 'curta' ? 'text-indigo-400 border-b border-indigo-500' : 'hover:text-slate-300'}`}
        >
          Curta
        </button>
        <button 
          onClick={() => changeMode('longa')} 
          className={`pb-2 -mb-2.5 transition-colors ${mode === 'longa' ? 'text-indigo-400 border-b border-indigo-500' : 'hover:text-slate-300'}`}
        >
          Longa
        </button>
      </div>

      {/* Relógio do Timer */}
      <div className="my-4 relative flex items-center justify-center w-full">
        <div className={`w-36 h-36 rounded-full border-2 flex items-center justify-center absolute transition-all ${
          isActive ? 'border-indigo-500 border-t-transparent animate-spin-slow' : 'border-slate-800'
        }`} />
        <div className="text-3xl font-bold tracking-widest text-slate-100 z-10 font-mono">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3 w-full">
        <button 
          onClick={resetTimer}
          className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
        >
          <RotateCcw size={16} />
        </button>
        <button 
          onClick={toggleTimer}
          className="flex-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium p-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 active:scale-95"
        >
          {isActive ? <Pause size={16} /> : <Play size={16} />}
          <span className="text-xs">{isActive ? "Pausar" : "Iniciar"}</span>
        </button>
      </div>
    </div>
  );
}