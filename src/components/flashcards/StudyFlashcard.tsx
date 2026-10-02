"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useOptimistic,
  startTransition,
} from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import {
  X,
  RotateCcw,
  AlertCircle,
  Check,
  ArrowLeft,
  RotateCw,
  Sparkles,
  Zap,
  Loader2,
  Brain,
  Award,
  Command,
  TouchpadIcon,
  HelpCircle,
  Lightbulb,
  WifiOff,
  RefreshCw,
  Headphones,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useTheme } from "@/contexts/ThemeContext";
import { useGamification } from "@/context/GamificationContext";
import { useAchievement } from "@/context/AchievementContext";
import { useSound } from "@/hooks/useSound";
import { AudioFlashcardPlayer } from "./AudioFlashcardPlayer";
import { checkNewAchievements } from "@/lib/check-achievements";
import { invalidateUserCacheAction } from "@/actions/gamification-actions";
import {
  predictNextIntervals,
  ReviewGrade,
  calculateMemoryRetention,
  getMemoryStatus,
  isLeechCard,
} from "@/lib/spaced-repetition";
import {
  generateFlashcardMnemonicAction,
  reviewFlashcardAction,
} from "@/actions/flashcard-actions";
import {
  useOfflineSync,
  enqueueOfflineReview,
  cacheOfflineDeck,
  getCachedOfflineDeck,
} from "@/lib/offline-sync";

interface Flashcard {
  id: string;
  question?: string;
  answer?: string;
  front?: string;
  back?: string;
  details?: string | null;
  topicId?: string | null;
  deckId?: string | null;
  interval?: number | null;
  easeFactor?: number | null;
  stability?: number | null;
  difficulty?: number | null;
  repetitions?: number | null;
  lapses?: number | null;
  lastReviewed?: Date | string | null;
}

interface StudyFlashcardProps {
  cards: Flashcard[];
  deckTitle?: string;
  deckId?: string;
  userId?: string;
}

export default function StudyFlashcard({
  cards: initialCards,
  deckTitle,
  deckId,
  userId,
}: StudyFlashcardProps) {
  const { isLight } = useTheme();
  const [cards, setCards] = useState<Flashcard[]>(initialCards || []);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showEbbinghausCurve, setShowEbbinghausCurve] = useState(false);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const isDraggingRef = useRef(false);
  const cardStartTimeRef = useRef(0);

  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();

  // Escuta acionamento global do modo áudio pela Command Palette
  useEffect(() => {
    const handleOpenAudio = () => setIsAudioPlayerOpen(true);
    window.addEventListener("open-audio-study", handleOpenAudio);
    return () => window.removeEventListener("open-audio-study", handleOpenAudio);
  }, []);

  useEffect(() => {
    const currentDeckId = deckId || initialCards?.[0]?.deckId || "all";
    if (initialCards && initialCards.length > 0) {
      setCards(initialCards);
      cacheOfflineDeck(currentDeckId, initialCards);
    } else {
      const cached = getCachedOfflineDeck<Flashcard[]>(currentDeckId);
      if (cached?.cards && cached.cards.length > 0) {
        setCards(cached.cards);
      }
    }
  }, [initialCards, deckId]);

  useEffect(() => {
    cardStartTimeRef.current = Date.now();
  }, []);

  const x = useMotionValue(0);
  const cardRotate = useTransform(x, [-250, 250], [-12, 12]);

  // Opacidades e escalas dinâmicas das badges baseadas no deslocamento X
  // 1. ERREI (Vermelho): < -40px (arrasto para a esquerda -> Grade 1)
  const erreiOpacity = useTransform(x, [-100, -40, 0, 10], [1, 0.6, 0, 0]);
  const erreiScale = useTransform(x, [-100, -40, 0], [1.05, 0.9, 0.75]);

  // 2. BOM (Verde): 30px a 90px (arrasto leve para a direita -> Grade 3)
  const bomOpacity = useTransform(
    x,
    [0, 30, 50, 75, 90, 110],
    [0, 0.7, 1, 1, 0.7, 0]
  );
  const bomScale = useTransform(x, [0, 30, 60, 90], [0.75, 0.9, 1.05, 0.9]);

  // 3. FÁCIL (Azul): > 90px (arrasto para a direita -> Grade 4)
  const facilOpacity = useTransform(x, [75, 90, 140], [0, 0.6, 1]);
  const facilScale = useTransform(x, [75, 90, 140], [0.8, 1, 1.1]);

  const { playCorrect, playError, playFlip } = useSound();

  const [performanceStats, setPerformanceStats] = useState({
    erros: 0,
    acertos: 0,
  });

  const { stats: gamificationStats, refreshStats } = useGamification();
  const { notifyAchievement } = useAchievement();

  const [levelUpData, setLevelUpData] = useState<{
    leveledUp: boolean;
    newLevel: number;
    title?: string;
  } | null>(null);

  const baseTotalXp = gamificationStats?.gamification?.totalXp ?? 0;

  // Reatividade Instantânea: useOptimistic para avanço visual e saldo de XP
  const [optimisticStudy, setOptimisticStudy] = useOptimistic(
    {
      index,
      totalXp: baseTotalXp,
    },
    (
      state,
      update: {
        nextIndex: number;
        xpDelta: number;
      },
    ) => ({
      index: update.nextIndex,
      totalXp: state.totalXp + update.xpDelta,
    }),
  );

  const currentIndex = optimisticStudy.index;
  const currentTotalXp = optimisticStudy.totalXp;
  const currentCard = cards[currentIndex];
  const progress =
    cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  // Estado local para mnemônicos gerados durante a sessão
  const [mnemonicOverrides, setMnemonicOverrides] = useState<Record<string, string>>({});
  const [isGeneratingMnemonic, setIsGeneratingMnemonic] = useState(false);

  // Cálculo da Retenção de Memória FSRS em Tempo Real (Curva de Ebbinghaus: R = 0.9^(t / S))
  const memoryRetention = useMemo(() => {
    if (!currentCard) return 100;
    return calculateMemoryRetention(
      currentCard.stability ?? 1.0,
      currentCard.lastReviewed ? new Date(currentCard.lastReviewed) : null,
    );
  }, [currentCard]);

  const memoryStatus = useMemo(
    () => getMemoryStatus(memoryRetention),
    [memoryRetention],
  );

  // Detecção de Card Sanguessuga (Leech / Ponto Cego)
  const isLeech = useMemo(() => {
    if (!currentCard) return false;
    return isLeechCard(currentCard.lapses ?? 0, currentCard.repetitions ?? 0);
  }, [currentCard]);

  const currentDetails = useMemo(() => {
    if (!currentCard) return null;
    return mnemonicOverrides[currentCard.id] ?? currentCard.details ?? null;
  }, [currentCard, mnemonicOverrides]);

  const handleGenerateMnemonic = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentCard || isGeneratingMnemonic) return;

      setIsGeneratingMnemonic(true);
      try {
        const res = await generateFlashcardMnemonicAction(currentCard.id);
        if (res.success && res.data) {
          setMnemonicOverrides((prev) => ({
            ...prev,
            [currentCard.id]: res.data!.details,
          }));
        }
      } catch (err) {
        console.error("Erro ao gerar mnemônico inteligente:", err);
      } finally {
        setIsGeneratingMnemonic(false);
      }
    },
    [currentCard, isGeneratingMnemonic],
  );

  // Previsão dinâmica dos próximos intervalos do card atual (FSRS)
  const projections = useMemo(() => {
    if (!currentCard) {
      return {
        1: { interval: 1, label: "1d" },
        2: { interval: 2, label: "2d" },
        3: { interval: 3, label: "3d" },
        4: { interval: 6, label: "6d" },
      };
    }
    return predictNextIntervals({
      interval: currentCard.interval,
      easeFactor: currentCard.easeFactor,
      stability: currentCard.stability,
      difficulty: currentCard.difficulty,
      repetitions: currentCard.repetitions,
    });
  }, [currentCard]);

  const frontText = currentCard
    ? currentCard.question ||
      (currentCard as unknown as Record<string, string>).front ||
      "Sem pergunta"
  : "";

  const backText = currentCard
    ? currentCard.answer ||
      (currentCard as unknown as Record<string, string>).back ||
      "Sem resposta"
  : "";

  const toggleFlip = useCallback(() => {
    playFlip();
    setIsFlipped((prev) => !prev);
  }, [playFlip]);

  const handleAnswer = useCallback(
    (grade: ReviewGrade) => {
      if (!currentCard) return;

      // 1. Efeito sonoro imediato
      if (grade >= 3) {
        playCorrect();
      } else if (grade === 1) {
        playError();
      } else {
        playFlip();
      }

      const targetCard = currentCard;
      const isLastCard = currentIndex >= cards.length - 1;
      const responseTimeMs = Math.max(0, Date.now() - cardStartTimeRef.current);
      // Requisito 3: +5 XP se errou (nota 1), +13 XP se acertou (notas 2, 3, 4)
      const xpDelta = grade === 1 ? 5 : 13;

      // 2. Transição instantânea visual do card
      setIsFlipped(false);

      if (grade < 3) {
        setPerformanceStats((prev) => ({ ...prev, erros: prev.erros + 1 }));
      } else {
        setPerformanceStats((prev) => ({
          ...prev,
          acertos: prev.acertos + 1,
        }));
      }

      if (isLastCard) {
        setIsFinished(true);
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { x: 0.5, y: 0.55 },
          colors: ["#818cf8", "#c084fc", "#38bdf8", "#34d399", "#ffffff"],
        });

        checkNewAchievements(notifyAchievement);
      }

      // 3. Reatividade Instantânea com useOptimistic gerenciada via startTransition
      startTransition(async () => {
        setOptimisticStudy({
          nextIndex: currentIndex + 1,
          xpDelta,
        });

        try {
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            enqueueOfflineReview({
              cardId: targetCard.id,
              grade,
              rating: grade,
              responseTimeMs,
            });
            setIndex((prev) => prev + 1);
            return;
          }

          const previousLevel = gamificationStats?.gamification?.level ?? 1;

          // Chamada da Server Action reviewFlashcardAction em segundo plano
          const res = await reviewFlashcardAction({
            cardId: targetCard.id,
            rating: grade,
            grade,
            responseTimeMs,
          });

          if (res.success && res.data) {
            setIndex((prev) => prev + 1);

            window.dispatchEvent(
              new CustomEvent("xp-updated", {
                detail: {
                  totalXp: res.data.totalXp,
                  earnedXp: res.data.earnedXp,
                  levelInfo: res.data.levelInfo,
                },
              }),
            );

            if (res.data.levelInfo?.level && res.data.levelInfo.level > previousLevel) {
              const newLevel = res.data.levelInfo.level;
              const newTitle = res.data.levelInfo.title || "Mestre da Retenção";

              setLevelUpData({
                leveledUp: true,
                newLevel,
                title: newTitle,
              });
            }

            if (userId) {
              invalidateUserCacheAction(userId).catch(() => {});
            }
            refreshStats().catch(() => {});
          } else {
            console.warn("Falha no processamento da revisão:", res.error);
            enqueueOfflineReview({
              cardId: targetCard.id,
              grade,
              rating: grade,
              responseTimeMs,
            });
            // Em caso de falha, não chama setIndex: reverte suavemente o useOptimistic
          }
        } catch (error) {
          console.warn("Falha de rede na chamada de revisão. Revertendo estado suavemente:", error);
          enqueueOfflineReview({
            cardId: targetCard.id,
            grade,
            rating: grade,
            responseTimeMs,
          });
          // Reversão suave sem quebrar o layout
        }
      });
    },
    [
      cards.length,
      currentCard,
      currentIndex,
      gamificationStats?.gamification?.level,
      notifyAchievement,
      playCorrect,
      playError,
      playFlip,
      refreshStats,
      setOptimisticStudy,
      userId,
    ],
  );

  // Reseta a posição do card para o centro ao avançar ou reiniciar e reinicia cronômetro do card
  useEffect(() => {
    x.set(0);
    setShowEbbinghausCurve(false);
    cardStartTimeRef.current = Date.now();
  }, [currentIndex, x]);

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;

    // Reseta a flag com leve delay para prevenir trigger acidental de click/flip
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 80);

    // 1. Arrasto para a esquerda (< -40px ou velocidade rápida para a esquerda): Grade 1 ("ERREI")
    if (offsetX < -40 || (offsetX < -20 && velocityX < -250)) {
      handleAnswer(1);
    }
    // 2. Arrasto para a direita (> 90px ou velocidade rápida para a direita): Grade 4 ("FÁCIL")
    else if (offsetX > 90 || (offsetX > 70 && velocityX > 350)) {
      handleAnswer(4);
    }
    // 3. Arrasto leve para a direita (entre 30px e 90px): Grade 3 ("BOM")
    else if (offsetX >= 30 && offsetX <= 90) {
      handleAnswer(3);
    }
  };

  const handleCardClick = () => {
    if (isDraggingRef.current) return;
    toggleFlip();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evita acionar atalhos caso o foco esteja em algum input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (isFinished || !currentCard) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (!isFlipped) {
          toggleFlip();
        } else {
          // Padrão de Alta Velocidade Anki/SuperMemo: quando virado, Espaço confirma BOM (3)
          handleAnswer(3);
        }
      } else if (isFlipped) {
        if (e.key === "1") {
          e.preventDefault();
          handleAnswer(1);
        } else if (e.key === "2") {
          e.preventDefault();
          handleAnswer(2);
        } else if (e.key === "3") {
          e.preventDefault();
          handleAnswer(3);
        } else if (e.key === "4") {
          e.preventDefault();
          handleAnswer(4);
        }
      }

      // Atalho H: Alternar Modo de Áudio Hands-Free
      if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        setIsAudioPlayerOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, isFinished, currentCard, handleAnswer, toggleFlip, setIsAudioPlayerOpen]);

  if (!cards || cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[85vh] p-4">
        <div className="w-full max-w-md p-6 sm:p-8 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-2xl text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-100">Baralho Vazio</h3>
          <p className="text-slate-400 text-xs">
            Adicione novos cards para continuar.
          </p>
          <Link
            href="/flashcards/decks"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs"
          >
            <ArrowLeft size={15} /> Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[82vh] p-0 sm:p-4 relative overflow-hidden pb-12">
      {/* Luz de Fundo (Ambient Glow) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[500px] h-[350px] bg-indigo-600/15 rounded-full blur-[130px] opacity-70" />
        <div className="absolute top-1/4 w-[280px] h-[200px] bg-violet-600/15 rounded-full blur-[100px]" />
      </div>

      {/* Contêiner Principal Expandido para visualização imersiva e clara */}
      <div className={`w-full max-w-4xl lg:max-w-5xl p-3 sm:p-8 md:p-10 rounded-none sm:rounded-[2.5rem] sm:backdrop-blur-3xl select-none transition-all relative z-10 ${
        isLight
          ? "bg-transparent sm:bg-white/95 sm:border sm:border-slate-200/90 sm:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
          : "bg-transparent sm:bg-[#090d16]/90 sm:border sm:border-slate-800/80 sm:shadow-[0_0_60px_-10px_rgba(99,102,241,0.25)]"
      }`}>
        <div className="hidden sm:block absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        {isFinished ? (
          <div className="text-center py-6 sm:py-8 space-y-5 sm:space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500/20 via-indigo-500/20 to-slate-900 border border-emerald-500/40 rounded-3xl flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)] rotate-3">
                <Award
                  size={36}
                  className="sm:w-10 sm:h-10"
                  strokeWidth={1.75}
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border backdrop-blur-md ${
                isLight
                  ? "text-emerald-700 bg-emerald-50 border-emerald-300"
                  : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
              }`}>
                <Sparkles size={12} /> Sessão Concluída
              </span>
              <h2 className={`text-2xl sm:text-4xl font-black pt-1 ${
                isLight
                  ? "text-slate-900"
                  : "text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text"
              }`}>
                Sinapses Reforçadas!
              </h2>
              <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Você concluiu a revisão de{" "}
                <strong className={isLight ? "text-indigo-600 font-semibold" : "text-indigo-300 font-semibold"}>
                  {cards.length} cards
                </strong>{" "}
                com sucesso.
              </p>
            </div>

            {levelUpData?.leveledUp && (
              <div className="mx-auto max-w-md rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-900/50 via-indigo-900/50 to-purple-900/50 p-4 shadow-[0_0_25px_rgba(168,85,247,0.3)] animate-bounce">
                <p className="text-xs font-black tracking-wider text-purple-300 uppercase">
                  🎉 LEVEL UP ALCANÇADO!
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  Você subiu para o{" "}
                  <span className="text-amber-300">
                    Nível {levelUpData.newLevel}! 🚀
                  </span>
                </p>
              </div>
            )}

            <div className={`grid grid-cols-2 gap-3 max-w-xs mx-auto p-3.5 sm:p-4 rounded-3xl backdrop-blur-md shadow-inner ${
              isLight
                ? "bg-slate-50 border border-slate-200"
                : "bg-slate-900/40 border border-white/5"
            }`}>
              <div className={`pr-2 border-r ${isLight ? "border-slate-200" : "border-slate-800/80"}`}>
                <span className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Dominados
                </span>
                <span className="text-lg sm:text-xl font-black text-emerald-500 font-mono tracking-tight">
                  {performanceStats.acertos}
                </span>
              </div>
              <div className="pl-2">
                <span className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Revisar
                </span>
                <span className="text-lg sm:text-xl font-black text-rose-500 font-mono tracking-tight">
                  {performanceStats.erros}
                </span>
              </div>
            </div>

            <div className={`text-xs p-3.5 rounded-2xl max-w-md mx-auto flex items-center gap-3 text-left border ${
              isLight
                ? "bg-indigo-50/70 border-indigo-200/80 text-indigo-950"
                : "text-indigo-300/90 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border-indigo-500/20"
            }`}>
              <div className={`p-2 rounded-xl border shrink-0 ${
                isLight
                  ? "bg-indigo-100 border-indigo-200 text-indigo-700"
                  : "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
              }`}>
                <Brain size={18} />
              </div>
              <span className="text-[11px] leading-relaxed">
                <strong>Algoritmo FSRS Calibrado:</strong> O intervalo ideal para a
                próxima repetição foi calculado com base na estabilidade de memória e acurácia da disciplina.
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => {
                  setIndex(0);
                  setIsFlipped(false);
                  setIsFinished(false);
                  setPerformanceStats({ erros: 0, acertos: 0 });
                  setLevelUpData(null);
                }}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold text-xs transition-all active:scale-95 shadow-sm cursor-pointer border ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                    : "bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300"
                }`}
              >
                <RotateCw size={14} /> Recomeçar
              </button>

              <Link
                href="/flashcards/decks"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold text-xs transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] active:scale-95"
              >
                <ArrowLeft size={15} /> Finalizar
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Topbar compacta */}
            <div className="flex items-center justify-between mb-3 relative z-10 px-1">
              <Link
                href="/flashcards/decks"
                className={`group inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors truncate max-w-[200px] sm:max-w-none ${
                  isLight ? "text-slate-600 hover:text-indigo-600" : "text-slate-400 hover:text-indigo-300"
                }`}
              >
                <ArrowLeft
                  size={14}
                  className="group-hover:-translate-x-1 transition-transform text-indigo-500 shrink-0"
                />
                <span className="truncate">
                  {deckTitle || "Sair do Estudo"}
                </span>
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                {(!isOnline || pendingCount > 0) && (
                  <button
                    type="button"
                    onClick={triggerSync}
                    disabled={isSyncing || !isOnline}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-500 dark:text-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
                    title={
                      !isOnline
                        ? "Sem conexão: revisões salvas localmente no dispositivo"
                        : "Clique para sincronizar com o servidor"
                    }
                  >
                    <WifiOff size={11} className="text-amber-500 dark:text-amber-400" />
                    <span>{!isOnline ? "Offline" : `${pendingCount} na fila`}</span>
                    {isSyncing && (
                      <RefreshCw size={10} className="animate-spin text-amber-500 dark:text-amber-300" />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsAudioPlayerOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
                    isLight
                      ? "bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700"
                      : "bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300"
                  }`}
                  title="Estudo com áudio contínuo para fones de ouvido (Atalho: H)"
                >
                  <Headphones size={13} className="text-indigo-500 dark:text-indigo-400" />
                  <span className="hidden sm:inline">Modo Fones</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border hidden sm:inline ${
                    isLight
                      ? "bg-indigo-200/60 border-indigo-300 text-indigo-800"
                      : "bg-indigo-500/25 border-indigo-500/40 text-indigo-300"
                  }`}>
                    H
                  </span>
                </button>

                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold font-mono shadow-inner ${
                    isLight
                      ? "bg-amber-50 border border-amber-200/90 text-amber-800"
                      : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                  }`}
                  title="Saldo de XP em tempo real"
                >
                  <Zap size={11} className={isLight ? "text-amber-600 fill-amber-600" : "text-amber-400 fill-amber-400"} />
                  <span>{currentTotalXp} XP</span>
                </div>

                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono shadow-inner ${
                  isLight
                    ? "bg-slate-100 border border-slate-200 text-slate-700"
                    : "bg-slate-900/90 border border-slate-800 text-slate-300"
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {currentIndex + 1}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600">/</span>
                  <span className="text-slate-500 dark:text-slate-400">{cards.length}</span>
                </div>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="mb-4 relative z-10 px-1">
              <div className={`h-1.5 w-full rounded-full overflow-hidden border p-0.5 shadow-inner ${
                isLight
                  ? "bg-slate-100 border-slate-200"
                  : "bg-slate-900/90 border-slate-800/80"
              }`}>
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Flashcard 3D Container com Framer Motion Swipe & Badges Dinâmicas */}
            <motion.div
              style={{ x, rotate: cardRotate, perspective: 1200 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.75}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onClick={handleCardClick}
              className="relative w-full min-h-[350px] sm:min-h-[440px] md:min-h-[500px] mb-4 sm:mb-5 cursor-grab active:cursor-grabbing group flex flex-col select-none touch-none"
            >
              {/* BADGE ERREI: Arrasto para a esquerda (< 0px) -> Grade 1 */}
              <motion.div
                style={{ opacity: erreiOpacity, scale: erreiScale }}
                className="pointer-events-none absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2 rounded-2xl border-2 border-rose-500/90 bg-rose-950/90 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-black tracking-widest text-rose-200 shadow-[0_0_30px_rgba(244,63,94,0.6)] backdrop-blur-md rotate-6"
              >
                <X size={18} strokeWidth={3} className="text-rose-400" />
                <span>ERREI</span>
              </motion.div>

              {/* BADGE BOM: Arrasto leve para a direita (0px a 150px) -> Grade 3 */}
              <motion.div
                style={{ opacity: bomOpacity, scale: bomScale }}
                className="pointer-events-none absolute top-4 left-4 sm:top-6 sm:left-6 z-30 flex items-center gap-2 rounded-2xl border-2 border-emerald-500/90 bg-emerald-950/90 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-black tracking-widest text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.6)] backdrop-blur-md -rotate-6"
              >
                <Check size={18} strokeWidth={3} className="text-emerald-400" />
                <span>BOM</span>
              </motion.div>

              {/* BADGE FÁCIL: Arrasto longo para a direita (> 150px) -> Grade 4 */}
              <motion.div
                style={{ opacity: facilOpacity, scale: facilScale }}
                className="pointer-events-none absolute top-4 left-4 sm:top-6 sm:left-6 z-30 flex items-center gap-2 rounded-2xl border-2 border-blue-400/90 bg-blue-950/90 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-black tracking-widest text-blue-200 shadow-[0_0_30px_rgba(59,130,246,0.7)] backdrop-blur-md -rotate-12"
              >
                <Zap size={18} strokeWidth={3} className="text-blue-400 fill-blue-400" />
                <span>FÁCIL</span>
              </motion.div>

              <div
                className="w-full flex-1 relative will-change-transform"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: "transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* FRENTE DO CARD */}
                <div
                  className={`absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl p-4 sm:p-10 md:p-12 flex flex-col justify-between text-center backdrop-blur-2xl transition-colors duration-300 ${
                    isLight
                      ? "bg-white border border-slate-200/90 shadow-[0_12px_40px_-10px_rgba(15,23,42,0.1)] border-t-indigo-500"
                      : "bg-gradient-to-b from-[#0c101c] via-[#080b15] to-[#05070f] border border-indigo-500/25 group-hover:border-indigo-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-t-indigo-400/40"
                  }`}
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="w-full flex justify-between items-center relative z-10">
                    <span className="text-[10px] sm:text-xs font-extrabold tracking-widest text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-lg uppercase backdrop-blur-md">
                      Pergunta
                    </span>
                    
                      {/* Medidor de Retenção FSRS e Indicador de Leech com Curva de Ebbinghaus Visual */}
                      <div className="flex items-center gap-2">
                        {isLeech && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                            <AlertCircle size={11} />
                            Ponto Cego
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEbbinghausCurve((prev) => !prev);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono font-bold shadow-sm transition-all hover:scale-105 cursor-pointer ${memoryStatus.bgBadge} ${memoryStatus.textBadge} ${memoryStatus.borderBadge}`}
                          title="Clique para ver a Curva de Esquecimento de Ebbinghaus"
                        >
                          <Brain size={12} />
                          <span>Retenção {memoryRetention}%</span>
                          <span className="w-8 h-1.5 bg-black/30 dark:bg-black/40 rounded-full overflow-hidden inline-flex">
                            <span
                              className={`h-full rounded-full transition-all duration-300 ${
                                memoryRetention >= 85
                                  ? "bg-emerald-400"
                                  : memoryRetention >= 70
                                  ? "bg-amber-400"
                                  : "bg-rose-400"
                              }`}
                              style={{ width: `${Math.min(100, memoryRetention)}%` }}
                            />
                          </span>
                          <span className="text-[9px] opacity-70">📈</span>
                        </button>
                      </div>
                    </div>

                  {/* Popover / Drawer da Curva de Esquecimento de Ebbinghaus */}
                  <AnimatePresence>
                    {showEbbinghausCurve && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-30 my-2 p-3.5 rounded-2xl bg-slate-950/95 border border-indigo-500/40 text-left shadow-2xl backdrop-blur-2xl space-y-2.5 max-w-md mx-auto"
                      >
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>📈 Curva de Ebbinghaus</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                                FSRS Pro
                              </span>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowEbbinghausCurve(false)}
                            className="text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Gráfico SVG da Curva Exponencial */}
                        <div className="relative h-20 w-full bg-slate-900/80 rounded-xl p-2 border border-white/5 flex items-end">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60">
                            <defs>
                              <linearGradient id="ebbinghaus-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#818cf8" />
                                <stop offset="50%" stopColor="#38bdf8" />
                                <stop offset="100%" stopColor="#f43f5e" />
                              </linearGradient>
                            </defs>
                            {/* Linha crítica de 70% */}
                            <line x1="0" y1="24" x2="200" y2="24" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
                            {/* Curva R = e^(-t/S) */}
                            <path
                              d="M 0,6 Q 40,12 80,24 T 200,52"
                              fill="none"
                              stroke="url(#ebbinghaus-grad)"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            {/* Ponto Atual */}
                            <circle
                              cx={Math.max(10, Math.min(190, 200 - (memoryRetention / 100) * 190))}
                              cy={Math.max(6, Math.min(54, 60 - (memoryRetention / 100) * 54))}
                              r="4.5"
                              fill="#38bdf8"
                              className="animate-pulse shadow-lg"
                            />
                          </svg>
                          <span className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-500">
                            Tempo (dias) ➔
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                          <span>
                            Estabilidade: <strong>{currentCard?.stability ? `${currentCard.stability.toFixed(1)}d` : "1d"}</strong>
                          </span>
                          <span>
                            Declínio crítico: <strong>&lt; 70%</strong>
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Banner de Intervenção para Ponto Cego (Leech) */}
                  {isLeech && (
                    <div className="relative z-10 my-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center justify-between gap-2 max-w-lg mx-auto">
                      <div className="flex items-center gap-2 text-left">
                        <AlertCircle size={14} className="shrink-0 text-amber-400" />
                        <span className="text-[11px] leading-tight">Card com falhas repetidas. Fixe com um macete prático!</span>
                      </div>
                      <button
                        onClick={handleGenerateMnemonic}
                        disabled={isGeneratingMnemonic}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
                      >
                        {isGeneratingMnemonic ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Sparkles size={11} className="text-amber-400" />
                        )}
                        <span>Macete IA</span>
                      </button>
                    </div>
                  )}

                  <div className="my-auto space-y-4 sm:space-y-5 max-w-2xl sm:max-w-3xl mx-auto relative z-10 py-4 sm:py-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-[0_0_25px_rgba(99,102,241,0.15)]">
                      <HelpCircle size={26} />
                    </div>
                    <h2 className={`text-lg sm:text-2xl md:text-3xl font-bold leading-relaxed tracking-tight select-text ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}>
                      {frontText}
                    </h2>
                  </div>

                  {/* Instrução de Ação Integrada */}
                  <div className="inline-flex items-center justify-center relative z-10">
                    {/* Exclusivo Mobile */}
                    <div className="sm:hidden inline-flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-300 font-medium bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/20 px-3.5 py-1.5 rounded-full backdrop-blur-md">
                      <TouchpadIcon
                        size={12}
                        className="animate-pulse text-indigo-500 dark:text-indigo-400"
                      />
                      <span>Toque para virar • Deslize para avaliar</span>
                    </div>

                    {/* Exclusivo Desktop */}
                    <div className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold">
                      <span className={isLight ? "text-slate-500" : "text-slate-400"}>Arraste para avaliar ou</span>
                      <kbd className={`px-2.5 py-1 rounded-md text-xs font-mono shadow-sm flex items-center gap-1 ${
                        isLight
                          ? "bg-slate-100 text-slate-800 border border-slate-300"
                          : "bg-slate-900 text-slate-200 border border-slate-700/80 shadow-md"
                      }`}>
                        <Command size={11} /> Espaço
                      </kbd>
                      <span className={isLight ? "text-slate-500" : "text-slate-400"}>para virar</span>
                    </div>
                  </div>
                </div>

                {/* VERSO DO CARD */}
                <div
                  className={`absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl p-4 sm:p-10 md:p-12 flex flex-col justify-between text-center backdrop-blur-2xl transition-colors duration-300 ${
                    isLight
                      ? "bg-white border-2 border-emerald-500/40 shadow-[0_15px_35px_rgba(16,185,129,0.1)] text-slate-900"
                      : "bg-gradient-to-b from-[#09151c] via-[#080b15] to-[#05070f] border border-emerald-500/30 rounded-2xl sm:rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-t-emerald-400/40 text-slate-100"
                  }`}
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="w-full flex justify-between items-center">
                    <span className={`text-[10px] sm:text-xs font-extrabold tracking-widest px-3 py-1 rounded-lg uppercase backdrop-blur-md ${
                      isLight
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-300"
                        : "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30"
                    }`}>
                      Resposta
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-mono tracking-wider ${
                        isLight ? "text-emerald-700 font-semibold" : "text-emerald-400/80"
                      }`}>
                        FSRS • S: {currentCard?.stability ? `${currentCard.stability.toFixed(1)}d` : "1d"}
                      </span>
                    </div>
                  </div>

                  <div className="my-auto space-y-4 max-w-2xl sm:max-w-3xl mx-auto overflow-y-auto max-h-72 sm:max-h-96 px-2 custom-scrollbar py-3">
                    <h3 className={`text-base sm:text-xl md:text-2xl font-semibold leading-relaxed select-text ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}>
                      {backText}
                    </h3>

                    {/* Mnemônico / Detalhes de Aprendizagem */}
                    {currentDetails ? (
                      <div className={`text-[11px] sm:text-xs p-3.5 rounded-xl leading-relaxed text-left shadow-inner space-y-2 border ${
                        isLight
                          ? "bg-slate-50 border-slate-200 text-slate-800"
                          : "bg-slate-900/90 border-indigo-500/30 text-slate-200"
                      }`}>
                        {currentDetails.includes("💡 Mnemônico IA:") || currentDetails.includes("💡 Macete IA:") ? (
                          <>
                            <div className={`flex items-center gap-1.5 font-bold text-xs border-b pb-1.5 ${
                              isLight ? "text-amber-700 border-amber-200" : "text-amber-300 border-white/10"
                            }`}>
                              <Lightbulb size={14} className={isLight ? "text-amber-600" : "text-amber-400"} />
                              <span>Macete de Memorização</span>
                            </div>
                            <div className={`whitespace-pre-line font-medium ${
                              isLight ? "text-indigo-950" : "text-indigo-100"
                            }`}>
                              {currentDetails}
                            </div>
                          </>
                        ) : (
                          <p className={`whitespace-pre-line ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                            {currentDetails}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="pt-1">
                        <button
                          onClick={handleGenerateMnemonic}
                          disabled={isGeneratingMnemonic}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95 border ${
                            isLight
                              ? "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                              : "bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/30 text-indigo-300"
                          }`}
                        >
                          {isGeneratingMnemonic ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Sparkles size={12} className={isLight ? "text-indigo-600" : "text-indigo-400"} />
                          )}
                          <span>Criar Macete com IA</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <span className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-bold ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}>
                    Classifique sua facilidade
                  </span>
                </div>
              </div>
            </motion.div>

            {/* BOTÕES DE FSRS COM ERGONOMIA ESTILO ANKI E ALTO CONTRASTE */}
            <div
              className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 transition-all duration-300 ${
                isFlipped
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3 pointer-events-none"
              }`}
            >
              {[
                {
                  label: "ERREI",
                  sublabel: "Again",
                  grade: 1 as ReviewGrade,
                  key: "1",
                  icon: RotateCcw,
                  interval: projections[1]?.label ?? "1d",
                  style: isLight
                    ? "bg-rose-50/90 hover:bg-rose-100 border-rose-200 text-rose-700 hover:border-rose-300 shadow-sm"
                    : "from-rose-950/40 via-rose-900/20 to-slate-900/80 hover:from-rose-900/50 hover:to-slate-900 border-rose-500/40 text-rose-300 hover:border-rose-400/80 shadow-[0_0_20px_-5px_rgba(244,63,94,0.25)]",
                  badgeStyle: isLight
                    ? "bg-rose-100 text-rose-800 border-rose-200"
                    : "bg-rose-500/20 text-rose-200 border-rose-500/30",
                  kbdStyle: isLight
                    ? "bg-white text-rose-700 border-rose-200 shadow-xs"
                    : "bg-slate-950/80 text-rose-200 border-rose-500/30",
                },
                {
                  label: "DIFÍCIL",
                  sublabel: "Hard",
                  grade: 2 as ReviewGrade,
                  key: "2",
                  icon: AlertCircle,
                  interval: projections[2]?.label ?? "2d",
                  style: isLight
                    ? "bg-amber-50/90 hover:bg-amber-100 border-amber-200 text-amber-800 hover:border-amber-300 shadow-sm"
                    : "from-amber-950/40 via-amber-900/20 to-slate-900/80 hover:from-amber-900/50 hover:to-slate-900 border-amber-500/40 text-amber-300 hover:border-amber-400/80 shadow-[0_0_20px_-5px_rgba(245,158,11,0.25)]",
                  badgeStyle: isLight
                    ? "bg-amber-100 text-amber-900 border-amber-200"
                    : "bg-amber-500/20 text-amber-200 border-amber-500/30",
                  kbdStyle: isLight
                    ? "bg-white text-amber-800 border-amber-200 shadow-xs"
                    : "bg-slate-950/80 text-amber-200 border-amber-500/30",
                },
                {
                  label: "BOM",
                  sublabel: "Good",
                  grade: 3 as ReviewGrade,
                  key: "3 • Espaço",
                  icon: Check,
                  interval: projections[3]?.label ?? "4d",
                  style: isLight
                    ? "bg-emerald-50/90 hover:bg-emerald-100 border-emerald-300 text-emerald-800 hover:border-emerald-400 shadow-sm ring-1 ring-emerald-400/30 font-semibold"
                    : "from-emerald-950/40 via-emerald-900/20 to-slate-900/80 hover:from-emerald-900/50 hover:to-slate-900 border-emerald-500/40 text-emerald-300 hover:border-emerald-400/80 shadow-[0_0_20px_-5px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/20",
                  badgeStyle: isLight
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
                  kbdStyle: isLight
                    ? "bg-white text-emerald-900 border-emerald-300 shadow-xs font-semibold"
                    : "bg-slate-950/80 text-emerald-200 border-emerald-500/30 font-semibold",
                },
                {
                  label: "FÁCIL",
                  sublabel: "Easy",
                  grade: 4 as ReviewGrade,
                  key: "4",
                  icon: Zap,
                  interval: projections[4]?.label ?? "7d",
                  style: isLight
                    ? "bg-indigo-50/90 hover:bg-indigo-100 border-indigo-200 text-indigo-700 hover:border-indigo-300 shadow-sm"
                    : "from-indigo-950/40 via-indigo-900/20 to-slate-900/80 hover:from-indigo-900/50 hover:to-slate-900 border-indigo-500/40 text-indigo-300 hover:border-indigo-400/80 shadow-[0_0_20px_-5px_rgba(99,102,241,0.25)]",
                  badgeStyle: isLight
                    ? "bg-indigo-100 text-indigo-900 border-indigo-200"
                    : "bg-indigo-500/20 text-indigo-200 border-indigo-500/30",
                  kbdStyle: isLight
                    ? "bg-white text-indigo-800 border-indigo-200 shadow-xs"
                    : "bg-slate-950/80 text-indigo-200 border-indigo-500/30",
                },
              ].map((btn) => (
                <motion.button
                  key={btn.label}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnswer(btn.grade);
                  }}
                  className={`group relative flex flex-col items-center justify-center gap-1 py-3 px-2 sm:py-3.5 sm:px-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isLight ? "bg-white" : "bg-gradient-to-b backdrop-blur-xl"
                  } ${btn.style}`}
                >
                  <kbd className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-mono border transition-opacity absolute top-2 right-2 ${btn.kbdStyle}`}>
                    {btn.key}
                  </kbd>

                  <btn.icon
                    size={18}
                    className="group-hover:scale-110 transition-transform my-0.5"
                  />

                  <span className="font-black text-[11px] sm:text-xs tracking-wider">
                    {btn.label}
                  </span>

                  {/* Projeção Visual do Próximo Intervalo */}
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-tight mt-0.5 ${btn.badgeStyle}`}
                  >
                    <span>{btn.interval}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* PLAYER DE ESTUDO HANDS-FREE / FONES DE OUVIDO */}
      <AudioFlashcardPlayer
        isOpen={isAudioPlayerOpen}
        onClose={() => setIsAudioPlayerOpen(false)}
        cards={cards}
        deckTitle={deckTitle}
        initialIndex={currentIndex}
      />
    </div>
  );
}
