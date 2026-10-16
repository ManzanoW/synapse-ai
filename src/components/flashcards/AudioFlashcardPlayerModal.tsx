"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Headphones,
  Volume2,
  BrainCircuit,
  Sparkles,
  Clock,
  Gauge,
  CheckCircle2,
  Crown,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAudioFlashcards,
  AudioFlashcardItem,
} from "@/hooks/useAudioFlashcards";
import { getAiQuotaStatusAction } from "@/actions/quota-actions";

interface AudioFlashcardPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: AudioFlashcardItem[];
  deckTitle?: string;
  isPro?: boolean;
}

const FREE_AUDIO_LIMIT_SECONDS = 15 * 60; // 15 minutos diários no plano Básico (900s)
const PRO_AUDIO_LIMIT_SECONDS = 120 * 60; // 120 minutos diários no plano Pro (7200s)

export function AudioFlashcardPlayerModal({
  isOpen,
  onClose,
  cards,
  deckTitle = "Flashcards",
  isPro,
}: AudioFlashcardPlayerModalProps) {
  const {
    isPlaying,
    currentIndex,
    currentCard,
    totalCards,
    currentPhase,
    countdownRemaining,
    pauseDuration,
    playbackSpeed,
    pause,
    togglePlay,
    next,
    prev,
    setPauseDuration,
    setPlaybackSpeed,
    availableVoices,
    selectedVoiceURI,
    setSelectedVoiceURI,
  } = useAudioFlashcards({
    cards,
    deckTitle,
    initialPauseDuration: 4,
  });

  const [mounted, setMounted] = useState(false);
  const [isProUser, setIsProUser] = useState<boolean>(isPro ?? false);
  const [audioSecondsToday, setAudioSecondsToday] = useState<number>(0);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Carrega status Pro e minutos ouvidos hoje
  useEffect(() => {
    if (!isOpen) return;

    if (isPro === undefined) {
      getAiQuotaStatusAction().then((res) => {
        if (res.success && res.data) {
          setIsProUser(res.data.isUnlimited);
        }
      });
    } else {
      setIsProUser(isPro);
    }

    if (typeof window !== "undefined") {
      const todayKey = `synapse_audio_time_${new Date().toISOString().slice(0, 10)}`;
      const saved = parseInt(localStorage.getItem(todayKey) || "0", 10);
      setAudioSecondsToday(isNaN(saved) ? 0 : saved);
    }
  }, [isOpen, isPro]);

  // Acumula tempo de áudio ouvido e pausa ao atingir 15 min no plano Free
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setAudioSecondsToday((prev) => {
        const next = prev + 1;
        if (typeof window !== "undefined") {
          const todayKey = `synapse_audio_time_${new Date().toISOString().slice(0, 10)}`;
          localStorage.setItem(todayKey, String(next));
        }

        if (!isProUser && next >= FREE_AUDIO_LIMIT_SECONDS) {
          pause();
          setShowLimitModal(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, isProUser, pause]);

  const handleTogglePlay = () => {
    if (!isPlaying && !isProUser && audioSecondsToday >= FREE_AUDIO_LIMIT_SECONDS) {
      setShowLimitModal(true);
      return;
    }
    togglePlay();
  };

  // Atalhos de teclado (Espaço = Play/Pause, Esc = Fechar)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === "Escape") {
        if (showLimitModal) {
          setShowLimitModal(false);
        } else {
          pause();
          onClose();
        }
      } else if (e.key === "ArrowRight") {
        next();
      } else if (e.key === "ArrowLeft") {
        prev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleTogglePlay, pause, onClose, next, prev, showLimitModal]);

  const handleClose = () => {
    pause();
    onClose();
  };

  if (!mounted || !isOpen) return null;

  const progressPercent =
    totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl select-none overflow-y-auto">
      {/* Ambient Glow dinâmico dependendo da fase */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
          currentPhase === "thinking"
            ? "bg-amber-600/20"
            : currentPhase === "answer"
              ? "bg-emerald-600/20"
              : "bg-indigo-600/20"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="audio-flashcard-title"
        className="relative w-full max-w-2xl bg-[#060913]/95 border border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col justify-between my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Topo do Player */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Headphones size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold tracking-widest text-indigo-400">
                  Synapse Audio
                </span>
                <span className="text-slate-600">•</span>
                <span id="audio-flashcard-title" className="text-xs text-slate-300 font-semibold truncate max-w-[200px]">
                  {deckTitle}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Card {currentIndex + 1} de {totalCards} (
                {Math.round(progressPercent)}%)
              </p>
            </div>
          </div>

            <div className="flex items-center gap-2">
              {isProUser ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-mono font-bold"
                  title="Plano Pro: até 120 minutos diários de áudio neural"
                >
                  <Crown size={11} className="text-amber-400" />
                  <span>{Math.floor(audioSecondsToday / 60)}m / 120m</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLimitModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-mono font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
                  title="Degustação do plano Básico: até 15 minutos diários"
                >
                  <Clock
                    size={11}
                    className={
                      FREE_AUDIO_LIMIT_SECONDS - audioSecondsToday <= 180
                        ? "text-amber-400 animate-pulse"
                        : "text-cyan-400"
                    }
                  />
                  <span>
                    {audioSecondsToday >= FREE_AUDIO_LIMIT_SECONDS
                      ? "15m atingidos"
                      : `${Math.ceil((FREE_AUDIO_LIMIT_SECONDS - audioSecondsToday) / 60)}m livres`}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                aria-label="Fechar player de áudio"
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none transition-colors cursor-pointer"
                title="Fechar player (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

        {/* Barra de Progresso Fina */}
        <div
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso do deck: card ${currentIndex + 1} de ${totalCards}`}
          className="w-full h-1 bg-slate-950 rounded-full overflow-hidden my-3 border border-slate-900"
        >
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Palco Central: Visualizador de Ondas & Conteúdo */}
        <div className="flex-1 flex flex-col items-center justify-center text-center my-4 space-y-6">
          {/* Equalizador de Ondas Sonoras */}
          <div className="flex items-center justify-center gap-1.5 h-12">
            {[12, 28, 44, 20, 36, 16].map((h, i) => (
              <motion.span
                key={i}
                animate={{
                  height: isPlaying ? [12, h, 8, h + 4, 12] : 8,
                  opacity: isPlaying ? 1 : 0.4,
                }}
                transition={{
                  duration: 0.8 + i * 0.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={`w-1.5 rounded-full transition-colors ${
                  currentPhase === "thinking"
                    ? "bg-amber-400"
                    : currentPhase === "answer"
                      ? "bg-emerald-400"
                      : "bg-indigo-400"
                }`}
              />
            ))}
          </div>

          {/* Badge de Fase Atual */}
          <div>
            {currentPhase === "question" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <Volume2 size={13} className="animate-pulse" />
                Lendo Pergunta...
              </span>
            )}
            {currentPhase === "thinking" && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                <BrainCircuit size={13} className="animate-spin" />
                Pausa Reflexiva ({countdownRemaining}s) - Formule sua resposta!
              </span>
            )}
            {currentPhase === "answer" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 size={13} />
                Revelando Gabarito & Macete
              </span>
            )}
            {currentPhase === "idle" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">
                Pronto para começar
              </span>
            )}
            {currentPhase === "finished" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold">
                <Sparkles size={13} />
                Revisão de Áudio Concluída!
              </span>
            )}
          </div>

          {/* Texto do Card em Foco */}
          {currentCard ? (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentCard.question}
              </h3>

              <AnimatePresence>
                {currentPhase === "answer" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm leading-relaxed"
                  >
                    <p className="font-semibold">{currentCard.answer}</p>
                    {currentCard.details && (
                      <p className="text-xs text-emerald-300/80 mt-2 italic pt-2 border-t border-emerald-500/20">
                        💡 {currentCard.details}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nenhum card selecionado.</p>
          )}
        </div>

        {/* Controles Principais de Áudio */}
        <div className="space-y-5 pt-4 border-t border-slate-800/80 shrink-0">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={prev}
              disabled={currentIndex === 0}
              aria-label="Card anterior"
              className="p-3.5 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
              title="Card anterior (Seta esquerda)"
            >
              <SkipBack size={20} />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? "Pausar reprodução de áudio" : "Iniciar reprodução de áudio"}
              className="py-4 px-8 min-h-[48px] rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer min-w-36 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              <span>{isPlaying ? "Pausar" : "Ouvir Agora"}</span>
            </button>

            <button
              type="button"
              onClick={next}
              disabled={currentIndex >= totalCards - 1}
              aria-label="Próximo card"
              className="p-3.5 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
              title="Próximo card (Seta direita)"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* Barra Inferior: Configurações de Voz, Velocidade & Pausa Reflexiva */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-slate-800/80">
            {/* Seletor de Voz Neural de Estúdio */}
            {availableVoices.length > 0 && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Volume2 size={13} className="text-emerald-400 shrink-0" />
                <span className="text-slate-400 font-semibold shrink-0">
                  Voz:
                </span>
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 text-slate-200 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[210px] truncate"
                  title="Selecione a voz neural de estúdio"
                >
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      ✨ {v.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Velocidade da Voz */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Gauge size={13} className="text-indigo-400" />
                Velocidade:
              </span>
              {[0.8, 1.0, 1.25, 1.5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPlaybackSpeed(s)}
                  aria-label={`Definir velocidade para ${s} vezes`}
                  className={`px-2 py-1 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${
                    playbackSpeed === s
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Tempo de Reflexão */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Clock size={13} className="text-amber-400" />
                Pausa:
              </span>
              {[2, 3, 4, 5, 6].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setPauseDuration(sec)}
                  aria-label={`Definir pausa reflexiva para ${sec} segundos`}
                  className={`px-2 py-1 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                    pauseDuration === sec
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Dica de Fones Bluetooth */}
          <div className="text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Headphones size={13} className="text-indigo-400" />
              <span>
                Compatível com botões dos <strong>fones Bluetooth</strong> e
                tela bloqueada (MediaSession API).
              </span>
            </p>
          </div>
        </div>

        {/* Modal de Upgrade Pro de Áudio */}
        <AnimatePresence>
          {showLimitModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setShowLimitModal(false)}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Estudo Hands-Free Pro"
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-[#07090e] border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4 overflow-hidden text-left"
              >
                <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-500/15 blur-3xl" />

                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Crown size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Estudo Hands-Free Pro</h4>
                      <p className="text-[10px] text-amber-400/80 font-mono">Degustação de 15 Minutos Concluída</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLimitModal(false)}
                    aria-label="Fechar aviso de degustação"
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <p>
                    Você aproveitou seus <strong className="text-white">15 minutos gratuitos</strong> de áudio de hoje!
                  </p>
                  <p className="text-slate-400">
                    No <strong className="text-amber-300">Synapse Pro</strong>, você tem até <strong className="text-white">120 minutos diários (2 horas)</strong> de estudo hands-free contínuo, perfeito para transformar trânsito, tarefas domésticas, caminhada e academia em aprovação acelerada.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                    <span>Vozes neurais com pausa cognitiva configurável</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                    <span>Controle total via fones bluetooth (play/pause/skip)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                    <span>60 Sinapses/dia para criação ilimitada com IA</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href="/pricing"
                    onClick={() => {
                      setShowLimitModal(false);
                      handleClose();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm text-center shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Crown size={16} />
                    <span>Desbloquear 120 Minutos no Synapse Pro</span>
                    <ArrowRight size={14} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowLimitModal(false)}
                    className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    Continuar no modo visual
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
