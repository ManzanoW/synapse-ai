"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useOptimistic,
  useTransition,
  useMemo,
} from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
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
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useGamification } from "@/context/GamificationContext";
import { useAchievement } from "@/context/AchievementContext";
import { useSound } from "@/hooks/useSound";
import { checkNewAchievements } from "@/lib/check-achievements";
import { invalidateUserCacheAction } from "@/actions/gamification-actions";
import {
  predictNextIntervals,
  ReviewGrade,
} from "@/lib/spaced-repetition";

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
}

interface StudyFlashcardProps {
  cards: Flashcard[];
  deckTitle?: string;
  deckId?: string;
  userId?: string;
}

interface OptimisticState {
  index: number;
  acertos: number;
  erros: number;
}

export default function StudyFlashcard({
  cards,
  deckTitle,
  userId,
}: StudyFlashcardProps) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<ReviewGrade | null>(null);
  const isDraggingRef = useRef(false);
  const cardStartTimeRef = useRef(Date.now());

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

  const [, startTransition] = useTransition();
  const { playCorrect, playError, playFlip } = useSound();

  const [performanceStats, setPerformanceStats] = useState({
    erros: 0,
    acertos: 0,
  });

  const [optimisticState, setOptimisticState] = useOptimistic<
    OptimisticState,
    { grade: ReviewGrade }
  >(
    { index, acertos: performanceStats.acertos, erros: performanceStats.erros },
    (currentState, action) => {
      const isSuccess = action.grade >= 3;
      return {
        index: Math.min(currentState.index + 1, cards.length),
        acertos: isSuccess ? currentState.acertos + 1 : currentState.acertos,
        erros: !isSuccess ? currentState.erros + 1 : currentState.erros,
      };
    },
  );

  const { stats: gamificationStats, refreshStats } = useGamification();
  const { notifyAchievement } = useAchievement();

  const [levelUpData, setLevelUpData] = useState<{
    leveledUp: boolean;
    newLevel: number;
    title?: string;
  } | null>(null);

  const currentIndex = optimisticState.index;
  const currentCard = cards[currentIndex];
  const progress =
    cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

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
    async (grade: ReviewGrade) => {
      if (!currentCard) return;

      // Efeito sonoro imediato
      if (grade >= 3) {
        playCorrect();
      } else if (grade === 1) {
        playError();
      } else {
        playFlip();
      }

      setSelectedGrade(grade);
      setIsFlipped(false);

      const isLastCard = index >= cards.length - 1;

      startTransition(() => {
        setOptimisticState({ grade });
      });

      const responseTimeMs = Math.max(0, Date.now() - cardStartTimeRef.current);

      try {
        const previousLevel = gamificationStats?.gamification?.level ?? 1;

        const [resReview] = await Promise.all([
          fetch("/api/flashcards/review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cardId: currentCard.id,
              grade,
              rating: grade,
              responseTimeMs,
            }),
          }),
          fetch("/api/review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cardId: currentCard.id,
              flashcardId: currentCard.id,
              topicId:
                currentCard.topicId || currentCard.deckId || currentCard.id,
              grade: grade === 1 ? 0 : grade === 2 ? 3 : grade === 3 ? 4 : 5,
              source: "FLASHCARD",
            }),
          }),
        ]);

        if (resReview.ok) {
          const data = await resReview.json();

          window.dispatchEvent(
            new CustomEvent("xp-updated", {
              detail: {
                totalXp: data.totalXp,
                earnedXp: data.earnedXp,
                levelInfo: data.levelInfo,
              },
            }),
          );

          if (data.levelInfo?.level && data.levelInfo.level > previousLevel) {
            const newLevel = data.levelInfo.level;
            const newTitle = data.levelInfo.title || "Mestre da Retenção";

            setLevelUpData({
              leveledUp: true,
              newLevel,
              title: newTitle,
            });
          }
        }

        if (userId) {
          await invalidateUserCacheAction(userId);
        }
        await refreshStats();
      } catch (error) {
        console.error("Erro ao sincronizar revisão do flashcard:", error);
      } finally {
        setIndex((prev) => prev + 1);
        if (grade < 3) {
          setPerformanceStats((prev) => ({ ...prev, erros: prev.erros + 1 }));
        } else {
          setPerformanceStats((prev) => ({
            ...prev,
            acertos: prev.acertos + 1,
          }));
        }
        setSelectedGrade(null);
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
    },
    [
      index,
      cards,
      currentCard,
      gamificationStats,
      refreshStats,
      notifyAchievement,
      setOptimisticState,
      userId,
      playCorrect,
      playError,
      playFlip,
    ],
  );

  // Reseta a posição do card para o centro ao avançar ou reiniciar e reinicia cronômetro do card
  useEffect(() => {
    x.set(0);
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
        toggleFlip();
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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, isFinished, currentCard, handleAnswer, toggleFlip]);

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

      {/* Contêiner Principal */}
      <div className="w-full max-w-2xl p-3 sm:p-7 md:p-8 bg-transparent sm:bg-[#090d16]/90 sm:border sm:border-slate-800/80 rounded-none sm:rounded-[2.5rem] sm:backdrop-blur-3xl sm:shadow-[0_0_50px_-10px_rgba(99,102,241,0.2)] select-none transition-all relative z-10">
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
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-md">
                <Sparkles size={12} /> Sessão Concluída
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text pt-1">
                Sinapses Reforçadas!
              </h2>
              <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                Você concluiu a revisão de{" "}
                <strong className="text-indigo-300 font-semibold">
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

            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto bg-slate-900/40 border border-white/5 p-3.5 sm:p-4 rounded-3xl backdrop-blur-md shadow-inner">
              <div className="border-r border-slate-800/80 pr-2">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Dominados
                </span>
                <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono tracking-tight">
                  {optimisticState.acertos}
                </span>
              </div>
              <div className="pl-2">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Revisar
                </span>
                <span className="text-lg sm:text-xl font-black text-rose-400 font-mono tracking-tight">
                  {optimisticState.erros}
                </span>
              </div>
            </div>

            <div className="text-xs text-indigo-300/90 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 p-3.5 rounded-2xl max-w-md mx-auto flex items-center gap-3 text-left">
              <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shrink-0">
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
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-2xl font-semibold text-xs transition-all active:scale-95 shadow-md cursor-pointer"
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
                className="group inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-300 transition-colors truncate max-w-[200px] sm:max-w-none"
              >
                <ArrowLeft
                  size={14}
                  className="group-hover:-translate-x-1 transition-transform text-indigo-400 shrink-0"
                />
                <span className="truncate">
                  {deckTitle || "Sair do Estudo"}
                </span>
              </Link>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-[10px] sm:text-[11px] font-mono shadow-inner shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="font-bold text-indigo-400">
                  {currentIndex + 1}
                </span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400">{cards.length}</span>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="mb-4 relative z-10 px-1">
              <div className="h-1.5 w-full bg-slate-900/90 rounded-full overflow-hidden border border-slate-800/80 p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(99,102,241,0.8)]"
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
              className="relative w-full min-h-[360px] sm:min-h-[420px] mb-4 cursor-grab active:cursor-grabbing group flex flex-col select-none touch-none"
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
                  transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {/* FRENTE DO CARD */}
                <div
                  className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#0c101c] via-[#080b15] to-[#05070f] border border-indigo-500/25 group-hover:border-indigo-500/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-center backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors duration-300 border-t-indigo-400/40"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="w-full flex justify-between items-center relative z-10">
                    <span className="text-[9px] font-extrabold tracking-widest text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-lg uppercase backdrop-blur-md">
                      Pergunta
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                      CARD #{currentIndex + 1}
                    </span>
                  </div>

                  <div className="my-auto space-y-3 sm:space-y-4 max-w-lg mx-auto relative z-10 py-2">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                      <HelpCircle size={22} />
                    </div>
                    <h2 className="text-base sm:text-2xl font-bold text-slate-100 leading-relaxed tracking-tight">
                      {frontText}
                    </h2>
                  </div>

                  {/* Instrução de Ação Integrada */}
                  <div className="inline-flex items-center justify-center relative z-10">
                    {/* Exclusivo Mobile */}
                    <div className="sm:hidden inline-flex items-center gap-1.5 text-[10px] text-indigo-300 font-medium bg-indigo-950/40 border border-indigo-500/20 px-3.5 py-1.5 rounded-full backdrop-blur-md">
                      <TouchpadIcon
                        size={12}
                        className="animate-pulse text-indigo-400"
                      />
                      <span>Toque para virar • Deslize para avaliar</span>
                    </div>

                    {/* Exclusivo Desktop */}
                    <div className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                      <span className="text-slate-500">Arraste para avaliar ou</span>
                      <kbd className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-200 border border-slate-700/80 text-[10px] font-mono shadow-md flex items-center gap-1">
                        <Command size={10} /> Espaço
                      </kbd>
                      <span className="text-slate-500">para virar</span>
                    </div>
                  </div>
                </div>

                {/* VERSO DO CARD */}
                <div
                  className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#09151c] via-[#080b15] to-[#05070f] border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-center backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-t-emerald-400/40"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="w-full flex justify-between items-center">
                    <span className="text-[9px] font-extrabold tracking-widest text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg uppercase backdrop-blur-md">
                      Resposta
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono tracking-wider">
                      FSRS / SM-2
                    </span>
                  </div>

                  <div className="my-auto space-y-2.5 sm:space-y-3 max-w-lg mx-auto overflow-y-auto max-h-56 px-1 custom-scrollbar py-2">
                    <h3 className="text-sm sm:text-lg font-semibold text-slate-100 leading-relaxed">
                      {backText}
                    </h3>

                    {currentCard?.details && (
                      <p className="text-[11px] sm:text-xs text-slate-300 bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl leading-relaxed text-left shadow-inner">
                        {currentCard.details}
                      </p>
                    )}
                  </div>

                  <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Classifique sua facilidade
                  </span>
                </div>
              </div>
            </motion.div>

            {/* BOTÕES DE FSRS COM VISUAL RENOVADO, GLASSMORPHISM E INTERVALOS PROJETADOS */}
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
                  style:
                    "from-rose-950/40 via-rose-900/20 to-slate-900/80 hover:from-rose-900/50 hover:to-slate-900 border-rose-500/40 text-rose-300 hover:border-rose-400/80 shadow-[0_0_20px_-5px_rgba(244,63,94,0.25)]",
                  badgeStyle:
                    "bg-rose-500/20 text-rose-200 border-rose-500/30",
                },
                {
                  label: "DIFÍCIL",
                  sublabel: "Hard",
                  grade: 2 as ReviewGrade,
                  key: "2",
                  icon: AlertCircle,
                  interval: projections[2]?.label ?? "2d",
                  style:
                    "from-amber-950/40 via-amber-900/20 to-slate-900/80 hover:from-amber-900/50 hover:to-slate-900 border-amber-500/40 text-amber-300 hover:border-amber-400/80 shadow-[0_0_20px_-5px_rgba(245,158,11,0.25)]",
                  badgeStyle:
                    "bg-amber-500/20 text-amber-200 border-amber-500/30",
                },
                {
                  label: "BOM",
                  sublabel: "Good",
                  grade: 3 as ReviewGrade,
                  key: "3",
                  icon: Check,
                  interval: projections[3]?.label ?? "4d",
                  style:
                    "from-emerald-950/40 via-emerald-900/20 to-slate-900/80 hover:from-emerald-900/50 hover:to-slate-900 border-emerald-500/40 text-emerald-300 hover:border-emerald-400/80 shadow-[0_0_20px_-5px_rgba(16,185,129,0.25)]",
                  badgeStyle:
                    "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
                },
                {
                  label: "FÁCIL",
                  sublabel: "Easy",
                  grade: 4 as ReviewGrade,
                  key: "4",
                  icon: Zap,
                  interval: projections[4]?.label ?? "7d",
                  style:
                    "from-indigo-950/40 via-indigo-900/20 to-slate-900/80 hover:from-indigo-900/50 hover:to-slate-900 border-indigo-500/40 text-indigo-300 hover:border-indigo-400/80 shadow-[0_0_20px_-5px_rgba(99,102,241,0.25)]",
                  badgeStyle:
                    "bg-indigo-500/20 text-indigo-200 border-indigo-500/30",
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
                  className={`group relative flex flex-col items-center justify-center gap-1 py-3 px-2 sm:py-3.5 sm:px-3 rounded-2xl border bg-gradient-to-b backdrop-blur-xl transition-all duration-200 cursor-pointer ${btn.style}`}
                >
                  <span className="hidden sm:block absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-slate-950/80 text-[9px] font-mono opacity-50 group-hover:opacity-100 transition-opacity border border-white/10">
                    {btn.key}
                  </span>

                  {selectedGrade === btn.grade ? (
                    <Loader2 size={18} className="animate-spin my-1" />
                  ) : (
                    <btn.icon
                      size={18}
                      className="group-hover:scale-110 transition-transform my-0.5"
                    />
                  )}

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
    </div>
  );
}
