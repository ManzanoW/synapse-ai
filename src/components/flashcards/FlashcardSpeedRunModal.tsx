"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Zap,
  X,
  Flame,
  Clock,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  CheckCircle2,
  XCircle,
  Play,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Loader2,
  HelpCircle,
} from "lucide-react";
import {
  getSpeedRunFlashcardsAction,
  recordSpeedRunSessionAction,
  SpeedRunCardItem,
} from "@/actions/flashcard-actions";

interface DeckOption {
  id: string;
  title: string;
}

interface FlashcardSpeedRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: DeckOption[];
  initialCards?: SpeedRunCardItem[];
}

type GameState = "LOBBY" | "PLAYING" | "GAME_OVER";

// Web Audio Procedural Synthesizer (0 external MP3 files needed)
class SoundFx {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playCorrect() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignora falhas de áudio
    }
  }

  playWrong() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.18);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignora falhas de áudio
    }
  }

  playCombo() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.2, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.12);
      });
    } catch {
      // Ignora
    }
  }

  playGameOver() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [440, 392, 349, 329.6]; // A4, G4, F4, E4
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.15, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.2);
      });
    } catch {
      // Ignora
    }
  }
}

const sfx = new SoundFx();

export function FlashcardSpeedRunModal({
  isOpen,
  onClose,
  decks,
  initialCards,
}: FlashcardSpeedRunModalProps) {
  const [gameState, setGameState] = useState<GameState>("LOBBY");
  const [selectedDeckId, setSelectedDeckId] = useState<string>("all");
  const [cards, setCards] = useState<SpeedRunCardItem[]>(initialCards || []);
  const [loadingCards, setLoadingCards] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Gameplay state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [totalPlayTime, setTotalPlayTime] = useState(0);

  // FX & Feedback state
  const [timeFloatingBonus, setTimeFloatingBonus] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Post-game submission
  const [submittingResult, setSubmittingResult] = useState(false);
  const [awardedXp, setAwardedXp] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Alterna som
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sfx.muted = next;
  };

  // Carrega cards ao abrir ou mudar baralho
  const loadCards = useCallback(async (deckId: string) => {
    setLoadingCards(true);
    try {
      const res = await getSpeedRunFlashcardsAction(deckId);
      if (res.success && res.data && res.data.length > 0) {
        setCards(res.data);
      } else {
        setCards([]);
      }
    } catch (err) {
      console.error("Erro ao buscar cards para speedrun:", err);
    } finally {
      setLoadingCards(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setGameState("LOBBY");
      setAwardedXp(null);
      loadCards(selectedDeckId);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, selectedDeckId, loadCards]);

  // Cronômetro de Sobrevivência
  useEffect(() => {
    if (gameState === "PLAYING") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
        setTotalPlayTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Iniciar partida
  const handleStartGame = () => {
    if (cards.length === 0) return;
    setGameState("PLAYING");
    setTimeLeft(60);
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setCorrectCount(0);
    setWrongCount(0);
    setTotalPlayTime(0);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setAwardedXp(null);
  };

  // Fim de jogo
  const handleGameOver = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState("GAME_OVER");
    sfx.playGameOver();

    // Envia resultado para servidor registrar XP
    setSubmittingResult(true);
    try {
      const res = await recordSpeedRunSessionAction({
        score,
        correctCount,
        wrongCount,
        maxCombo,
        durationSeconds: totalPlayTime || 60,
        deckId: selectedDeckId !== "all" ? selectedDeckId : undefined,
      });

      if (res.success && res.earnedXp) {
        setAwardedXp(res.earnedXp);
      }
    } catch (err) {
      console.error("Erro ao salvar resultado de speedrun:", err);
    } finally {
      setSubmittingResult(false);
    }
  };

  // Trigger floating bonus text
  const triggerTimeBonus = (text: string) => {
    setTimeFloatingBonus(text);
    setTimeout(() => {
      setTimeFloatingBonus(null);
    }, 750);
  };

  // Resposta: ACERTEI (+2s, combo, XP)
  const handleCorrect = () => {
    if (gameState !== "PLAYING") return;

    const newCombo = combo + 1;
    setCombo(newCombo);
    if (newCombo > maxCombo) {
      setMaxCombo(newCombo);
    }

    const multiplier = Math.min(newCombo, 5);
    const addedScore = 100 * multiplier;
    setScore((prev) => prev + addedScore);
    setCorrectCount((prev) => prev + 1);

    // Bônus de tempo de sobrevivência (+2s)
    setTimeLeft((prev) => Math.min(prev + 2, 99));
    triggerTimeBonus("+2s");

    if (newCombo >= 4) {
      sfx.playCombo();
    } else {
      sfx.playCorrect();
    }

    advanceCard();
  };

  // Resposta: ERREI (-5s, reset combo)
  const handleWrong = () => {
    if (gameState !== "PLAYING") return;

    setCombo(1);
    setWrongCount((prev) => prev + 1);

    // Penalidade severa de tempo (-5s)
    setTimeLeft((prev) => Math.max(0, prev - 5));
    triggerTimeBonus("-5s");

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);

    sfx.playWrong();

    if (timeLeft - 5 <= 0) {
      handleGameOver();
      return;
    }

    advanceCard();
  };

  // Avança para o próximo card ou recomeça fila se esgotar
  const advanceCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => {
      if (prev + 1 >= cards.length) {
        // Se acabar o deck, embaralha novamente para continuar o survival
        return 0;
      }
      return prev + 1;
    });
  };

  // Atalhos de teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "LOBBY") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          handleStartGame();
        }
      } else if (gameState === "PLAYING") {
        if (e.code === "Space") {
          e.preventDefault();
          setIsFlipped((prev) => !prev);
        } else if (e.code === "ArrowRight" || e.key === "1") {
          e.preventDefault();
          handleCorrect();
        } else if (e.code === "ArrowLeft" || e.key === "2") {
          e.preventDefault();
          handleWrong();
        }
      } else if (gameState === "GAME_OVER") {
        if (e.code === "KeyR" || e.code === "Enter") {
          e.preventDefault();
          handleStartGame();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!mounted || !isOpen) return null;

  const currentCard = cards[currentCardIndex];
  const progressRatio = Math.max(0, Math.min(timeLeft / 60, 1));
  const isTimeCritical = timeLeft <= 15;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        className={`relative w-full max-w-2xl bg-gradient-to-b from-[#0e1322] via-[#090d18] to-[#04060c] border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto ${
          isShaking ? "animate-bounce" : ""
        }`}
      >
        {/* Glow Superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* TOP BAR */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/10">
              <Zap size={18} className="fill-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Speed Run Arcade
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  60s
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {gameState === "PLAYING"
                  ? `${currentCard?.deckTitle || "Baralho Geral"} • Card ${currentCardIndex + 1}/${cards.length}`
                  : "Sobrevivência & Reflexo Rápido"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Áudio */}
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? "Ativar Efeitos Sonoros" : "Silenciar Áudio"}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                isMuted
                  ? "bg-slate-800/60 border-slate-700 text-slate-400"
                  : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
              }`}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Fechar */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ===================== ESTADO: LOBBY ===================== */}
        {gameState === "LOBBY" && (
          <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center text-center space-y-6 overflow-y-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/10">
              <Flame size={32} className="fill-amber-400/30" />
            </div>

            <div className="space-y-2 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Teste de Reflexo: 60 Segundos
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Pense rápido! Acerte o máximo de flashcards que conseguir antes que o tempo esgote.
              </p>
            </div>

            {/* Regras do Arcade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-left">
              <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Acerto (+2s)
                </span>
                <p className="text-[10px] text-slate-300">
                  Ganha +2 segundos no relógio e sobe o multiplicador de Combo.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                  <XCircle size={13} />
                  Erro (-5s)
                </span>
                <p className="text-[10px] text-slate-300">
                  Penalidade severa de 5s no relógio e reseta o combo de volta para 1x.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-1">
                <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                  <Flame size={13} />
                  5x Frenzy
                </span>
                <p className="text-[10px] text-slate-300">
                  Sequências perfeitas geram pontuação épica e super bônus de XP.
                </p>
              </div>
            </div>

            {/* Seletor de Baralho */}
            <div className="w-full max-w-sm space-y-2 text-left">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Escolha o Baralho:</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {cards.length} cards disponíveis
                </span>
              </label>
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="all">🌟 Todos os Flashcards (Mix Geral)</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    📚 {d.title}
                  </option>
                ))}
              </select>
            </div>

            {/* CTA */}
            <div className="w-full max-w-sm pt-2">
              <button
                type="button"
                onClick={handleStartGame}
                disabled={loadingCards || cards.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm px-6 py-3.5 rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {loadingCards ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Carregando Flashcards...</span>
                  </>
                ) : cards.length === 0 ? (
                  <span>Nenhum flashcard disponível</span>
                ) : (
                  <>
                    <Play size={16} className="fill-slate-950" />
                    <span>Começar Speed Run (60s)</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 mt-2">
                Dica: Use a tecla <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Espaço</kbd> para virar a carta.
              </p>
            </div>
          </div>
        )}

        {/* ===================== ESTADO: JOGANDO ===================== */}
        {gameState === "PLAYING" && (
          <div className="relative z-10 p-5 sm:p-7 flex flex-col flex-1 justify-between space-y-5 overflow-y-auto">
            {/* STATS HUD: TEMPO, COMBO, SCORE */}
            <div className="grid grid-cols-3 items-center gap-2 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl backdrop-blur-md relative">
              {/* Relógio & Sobrevivência */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-base transition-all ${
                    isTimeCritical
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse shadow-lg shadow-rose-500/20"
                      : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                  }`}
                >
                  {timeLeft}s
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tempo
                  </span>
                  <div className="relative">
                    <span className="text-xs font-mono font-bold text-white">
                      0:{timeLeft.toString().padStart(2, "0")}
                    </span>
                    {/* Floating text (+2s / -5s) */}
                    {timeFloatingBonus && (
                      <span
                        className={`absolute -top-3 left-8 text-xs font-black font-mono animate-out fade-out slide-out-to-top-3 duration-700 ${
                          timeFloatingBonus.startsWith("+")
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {timeFloatingBonus}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Combo Multiplier */}
              <div className="text-center">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
                  <Flame
                    size={13}
                    className={`fill-amber-400 text-amber-400 ${
                      combo >= 3 ? "animate-bounce" : ""
                    }`}
                  />
                  <span className="text-xs font-black text-amber-300 font-mono">
                    {combo}x {combo >= 5 ? "FRENZY 🔥" : "COMBO"}
                  </span>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pontos
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-amber-400">
                  {score.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Barra de Progresso do Tempo */}
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isTimeCritical
                    ? "bg-rose-500 shadow-sm shadow-rose-500/50"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm shadow-orange-500/50"
                }`}
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>

            {/* CARD DO FLASHCARD */}
            <div
              onClick={() => setIsFlipped((prev) => !prev)}
              className="group cursor-pointer min-h-[220px] sm:min-h-[260px] p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between relative shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {isFlipped ? "Verso: Resposta" : "Frente: Pergunta"}
                </span>
                <span className="text-[11px] text-slate-500">
                  Clique ou Espaço para {isFlipped ? "ocultar" : "revelar"}
                </span>
              </div>

              {/* Conteúdo do Card */}
              <div className="py-4 text-center space-y-3">
                {!isFlipped ? (
                  <h3 className="text-lg sm:text-2xl font-black text-white leading-snug">
                    {currentCard?.question || "Pergunta indisponível"}
                  </h3>
                ) : (
                  <div className="space-y-3 animate-in zoom-in-95 duration-200">
                    <p className="text-base sm:text-xl font-bold text-emerald-300 leading-snug">
                      {currentCard?.answer || "Resposta indisponível"}
                    </p>
                    {currentCard?.details && (
                      <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 max-w-md mx-auto">
                        💡 {currentCard.details}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Dica de interação */}
              <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <HelpCircle size={13} />
                <span>
                  {isFlipped
                    ? "Avalie seu desempenho abaixo"
                    : "Pressione ESPAÇO para virar"}
                </span>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO: ERREI / REVELAR / ACERTEI */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleWrong}
                className="flex items-center justify-center gap-2 p-3.5 sm:p-4 rounded-2xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/40 font-black text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-lg shadow-rose-950/30"
              >
                <XCircle size={18} />
                <span>Errei (-5s)</span>
                <span className="hidden sm:inline text-[10px] text-rose-400/80 font-mono font-normal">
                  [← ou 2]
                </span>
              </button>

              <button
                type="button"
                onClick={handleCorrect}
                className="flex items-center justify-center gap-2 p-3.5 sm:p-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/40 font-black text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-950/30"
              >
                <CheckCircle2 size={18} />
                <span>Acertei (+2s)</span>
                <span className="hidden sm:inline text-[10px] text-emerald-400/80 font-mono font-normal">
                  [→ ou 1]
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== ESTADO: GAME OVER ===================== */}
        {gameState === "GAME_OVER" && (
          <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center text-center space-y-6 overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/10">
              <Trophy size={32} />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={13} /> Speed Run Concluído
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {score.toLocaleString()} <span className="text-amber-400">Pontos</span>
              </h2>
              <p className="text-xs text-slate-400">
                Você sobreviveu por {totalPlayTime}s sob pressão de tempo!
              </p>
            </div>

            {/* Painel de Estatísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg text-left">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Acertos
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {correctCount}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Erros
                </span>
                <span className="text-xl font-black text-rose-400 font-mono">
                  {wrongCount}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Maior Combo
                </span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  {maxCombo}x
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Precisão
                </span>
                <span className="text-xl font-black text-indigo-300 font-mono">
                  {correctCount + wrongCount > 0
                    ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            {/* Recompensa de XP */}
            <div className="w-full max-w-md p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <TrendingUp size={20} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-white block">
                    Recompensa de Atividade
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Ofensiva e pontuação computadas
                  </span>
                </div>
              </div>

              <div>
                {submittingResult ? (
                  <Loader2 size={16} className="animate-spin text-amber-400" />
                ) : (
                  <span className="text-base font-black text-amber-300 font-mono">
                    +{awardedXp || 15} XP
                  </span>
                )}
              </div>
            </div>

            {/* Botões Finais */}
            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-md">
              <button
                type="button"
                onClick={handleStartGame}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>Jogar Novamente [R]</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                <span>Voltar aos Flashcards</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
