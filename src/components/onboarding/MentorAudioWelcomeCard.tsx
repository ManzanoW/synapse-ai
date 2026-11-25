"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Headphones,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  FileText,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface MentorAudioWelcomeCardProps {
  userName?: string | null;
  targetRole?: string | null;
}

const WELCOME_SCRIPT = (name: string, role: string) =>
  `Olá, ${name}! Seja muito bem-vindo ao Synapse AI. Eu sei exatamente como é a ansiedade de encarar um edital imenso e sentir que o tempo é curto. Mas a partir de hoje, você não estuda mais sozinho. Aqui na plataforma, você não precisa ser perfeito no primeiro dia, nem virar noites sem dormir. Você só precisa de constância e de cumprir o seu bloco de hoje. Respire fundo, confie no seu processo e vamos juntos construir a sua posse como ${role}!`;

export function MentorAudioWelcomeCard({
  userName,
  targetRole,
}: MentorAudioWelcomeCardProps) {
  const displayName = userName ? userName.split(" ")[0] : "Concurseiro";
  const displayRole = targetRole || "Servidor Público";

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(28); // Duração aproximada de 28s
  const [currentTime, setCurrentTime] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<"pt-BR-FranciscaNeural" | "pt-BR-AntonioNeural">("pt-BR-FranciscaNeural");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("synapse_mentor_audio_dismissed");
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    } catch {}
  }, []);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const updateProgress = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / (audioRef.current.duration || 28)) * 100);
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  const handlePlayAudio = async () => {
    triggerHaptic("medium");

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    // Se já temos a URL do áudio sintetizado em cache, dá play direto
    if (audioBlobUrlRef.current && audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        animFrameRef.current = requestAnimationFrame(updateProgress);
        return;
      } catch (err) {
        console.warn("Retentativa de play:", err);
      }
    }

    setIsLoadingAudio(true);
    const speechText = WELCOME_SCRIPT(displayName, displayRole);

    try {
      // 1. Tenta sintetizar com voz humana de estúdio via Edge TTS Neural
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: speechText,
          voice: selectedVoice,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audioBlobUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration)) {
            setDuration(Math.round(audio.duration));
          }
        };

        audio.onended = () => {
          setIsPlaying(false);
          setProgress(100);
          setCurrentTime(duration);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };

        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoadingAudio(false);
          fallbackWebSpeech(speechText);
        };

        await audio.play();
        setIsPlaying(true);
        animFrameRef.current = requestAnimationFrame(updateProgress);
        setIsLoadingAudio(false);
        return;
      } else {
        throw new Error("Falha no servidor TTS");
      }
    } catch {
      // 2. Fallback de alta fidelidade via Web Speech se offline
      fallbackWebSpeech(speechText);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const fallbackWebSpeech = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95; // Cadência natural, sem pressa mecânica
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    // Prioriza vozes humanas e naturais da Microsoft/Google instaladas no SO
    const naturalVoice = voices.find(
      (v) =>
        (v.lang === "pt-BR" || v.lang === "pt_BR") &&
        (v.name.includes("Natural") ||
          v.name.includes("Neural") ||
          v.name.includes("Google") ||
          v.name.includes("Francisca") ||
          v.name.includes("Luciana"))
    );

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    } else {
      const ptBrVoice = voices.find((v) => v.lang === "pt-BR" || v.lang === "pt_BR");
      if (ptBrVoice) utterance.voice = ptBrVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
    };
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleDismiss = () => {
    triggerHaptic("light");
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsDismissed(true);
    try {
      localStorage.setItem("synapse_mentor_audio_dismissed", "true");
    } catch {}
  };

  if (isDismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/35 bg-[#090d16] p-4 sm:p-5 shadow-xs animate-in fade-in duration-300">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Lado Esquerdo: Avatar do Mentor + Título + Status */}
        <div className="flex items-start sm:items-center gap-3.5">
          {/* Avatar com Ondas Sonoras Animadas */}
          <div className="relative shrink-0">
            <div className="flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-950/50 border border-indigo-400/30">
              <Headphones size={24} />
            </div>

            {isPlaying && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-950">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" />
                <span>BOAS-VINDAS DO MENTOR</span>
              </span>
              <span className="text-[11px] text-slate-400">
                🎙️ Voz Humana de Estúdio
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white mt-1">
              Uma mensagem especial para você, {displayName}!
            </h3>

            {/* Equalizador animado enquanto toca */}
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
              {isPlaying ? (
                <div className="flex items-center gap-0.5 h-3">
                  <span className="w-0.5 h-3 bg-indigo-400 animate-pulse" />
                  <span className="w-0.5 h-2 bg-cyan-400 animate-pulse delay-75" />
                  <span className="w-0.5 h-3.5 bg-indigo-300 animate-pulse delay-150" />
                  <span className="w-0.5 h-1.5 bg-cyan-400 animate-pulse delay-100" />
                  <span className="w-0.5 h-3 bg-indigo-400 animate-pulse" />
                  <span className="text-[11px] text-indigo-300 font-medium ml-1.5">
                    Reproduzindo áudio humanizado...
                  </span>
                </div>
              ) : (
                <span>Ouça em menos de 30 segundos antes de começar</span>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: Player de Áudio + Controles */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Botão Play / Pause */}
          <button
            type="button"
            onClick={handlePlayAudio}
            disabled={isLoadingAudio}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer active:scale-95 ${
              isPlaying
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50"
            }`}
          >
            {isLoadingAudio ? (
              <>
                <Loader2 size={15} className="animate-spin text-white" />
                <span>Carregando voz...</span>
              </>
            ) : isPlaying ? (
              <>
                <Pause size={15} className="fill-slate-950" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play size={15} className="fill-white" />
                <span>Ouvir Mensagem</span>
              </>
            )}
          </button>

          {/* Botão Ler Texto */}
          <button
            type="button"
            onClick={() => setShowFullText((prev) => !prev)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ler transcrição da mensagem"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">
              {showFullText ? "Ocultar" : "Ler Texto"}
            </span>
          </button>

          {/* Botão Fechar / Dispensar */}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            title="Dispensar mensagem"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Barra de Progresso quando estiver tocando */}
      {(isPlaying || progress > 0) && (
        <div className="mt-3.5 pt-2 border-t border-white/10">
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>00:{String(Math.floor(currentTime)).padStart(2, "0")}</span>
            <span>00:{String(duration).padStart(2, "0")}</span>
          </div>
        </div>
      )}

      {/* Caixa de Texto Completa (Toggle) */}
      {showFullText && (
        <div className="mt-3.5 p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-slate-300 leading-relaxed space-y-2 animate-in fade-in duration-150">
          <p className="italic text-slate-200">
            &ldquo;{WELCOME_SCRIPT(displayName, displayRole)}&rdquo;
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-white/5">
            <span>Professor Sináptico • Synapse AI</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Voz:</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedVoice((prev) =>
                    prev === "pt-BR-FranciscaNeural"
                      ? "pt-BR-AntonioNeural"
                      : "pt-BR-FranciscaNeural"
                  );
                  if (audioBlobUrlRef.current) {
                    URL.revokeObjectURL(audioBlobUrlRef.current);
                    audioBlobUrlRef.current = null;
                  }
                }}
                className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
              >
                {selectedVoice === "pt-BR-FranciscaNeural" ? "Francisca (Feminina)" : "Antônio (Masculino)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
