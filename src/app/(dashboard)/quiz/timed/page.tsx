"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/lib/sidebar-context";
import { useGamification } from "@/context/GamificationContext";
import {
  Timer,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  BookOpen,
  HelpCircle,
  Maximize2,
  Minimize2,
  Sliders,
  ChevronRight,
  Target,
  ShieldAlert,
  Loader2,
} from "lucide-react";

import { PacingBar } from "./_components/PacingBar";
import { ExamSheetHUD } from "./_components/ExamSheetHUD";
import { SubmitConfirmModal } from "./_components/SubmitConfirmModal";
import { TimedExamResultView } from "./_components/TimedExamResultView";

import {
  submitQuizAttemptAction,
  getSavedQuizByIdAction,
} from "@/actions/quiz-actions";
import { getErrorNotebookItemsAction } from "@/actions/error-notebook-actions";
import {
  TimedQuizConfig,
  TimedQuizQuestion,
  TimedQuizPacingMode,
  QuestionAnswerSubmission,
  ErrorClassification,
} from "@/types/quiz";

interface SubjectItem {
  id: string;
  name: string;
  topics?: { id: string; title: string }[];
}

export default function TimedQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { closeSidebar, openSidebar } = useSidebar();
  const { stats: gamificationStats, refreshStats } = useGamification();

  // Fases da tela: "setup" | "exam" | "results"
  const [phase, setPhase] = useState<"setup" | "exam" | "results">("setup");

  // Parâmetros de Configuração
  const [banca, setBanca] = useState("FGV");
  const [materia, setMateria] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [qtdQuestoes, setQtdQuestoes] = useState("10");
  const [dificuldade, setDificuldade] = useState("Média");
  const [pacingMode, setPacingMode] = useState<TimedQuizPacingMode>("per_question");
  const [minutesPerQuestion, setMinutesPerQuestion] = useState(3);
  const [totalBlockMinutes, setTotalBlockMinutes] = useState(30);
  const [strictAntiDistraction, setStrictAntiDistraction] = useState(false);

  // Dados do Edital / Matérias
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado do Exame Ativo
  const [questions, setQuestions] = useState<TimedQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});

  // Cronômetro Resiliente Baseado em Timestamps
  const [totalAllocatedSeconds, setTotalAllocatedSeconds] = useState(1800);
  const [remainingSeconds, setRemainingSeconds] = useState(1800);
  const [isPaused, setIsPaused] = useState(false);
  const endTimeRef = useRef<number>(0);
  const pausedTimeRemainingRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Rastreamento de tempo individual por questão
  const questionStartTimestampRef = useRef<number>(Date.now());
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<Record<number, number>>({});

  // UI States do Exame
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isExamSheetOpen, setIsExamSheetOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTimeoutAutoSubmit, setIsTimeoutAutoSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resultado Final
  const [resultData, setResultData] = useState<{
    correctAnswers: number;
    accuracyPercentage: number;
    totalTimeSpentSeconds: number;
    earnedXp: number;
    baseEarnedXp: number;
    accuracyBonusXp: number;
    timedBonusXp: number;
    completedWithinTime: boolean;
    questionsAudit: Array<{
      question: TimedQuizQuestion;
      userAnswer?: string;
      isCorrect: boolean;
      timeSpentSeconds: number;
      isFlagged?: boolean;
      errorReason?: ErrorClassification;
    }>;
  } | null>(null);

  // 1. CARREGAMENTO INICIAL DAS MATÉRIAS DO EDITAL & INICIALIZAÇÃO INSTANTÂNEA
  useEffect(() => {
    const examId = searchParams.get("examId") || searchParams.get("quizId");
    const source = searchParams.get("source");
    const pacingParam = searchParams.get("pacing") as TimedQuizPacingMode | null;
    const paceParam = parseFloat(searchParams.get("pace") || "3");
    const blockParam = parseInt(searchParams.get("block") || "30", 10);
    const focusParam = searchParams.get("focus") === "true";

    // Se acessado diretamente sem nenhum parâmetro de exame, redireciona para a Central em /questions
    if (!examId && !source && !searchParams.get("subjectId") && !searchParams.get("topicId")) {
      router.replace("/questions?tab=history");
      return;
    }

    if (examId) {
      setIsGenerating(true);
      getSavedQuizByIdAction(examId)
        .then((res) => {
          if (!res.success || !res.data) {
            router.replace("/questions?tab=history");
            return;
          }

          const savedQuiz = res.data;
          const questionsList = (
            Array.isArray(savedQuiz.questions) ? savedQuiz.questions : []
          ) as unknown as TimedQuizQuestion[];

          if (questionsList.length === 0) {
            router.replace("/questions?tab=history");
            return;
          }

          setBanca(savedQuiz.banca || "FGV");
          setMateria(savedQuiz.subject || "Simulado Salvo");
          if (savedQuiz.topicId) setSelectedTopicId(savedQuiz.topicId);

          setQuestions(questionsList);
          setCurrentIndex(0);
          setSelectedAnswers({});
          setFlaggedQuestions({});
          setTimeSpentPerQuestion({});

          let allocated = 1800;
          if (pacingParam === "total_block") {
            allocated = blockParam * 60;
          } else {
            allocated = Math.max(60, Math.round(questionsList.length * paceParam * 60));
          }

          setTotalAllocatedSeconds(allocated);
          setRemainingSeconds(allocated);
          endTimeRef.current = Date.now() + allocated * 1000;
          questionStartTimestampRef.current = Date.now();
          setIsPaused(false);
          setIsFocusMode(focusParam);
          setPhase("exam");
        })
        .catch((err) => {
          console.error("Erro ao carregar simulado salvo:", err);
          router.replace("/questions?tab=history");
        })
        .finally(() => {
          setIsGenerating(false);
          setIsLoadingSubjects(false);
        });
      return;
    }

    if (source === "errors") {
      setIsGenerating(true);
      getErrorNotebookItemsAction({ status: "PENDING" })
        .then((res) => {
          if (!res.success || !res.data || res.data.length === 0) {
            router.replace("/questions?tab=notebook");
            return;
          }

          const errorQuestions: TimedQuizQuestion[] = res.data.map((item, idx) => ({
            id: item.id || `err-q-${idx}`,
            enunciado: item.questionText,
            formato: "multipla",
            alternativas: Array.isArray(item.options) ? (item.options as any) : [],
            gabaritoCorreto: item.correctAnswer,
            justificativa: item.explanation || "Questão recuperada do Caderno de Erros.",
            subjectId: item.subjectId || undefined,
            topicId: item.topicId || undefined,
          }));

          setBanca("Recuperação");
          setMateria("Caderno de Erros");
          setQuestions(errorQuestions);
          setCurrentIndex(0);
          setSelectedAnswers({});
          setFlaggedQuestions({});
          setTimeSpentPerQuestion({});

          let allocated = 1800;
          if (pacingParam === "total_block") {
            allocated = blockParam * 60;
          } else {
            allocated = Math.max(60, Math.round(errorQuestions.length * paceParam * 60));
          }

          setTotalAllocatedSeconds(allocated);
          setRemainingSeconds(allocated);
          endTimeRef.current = Date.now() + allocated * 1000;
          questionStartTimestampRef.current = Date.now();
          setIsPaused(false);
          setIsFocusMode(focusParam);
          setPhase("exam");
        })
        .catch((err) => {
          console.error("Erro ao carregar erros pendentes:", err);
          router.replace("/questions?tab=notebook");
        })
        .finally(() => {
          setIsGenerating(false);
          setIsLoadingSubjects(false);
        });
      return;
    }

    // Carregamento de matérias para modo de preparação
    fetch("/api/edital?mode=subjects")
      .then((res) => res.json())
      .then((json) => {
        const rawSubjects: SubjectItem[] = json.data || [];
        const uniqueSubjectsMap = new Map<string, SubjectItem>();

        rawSubjects.forEach((sub) => {
          const nameKey = sub.name.trim();
          if (uniqueSubjectsMap.has(nameKey)) {
            const existing = uniqueSubjectsMap.get(nameKey)!;
            const combined = [...(existing.topics || []), ...(sub.topics || [])];
            existing.topics = Array.from(new Map(combined.map((t) => [t.id, t])).values());
          } else {
            uniqueSubjectsMap.set(nameKey, {
              ...sub,
              name: nameKey,
              topics: sub.topics ? [...sub.topics] : [],
            });
          }
        });

        const loaded = Array.from(uniqueSubjectsMap.values());
        setSubjects(loaded);

        const paramSub = searchParams.get("subjectId");
        const paramTop = searchParams.get("topicId");

        if (paramSub) {
          const decodedSub = decodeURIComponent(paramSub);
          const found = loaded.find(
            (s) =>
              s.id === decodedSub ||
              s.name.trim().toLowerCase() === decodedSub.trim().toLowerCase()
          );
          if (found) {
            setMateria(found.name);
            if (paramTop && found.topics) {
              const matchedTop = found.topics.find((t) => t.id === paramTop);
              if (matchedTop) setSelectedTopicId(matchedTop.id);
            }
          } else {
            setMateria(decodedSub);
          }
        } else if (loaded.length > 0) {
          setMateria(loaded[0].name);
        }
      })
      .catch((err) => console.error("Erro ao carregar matérias:", err))
      .finally(() => setIsLoadingSubjects(false));
  }, [searchParams, router]);

  // Sincroniza fechamento da sidebar se o modo anti-distração estiver ligado
  useEffect(() => {
    if (isFocusMode && closeSidebar) {
      closeSidebar();
    }
  }, [isFocusMode, closeSidebar]);

  const currentSubjectObj = subjects.find(
    (s) =>
      s.id === materia || s.name.trim().toLowerCase() === materia.trim().toLowerCase()
  );
  const availableTopics = currentSubjectObj?.topics || [];

  // 2. FUNÇÃO AUXILIAR: ACUMULAR TEMPO DA QUESTÃO ATUAL
  const recordCurrentQuestionTime = useCallback(() => {
    const now = Date.now();
    const elapsedSeconds = Math.max(
      1,
      Math.round((now - questionStartTimestampRef.current) / 1000)
    );
    setTimeSpentPerQuestion((prev) => ({
      ...prev,
      [currentIndex]: (prev[currentIndex] || 0) + elapsedSeconds,
    }));
    questionStartTimestampRef.current = now;
  }, [currentIndex]);

  // Transição de questão segura registrando o tempo da questão que está saindo
  const navigateToQuestion = useCallback(
    (targetIndex: number) => {
      if (targetIndex < 0 || targetIndex >= questions.length || targetIndex === currentIndex) {
        return;
      }
      recordCurrentQuestionTime();
      setCurrentIndex(targetIndex);
    },
    [questions.length, currentIndex, recordCurrentQuestionTime]
  );

  // 3. CRONÔMETRO RESILIENTE BASEADO EM TIMESTAMP
  useEffect(() => {
    if (phase !== "exam") {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    if (isPaused) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const diffMs = endTimeRef.current - now;
      const leftSec = Math.max(0, Math.ceil(diffMs / 1000));
      setRemainingSeconds(leftSec);

      if (leftSec <= 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        // Dispara auto-submissão mandatória de estouro de tempo
        setIsTimeoutAutoSubmit(true);
        setIsConfirmModalOpen(true);
      }
    }, 500);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase, isPaused]);

  // Pausar / Retomar cronômetro
  const handleTogglePause = () => {
    if (isPaused) {
      // Retoma
      endTimeRef.current = Date.now() + pausedTimeRemainingRef.current * 1000;
      questionStartTimestampRef.current = Date.now();
      setIsPaused(false);
    } else {
      // Pausa
      recordCurrentQuestionTime();
      pausedTimeRemainingRef.current = remainingSeconds;
      setIsPaused(true);
    }
  };

  // 4. INICIAR SIMULADO (GERAÇÃO OU PREPARAÇÃO)
  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const count = parseInt(qtdQuestoes, 10) || 10;
      const selectedTopicObj = availableTopics.find((t) => t.id === selectedTopicId);
      const topicoNome = selectedTopicObj ? selectedTopicObj.title : undefined;

      const response = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banca,
          materia,
          topicoId: selectedTopicId || "ALL",
          topicoNome: topicoNome || "Todos os Tópicos",
          qtdQuestoes: count,
          dificuldade,
          fonteConteudo: "banca",
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.data || json.data.length === 0) {
        throw new Error(
          json.error || json.details || "Não foi possível gerar as questões do simulado."
        );
      }

      const generatedQuestions: TimedQuizQuestion[] = json.data;
      setQuestions(generatedQuestions);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setFlaggedQuestions({});
      setTimeSpentPerQuestion({});

      // Cálculo do tempo total alocado em segundos
      let allocated = 1800; // 30 min padrão
      if (pacingMode === "per_question") {
        allocated = count * minutesPerQuestion * 60;
      } else {
        allocated = totalBlockMinutes * 60;
      }

      setTotalAllocatedSeconds(allocated);
      setRemainingSeconds(allocated);
      endTimeRef.current = Date.now() + allocated * 1000;
      questionStartTimestampRef.current = Date.now();
      setIsPaused(false);
      setIsFocusMode(strictAntiDistraction);
      setPhase("exam");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Falha ao iniciar simulado cronometrado."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // 5. SUBMISSÃO FINAL DO SIMULADO
  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    recordCurrentQuestionTime();

    try {
      const totalQ = questions.length;
      let correctCount = 0;

      const submissions: QuestionAnswerSubmission[] = questions.map((q, idx) => {
        const userAns = selectedAnswers[idx] || "";
        const isCorr = userAns === q.gabaritoCorreto;
        if (isCorr) correctCount += 1;

        const isFlag = Boolean(flaggedQuestions[idx]);
        const timeSpent = timeSpentPerQuestion[idx] || Math.round(totalAllocatedSeconds / totalQ);

        return {
          questionId: q.id || `timed-q-${idx}`,
          subjectId: q.subjectId || currentSubjectObj?.id || "",
          topicId: q.topicId || selectedTopicId || undefined,
          selectedOption: userAns,
          isCorrect: isCorr,
          timeSpentSeconds: timeSpent,
          isFlaggedForReview: isFlag,
          questionText: q.enunciado,
          options: q.alternativas,
          correctAnswer: q.gabaritoCorreto,
          explanation: q.justificativa,
          errorReason: isCorr ? undefined : isTimeoutAutoSubmit ? "TIME_PRESSURE" : "UNCLASSIFIED",
        };
      });

      const totalTimeSpent = Math.max(1, totalAllocatedSeconds - remainingSeconds);

      // Chamada à Server Action oficial com computação atômica e gamificação
      const res = await submitQuizAttemptAction({
        title: `Simulado Cronometrado [${banca}] - ${materia || "Geral"}`,
        topicId: selectedTopicId || undefined,
        subjectId: currentSubjectObj?.id || undefined,
        totalQuestions: totalQ,
        correctAnswers: correctCount,
        timeSpentSeconds: totalTimeSpent,
        totalAllocatedSeconds,
        isTimedSimulation: true,
        answers: submissions,
      });

      const accuracy = Math.round((correctCount / Math.max(1, totalQ)) * 100);

      const serverData = res.success ? res.data : null;
      const earnedXp = serverData?.earnedXp || correctCount * 20;
      const baseEarnedXp = serverData?.baseEarnedXp || correctCount * 20;
      const accuracyBonusXp = serverData?.accuracyBonusXp || (accuracy >= 80 ? 50 : 0);
      const timedBonusXp = serverData?.timedBonusXp || 0;
      const completedWithin = serverData?.completedWithinTime ?? (remainingSeconds > 0);

      // Auditoria completa para a tela de revisão pós-exame
      const audit = questions.map((q, idx) => ({
        question: q,
        userAnswer: selectedAnswers[idx],
        isCorrect: selectedAnswers[idx] === q.gabaritoCorreto,
        timeSpentSeconds: timeSpentPerQuestion[idx] || 0,
        isFlagged: Boolean(flaggedQuestions[idx]),
        errorReason: (selectedAnswers[idx] !== q.gabaritoCorreto
          ? isTimeoutAutoSubmit
            ? "TIME_PRESSURE"
            : "UNCLASSIFIED"
          : undefined) as ErrorClassification | undefined,
      }));

      setResultData({
        correctAnswers: correctCount,
        accuracyPercentage: accuracy,
        totalTimeSpentSeconds: totalTimeSpent,
        earnedXp,
        baseEarnedXp,
        accuracyBonusXp,
        timedBonusXp,
        completedWithinTime: completedWithin,
        questionsAudit: audit,
      });

      if (refreshStats) await refreshStats();
      setIsConfirmModalOpen(false);
      setPhase("results");
    } catch (error) {
      console.error("Erro ao submeter simulado cronometrado:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. ATALHOS DE TECLADO NO EXAME
  useEffect(() => {
    if (phase !== "exam" || isConfirmModalOpen || isExamSheetOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const keyUpper = e.key.toUpperCase();

      // Z: Alternar modo anti-distração
      if (keyUpper === "Z") {
        e.preventDefault();
        setIsFocusMode((prev) => !prev);
        return;
      }

      // G: Abrir/Fechar Gabarito
      if (keyUpper === "G") {
        e.preventDefault();
        setIsExamSheetOpen((prev) => !prev);
        return;
      }

      // F ou R: Alternar Flag de Revisão
      if (keyUpper === "F" || keyUpper === "R") {
        e.preventDefault();
        setFlaggedQuestions((prev) => ({
          ...prev,
          [currentIndex]: !prev[currentIndex],
        }));
        return;
      }

      // Alternativas: A, B, C, D, E ou 1, 2, 3, 4, 5
      const mapKeyToAlt: Record<string, string> = {
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

      if (mapKeyToAlt[keyUpper]) {
        e.preventDefault();
        const altId = mapKeyToAlt[keyUpper];
        setSelectedAnswers((prev) => ({
          ...prev,
          [currentIndex]: altId,
        }));
        return;
      }

      // Navegação por setas
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (currentIndex < questions.length - 1) {
          navigateToQuestion(currentIndex + 1);
        }
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (currentIndex > 0) {
          navigateToQuestion(currentIndex - 1);
        }
        return;
      }

      // Enter: Avançar para a próxima questão
      if (e.key === "Enter") {
        e.preventDefault();
        if (currentIndex < questions.length - 1) {
          navigateToQuestion(currentIndex + 1);
        } else {
          setIsConfirmModalOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    phase,
    isConfirmModalOpen,
    isExamSheetOpen,
    currentIndex,
    questions.length,
    navigateToQuestion,
  ]);

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).filter(
    (k) => selectedAnswers[Number(k)] !== undefined && selectedAnswers[Number(k)] !== ""
  ).length;
  const flaggedCount = Object.keys(flaggedQuestions).filter(
    (k) => Boolean(flaggedQuestions[Number(k)])
  ).length;

  // Render enunciado formatado com negritos destacados
  const renderEnunciado = (texto: string) => {
    if (!texto) return null;
    const partes = texto.split(/(\*\*.*?\*\*)/g);
    return partes.map((parte, i) => {
      if (parte.startsWith("**") && parte.endsWith("**")) {
        const limpo = parte.slice(2, -2);
        return (
          <span
            key={`highlight-${i}`}
            className="inline-block bg-violet-500/15 text-violet-200 px-1.5 py-0.5 mx-0.5 rounded-md border border-violet-400/30 font-semibold align-baseline shadow-xs"
          >
            {limpo}
          </span>
        );
      }
      return <React.Fragment key={`text-${i}`}>{parte}</React.Fragment>;
    });
  };

  return (
    <div
      className={`min-h-screen font-sans antialiased selection:bg-violet-500/30 text-slate-100 ${
        isFocusMode
          ? "fixed inset-0 z-50 bg-[#02050e] overflow-y-auto"
          : "bg-[#02050e] p-3 sm:p-6"
      }`}
    >
      {/* CSS Dinâmico para ocultar sidebar e layout padrão quando em modo anti-distração */}
      {isFocusMode && (
        <style jsx global>{`
          aside,
          [data-sidebar="sidebar"],
          .sidebar-container,
          nav.bottom-nav {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        `}</style>
      )}

      {/* ========================================================================= */}
      {/* FASE 1: CONFIGURAÇÃO DO SIMULADO CRONOMETRADO                              */}
      {/* ========================================================================= */}
      {phase === "setup" && (
        isGenerating ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-300">
            <Loader2 size={36} className="animate-spin text-violet-400" />
            <p className="text-sm font-bold text-violet-200">
              Carregando caderno para o modo cronometrado...
            </p>
            <p className="text-xs text-slate-400">Zero tokens consumidos • Início instantâneo</p>
          </div>
        ) : (
        <div className="max-w-3xl mx-auto space-y-6 pt-4 pb-16">
          {/* HEADER SPOTLIGHT */}
          <div className="relative overflow-hidden bg-linear-to-br from-[#0e1424] via-[#090d18] to-[#04060c] border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider">
                <Timer size={14} className="text-violet-400 animate-pulse" />
                Exam Simulation Mode
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Modo Simulado Cronometrado
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Treine sob a pressão de tempo exata de uma prova real. Configure o
                tempo por questão ou bloco total, acompanhe sua Pacing Bar em tempo
                real e ganhe bônus de XP para alta precisão dentro do prazo.
              </p>
            </div>
          </div>

          {/* FORMULÁRIO DE CONFIGURAÇÃO */}
          <form
            onSubmit={handleStartExam}
            className="bg-[#080c16]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6"
          >
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                <ShieldAlert size={18} className="shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* BANCA */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Banca Examinadora
                </label>
                <select
                  value={banca}
                  onChange={(e) => setBanca(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
                >
                  <option value="FGV" className="bg-[#0a0f1d]">FGV (Fundação Getulio Vargas)</option>
                  <option value="Cebraspe" className="bg-[#0a0f1d]">Cebraspe / Cespe</option>
                  <option value="FCC" className="bg-[#0a0f1d]">FCC (Fundação Carlos Chagas)</option>
                  <option value="Vunesp" className="bg-[#0a0f1d]">Vunesp</option>
                  <option value="Cesgranrio" className="bg-[#0a0f1d]">Cesgranrio</option>
                  <option value="Outras" className="bg-[#0a0f1d]">Banca Mista / Geral</option>
                </select>
              </div>

              {/* MATÉRIA DO EDITAL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Disciplina / Matéria
                </label>
                <select
                  value={materia}
                  onChange={(e) => {
                    setMateria(e.target.value);
                    setSelectedTopicId("");
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.name} className="bg-[#0a0f1d]">
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* TÓPICO (OPCIONAL) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Tópico do Edital (Opcional)
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
                >
                  <option value="" className="bg-[#0a0f1d]">Todos os Tópicos da Matéria</option>
                  {availableTopics.map((top) => (
                    <option key={top.id} value={top.id} className="bg-[#0a0f1d]">
                      {top.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* QUANTIDADE DE QUESTÕES */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Número de Questões
                </label>
                <select
                  value={qtdQuestoes}
                  onChange={(e) => setQtdQuestoes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
                >
                  <option value="5" className="bg-[#0a0f1d]">5 Questões (Simulado Rápido)</option>
                  <option value="10" className="bg-[#0a0f1d]">10 Questões (Recomendado)</option>
                  <option value="15" className="bg-[#0a0f1d]">15 Questões (Bloco Completo)</option>
                  <option value="20" className="bg-[#0a0f1d]">20 Questões (Intensivo)</option>
                  <option value="30" className="bg-[#0a0f1d]">30 Questões (Maratona de Prova)</option>
                </select>
              </div>
            </div>

            {/* SELEÇÃO DO MODO DE TEMPO (PACING) */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Régua de Tempo & Ritmo de Prova
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPacingMode("per_question")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    pacingMode === "per_question"
                      ? "bg-violet-600/20 border-violet-500/60 text-white shadow-lg shadow-violet-600/10"
                      : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Média por Questão</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                      {minutesPerQuestion} min/questão
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Tempo total proporcional ao total de questões. Ex: 10 questões ={" "}
                    {10 * minutesPerQuestion} minutos.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPacingMode("total_block")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    pacingMode === "total_block"
                      ? "bg-violet-600/20 border-violet-500/60 text-white shadow-lg shadow-violet-600/10"
                      : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Bloco Fixo de Prova</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                      {totalBlockMinutes} min total
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Tempo fixo para você gerenciar o bloco inteiro como no caderno da banca.
                  </p>
                </button>
              </div>

              {/* SLIDERS DE AJUSTE FINO */}
              {pacingMode === "per_question" ? (
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-300">
                    Minutos por questão: <strong className="text-violet-400">{minutesPerQuestion} min</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    {[2, 2.5, 3, 4].map((m) => (
                      <button
                        key={`min-${m}`}
                        type="button"
                        onClick={() => setMinutesPerQuestion(m)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                          minutesPerQuestion === m
                            ? "bg-violet-600 text-white"
                            : "bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-300">
                    Duração total do bloco: <strong className="text-violet-400">{totalBlockMinutes} min</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    {[15, 30, 45, 60, 90].map((m) => (
                      <button
                        key={`block-${m}`}
                        type="button"
                        onClick={() => setTotalBlockMinutes(m)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                          totalBlockMinutes === m
                            ? "bg-violet-600 text-white"
                            : "bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* MODO ANTI-DISTRAÇÃO AUTOMÁTICO */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  Iniciar em Modo Anti-Distração (Focus Cockpit)
                </span>
                <span className="text-[11px] text-slate-400">
                  Oculta a barra lateral e escurece a tela para máxima concentração.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStrictAntiDistraction((prev) => !prev)}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  strictAntiDistraction ? "bg-violet-600" : "bg-white/10"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 ${
                    strictAntiDistraction ? "translate-x-5.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* BOTÃO DE INÍCIO */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isGenerating || subjects.length === 0}
                className="w-full py-4 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm tracking-wide transition-all shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Preparando Caderno de Prova...</span>
                  </>
                ) : (
                  <>
                    <Play size={18} className="fill-current" />
                    <span>Iniciar Simulado Cronometrado</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        )
      )}

      {/* ========================================================================= */}
      {/* FASE 2: COCKPIT DO EXAME ATIVO                                            */}
      {/* ========================================================================= */}
      {phase === "exam" && currentQ && (
        <div className="min-h-screen flex flex-col justify-between">
          {/* PACING BAR FIXA NO TOPO */}
          <PacingBar
            remainingSeconds={remainingSeconds}
            totalAllocatedSeconds={totalAllocatedSeconds}
            currentQuestionIndex={currentIndex}
            totalQuestions={questions.length}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
            onOpenExamSheet={() => setIsExamSheetOpen((prev) => !prev)}
            examSheetOpen={isExamSheetOpen}
            answeredCount={answeredCount}
            flaggedCount={flaggedCount}
          />

          {/* ÁREA CENTRAL: CARTÃO DA QUESTÃO ATUAL */}
          <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-6 py-6 space-y-6">
            <div className="bg-[#090d18]/90 border border-violet-500/20 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6 relative overflow-hidden">
              {/* Glow sutil */}
              <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-violet-600/10 blur-3xl" />

              {/* CABEÇALHO DA QUESTÃO */}
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 text-xs font-black uppercase tracking-wider">
                    Questão {currentIndex + 1}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase">
                    {banca}
                  </span>
                  <span className="text-xs text-slate-400 font-medium truncate max-w-xs">
                    {materia}
                  </span>
                </div>

                {/* BOTÃO MARCAR PARA REVISÃO (FLAG) */}
                <button
                  onClick={() =>
                    setFlaggedQuestions((prev) => ({
                      ...prev,
                      [currentIndex]: !prev[currentIndex],
                    }))
                  }
                  type="button"
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    flaggedQuestions[currentIndex]
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-amber-500/30"
                  }`}
                  title="Marcar para Revisão (F ou R)"
                >
                  <Flag
                    size={13}
                    className={flaggedQuestions[currentIndex] ? "fill-current text-amber-400" : ""}
                  />
                  <span>
                    {flaggedQuestions[currentIndex] ? "Marcada" : "Revisar (F)"}
                  </span>
                </button>
              </div>

              {/* ENUNCIADO */}
              <div className="text-sm sm:text-base text-slate-100 leading-relaxed font-normal">
                {renderEnunciado(currentQ.enunciado)}
              </div>

              {/* ALTERNATIVAS */}
              <div className="space-y-3 pt-2">
                {currentQ.alternativas?.map((alt, altIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === alt.id;
                  const keyNumber = altIdx + 1;

                  return (
                    <div
                      key={alt.id}
                      onClick={() =>
                        setSelectedAnswers((prev) => ({
                          ...prev,
                          [currentIndex]: alt.id,
                        }))
                      }
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isSelected
                          ? "bg-violet-600/25 border-violet-500 text-white ring-2 ring-violet-500/30 shadow-lg shadow-violet-600/15"
                          : "bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:border-white/20"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl border flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                          isSelected
                            ? "bg-violet-600 border-violet-400 text-white shadow-xs"
                            : "bg-white/5 border-white/15 text-slate-400"
                        }`}
                      >
                        {alt.id}
                      </div>

                      <span className="text-xs sm:text-sm leading-relaxed flex-1 pt-0.5">
                        {alt.texto}
                      </span>

                      <span className="hidden sm:inline-block text-[10px] font-mono text-slate-600 px-1.5 py-0.5 rounded bg-white/5">
                        [{keyNumber}]
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BARRA INFERIOR DE NAVEGAÇÃO E AÇÕES */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => navigateToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
                type="button"
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowLeft size={14} />
                <span>Anterior</span>
              </button>

              <button
                onClick={() => setIsConfirmModalOpen(true)}
                type="button"
                className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs transition-all cursor-pointer"
              >
                Finalizar Prova
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => navigateToQuestion(currentIndex + 1)}
                  type="button"
                  className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-violet-600/20"
                >
                  <span>Próxima</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setIsConfirmModalOpen(true)}
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <span>Concluir Simulado</span>
                  <CheckCircle2 size={15} />
                </button>
              )}
            </div>
          </main>

          {/* GRADE DE GABARITO RETRÁTIL (HUD) */}
          <ExamSheetHUD
            isOpen={isExamSheetOpen}
            onClose={() => setIsExamSheetOpen(false)}
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            selectedAnswers={selectedAnswers}
            flaggedQuestions={flaggedQuestions}
            onSelectQuestion={(idx) => navigateToQuestion(idx)}
            onRequestFinish={() => setIsConfirmModalOpen(true)}
          />

          {/* MODAL DE CONFIRMAÇÃO / TIMEOUT */}
          <SubmitConfirmModal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={handleSubmitExam}
            onReviewPending={() => {
              setIsConfirmModalOpen(false);
              // Pula para a primeira questão pendente ou com flag
              const firstPendingIndex = questions.findIndex(
                (_, idx) =>
                  selectedAnswers[idx] === undefined ||
                  selectedAnswers[idx] === "" ||
                  Boolean(flaggedQuestions[idx])
              );
              if (firstPendingIndex !== -1) {
                navigateToQuestion(firstPendingIndex);
              }
            }}
            totalQuestions={questions.length}
            answeredCount={answeredCount}
            flaggedCount={flaggedCount}
            remainingSeconds={remainingSeconds}
            isTimeoutAutoSubmit={isTimeoutAutoSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* FASE 3: AUDITORIA E RESULTADOS PÓS-EXAME                                   */}
      {/* ========================================================================= */}
      {phase === "results" && resultData && (
        <TimedExamResultView
          banca={banca}
          materia={materia}
          totalQuestions={questions.length}
          correctAnswers={resultData.correctAnswers}
          accuracyPercentage={resultData.accuracyPercentage}
          totalTimeSpentSeconds={resultData.totalTimeSpentSeconds}
          totalAllocatedSeconds={totalAllocatedSeconds}
          earnedXp={resultData.earnedXp}
          baseEarnedXp={resultData.baseEarnedXp}
          accuracyBonusXp={resultData.accuracyBonusXp}
          timedBonusXp={resultData.timedBonusXp}
          completedWithinTime={resultData.completedWithinTime}
          questionsAudit={resultData.questionsAudit}
          onRestartExam={() => {
            setSelectedAnswers({});
            setFlaggedQuestions({});
            setTimeSpentPerQuestion({});
            setCurrentIndex(0);
            setRemainingSeconds(totalAllocatedSeconds);
            endTimeRef.current = Date.now() + totalAllocatedSeconds * 1000;
            questionStartTimestampRef.current = Date.now();
            setIsPaused(false);
            setPhase("exam");
          }}
          onNewExam={() => {
            router.push("/questions?tab=history");
          }}
        />
      )}
    </div>
  );
}
