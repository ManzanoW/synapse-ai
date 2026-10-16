"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  CloudRain,
  Coffee,
  Waves,
  BrainCircuit,
  Sliders,
  X,
} from "lucide-react";
import { useSoundscape } from "@/hooks/useSoundscape";
import { useAudio } from "@/contexts/AudioContext";
import { SoundscapeType } from "@/lib/soundscapes";

export function SoundscapeFloatingWidget() {
  const {
    currentSoundscape,
    volume,
    isPlaying,
    selectSoundscape,
    togglePlay,
    setVolume,
  } = useSoundscape();
  const { isMuted, toggleMute } = useAudio();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha popover ao clicar fora ou pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const soundscapesList: {
    id: SoundscapeType;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    tag?: string;
  }[] = [
    {
      id: "alpha_binaural",
      label: "Ondas Alfa (10 Hz)",
      icon: BrainCircuit,
      tag: "FLOW",
    },
    { id: "soft_rain", label: "Chuva Suave", icon: CloudRain },
    { id: "cafe_ambience", label: "Cafeteria Acústica", icon: Coffee },
    { id: "brown_noise", label: "Ruído Marrom", icon: Waves, tag: "TDAH" },
    { id: "zen_drone", label: "Tigela Tibetana", icon: Sparkles },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed top-3 right-4 z-40 hidden sm:flex items-center gap-2"
    >
      {/* Pílula Flutuante Principal */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 backdrop-blur-xl shadow-lg ${
          isPlaying
            ? "bg-indigo-50/90 border-indigo-300/80 text-indigo-700 shadow-indigo-500/10 dark:bg-indigo-950/80 dark:border-indigo-500/40 dark:text-indigo-200"
            : "bg-white/90 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-900/70 dark:border-white/10 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-white/20"
        }`}
      >
        {/* Visualizador de Áudio (barrinhas animadas se tocando) */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 text-xs font-semibold cursor-pointer group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-0.5"
          title="Configurações de Áudio & Foco"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          {isPlaying ? (
            <div className="flex items-end gap-0.5 h-3.5 w-3.5">
              <span className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-3" />
              <span className="w-1 bg-violet-500 dark:bg-violet-400 rounded-full animate-[pulse_1.1s_ease-in-out_infinite] h-2" />
              <span className="w-1 bg-indigo-400 dark:bg-indigo-300 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3.5" />
            </div>
          ) : (
            <Headphones
              size={14}
              className="text-slate-500 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400 transition-colors"
            />
          )}

          <span className="text-[11px] font-medium tracking-tight">
            {isPlaying
              ? soundscapesList.find((s) => s.id === currentSoundscape)?.label ||
                "Som Ativo"
              : "Som de Foco"}
          </span>
        </button>

        {/* Play / Pause Rápido */}
        <button
          type="button"
          onClick={togglePlay}
          className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={isPlaying ? "Pausar som ambiente" : "Iniciar som ambiente"}
          title={isPlaying ? "Pausar som ambiente" : "Iniciar som ambiente"}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} />}
        </button>

        {/* Mute Rápido de Efeitos */}
        <button
          type="button"
          onClick={toggleMute}
          className={`h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            isMuted
              ? "text-rose-500 dark:text-rose-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
          aria-label={isMuted ? "Ativar som geral" : "Silenciar tudo"}
          title={isMuted ? "Ativar som geral" : "Silenciar tudo"}
        >
          {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
      </div>

      {/* Popover de Controles e Presets */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Paisagens Sonoras Neurais"
          className="absolute top-11 right-0 w-72 rounded-2xl bg-white/95 dark:bg-[#090d1a]/95 border border-slate-200 dark:border-indigo-500/25 p-4 shadow-2xl backdrop-blur-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Headphones size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Paisagens Sonoras Neurais</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar painel de som"
              className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <X size={14} />
            </button>
          </div>

          {/* Lista de Paisagens Sonoras */}
          <div className="space-y-1">
            {soundscapesList.map((item) => {
              const Icon = item.icon;
              const isSelected = currentSoundscape === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectSoundscape(item.id)}
                  aria-pressed={isSelected}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isSelected
                      ? "bg-indigo-50 border border-indigo-300 text-indigo-700 font-semibold dark:bg-indigo-500/20 dark:border-indigo-500/40 dark:text-indigo-200"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      size={14}
                      className={isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.tag && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                      {item.tag}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Opção Silenciar Som Ambiente */}
            <button
              type="button"
              onClick={() => selectSoundscape("none")}
              aria-pressed={currentSoundscape === "none"}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                currentSoundscape === "none"
                  ? "bg-slate-100 border border-slate-300 text-slate-800 font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <VolumeX size={14} className="text-slate-400 dark:text-slate-500" />
              <span>Desativar som ambiente</span>
            </button>
          </div>

          {/* Controle de Volume */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Sliders size={11} />
                <span>Volume Ambiente</span>
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              aria-label="Volume ambiente"
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-indigo-600 dark:accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
