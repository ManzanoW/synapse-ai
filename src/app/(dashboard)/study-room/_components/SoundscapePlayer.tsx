"use client";

import React from "react";
import {
  Volume2,
  VolumeX,
  Headphones,
  BrainCircuit,
  CloudRain,
  Waves,
  Sparkles,
  Zap,
} from "lucide-react";
import { useSoundscape } from "@/hooks/useSoundscape";
import { SoundscapeType } from "@/lib/soundscapes";

interface SoundscapePlayerProps {
  soundscapeHook: ReturnType<typeof useSoundscape>;
}

export function SoundscapePlayer({ soundscapeHook }: SoundscapePlayerProps) {
  const {
    currentSoundscape,
    options,
    volume,
    isPlaying,
    selectSoundscape,
    setVolume,
  } = soundscapeHook;

  const getIcon = (type: SoundscapeType) => {
    switch (type) {
      case "alpha_binaural":
        return BrainCircuit;
      case "soft_rain":
        return CloudRain;
      case "brown_noise":
        return Waves;
      case "zen_drone":
        return Sparkles;
      default:
        return VolumeX;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Headphones size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Paisagens Sonoras Neurais
              {isPlaying && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Sintetizado via Web Audio API local
            </p>
          </div>
        </div>

        {/* Slider de Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => selectSoundscape(currentSoundscape === "none" ? "alpha_binaural" : "none")}
            className="text-slate-400 hover:text-white transition-colors"
            title={currentSoundscape === "none" ? "Ativar som" : "Mutar som ambiente"}
          >
            {currentSoundscape === "none" || volume === 0 ? (
              <VolumeX size={16} />
            ) : (
              <Volume2 size={16} className="text-indigo-400" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-[11px] font-mono text-slate-400 w-7 text-right">
            {volume}%
          </span>
        </div>
      </div>

      {/* Grid de Opções de Som */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {options.map((opt) => {
          const Icon = getIcon(opt.id);
          const isSelected = currentSoundscape === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => selectSoundscape(opt.id)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? "bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                  : "bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700/60"
              }`}
            >
              <div
                className={`p-2 rounded-lg transition-colors ${
                  isSelected
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-800/80 text-slate-400 group-hover:text-slate-200"
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold truncate ${
                      isSelected ? "text-indigo-200" : "text-slate-200"
                    }`}
                  >
                    {opt.label}
                  </span>
                  {opt.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold uppercase">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {opt.description}
                </p>
              </div>

              {isSelected && (
                <div className="absolute right-2 top-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Dica para fones de ouvido se ondas alfa selecionadas */}
      {currentSoundscape === "alpha_binaural" && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
          <Zap size={14} className="shrink-0 text-indigo-400" />
          <span>
            <strong>Dica de Neurociência:</strong> Para o efeito binaural de ondas alfa (10 Hz), use fones de ouvido estéreo. Os hemisférios cerebrais sincronizam com a diferença de frequência.
          </span>
        </div>
      )}
    </div>
  );
}
