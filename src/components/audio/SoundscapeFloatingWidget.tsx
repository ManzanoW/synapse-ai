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

  // Fecha popover ao clicar fora
  useEffect(() => {
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
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 backdrop-blur-xl shadow-xl ${
          isPlaying
            ? "bg-indigo-950/80 border-indigo-500/40 text-indigo-200 shadow-indigo-500/10"
            : "bg-slate-900/70 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
        }`}
      >
        {/* Visualizador de Áudio (barrinhas animadas se tocando) */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 text-xs font-semibold cursor-pointer group"
          title="Configurações de Áudio & Foco"
        >
          {isPlaying ? (
            <div className="flex items-end gap-0.5 h-3.5 w-3.5">
              <span className="w-1 bg-indigo-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-3" />
              <span className="w-1 bg-violet-400 rounded-full animate-[pulse_1.1s_ease-in-out_infinite] h-2" />
              <span className="w-1 bg-indigo-300 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3.5" />
            </div>
          ) : (
            <Headphones
              size={14}
              className="text-slate-400 group-hover:text-indigo-400 transition-colors"
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
          className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={isPlaying ? "Pausar som ambiente" : "Iniciar som ambiente"}
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
        </button>

        {/* Mute Rápido de Efeitos */}
        <button
          type="button"
          onClick={toggleMute}
          className={`p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${
            isMuted ? "text-rose-400" : "text-slate-400 hover:text-slate-200"
          }`}
          title={isMuted ? "Ativar som geral" : "Silenciar tudo"}
        >
          {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>
      </div>

      {/* Popover de Controles e Presets */}
      {isOpen && (
        <div className="absolute top-11 right-0 w-72 rounded-2xl bg-[#090d1a]/95 border border-indigo-500/25 p-4 shadow-2xl backdrop-blur-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Headphones size={14} className="text-indigo-400" />
              <span>Paisagens Sonoras Neurais</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={13} />
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
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      size={14}
                      className={isSelected ? "text-indigo-400" : "text-slate-400"}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.tag && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
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
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                currentSoundscape === "none"
                  ? "bg-slate-800 border border-slate-700 text-slate-200 font-medium"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
              }`}
            >
              <VolumeX size={14} className="text-slate-500" />
              <span>Desativar som ambiente</span>
            </button>
          </div>

          {/* Controle de Volume */}
          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sliders size={11} />
                <span>Volume Ambiente</span>
              </span>
              <span className="font-mono text-slate-300 font-bold">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
