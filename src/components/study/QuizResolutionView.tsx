"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
  Brain,
  BrainCircuit,
  Sparkles,
  Flag,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Target,
  AlertCircle,
  X,
  Check,
  Loader2,
  Layers,
  Award,
  LogOut,
  Maximize2,
  Minimize2,
  Printer,
} from "lucide-react";
import { QuestaoIA } from "@/app/(dashboard)/questions/page";
import { ErrorClassification } from "@/types/quiz";
import {
  deepenExplanationAction,
  DeepenExplanationResult,
} from "@/actions/quiz-actions";
import { MentorCopilotDrawer } from "@/components/mentor/MentorCopilotDrawer";
import { PrintableQuestions } from "@/components/questions/printable-questions";

export interface QuizResolutionViewProps {
  quizId?: string | null;
  banca?: string;
  subject?: string;
  questions: QuestaoIA[];
  initialSelectedAnswers?: Record<number, string>;
  initialCheckedQuestions?: Record<number, boolean>;
  initialFlaggedQuestions?: Record<number, boolean>;
  initialErrorClassifications?: Record<number, ErrorClassification>;
  initialTimerSeconds?: number;
  isInitialTimerRunning?: boolean;
  onAnswerQuestion?: (
    index: number,
    selectedAlt: string,
    isCorrect: boolean,
  ) => void;
  onFinishQuiz: (finalData: {
    totalQuestions: number;
    correctCount: number;
    timerSeconds: number;
    selectedAnswers: Record<number, string>;
    checkedQuestions: Record<number, boolean>;
    errorClassifications: Record<number, ErrorClassification>;
  }) => void;
  onExit: () => void;
  onCreateFlashcard?: (index: number) => Promise<void> | void;
  isCreatingFlashcard?: boolean;
  createdFlashcards?: Record<number, boolean>;
}

const ERROR_TAXONOMY: {
  key: ErrorClassification;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bgActive: string;
}[] = [
  {
    key: "THEORY_GAP",
    label: "Lacuna Teórica",
    desc: "Não conhecia ou esqueci o conceito teórico cobrado.",
    icon: Brain,
    color: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    bgActive: "border-violet-500 bg-violet-500/20 text-violet-200",
  },
  {
    key: "ATTENTION_LAPSE",
    label: "Falta de Atenção",
    desc: "Sabia a matéria, mas caí em pegadinha ou li com pressa.",
    icon: Eye,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    bgActive: "border-amber-500 bg-amber-500/20 text-amber-200",
  },
  {
    key: "MISINTERPRETATION",
    label: "Erro de Interpretação",
    desc: "Interpretei de forma errônea o comando da questão.",
    icon: AlertCircle,
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    bgActive: "border-cyan-500 bg-cyan-500/20 text-cyan-200",
  },
  {
    key: "TIME_PRESSURE",
    label: "Pressão de Tempo",
    desc: "Faltou tempo para calcular ou analisar as opções com calma.",
    icon: Clock,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    bgActive: "border-rose-500 bg-rose-500/20 text-rose-200",
  },
];

const renderEnunciado = (texto: string) => {
  if (!texto) return null;
  const partes = texto.split(/(\*\*.*?\*\*)/g);
  return partes.map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      const conteudoLimpo = parte.slice(2, -2);
      return (
        <span
          key={`hl-${i}`}
          className="inline-block bg-violet-500/15 text-violet-200 px-1.5 py-0.5 mx-0.5 rounded-md border border-violet-400/30 font-semibold align-baseline shadow-xs"
        >
          {conteudoLimpo}
        </span>
      );
    }
    return <React.Fragment key={`txt-${i}`}>{parte}</React.Fragment>;
  });
};

export function QuizResolutionView({
  quizId,
  banca = "FGV",
  subject = "Conhecimentos Gerais",
  questions,
  initialSelectedAnswers = {},
  initialCheckedQuestions = {},
  initialFlaggedQuestions = {},
  initialErrorClassifications = {},
  initialTimerSeconds = 0,
  isInitialTimerRunning = true,
  onAnswerQuestion,
  onFinishQuiz,
  onExit,
  onCreateFlashcard,
  isCreatingFlashcard = false,
  createdFlashcards = {},
}: QuizResolutionViewProps) {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Estados de resposta e resolução
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >(initialSelectedAnswers);
  const [checkedQuestions, setCheckedQuestions] = useState<
    Record<number, boolean>
  >(initialCheckedQuestions);
  const [flaggedQuestions, setFlaggedQuestions] = useState<
    Record<number, boolean>
  >(initialFlaggedQuestions);
  const [errorClassifications, setErrorClassifications] = useState<
    Record<number, ErrorClassification>
  >(initialErrorClassifications);

  // Alternativas riscadas/eliminadas pelo candidato
  const [eliminatedAlts, setEliminatedAlts] = useState<
    Record<number, Record<string, boolean>>
  >({});

  // Cronômetro
  const [timerSeconds, setTimerSeconds] = useState(initialTimerSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(isInitialTimerRunning);

  // UI States
  const [isJustificationExpanded, setIsJustificationExpanded] = useState(true);
  const [showErrorDiagnosisModal, setShowErrorDiagnosisModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [showFinishConfirmModal, setShowFinishConfirmModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deepenedExplanations, setDeepenedExplanations] = useState<
    Record<number, DeepenExplanationResult>
  >({});
  const [isDeepeningLoading, setIsDeepeningLoading] = useState(false);
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Atalho global ⌘J / Ctrl+J para alternar o Mentor IA
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsMentorOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Alternância de Tela Cheia
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Refs de auto-scroll para a régua horizontal mobile
  const rulerItemRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const totalQuestions = questions.length;
  const currentQuestion = questions[activeQuestionIndex];
  const isCurrentAnswered = Boolean(checkedQuestions[activeQuestionIndex]);
  const currentSelectedAlt = selectedAnswers[activeQuestionIndex];
  const isCurrentCorrect =
    currentQuestion && currentSelectedAlt === currentQuestion.gabaritoCorreto;
  const isCurrentFlagged = Boolean(flaggedQuestions[activeQuestionIndex]);

  // Contadores de desempenho
  const answeredCount = Object.keys(checkedQuestions).filter(
    (k) => checkedQuestions[Number(k)],
  ).length;
  const correctCount = Object.keys(checkedQuestions).filter((k) => {
    const idx = Number(k);
    return (
      checkedQuestions[idx] &&
      selectedAnswers[idx] === questions[idx]?.gabaritoCorreto
    );
  }).length;
  const percentageAcc =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const progressPercentage =
    totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0;

  // Formatação de cronômetro padronizada HH:MM:SS (ex: "00:15:30")
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  // Cronômetro
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Auto-scroll da régua mobile quando a questão ativa muda
  useEffect(() => {
    const el = rulerItemRefs.current[activeQuestionIndex];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeQuestionIndex]);

  // Navegação entre questões com direção da animação
  const navigateTo = useCallback(
    (nextIdx: number) => {
      if (nextIdx < 0 || nextIdx >= totalQuestions) return;
      setDirection(nextIdx > activeQuestionIndex ? 1 : -1);
      setActiveQuestionIndex(nextIdx);
    },
    [activeQuestionIndex, totalQuestions],
  );

  // Seleção de alternativa
  const handleSelectAnswer = useCallback(
    (altId: string) => {
      if (isCurrentAnswered) return;
      setSelectedAnswers((prev) => ({
        ...prev,
        [activeQuestionIndex]: altId,
      }));
    },
    [isCurrentAnswered, activeQuestionIndex],
  );

  // Riscar / restaurar alternativa
  const toggleEliminateAlt = (e: React.MouseEvent, altId: string) => {
    e.stopPropagation();
    if (isCurrentAnswered) return;
    setEliminatedAlts((prev) => {
      const currentMap = prev[activeQuestionIndex] || {};
      return {
        ...prev,
        [activeQuestionIndex]: {
          ...currentMap,
          [altId]: !currentMap[altId],
        },
      };
    });
  };

  // Submissão / Confirmação da resposta da questão atual
  const handleConfirmAnswer = useCallback(() => {
    if (!currentSelectedAlt || isCurrentAnswered) return;

    setCheckedQuestions((prev) => ({
      ...prev,
      [activeQuestionIndex]: true,
    }));

    const isCorrect =
      currentSelectedAlt === currentQuestion.gabaritoCorreto;

    if (onAnswerQuestion) {
      onAnswerQuestion(activeQuestionIndex, currentSelectedAlt, isCorrect);
    }
  }, [
    activeQuestionIndex,
    currentQuestion,
    currentSelectedAlt,
    isCurrentAnswered,
    onAnswerQuestion,
  ]);

  // Marcar / desmarcar para revisar
  const handleToggleFlag = useCallback(() => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [activeQuestionIndex]: !prev[activeQuestionIndex],
    }));
  }, [activeQuestionIndex]);

  // Aprofundar explicação com IA sob demanda
  const handleDeepenExplanation = async () => {
    if (!currentQuestion || isDeepeningLoading) return;
    if (deepenedExplanations[activeQuestionIndex]) return;

    setIsDeepeningLoading(true);
    try {
      const res = await deepenExplanationAction({
        enunciado: currentQuestion.enunciado,
        alternativas: currentQuestion.alternativas,
        gabaritoCorreto: currentQuestion.gabaritoCorreto,
        selectedAnswer: currentSelectedAlt,
        justificativaOriginal: currentQuestion.justificativa,
        banca,
        subject,
      });

      if (res.success && res.data) {
        setDeepenedExplanations((prev) => ({
          ...prev,
          [activeQuestionIndex]: res.data!,
        }));
      } else {
        alert(res.error || "Não foi possível aprofundar a explicação com IA.");
      }
    } catch (err) {
      console.error("Erro ao aprofundar explicação:", err);
    } finally {
      setIsDeepeningLoading(false);
    }
  };

  // Classificar erro cognitivo
  const handleClassifyError = (reason: ErrorClassification) => {
    setErrorClassifications((prev) => ({
      ...prev,
      [activeQuestionIndex]: reason,
    }));
  };

  // Finalizar Simulado
  const handleFinalize = () => {
    onFinishQuiz({
      totalQuestions,
      correctCount,
      timerSeconds,
      selectedAnswers,
      checkedQuestions,
      errorClassifications,
    });
  };

  // Disparo com confirmação se houver questões em branco
  const handlePromptFinalize = () => {
    if (answeredCount < totalQuestions) {
      setShowFinishConfirmModal(true);
    } else {
      handleFinalize();
    }
  };

  // Atalhos de teclado (Desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        showErrorDiagnosisModal
      ) {
        return;
      }

      const keyUpper = e.key.toUpperCase();

      // Navegação por setas: Esquerda e Direita
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateTo(activeQuestionIndex - 1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateTo(activeQuestionIndex + 1);
        return;
      }

      // Confirmação com Enter ou Espaço
      if (e.key === "Enter" || e.code === "Space") {
        if (!isCurrentAnswered && currentSelectedAlt) {
          e.preventDefault();
          handleConfirmAnswer();
        } else if (isCurrentAnswered && activeQuestionIndex < totalQuestions - 1) {
          e.preventDefault();
          navigateTo(activeQuestionIndex + 1);
        }
        return;
      }

      // Seleção de alternativas (A-E ou 1-5)
      if (!isCurrentAnswered && currentQuestion) {
        const keyMap: Record<string, string> = {
          A: "A",
          B: "B",
          C: "C",
          D: "D",
          E: "E",
          "1": "A",
          "2": "B",
          "3": "C",
          "4": "D",
          "5": "E",
        };

        if (currentQuestion.formato === "multipla") {
          const mappedAlt = keyMap[keyUpper];
          if (mappedAlt) {
            const hasAlt = currentQuestion.alternativas?.some(
              (a) => a.id === mappedAlt,
            );
            if (hasAlt) {
              e.preventDefault();
              handleSelectAnswer(mappedAlt);
            }
          }
        } else {
          if (keyUpper === "C" || keyUpper === "1") {
            e.preventDefault();
            handleSelectAnswer("Certo");
          } else if (keyUpper === "E" || keyUpper === "2") {
            e.preventDefault();
            handleSelectAnswer("Errado");
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeQuestionIndex,
    currentQuestion,
    currentSelectedAlt,
    isCurrentAnswered,
    navigateTo,
    handleConfirmAnswer,
    handleSelectAnswer,
    showErrorDiagnosisModal,
    totalQuestions,
  ]);

  if (isPrintMode) {
    return (
      <PrintableQuestions
        title={subject ? `Simulado - ${subject}` : "Caderno de Prova Oficial"}
        banca={banca}
        quizId={quizId}
        totalQuestions={totalQuestions}
        estimatedTimeMinutes={totalQuestions * 3}
        onBack={() => setIsPrintMode(false)}
        questions={questions.map((q, idx) => ({
          id: `q-${idx}`,
          number: idx + 1,
          statement: q.enunciado,
          options: q.alternativas?.map((a) => a.texto),
          correctOption: q.gabaritoCorreto,
          subjectName: subject || "Conhecimentos Gerais",
          format: q.formato,
          justification: q.justificativa,
        }))}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-slate-300">
        <Loader2 size={32} className="animate-spin text-violet-400" />
        <p className="text-sm font-medium">Carregando questão...</p>
      </div>
    );
  }

  const currentEliminations = eliminatedAlts[activeQuestionIndex] || {};
  const currentDeepExplanation = deepenedExplanations[activeQuestionIndex];

  return (
    <div
      data-quiz-root="true"
      className="min-h-screen bg-[#030712] text-slate-100 font-sans antialiased selection:bg-violet-500/30 relative"
    >
      {/* OCULTAÇÃO DA SIDEBAR E BOTTOM NAVIGATION GLOBAIS NO MODO RESOLUÇÃO */}
      <style jsx global>{`
        aside:not([data-quiz-sidebar="true"]):not([data-mentor-drawer="true"]),
        [data-sidebar="sidebar"],
        .sidebar-container {
          display: none !important;
        }
        div.fixed.bottom-0:has(nav) {
          display: none !important;
        }
        main:has([data-quiz-root="true"]) {
          margin-left: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. HEADER SUPERIOR DESKTOP (Apenas lg+) */}
      {/* ========================================================================= */}
      <header className="hidden lg:block w-full border-b border-white/5 bg-black/40 backdrop-blur-md px-6 py-4 mb-6 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Lado Esquerdo */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setShowExitConfirmModal(true)}
              type="button"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer shrink-0"
              title="Sair do Simulado"
            >
              <LogOut size={16} />
              <span>Sair do Simulado</span>
            </button>

            <div className="h-4 w-px bg-white/10 shrink-0" />

            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-mono font-bold text-[11px] uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-lg shrink-0">
                {banca}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-sm font-bold text-white truncate max-w-xl">
                {subject}
              </span>
            </div>
          </div>

          {/* Lado Direito */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Badge de Timer ("00:15:30") com indicador de pausa */}
            <div className="flex items-center gap-2 bg-zinc-900/90 border border-white/10 px-3 py-1.5 rounded-xl font-mono text-xs text-zinc-200 shadow-inner">
              <Clock
                size={14}
                className={isTimerRunning ? "text-emerald-400 animate-pulse" : "text-amber-400"}
              />
              <span className="font-bold tracking-wider">{formatTimer(timerSeconds)}</span>
              <button
                onClick={() => setIsTimerRunning((prev) => !prev)}
                type="button"
                className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                title={isTimerRunning ? "Pausar tempo" : "Retomar tempo"}
              >
                {isTimerRunning ? (
                  <Pause size={12} className="text-zinc-400" />
                ) : (
                  <Play size={12} className="text-emerald-400" />
                )}
              </button>
            </div>

            {/* Botão de Imprimir Caderno de Prova (PDF) */}
            <button
              onClick={() => setIsPrintMode(true)}
              type="button"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Imprimir Caderno de Prova Oficial com Folha Óptica (PDF)"
            >
              <Printer size={15} />
              <span className="hidden xl:inline">Imprimir Prova (PDF)</span>
            </button>

            {/* Botão de Tela Cheia */}
            <button
              onClick={toggleFullscreen}
              type="button"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HEADER FIXO MOBILE (Apenas < lg) */}
      {/* ========================================================================= */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#070b16]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setShowExitConfirmModal(true)}
            type="button"
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
            title="Sair do simulado"
          >
            <X size={16} />
          </button>
          <div className="truncate">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-400 block leading-none">
              {banca}
            </span>
            <span className="text-xs font-bold text-white truncate block mt-0.5">
              {subject}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Botão de Imprimir Prova Mobile */}
          <button
            onClick={() => setIsPrintMode(true)}
            type="button"
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-cyan-400 hover:text-white transition-all cursor-pointer"
            title="Imprimir Caderno de Prova (PDF)"
          >
            <Printer size={14} />
          </button>

          {/* Badge 01/20 */}
          <span className="text-xs font-mono font-black text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-1 rounded-xl shadow-xs">
            {String(activeQuestionIndex + 1).padStart(2, "0")}/
            {String(totalQuestions).padStart(2, "0")}
          </span>

          {/* Timer Compacto */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-xl text-xs font-mono text-slate-200">
            <Clock
              size={12}
              className={isTimerRunning ? "text-emerald-400 animate-pulse" : "text-slate-500"}
            />
            <span>{formatTimer(timerSeconds)}</span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. RÉGUA HORIZONTAL DE NÚMEROS MOBILE (Apenas < lg) */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed top-[57px] left-0 right-0 z-30 bg-[#050811]/90 backdrop-blur-md border-b border-white/10 px-3 py-2 overflow-x-auto scrollbar-none shadow-lg">
        <div className="flex items-center gap-2 min-w-max">
          {questions.map((_, idx) => {
            const isCurrent = idx === activeQuestionIndex;
            const isAnswered = Boolean(checkedQuestions[idx]);
            const isFlagged = Boolean(flaggedQuestions[idx]);

            let pillStyle =
              "bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700";

            if (isCurrent) {
              pillStyle =
                "bg-violet-600/30 border-violet-400 text-white ring-2 ring-violet-400 shadow-[0_0_12px_rgba(168,85,247,0.5)] font-black";
            } else if (isFlagged) {
              pillStyle =
                "bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold";
            } else if (isAnswered) {
              pillStyle =
                "bg-violet-600 border-violet-500 text-white font-bold";
            }

            return (
              <button
                key={`mobile-ruler-${idx}`}
                ref={(el) => {
                  rulerItemRefs.current[idx] = el;
                }}
                onClick={() => navigateTo(idx)}
                type="button"
                className={`w-8 h-8 rounded-lg border text-xs font-mono flex items-center justify-center transition-all shrink-0 cursor-pointer ${pillStyle}`}
              >
                {String(idx + 1).padStart(2, "0")}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CONTAINER PRINCIPAL (Desktop Grid 12 cols / Mobile scroll) */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 pt-28 lg:pt-0 pb-32 lg:pb-12 lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* ===================================================================== */}
        {/* COLUNA PRINCIPAL: 8 COLUNAS NO DESKTOP */}
        {/* ===================================================================== */}
        <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`question-${activeQuestionIndex}`}
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="bg-[#070b16]/90 border border-violet-500/20 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
              >
                {/* Glow decorativo de fundo */}
                <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-violet-600/10 blur-[90px]" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-600/10 blur-[90px]" />

                {/* HEADER DA QUESTÃO */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 gap-3 flex-wrap relative z-10">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-black font-mono tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/30 px-3 py-1 rounded-full uppercase">
                      Questão {String(activeQuestionIndex + 1).padStart(2, "0")} de{" "}
                      {String(totalQuestions).padStart(2, "0")}
                    </span>

                    <span className="text-[11px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      {banca}
                    </span>

                    {currentQuestion.formato && (
                      <span className="text-[11px] font-bold text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full uppercase">
                        {currentQuestion.formato === "multipla"
                          ? "Múltipla Escolha"
                          : "Certo / Errado"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botão Copilot Mentor IA */}
                    <button
                      onClick={() => setIsMentorOpen(true)}
                      type="button"
                      className="px-3 py-1.5 rounded-xl border border-violet-500/40 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 hover:border-violet-500/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md shadow-violet-950/40"
                      title="Abrir Mentor IA Copilot (⌘J ou Ctrl+J)"
                    >
                      <Brain size={14} className="text-violet-400" />
                      <span>Mentor IA</span>
                      <span className="text-[9px] font-mono text-violet-400/90 bg-violet-500/25 px-1 py-0.5 rounded border border-violet-500/30 hidden sm:inline">
                        ⌘J
                      </span>
                    </button>

                    <button
                      onClick={handleToggleFlag}
                      type="button"
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                        isCurrentFlagged
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-950/40"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                      title="Marcar para revisar no painel"
                    >
                      <Flag
                        size={14}
                        className={isCurrentFlagged ? "fill-amber-300 text-amber-300" : ""}
                      />
                      <span>{isCurrentFlagged ? "Marcada para Revisar" : "Marcar p/ Revisar"}</span>
                    </button>
                  </div>
                </div>

                {/* ENUNCIADO NÍTIDO COM TIPOGRAFIA AMPLA */}
                <div className="text-slate-100 text-base sm:text-lg leading-relaxed font-normal mb-8 relative z-10 whitespace-pre-line select-text">
                  {renderEnunciado(currentQuestion.enunciado)}
                </div>

                {/* ALTERNATIVAS INTERATIVAS */}
                <div className="space-y-3.5 mb-8 relative z-10">
                  {currentQuestion.formato === "multipla"
                    ? currentQuestion.alternativas?.map((alt, altIdx) => {
                        const isSelected = currentSelectedAlt === alt.id;
                        const isEliminated = Boolean(currentEliminations[alt.id]);
                        const atalhoNum = altIdx + 1;

                        // Estilos condicionais
                        let altStyle =
                          "bg-slate-950/50 border-slate-800/80 hover:border-violet-500/50 hover:bg-violet-950/20 text-slate-200";

                        if (isEliminated && !isCurrentAnswered) {
                          altStyle =
                            "opacity-30 line-through bg-slate-950/20 border-slate-900 text-slate-500";
                        } else if (isCurrentAnswered) {
                          if (alt.id === currentQuestion.gabaritoCorreto) {
                            altStyle =
                              "bg-emerald-500/15 border-emerald-500/80 text-emerald-100 ring-1 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]";
                          } else if (isSelected) {
                            altStyle =
                              "bg-rose-500/15 border-rose-500/80 text-rose-100 ring-1 ring-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)]";
                          } else {
                            altStyle =
                              "bg-slate-950/30 border-slate-900 text-slate-500 opacity-60";
                          }
                        } else if (isSelected) {
                          altStyle =
                            "bg-violet-600/20 border-violet-500 text-white ring-2 ring-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.3)]";
                        }

                        return (
                          <div
                            key={`alt-${alt.id}`}
                            className="relative flex items-center gap-2 group"
                          >
                            <button
                              disabled={isCurrentAnswered}
                              onClick={() =>
                                !isEliminated && handleSelectAnswer(alt.id)
                              }
                              type="button"
                              className={`w-full text-left p-4 sm:p-5 rounded-2xl border text-sm sm:text-base font-medium transition-all flex items-start justify-between cursor-pointer disabled:cursor-default active:scale-[0.99] ${altStyle}`}
                            >
                              <div className="flex items-start gap-3.5 pr-3">
                                {/* Badge circular A, B, C... */}
                                <span
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                                    isCurrentAnswered &&
                                    alt.id === currentQuestion.gabaritoCorreto
                                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                                      : isCurrentAnswered && isSelected
                                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                                        : isSelected
                                          ? "bg-violet-600 text-white shadow-md shadow-violet-500/40"
                                          : "bg-slate-900 border border-slate-800 text-slate-400 group-hover:border-violet-500/40 group-hover:text-violet-200"
                                  }`}
                                >
                                  {alt.id}
                                </span>

                                <span className="pt-0.5 leading-relaxed">
                                  {alt.texto}
                                </span>
                              </div>

                              {!isCurrentAnswered && (
                                <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-600 group-hover:text-violet-300 border border-slate-800 group-hover:border-violet-500/40 px-2 py-0.5 rounded-lg shrink-0 self-center transition-colors">
                                  {atalhoNum}
                                </kbd>
                              )}
                            </button>

                            {/* Botão de riscar alternativa */}
                            {!isCurrentAnswered && (
                              <button
                                type="button"
                                onClick={(e) => toggleEliminateAlt(e, alt.id)}
                                title={
                                  isEliminated
                                    ? "Restaurar alternativa"
                                    : "Riscar alternativa"
                                }
                                className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                                  isEliminated
                                    ? "text-rose-400 bg-rose-500/10 border border-rose-500/20 opacity-100"
                                    : "text-slate-600 hover:text-slate-300 sm:opacity-0 sm:group-hover:opacity-100"
                                }`}
                              >
                                {isEliminated ? (
                                  <Eye size={16} />
                                ) : (
                                  <EyeOff size={16} />
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })
                    : ["Certo", "Errado"].map((opcao, altIdx) => {
                        const isSelected = currentSelectedAlt === opcao;
                        const atalhoNum = altIdx + 1;

                        let ceStyle =
                          "bg-slate-950/50 border-slate-800/80 hover:border-violet-500/50 hover:bg-violet-950/20 text-slate-200";

                        if (isCurrentAnswered) {
                          if (opcao === currentQuestion.gabaritoCorreto) {
                            ceStyle =
                              "bg-emerald-500/15 border-emerald-500/80 text-emerald-100 ring-1 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]";
                          } else if (isSelected) {
                            ceStyle =
                              "bg-rose-500/15 border-rose-500/80 text-rose-100 ring-1 ring-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)]";
                          } else {
                            ceStyle =
                              "bg-slate-950/30 border-slate-900 text-slate-500 opacity-60";
                          }
                        } else if (isSelected) {
                          ceStyle =
                            "bg-violet-600/20 border-violet-500 text-white ring-2 ring-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.3)]";
                        }

                        return (
                          <button
                            key={`ce-${opcao}`}
                            disabled={isCurrentAnswered}
                            onClick={() => handleSelectAnswer(opcao)}
                            type="button"
                            className={`w-full text-left p-4 sm:p-5 rounded-2xl border text-sm sm:text-base font-semibold transition-all flex items-center justify-between cursor-pointer disabled:cursor-default active:scale-[0.99] group ${ceStyle}`}
                          >
                            <div className="flex items-center gap-3.5">
                              <span
                                className={`w-3.5 h-3.5 rounded-full ${
                                  opcao === "Certo"
                                    ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                                    : "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]"
                                }`}
                              />
                              <span>{opcao}</span>
                            </div>

                            {!isCurrentAnswered && (
                              <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-600 group-hover:text-violet-300 border border-slate-800 group-hover:border-violet-500/40 px-2 py-0.5 rounded-lg transition-colors">
                                {atalhoNum}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                </div>

                {/* ================================================================= */}
                {/* BOX DE JUSTIFICATIVA EXPANSÍVEL + APROFUNDAR COM IA */}
                {/* ================================================================= */}
                {isCurrentAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 rounded-2xl p-5 sm:p-6 bg-slate-950/80 border border-white/10 shadow-xl space-y-4 relative z-10"
                  >
                    {/* Linha de resultado e botões de ação */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2.5 font-bold text-sm">
                        {isCurrentCorrect ? (
                          <span className="text-emerald-400 flex items-center gap-1.5 font-black">
                            <CheckCircle2 size={18} /> Parabéns, você acertou!
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1.5 font-black">
                            <XCircle size={18} /> Resposta incorreta
                          </span>
                        )}
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-300 font-mono text-xs">
                          Gabarito Oficial:{" "}
                          <strong className="text-emerald-400 text-sm">
                            {currentQuestion.gabaritoCorreto}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                        {/* Botão Aprofundar Explicação com IA */}
                        <button
                          onClick={handleDeepenExplanation}
                          disabled={isDeepeningLoading || Boolean(currentDeepExplanation)}
                          type="button"
                          className={`w-full sm:w-auto px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                            currentDeepExplanation
                              ? "bg-violet-500/20 border-violet-500/40 text-violet-200"
                              : "bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-950/50 border-violet-400/40"
                          }`}
                        >
                          {isDeepeningLoading ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Dissecando questão com IA...</span>
                            </>
                          ) : currentDeepExplanation ? (
                            <>
                              <Sparkles size={13} className="text-violet-300" />
                              <span>Explicação Aprofundada ✓</span>
                            </>
                          ) : (
                            <>
                              <BrainCircuit size={14} className="text-violet-200" />
                              <span>Aprofundar Explicação com IA ✨</span>
                            </>
                          )}
                        </button>

                        {/* Se errou: Por que errei? */}
                        {!isCurrentCorrect && (
                          <button
                            type="button"
                            onClick={() => setShowErrorDiagnosisModal(true)}
                            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <Brain size={13} />
                            <span>
                              {errorClassifications[activeQuestionIndex]
                                ? "Diagnóstico Salvo ✓"
                                : "Por que errei? 🧠"}
                            </span>
                          </button>
                        )}

                        {/* Criar Flashcard */}
                        {onCreateFlashcard && (
                          <button
                            onClick={() => onCreateFlashcard(activeQuestionIndex)}
                            disabled={
                              isCreatingFlashcard ||
                              Boolean(createdFlashcards[activeQuestionIndex])
                            }
                            type="button"
                            className={`w-full sm:w-auto px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                              createdFlashcards[activeQuestionIndex]
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 cursor-default"
                                : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                            }`}
                          >
                            {isCreatingFlashcard ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : createdFlashcards[activeQuestionIndex] ? (
                              <CheckCircle2 size={12} className="text-emerald-400" />
                            ) : (
                              <Layers size={13} className="text-violet-300" />
                            )}
                            <span>
                              {createdFlashcards[activeQuestionIndex]
                                ? "Card Criado!"
                                : "🎴 Flashcard"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bloco de Justificativa Base Expansível */}
                    <div className="space-y-2">
                      <button
                        onClick={() =>
                          setIsJustificationExpanded((prev) => !prev)
                        }
                        type="button"
                        className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-violet-300 hover:text-violet-200 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Award size={14} /> Justificativa da Banca
                        </span>
                        {isJustificationExpanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>

                      {isJustificationExpanded && (
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl whitespace-pre-line">
                          {renderEnunciado(currentQuestion.justificativa)}
                        </p>
                      )}
                    </div>

                    {/* Exibição da Explicação Aprofundada com IA */}
                    {currentDeepExplanation && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-violet-950/40 via-[#0a0e1c] to-[#080b16] border border-violet-500/40 space-y-4 shadow-xl"
                      >
                        <div className="flex items-center gap-2 text-violet-300 font-bold text-xs uppercase tracking-wider border-b border-violet-500/20 pb-2">
                          <Sparkles size={14} className="text-violet-400 animate-pulse" />
                          <span>Análise Cognitiva Aprofundada (Synapse AI)</span>
                        </div>

                        {/* Visão Geral */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-mono font-bold text-violet-300 uppercase">
                            Raciocínio Central do Examinador:
                          </span>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                            {currentDeepExplanation.overview}
                          </p>
                        </div>

                        {/* Análise das Alternativas */}
                        {currentDeepExplanation.alternativesAnalysis &&
                          currentDeepExplanation.alternativesAnalysis.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <span className="text-[11px] font-mono font-bold text-violet-300 uppercase block">
                                Dissecação dos Distratores:
                              </span>
                              <div className="space-y-1.5">
                                {currentDeepExplanation.alternativesAnalysis.map(
                                  (altDetail, idx) => (
                                    <div
                                      key={`alt-detail-${idx}`}
                                      className="text-xs p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-start gap-2.5"
                                    >
                                      <span
                                        className={`font-black px-2 py-0.5 rounded-md text-[10px] shrink-0 ${
                                          altDetail.isCorrect
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                        }`}
                                      >
                                        {altDetail.letter}
                                      </span>
                                      <span className="text-slate-300 leading-relaxed">
                                        {altDetail.explanation}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        {/* Fundamento Legal */}
                        {currentDeepExplanation.legalBasis && (
                          <div className="text-xs p-3 rounded-xl bg-violet-500/10 border border-violet-500/25 space-y-1">
                            <span className="font-bold text-violet-200 block uppercase tracking-wider text-[10px]">
                              ⚖️ Fundamento Legal / Doutrinário:
                            </span>
                            <p className="text-slate-200">
                              {currentDeepExplanation.legalBasis}
                            </p>
                          </div>
                        )}

                        {/* Mnemônico / Regra de Ouro */}
                        {currentDeepExplanation.mnemonicTip && (
                          <div className="text-xs p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                            <span className="font-bold text-amber-300 block uppercase tracking-wider text-[10px]">
                              💡 Dica de Ouro & Mnemônico:
                            </span>
                            <p className="text-slate-200">
                              {currentDeepExplanation.mnemonicTip}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ================================================================= */}
                {/* BARRA INFERIOR DESKTOP (Navegação + Atalhos Visíveis) */}
                {/* ================================================================= */}
                <div className="hidden lg:flex items-center justify-between border-t border-white/10 pt-6 mt-6 gap-4 relative z-10">
                  {/* Atalhos Visíveis */}
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <kbd className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-slate-300">
                        A-E
                      </kbd>
                      <span className="text-slate-500">Selecionar</span>
                    </span>

                    <span className="text-slate-700">•</span>

                    <span className="flex items-center gap-1">
                      <kbd className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-slate-300">
                        ← / →
                      </kbd>
                      <span className="text-slate-500">Navegar</span>
                    </span>

                    <span className="text-slate-700">•</span>

                    <span className="flex items-center gap-1">
                      <kbd className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-violet-300">
                        Enter
                      </kbd>
                      <span className="text-slate-500">Confirmar</span>
                    </span>
                  </div>

                  {/* Botões de Ação Desktop */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigateTo(activeQuestionIndex - 1)}
                      disabled={activeQuestionIndex === 0}
                      type="button"
                      className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <ArrowLeft size={14} />
                      <span>Anterior</span>
                    </button>

                    {!isCurrentAnswered ? (
                      <button
                        onClick={handleConfirmAnswer}
                        disabled={!currentSelectedAlt}
                        type="button"
                        className="px-6 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-950/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                      >
                        Responder Questão
                      </button>
                    ) : (
                      <button
                        onClick={() => navigateTo(activeQuestionIndex + 1)}
                        disabled={activeQuestionIndex === totalQuestions - 1}
                        type="button"
                        className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-950/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                      >
                        <span>Próxima</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
        </div>

        {/* ===================================================================== */}
        {/* PAINEL LATERAL FIXO: 4 COLUNAS NO DESKTOP */}
        {/* ===================================================================== */}
        <aside
          data-quiz-sidebar="true"
          className="hidden lg:block lg:col-span-4 sticky top-24 space-y-5"
        >
          {/* CARD GLASSMORPHISM */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-5 backdrop-blur-md shadow-2xl">
            {/* Título & Estatística */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Visão Geral do Caderno
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                  {answeredCount}/{totalQuestions} respondidas
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-lg">
                  {progressPercentage}%
                </span>
              </div>
            </div>

            {/* Grid 4x5 de Questões (botões de 1 a 20) */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, idx) => {
                const isCurrent = idx === activeQuestionIndex;
                const isAnswered = Boolean(checkedQuestions[idx]);
                const isFlagged = Boolean(flaggedQuestions[idx]);

                let buttonStyle =
                  "bg-white/5 text-zinc-400 hover:bg-white/10 border-transparent";

                if (isCurrent) {
                  if (isAnswered) {
                    buttonStyle =
                      "bg-violet-600 ring-2 ring-violet-400 text-white font-bold shadow-[0_0_12px_rgba(139,92,246,0.5)]";
                  } else if (isFlagged) {
                    buttonStyle =
                      "bg-amber-500/20 border-amber-500/50 text-amber-300 ring-2 ring-violet-500 font-bold";
                  } else {
                    buttonStyle =
                      "ring-2 ring-violet-500 bg-violet-500/20 text-white font-bold";
                  }
                } else if (isFlagged) {
                  buttonStyle =
                    "border border-amber-500/50 bg-amber-500/10 text-amber-300 font-bold";
                } else if (isAnswered) {
                  buttonStyle = "bg-violet-600 text-white font-bold";
                }

                return (
                  <button
                    key={`desktop-grid-${idx}`}
                    onClick={() => navigateTo(idx)}
                    type="button"
                    className={`h-10 rounded-xl text-xs font-mono flex items-center justify-center transition-all cursor-pointer active:scale-95 border ${buttonStyle}`}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </button>
                );
              })}
            </div>

            {/* Legenda de Status */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-zinc-400 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-md bg-violet-600 shrink-0" />
                <span>Respondida</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-md ring-2 ring-violet-500 bg-violet-500/20 shrink-0" />
                <span>Ativa</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-md bg-amber-500/20 border border-amber-500/50 shrink-0" />
                <span>Revisão</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-md bg-white/5 shrink-0" />
                <span>Não respondida</span>
              </div>
            </div>

            {/* Progresso em barra fina com percentual */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-zinc-400">Progresso</span>
                <span className="text-zinc-200 font-mono font-bold">
                  {progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-violet-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {answeredCount > 0 && (
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
                  <span>Acerto parcial:</span>
                  <span className="text-emerald-400 font-bold">
                    {percentageAcc}% ({correctCount}/{answeredCount})
                  </span>
                </div>
              )}
            </div>

            {/* Botão de destaque no rodapé do card: Finalizar Simulado */}
            <button
              onClick={handlePromptFinalize}
              type="button"
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-violet-950/50 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <Award size={15} />
              <span>Finalizar Simulado</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* 4. BARRA DE AÇÕES FIXA NO RODAPÉ MOBILE (Apenas < lg) */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-black/95 backdrop-blur-md border-t border-white/10 z-40 pb-[env(safe-area-inset-bottom,1rem)] shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo(activeQuestionIndex - 1)}
            disabled={activeQuestionIndex === 0}
            type="button"
            className="flex-1 py-3 px-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed font-bold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
          >
            <ArrowLeft size={14} />
            <span>Anterior</span>
          </button>

          {!isCurrentAnswered ? (
            <button
              onClick={handleConfirmAnswer}
              disabled={!currentSelectedAlt}
              type="button"
              className="flex-[2] py-3 px-4 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-950/50 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer active:scale-95 flex items-center justify-center"
            >
              Responder
            </button>
          ) : (
            <button
              onClick={() => {
                if (activeQuestionIndex < totalQuestions - 1) {
                  navigateTo(activeQuestionIndex + 1);
                } else {
                  handlePromptFinalize();
                }
              }}
              type="button"
              className="flex-[2] py-3 px-4 rounded-xl bg-violet-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-950/50 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>
                {activeQuestionIndex < totalQuestions - 1
                  ? "Próxima"
                  : "Finalizar"}
              </span>
              <ArrowRight size={14} />
            </button>
          )}

          <button
            onClick={() => navigateTo(activeQuestionIndex + 1)}
            disabled={activeQuestionIndex === totalQuestions - 1}
            type="button"
            className="flex-1 py-3 px-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed font-bold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
          >
            <span>Próxima</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL DE DIAGNÓSTICO COGNITIVO DE ERRO */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showErrorDiagnosisModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowErrorDiagnosisModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0c101d] border border-amber-500/30 rounded-3xl w-full max-w-xl shadow-2xl shadow-amber-950/20 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* HEADER DO MODAL */}
              <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
                    <Brain size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      Diagnóstico de Erro & Ponto Cego 🧠
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Questão {activeQuestionIndex + 1} • Classifique seu motivo
                      para calibrar seu treino
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowErrorDiagnosisModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* CORPO DO MODAL */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
                {/* Resumo de Resposta vs Gabarito */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">
                      Sua resposta:
                    </span>
                    <span className="font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-500/20">
                      {currentSelectedAlt || "Nenhuma"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">
                      Gabarito correto:
                    </span>
                    <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                      {currentQuestion.gabaritoCorreto}
                    </span>
                  </div>
                </div>

                {/* Seleção do Motivo */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
                    Qual foi a causa principal do erro?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ERROR_TAXONOMY.map((reason) => {
                      const Icon = reason.icon;
                      const isChosen =
                        errorClassifications[activeQuestionIndex] ===
                        reason.key;
                      return (
                        <button
                          key={reason.key}
                          type="button"
                          onClick={() => handleClassifyError(reason.key)}
                          className={`cursor-pointer p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                            isChosen
                              ? reason.bgActive
                              : "border-white/5 bg-slate-950/60 hover:bg-slate-900/60 hover:border-white/15"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl border shrink-0 ${reason.color}`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-100 leading-tight">
                                {reason.label}
                              </span>
                              {isChosen && (
                                <Check
                                  size={14}
                                  className="text-emerald-400 shrink-0"
                                />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                              {reason.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pegadinha da Banca */}
                <div className="rounded-2xl p-4 bg-amber-950/15 border border-amber-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle size={15} />
                    <span>Pegadinha da Banca / Armadilha</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {currentQuestion.pegadinhaBanca ||
                      "A banca utilizou distratores formulados para desviar a atenção do núcleo do comando e induzir o candidato ao erro conceitual."}
                  </p>
                </div>

                {/* Ponto Cego & Explicação do Erro */}
                <div className="rounded-2xl p-4 bg-indigo-950/20 border border-indigo-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <Target size={15} />
                    <span>Ponto Cego & Por que você errou</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {currentQuestion.explicacaoErro ||
                      "Confusão comum na interpretação das regras ou detalhes do enunciado. Revise os conceitos-chave e as exceções associadas a este tópico."}
                  </p>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-800/80 bg-slate-900/40">
                <button
                  type="button"
                  onClick={() => setShowErrorDiagnosisModal(false)}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-violet-950/40 active:scale-95"
                >
                  Entendi o erro
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. MODAL DE CONFIRMAÇÃO: SAIR DO SIMULADO */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showExitConfirmModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowExitConfirmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0c101d] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                  <LogOut size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Deseja sair do simulado?
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Seu progresso atual e respostas foram salvas.
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                Você pode retomar este caderno a qualquer momento na aba de simulados salvos.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirmModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Continuar Simulado
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirmModal(false);
                    onExit();
                  }}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-950/40 cursor-pointer"
                >
                  Salvar e Sair
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 7. MODAL DE CONFIRMAÇÃO: FINALIZAR COM QUESTÕES EM BRANCO */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showFinishConfirmModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowFinishConfirmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0c101d] border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Finalizar Simulado?
                  </h3>
                  <p className="text-xs text-amber-300/80 mt-0.5 font-medium">
                    Existem questões não respondidas
                  </p>
                </div>
              </div>

              <div className="text-xs text-zinc-300 leading-relaxed bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl space-y-1">
                <p>
                  Você respondeu <strong className="text-white">{answeredCount}</strong> de{" "}
                  <strong className="text-white">{totalQuestions}</strong> questões.
                </p>
                <p className="text-amber-300">
                  Restam <strong className="font-bold">{totalQuestions - answeredCount}</strong> questões em branco.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFinishConfirmModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Continuar Respondendo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFinishConfirmModal(false);
                    handleFinalize();
                  }}
                  className="px-4 py-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-950/40 cursor-pointer"
                >
                  Finalizar Mesmo Assim
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DRAWER FLUTUANTE DO COPILOT MENTOR IA */}
      {currentQuestion && (
        <MentorCopilotDrawer
          isOpen={isMentorOpen}
          onClose={() => setIsMentorOpen(false)}
          questionIndex={activeQuestionIndex}
          questionText={currentQuestion.enunciado}
          options={currentQuestion.alternativas}
          correctAnswer={currentQuestion.gabaritoCorreto}
          explanation={currentQuestion.justificativa}
          banca={banca}
          subject={subject}
          mentorGuidance={currentQuestion.mentorGuidance}
          onGuidanceGenerated={(newGuidance) => {
            currentQuestion.mentorGuidance = newGuidance;
          }}
        />
      )}
    </div>
  );
}
