"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useSidebar } from "@/lib/sidebar-context";
import { useGamification } from "@/context/GamificationContext";

import {
  Menu,
  HelpCircle,
  Sparkles,
  History,
  Home,
  ArrowRight,
  Zap,
  BookOpen,
  Lock,
  Printer,
  Target,
  Flame,
  Maximize2,
  Minimize2,
  Clock,
  Pause,
  Play,
  CheckCircle2,
  Timer,
  BookOpenCheck,
  Loader2,
} from "lucide-react";

import { FloatingTimer } from "./_components/FloatingTimer";
import {
  ResumeSessionCard,
  PausedSession,
} from "./_components/ResumeSessionCard";
import { QuestionCard } from "./_components/QuestionCard";
import { CompletionModal } from "./_components/CompletionModal";
import { QuizResultView } from "@/components/study/QuizResultView";
import { QuizHistoryTab } from "./_components/QuizHistoryTab";
import { GenerateAIModal } from "./_components/GenerateAIModal";
import { QuestionMinimap } from "./_components/QuestionMinimap";
import { TimedLaunchModal } from "./_components/TimedLaunchModal";
import { TimedPacingModal } from "./_components/TimedPacingModal";
import { ErrorNotebookView } from "../notebook/components/ErrorNotebookView";
import { SimuladoGenerationModal } from "@/components/study/SimuladoGenerationModal";
import { QuizResolutionView } from "@/components/study/QuizResolutionView";

import { PrintableQuestions } from "@/components/questions/printable-questions";

import {
  submitQuizAttemptAction,
  getSubjectDomainStatsAction,
} from "@/actions/quiz-actions";
import { generateTargetedDeckAction } from "@/actions/deck-actions";
import {
  getErrorMetricsAction,
} from "@/actions/error-notebook-actions";
import {
  ErrorClassification,
  QuestionAnswerSubmission,
  ErrorNotebookMetrics,
} from "@/types/quiz";

export interface QuestaoIA {
  id?: string;
  enunciado: string;
  formato: string;
  justificativa: string;
  pegadinhaBanca?: string;
  explicacaoErro?: string;
  alternativas: { id: string; texto: string }[];
  gabaritoCorreto: string;
  flashcardFrente: string;
  flashcardVerso: string;
  subjectId?: string;
  topicId?: string;
}

interface QuizHistoryItem {
  id: string;
  banca: string;
  subject: string;
  difficulty: string;
  questions: QuestaoIA[];
  createdAt: string;
  topic?: { title: string } | null;
}

interface SubjectItem {
  id: string;
  name: string;
  topics?: { id: string; title: string }[];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function randomizeQuizSession(questionsList: QuestaoIA[]): QuestaoIA[] {
  const shuffledQuestions = shuffleArray(questionsList);
  return shuffledQuestions.map((q) => {
    if (
      q.formato !== "multipla" ||
      !Array.isArray(q.alternativas) ||
      q.alternativas.length === 0
    ) {
      return q;
    }
    const alternativaCorretaObj = q.alternativas.find(
      (alt) => alt.id === q.gabaritoCorreto,
    );
    const textoCorreto = alternativaCorretaObj
      ? alternativaCorretaObj.texto
      : null;
    if (!textoCorreto) return q;

    const alternativasEmbaralhadas = shuffleArray(q.alternativas);
    const letras = ["A", "B", "C", "D", "E"];
    let novoGabarito = q.gabaritoCorreto;

    const novasAlternativas = alternativasEmbaralhadas.map((alt, index) => {
      const novaLetra = letras[index] || `ALT_${index}`;
      if (alt.texto === textoCorreto) novoGabarito = novaLetra;
      return { id: novaLetra, texto: alt.texto };
    });

    return {
      ...q,
      alternativas: novasAlternativas,
      gabaritoCorreto: novoGabarito,
    };
  });
}

function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function TabCreateSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-violet-950/30 via-zinc-900/60 to-black/80 border border-violet-500/20 rounded-2xl p-6 sm:p-7">
        <div className="space-y-4 max-w-xl">
          <div className="h-5 w-44 rounded-full bg-violet-500/15 border border-violet-500/30" />
          <div className="h-8 w-4/5 rounded-xl bg-white/5" />
          <div className="h-4 w-3/5 rounded-lg bg-white/5" />
        </div>
        <div className="mt-6 pt-3 flex gap-3 border-t border-white/5">
          <div className="h-7 w-32 rounded-xl bg-white/5" />
          <div className="h-7 w-36 rounded-xl bg-white/5" />
          <div className="h-7 w-32 rounded-xl bg-white/5" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="h-52 rounded-2xl bg-zinc-900/50 border border-violet-500/20 backdrop-blur-xl p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30" />
            <div className="h-5 w-44 rounded-lg bg-white/5" />
            <div className="h-3 w-56 rounded bg-white/5" />
          </div>
          <div className="h-9 w-full rounded-xl bg-white/5" />
        </div>
        <div className="h-52 rounded-2xl bg-zinc-900/50 border border-indigo-500/20 backdrop-blur-xl p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30" />
            <div className="h-5 w-44 rounded-lg bg-white/5" />
            <div className="h-3 w-56 rounded bg-white/5" />
          </div>
          <div className="h-9 w-full rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}

function TabHistorySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-[#090d16]/60 border border-white/10 backdrop-blur-xl rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="h-5 w-36 rounded bg-white/5" />
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="h-8 w-28 rounded-lg bg-white/5" />
            <div className="h-8 w-24 rounded-lg bg-white/5" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <div className="h-10 flex-1 rounded-xl bg-white/[0.03] border border-white/5" />
          <div className="h-10 w-36 rounded-xl bg-white/[0.03] border border-white/5" />
        </div>
      </div>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-40 rounded-2xl bg-[#090d16]/60 border border-white/10 backdrop-blur-xl p-5 flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 rounded bg-indigo-500/10 border border-indigo-500/20" />
              <div className="h-4 w-20 rounded bg-white/5" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-white/5" />
              <div className="h-3 w-1/2 rounded bg-white/5" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="h-4 w-24 rounded bg-white/5" />
              <div className="h-7 w-20 rounded-lg bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabErrorsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-[#090d16]/60 border border-white/10 backdrop-blur-xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 rounded bg-white/5" />
              <div className="w-5 h-5 rounded bg-white/5" />
            </div>
            <div className="h-6 w-12 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="h-14 rounded-2xl bg-[#090d16]/60 border border-white/10 backdrop-blur-xl p-3 flex items-center justify-between gap-3">
        <div className="h-8 flex-1 rounded-xl bg-white/[0.03]" />
        <div className="h-8 w-28 rounded-xl bg-white/[0.03]" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-[#090d16]/60 border border-white/10 backdrop-blur-xl p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-rose-500/10 border border-rose-500/20" />
              <div className="h-4 w-16 rounded bg-white/5" />
            </div>
            <div className="h-4 w-4/5 rounded bg-white/5" />
            <div className="h-3 w-1/3 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QuestoesPage() {
  const router = useRouter();
  const { openSidebar, closeSidebar } = useSidebar();
  const searchParams = useSearchParams();

  // Estados gerais
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [practiceMetrics, setPracticeMetrics] = useState<{
    totalAnswered: number;
    averageAccuracy: number;
  }>({ totalAnswered: 0, averageAccuracy: 0 });

  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"create" | "history" | "errors">(
    () => {
      const tabParam = searchParams.get("tab");
      if (tabParam === "history") return "history";
      if (tabParam === "errors" || tabParam === "notebook") return "errors";
      return "create";
    },
  );
  const [pendingTab, setPendingTab] = useState<
    "create" | "history" | "errors" | null
  >(null);

  // Caderno de Erros Integrado
  const [errorNotebookMetrics, setErrorNotebookMetrics] =
    useState<ErrorNotebookMetrics>({
      totalErrors: 0,
      pendingErrors: 0,
      masteredErrors: 0,
      masteryRate: 0,
      taxonomyDistribution: [],
    });
  const [isLoadingNotebook, setIsLoadingNotebook] = useState(false);
  const [isNotebookLoaded, setIsNotebookLoaded] = useState(false);

  // Modais de Simulado Cronometrado Integrado
  const [isTimedLaunchModalOpen, setIsTimedLaunchModalOpen] = useState(false);
  const [timedModalPacingTarget, setTimedModalPacingTarget] =
    useState<QuizHistoryItem | null>(null);
  const [isErrorsPacingModalOpen, setIsErrorsPacingModalOpen] = useState(false);

  // Estados do caderno / questões
  const [banca, setBanca] = useState("FGV");
  const [questions, setQuestions] = useState<QuestaoIA[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [checkedQuestions, setCheckedQuestions] = useState<
    Record<number, boolean>
  >({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<
    Record<number, boolean>
  >({});
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const [savedErrors, setSavedErrors] = useState<Record<number, boolean>>({});
  const [errorClassifications, setErrorClassifications] = useState<
    Record<number, ErrorClassification>
  >({});
  const [creatingFlashcardIndex, setCreatingFlashcardIndex] = useState<
    number | null
  >(null);
  const [createdFlashcards, setCreatedFlashcards] = useState<
    Record<number, boolean>
  >({});
  const [focusedQuestionIndex, setFocusedQuestionIndex] = useState(0);
  const [isZenMode, setIsZenMode] = useState(false);

  // Cronômetro, Pacing Real-Time e conclusão
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [currentQuestionSeconds, setCurrentQuestionSeconds] = useState(0);
  const [isAdaptiveMode, setIsAdaptiveMode] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isSyncingSM2, setIsSyncingSM2] = useState(false);
  const [lastEarnedXp, setLastEarnedXp] = useState(0);

  // Modal de Feedback Visual Premium de Geração com IA
  const [isSimuladoModalOpen, setIsSimuladoModalOpen] = useState(false);
  const [simuladoGenerationError, setSimuladoGenerationError] = useState<string | null>(null);
  const [pendingSimuladoData, setPendingSimuladoData] = useState<{
    questions: QuestaoIA[];
    quizId: string | null;
  } | null>(null);

  // Modal IA / Edital
  const [materia, setMateria] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [specificTopic, setSpecificTopic] = useState("");
  const [qtdQuestoes, setQtdQuestoes] = useState("5");
  const [fonteConteudo, setFonteConteudo] = useState<"banca" | "texto" | "pdf">(
    "banca",
  );
  const [dificuldade, setDificuldade] = useState("Média");
  const [textoBase, setTextoBase] = useState("");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Histórico
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [loadingQuizId, setLoadingQuizId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Sessão pausada
  const STORAGE_KEY = "deepwork_quiz_session_v1";
  const [pausedSession, setPausedSession] = useState<PausedSession | null>(
    null,
  );
  const [isMounted, setIsMounted] = useState(false);

  // Level up
  const [levelUpData, setLevelUpData] = useState<{
    leveledUp: boolean;
    newLevel: number;
    title?: string;
  } | null>(null);

  const { stats: gamificationStats, refreshStats } = useGamification();

  useEffect(() => {
    if (isZenMode && closeSidebar) {
      closeSidebar();
    }
  }, [isZenMode, closeSidebar]);

  useEffect(() => {
    if (levelUpData?.leveledUp) {
      localStorage.setItem(
        "pending_levelup_notification",
        JSON.stringify({
          level: levelUpData.newLevel,
          title: levelUpData.title || "Iniciante Consciente",
          timestamp: Date.now(),
        }),
      );
    }
  }, [levelUpData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.questions?.length > 0) setPausedSession(parsed);
        }
      } catch (e) {
        console.error("Erro ao carregar localStorage:", e);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const fetchQuizHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/questions/list");
      const json = await response.json();
      setQuizHistory(json.data || []);
      setIsHistoryLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const loadErrorNotebookData = useCallback(async () => {
    setIsLoadingNotebook(true);
    try {
      const metricsRes = await getErrorMetricsAction();
      if (metricsRes.success && metricsRes.data) {
        setErrorNotebookMetrics(metricsRes.data);
      }
      setIsNotebookLoaded(true);
    } catch (err) {
      console.error("Erro ao carregar caderno de erros:", err);
    } finally {
      setIsLoadingNotebook(false);
    }
  }, []);

  useEffect(() => {
    // Carrega histórico para contagem de cadernos salvos e pré-carregamento
    fetchQuizHistory();

    // Carrega métricas agregadas de treino (precisão e total de questões)
    getSubjectDomainStatsAction()
      .then((res) => {
        if (res.success && res.data) {
          const totalAnswered = res.data.reduce(
            (acc, curr) => acc + curr.totalAnswered,
            0,
          );
          const totalCorrect = res.data.reduce(
            (acc, curr) => acc + curr.correctCount,
            0,
          );
          const averageAccuracy =
            totalAnswered > 0
              ? Math.round((totalCorrect / totalAnswered) * 100)
              : 0;
          setPracticeMetrics({ totalAnswered, averageAccuracy });
        }
      })
      .catch((err) => console.error("Erro ao carregar métricas de domínio:", err));

    const tabParam = searchParams.get("tab");
    if (tabParam === "history") {
      setActiveTab("history");
    } else if (tabParam === "notebook" || tabParam === "errors") {
      setActiveTab("errors");
      loadErrorNotebookData();
    } else if (tabParam === "create") {
      setActiveTab("create");
    }

    const openTimed = searchParams.get("openTimed");
    if (openTimed === "true") {
      loadErrorNotebookData();
      setIsTimedLaunchModalOpen(true);
    }

    // Carrega estatísticas resumidas de erros para badge do tab
    getErrorMetricsAction()
      .then((res) => {
        if (res.success && res.data) {
          setErrorNotebookMetrics(res.data);
        }
      })
      .catch(() => {});

    const paramTopicId = searchParams.get("topicId");
    const paramSubjectId = searchParams.get("subjectId");
    const paramQuizId = searchParams.get("quizId");

    if (paramQuizId) {
      fetch(`/api/questions/${paramQuizId}`)
        .then(async (res) => {
          if (res.ok) {
            const json = await res.json();
            if (json.data) return json.data;
          }
          const listRes = await fetch("/api/questions/list");
          const listJson = await listRes.json();
          const list: QuizHistoryItem[] = listJson.data || [];
          return list.find((q) => q.id === paramQuizId);
        })
        .then((foundQuiz) => {
          if (foundQuiz && foundQuiz.questions?.length > 0) {
            setCurrentQuizId(foundQuiz.id);
            setQuestions(foundQuiz.questions);
            setBanca(foundQuiz.banca || "FGV");
            setMateria(foundQuiz.subject || "");
            setSelectedAnswers({});
            setCheckedQuestions({});
            setFlaggedQuestions({});
            setErrorClassifications({});
            setTimerSeconds(0);
            setIsTimerRunning(true);
            setActiveTab("create");
          }
        })
        .catch(console.error);
      return;
    }

    if (paramTopicId || paramSubjectId) {
      queueMicrotask(() => {
        setIsAIModalOpen(true);
      });
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "history") {
        setActiveTab("history");
        if (!isHistoryLoaded) fetchQuizHistory();
      } else if (tab === "errors" || tab === "notebook") {
        setActiveTab("errors");
        if (!isNotebookLoaded) loadErrorNotebookData();
      } else {
        setActiveTab("create");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isHistoryLoaded, isNotebookLoaded, fetchQuizHistory, loadErrorNotebookData]);

  useEffect(() => {
    if (!isMounted) return;
    try {
      if (questions.length > 0) {
        const currentState = {
          quizId: currentQuizId,
          banca,
          questions,
          selectedAnswers,
          checkedQuestions,
          createdFlashcards,
          timerSeconds,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
      }
    } catch (e) {
      console.error("Erro ao salvar localStorage:", e);
    }
  }, [
    currentQuizId,
    banca,
    questions,
    selectedAnswers,
    checkedQuestions,
    createdFlashcards,
    timerSeconds,
    isMounted,
  ]);

  // Reinicia o tempo da questão atual ao alternar a questão em foco
  useEffect(() => {
    setCurrentQuestionSeconds(0);
  }, [focusedQuestionIndex]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && questions.length > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
        setCurrentQuestionSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, questions.length]);

  useEffect(() => {
    queueMicrotask(() => {
      setIsInitialLoading(true);
    });

    fetch("/api/edital?mode=subjects")
      .then((res) => res.json())
      .then((json) => {
        const rawSubjects: SubjectItem[] = json.data || [];
        const uniqueSubjectsMap = new Map<string, SubjectItem>();

        rawSubjects.forEach((sub) => {
          const nameKey = sub.name.trim();
          if (uniqueSubjectsMap.has(nameKey)) {
            const existing = uniqueSubjectsMap.get(nameKey)!;
            const combinedTopics = [
              ...(existing.topics || []),
              ...(sub.topics || []),
            ];
            const uniqueTopics = Array.from(
              new Map(combinedTopics.map((t) => [t.id, t])).values(),
            );
            existing.topics = uniqueTopics;
          } else {
            uniqueSubjectsMap.set(nameKey, {
              ...sub,
              name: nameKey,
              topics: sub.topics ? [...sub.topics] : [],
            });
          }
        });

        const loadedSubjects = Array.from(uniqueSubjectsMap.values());
        setSubjects(loadedSubjects);

        const paramSubjectId = searchParams.get("subjectId");
        const paramTopicId = searchParams.get("topicId");

        if (paramSubjectId) {
          const decodedSubject = decodeURIComponent(paramSubjectId);
          const matchedSubject = loadedSubjects.find(
            (s) =>
              s.id === decodedSubject ||
              s.name.trim().toLowerCase() ===
                decodedSubject.trim().toLowerCase(),
          );

          if (matchedSubject) {
            setMateria(matchedSubject.name);
            if (paramTopicId && matchedSubject.topics) {
              const matchedTopic = matchedSubject.topics.find(
                (t) =>
                  t.id === paramTopicId ||
                  t.title.trim().toLowerCase() ===
                    paramTopicId.trim().toLowerCase(),
              );
              setSelectedTopicId(matchedTopic ? matchedTopic.id : paramTopicId);
            }
          } else {
            setMateria(decodedSubject);
            if (paramTopicId) setSelectedTopicId(paramTopicId);
          }
        } else if (loadedSubjects.length > 0) {
          setMateria((prev) => prev || loadedSubjects[0].name);
          if (paramTopicId) setSelectedTopicId(paramTopicId);
        }
      })
      .catch(console.error)
      .finally(() => {
        setIsInitialLoading(false);
      });
  }, []);

  const currentSubjectObj = subjects.find(
    (s) =>
      s.id === materia ||
      s.name.trim().toLowerCase() === materia.trim().toLowerCase(),
  );
  const availableTopics = currentSubjectObj?.topics || [];

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(checkedQuestions).length;
  const correctCount = Object.keys(checkedQuestions).filter(
    (idxStr) =>
      selectedAnswers[Number(idxStr)] ===
      questions[Number(idxStr)]?.gabaritoCorreto,
  ).length;
  const percentageAcc =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  const handleTabChange = useCallback(
    (newTab: "create" | "history" | "errors") => {
      if (
        activeTab === "create" &&
        newTab !== "create" &&
        questions.length > 0 &&
        Object.keys(selectedAnswers).length > 0
      ) {
        setPendingTab(newTab);
        return;
      }
      setActiveTab(newTab);
      const newUrl =
        newTab === "create" ? window.location.pathname : `?tab=${newTab}`;
      window.history.replaceState(null, "", newUrl);

      if (newTab === "history" && !isHistoryLoaded) {
        fetchQuizHistory();
      } else if (newTab === "errors" && !isNotebookLoaded) {
        loadErrorNotebookData();
      }
    },
    [
      activeTab,
      questions.length,
      selectedAnswers,
      isHistoryLoaded,
      isNotebookLoaded,
      fetchQuizHistory,
      loadErrorNotebookData,
    ],
  );

  const confirmNavigation = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      const newUrl =
        pendingTab === "create"
          ? window.location.pathname
          : `?tab=${pendingTab}`;
      window.history.replaceState(null, "", newUrl);
      if (pendingTab === "history" && !isHistoryLoaded) {
        fetchQuizHistory();
      } else if (pendingTab === "errors" && !isNotebookLoaded) {
        loadErrorNotebookData();
      }
      setQuestions([]);
      setSelectedAnswers({});
      setCheckedQuestions({});
      setFlaggedQuestions({});
      setErrorClassifications({});
      setSavedErrors({});
      setCreatedFlashcards({});
      setShowCompletionModal(false);
      setCurrentQuizId(null);
      setIsZenMode(false);
    }
    setPendingTab(null);
  };

  const syncQuizWithSM2 = useCallback(
    async (finalAccuracy: number) => {
      if (!selectedTopicId) return;
      setIsSyncingSM2(true);
      let grade = 1;
      if (finalAccuracy >= 95) grade = 5;
      else if (finalAccuracy >= 85) grade = 4;
      else if (finalAccuracy >= 70) grade = 3;
      else if (finalAccuracy >= 50) grade = 2;

      try {
        await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId: selectedTopicId,
            grade,
            source: "QUIZ",
          }),
        });
      } catch (err) {
        console.error("Erro ao sincronizar SM-2:", err);
      } finally {
        setIsSyncingSM2(false);
      }
    },
    [selectedTopicId],
  );

  const handleAnswerQuestion = useCallback(
    async (index: number) => {
      const nextChecked = { ...checkedQuestions, [index]: true };
      setCheckedQuestions(nextChecked);

      if (Object.keys(nextChecked).length === totalQuestions) {
        setIsTimerRunning(false);
        const finalCorrect = Object.keys(nextChecked).filter(
          (idxStr) =>
            selectedAnswers[Number(idxStr)] ===
            questions[Number(idxStr)]?.gabaritoCorreto,
        ).length;
        const finalAcc = Math.round((finalCorrect / totalQuestions) * 100);

        await syncQuizWithSM2(finalAcc);

        try {
          // 1. Grava no banco e atualiza estatísticas atômicas com a Server Action oficial
          const submissions: QuestionAnswerSubmission[] = questions.map(
            (q, idx) => ({
              questionId: q.id || `q-${idx}`,
              subjectId: q.subjectId || currentSubjectObj?.id || "",
              topicId: q.topicId || selectedTopicId || undefined,
              selectedOption: selectedAnswers[idx] || "",
              isCorrect: selectedAnswers[idx] === q.gabaritoCorreto,
              timeSpentSeconds: Math.round(timerSeconds / totalQuestions),
              errorReason: errorClassifications[idx] || "UNCLASSIFIED",
              questionText: q.enunciado,
              options: q.alternativas,
              correctAnswer: q.gabaritoCorreto,
              explanation: q.justificativa,
            }),
          );

          const attemptResult = await submitQuizAttemptAction({
            title: `Simulado ${banca} - ${materia || "Geral"}`,
            topicId: selectedTopicId || undefined,
            subjectId: currentSubjectObj?.id || undefined,
            totalQuestions,
            correctAnswers: finalCorrect,
            timeSpentSeconds: timerSeconds,
            answers: submissions,
          });

          // 2. Persiste histórico local no endpoint legado para visualização da aba de histórico
          const response = await fetch("/api/questions/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quizId: currentQuizId,
              banca: banca || "Geral",
              subject: materia?.trim() || "Geral",
              topicId: selectedTopicId || null,
              difficulty: dificuldade || "Média",
              questions: questions.map((q, idx) => ({
                ...q,
                userAnswer: selectedAnswers[idx],
                isCorrect: selectedAnswers[idx] === q.gabaritoCorreto,
                errorReason: errorClassifications[idx] || null,
                timeSpentSeconds: Math.round(
                  timerSeconds / Math.max(1, totalQuestions),
                ),
              })),
            }),
          });

          const data = await response.json();
          const earnedXp = attemptResult.success
            ? attemptResult.data?.earnedXp || data.earnedXp || 0
            : data.earnedXp || 0;

          setLastEarnedXp(earnedXp);

          window.dispatchEvent(
            new CustomEvent("xp-updated", {
              detail: {
                totalXp: data.totalXp,
                earnedXp,
                levelInfo: data.levelInfo,
              },
            }),
          );

          const newLevel = data.levelInfo?.level;
          const previousLevel = gamificationStats?.gamification?.level ?? 1;

          if (newLevel && newLevel > previousLevel) {
            setLevelUpData({
              leveledUp: true,
              newLevel,
              title: data.levelInfo?.title || "Iniciante Consciente",
            });
          }
          if (refreshStats) await refreshStats();
        } catch (error) {
          console.error("Erro ao registrar simulado e creditar XP:", error);
        } finally {
          setShowCompletionModal(true);
        }
      }
    },
    [
      checkedQuestions,
      totalQuestions,
      selectedAnswers,
      questions,
      syncQuizWithSM2,
      currentQuizId,
      banca,
      materia,
      selectedTopicId,
      currentSubjectObj,
      dificuldade,
      timerSeconds,
      errorClassifications,
      gamificationStats,
      refreshStats,
    ],
  );

  const handleCreateFlashcard = async (index: number) => {
    const q = questions[index];
    if (!q) return;

    setCreatingFlashcardIndex(index);
    try {
      // Criação cirúrgica com IA integrando a justificativa e o motivo diagnosticado
      const reason = errorClassifications[index] || "THEORY_GAP";

      const res = await generateTargetedDeckAction({
        topicId: q.topicId || selectedTopicId || undefined,
        subjectId: q.subjectId || currentSubjectObj?.id || undefined,
        questionEnunciado: q.enunciado,
        gabarito: q.gabaritoCorreto,
        justificativa: q.justificativa,
        errorReason: reason,
      });

      if (res.success) {
        setCreatedFlashcards((prev) => ({ ...prev, [index]: true }));
      } else {
        // Fallback para rota local caso a IA falhe
        const fallbackRes = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: q.flashcardFrente || q.enunciado.replace(/\*\*/g, ""),
            answer:
              q.flashcardVerso ||
              `Gabarito: ${q.gabaritoCorreto}\n\n${q.justificativa}`,
            details: q.justificativa,
            subject: materia || "Banco de Provas",
            topicId: selectedTopicId || undefined,
          }),
        });
        if (fallbackRes.ok) {
          setCreatedFlashcards((prev) => ({ ...prev, [index]: true }));
        }
      }
    } catch (err) {
      console.error("Erro ao gerar flashcard:", err);
    } finally {
      setCreatingFlashcardIndex(null);
    }
  };

  const handleGenerateSimulado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subjects.length === 0) return;

    // Dispara imediatamente o modal futurista e fecha a tela de configuração
    setIsAIModalOpen(false);
    setIsGenerating(true);
    setSimuladoGenerationError(null);
    setPendingSimuladoData(null);
    setIsSimuladoModalOpen(true);

    try {
      const selectedTopicObj = availableTopics.find(
        (t) => t.id === selectedTopicId,
      );
      const topicoNome = selectedTopicObj
        ? selectedTopicObj.title
        : selectedTopicId;

      const response = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banca,
          materia,
          topicoId: selectedTopicId || "ALL",
          topicoNome: topicoNome || "Todos os Tópicos da Matéria",
          specificTopic: specificTopic.trim() || undefined,
          qtdQuestoes: parseInt(qtdQuestoes, 10),
          dificuldade,
          textoBase,
          fonteConteudo,
          adaptiveMode: isAdaptiveMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.details || "Falha ao gerar simulado com IA.",
        );
      }

      const targetId = data.id || data.simuladoId;

      setIsGenerating(false);
      setIsSimuladoModalOpen(false);

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        setQuestions(data.data);
        setCurrentQuizId(targetId || null);
        setSelectedAnswers({});
        setCheckedQuestions({});
        setFlaggedQuestions({});
        setErrorClassifications({});
        setSavedErrors({});
        setCreatedFlashcards({});
        setTimerSeconds(0);
        setFocusedQuestionIndex(0);
        setIsTimerRunning(true);
      }

      if (targetId) {
        router.push(`/questions/${targetId}`);
        // Se o projeto usar tabs na mesma página, descomente:
        // setActiveTab("solve");
      } else {
        handleTabChange("history");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao gerar questões.";
      console.error("Erro ao gerar simulado:", msg);
      setSimuladoGenerationError(msg);
      setIsSimuladoModalOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSimuladoModalComplete = () => {
    if (pendingSimuladoData) {
      setQuestions(pendingSimuladoData.questions);
      setCurrentQuizId(pendingSimuladoData.quizId);
      setSelectedAnswers({});
      setCheckedQuestions({});
      setFlaggedQuestions({});
      setErrorClassifications({});
      setSavedErrors({});
      setCreatedFlashcards({});
      setTimerSeconds(0);
      setFocusedQuestionIndex(0); // Transição direta para a 1ª questão
      setIsTimerRunning(true);
      setIsSimuladoModalOpen(false);
      setPendingSimuladoData(null);

      // Rola suavemente até o primeiro card de questão
      setTimeout(() => {
        document
          .getElementById("question-card-0")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  };

  // ATALHOS DE TECLADO
  useEffect(() => {
    if (
      activeTab !== "create" ||
      questions.length === 0 ||
      isAIModalOpen ||
      showCompletionModal
    ) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const currentQuestion = questions[focusedQuestionIndex];
      if (!currentQuestion) return;

      const isAlreadyAnswered = Boolean(checkedQuestions[focusedQuestionIndex]);
      const keyUpper = e.key.toUpperCase();

      if (keyUpper === "Z") {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
        return;
      }

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
        if (isAlreadyAnswered) return;

        if (currentQuestion.formato === "multipla") {
          const targetAltId = mapKeyToAlt[keyUpper];
          const hasAlt = currentQuestion.alternativas?.some(
            (alt) => alt.id === targetAltId,
          );
          if (hasAlt) {
            setSelectedAnswers((prev) => ({
              ...prev,
              [focusedQuestionIndex]: targetAltId,
            }));
          }
        } else {
          if (keyUpper === "C" || keyUpper === "1") {
            setSelectedAnswers((prev) => ({
              ...prev,
              [focusedQuestionIndex]: "Certo",
            }));
          } else if (keyUpper === "E" || keyUpper === "2") {
            setSelectedAnswers((prev) => ({
              ...prev,
              [focusedQuestionIndex]: "Errado",
            }));
          }
        }
      }

      if (e.key === "Enter") {
        const hasSelectedAnswer = Boolean(
          selectedAnswers[focusedQuestionIndex],
        );

        if (!isAlreadyAnswered && hasSelectedAnswer) {
          e.preventDefault();
          handleAnswerQuestion(focusedQuestionIndex);
        }
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedQuestionIndex((prev) => {
          const next = Math.min(prev + 1, questions.length - 1);
          document
            .getElementById(`question-card-${next}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
          return next;
        });
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedQuestionIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          document
            .getElementById(`question-card-${next}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeTab,
    questions,
    focusedQuestionIndex,
    selectedAnswers,
    checkedQuestions,
    isAIModalOpen,
    showCompletionModal,
    handleAnswerQuestion,
  ]);

  if (isPrintMode) {
    return (
      <PrintableQuestions
        title={materia ? `Simulado - ${materia}` : "Simulado de Questões Geral"}
        totalQuestions={questions.length > 0 ? questions.length : 20}
        estimatedTimeMinutes={questions.length > 0 ? questions.length * 2 : 40}
        onBack={() => setIsPrintMode(false)}
        questions={
          questions.length > 0
            ? questions.map((q, idx) => ({
                id: `q-${idx}`,
                number: idx + 1,
                statement: q.enunciado,
                options: q.alternativas?.map((a) => a.texto),
                correctOption: q.gabaritoCorreto,
                subjectName: materia || "Conhecimentos Gerais",
              }))
            : []
        }
      />
    );
  }

  if (questions.length > 0 && activeTab === "create") {
    return (
      <>
        <QuizResolutionView
          quizId={currentQuizId}
          banca={banca}
          subject={materia || "Simulado"}
          questions={questions}
          initialSelectedAnswers={selectedAnswers}
          initialCheckedQuestions={checkedQuestions}
          initialFlaggedQuestions={flaggedQuestions}
          initialErrorClassifications={errorClassifications}
          initialTimerSeconds={timerSeconds}
          isInitialTimerRunning={isTimerRunning && !showCompletionModal}
          onAnswerQuestion={(index, altId, isCorrect) => {
            setSelectedAnswers((prev) => ({ ...prev, [index]: altId }));
            setCheckedQuestions((prev) => ({ ...prev, [index]: true }));
          }}
          onFinishQuiz={async (finalData) => {
            setSelectedAnswers(finalData.selectedAnswers);
            setCheckedQuestions(finalData.checkedQuestions);
            setErrorClassifications(finalData.errorClassifications);
            setTimerSeconds(finalData.timerSeconds);
            setIsTimerRunning(false);

            const finalCorrect = finalData.correctCount;
            const finalTotal = finalData.totalQuestions || 1;
            const finalAcc = Math.round((finalCorrect / finalTotal) * 100);

            await syncQuizWithSM2(finalAcc);

            try {
              const submissions: QuestionAnswerSubmission[] = questions.map(
                (q, idx) => ({
                  questionId: q.id || `q-${idx}`,
                  subjectId: q.subjectId || currentSubjectObj?.id || "",
                  topicId: q.topicId || selectedTopicId || undefined,
                  selectedOption: finalData.selectedAnswers[idx] || "",
                  isCorrect:
                    finalData.selectedAnswers[idx] === q.gabaritoCorreto,
                  timeSpentSeconds: Math.round(
                    finalData.timerSeconds / finalTotal,
                  ),
                  errorReason:
                    finalData.errorClassifications[idx] || "UNCLASSIFIED",
                  questionText: q.enunciado,
                  options: q.alternativas,
                  correctAnswer: q.gabaritoCorreto,
                  explanation: q.justificativa,
                }),
              );

              const attemptResult = await submitQuizAttemptAction({
                title: `Simulado ${banca} - ${materia || "Geral"}`,
                topicId: selectedTopicId || undefined,
                subjectId: currentSubjectObj?.id || undefined,
                totalQuestions: finalTotal,
                correctAnswers: finalCorrect,
                timeSpentSeconds: finalData.timerSeconds,
                answers: submissions,
              });

              const response = await fetch("/api/questions/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  quizId: currentQuizId,
                  banca: banca || "Geral",
                  subject: materia?.trim() || "Geral",
                  topicId: selectedTopicId || null,
                  difficulty: dificuldade || "Média",
                  questions: questions.map((q, idx) => ({
                    ...q,
                    userAnswer: finalData.selectedAnswers[idx],
                    isCorrect:
                      finalData.selectedAnswers[idx] === q.gabaritoCorreto,
                    errorReason: finalData.errorClassifications[idx] || null,
                    timeSpentSeconds: Math.round(
                      finalData.timerSeconds / Math.max(1, finalTotal),
                    ),
                  })),
                }),
              });

              const data = await response.json();
              const earnedXp = attemptResult.success
                ? attemptResult.data?.earnedXp || data.earnedXp || 0
                : data.earnedXp || 0;

              setLastEarnedXp(earnedXp);

              window.dispatchEvent(
                new CustomEvent("xp-updated", {
                  detail: {
                    totalXp: data.totalXp,
                    earnedXp,
                    levelInfo: data.levelInfo,
                  },
                }),
              );

              const newLevel = data.levelInfo?.level;
              const previousLevel =
                gamificationStats?.gamification?.level ?? 1;

              if (newLevel && newLevel > previousLevel) {
                setLevelUpData({
                  leveledUp: true,
                  newLevel,
                  title: data.levelInfo?.title || "Iniciante Consciente",
                });
              }
              if (refreshStats) await refreshStats();
            } catch (error) {
              console.error(
                "Erro ao registrar simulado e creditar XP:",
                error,
              );
            } finally {
              setShowCompletionModal(true);
            }
          }}
          onExit={() => {
            setQuestions([]);
            setSelectedAnswers({});
            setCheckedQuestions({});
            setFlaggedQuestions({});
            setErrorClassifications({});
            localStorage.removeItem(STORAGE_KEY);
            setPausedSession(null);
            setCurrentQuizId(null);
            setIsTimerRunning(false);
            setIsZenMode(false);
          }}
          onCreateFlashcard={(index) => handleCreateFlashcard(index)}
          isCreatingFlashcard={creatingFlashcardIndex !== null}
          createdFlashcards={createdFlashcards}
        />

        {showCompletionModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#030712] animate-in fade-in duration-300">
            <QuizResultView
              quizId={currentQuizId}
              banca={banca}
              subject={materia || "Simulado"}
              topicId={selectedTopicId || null}
              questions={questions}
              selectedAnswers={selectedAnswers}
              timerSeconds={timerSeconds}
              earnedXp={lastEarnedXp}
              levelUpData={levelUpData}
              onRestart={() => {
                setSelectedAnswers({});
                setCheckedQuestions({});
                setFlaggedQuestions({});
                setErrorClassifications({});
                setTimerSeconds(0);
                setIsTimerRunning(true);
                setShowCompletionModal(false);
              }}
              onExit={() => {
                setQuestions([]);
                setSelectedAnswers({});
                setCheckedQuestions({});
                setFlaggedQuestions({});
                setErrorClassifications({});
                setTimerSeconds(0);
                setIsTimerRunning(false);
                setShowCompletionModal(false);
              }}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#02050e] text-slate-100 p-3 sm:p-8 font-sans antialiased relative selection:bg-indigo-500/30">
      {isZenMode && (
        <style jsx global>{`
          aside,
          [data-sidebar="sidebar"],
          .sidebar-container {
            display: none !important;
          }
          main,
          #dashboard-content {
            margin-left: 0 !important;
            padding-left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        `}</style>
      )}

      {/* Timer Flutuante com Pacing Real-Time */}
      {questions.length > 0 && activeTab === "create" && (
        <FloatingTimer
          seconds={timerSeconds}
          currentQuestionSeconds={currentQuestionSeconds}
          questionIndex={focusedQuestionIndex}
          totalQuestions={questions.length}
          isRunning={isTimerRunning}
          onToggleTimer={() => setIsTimerRunning((prev) => !prev)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* ================= 1. CABEÇALHO PRINCIPAL (SEM QUESTÕES ATIVAS) ================= */}
        {!isZenMode && questions.length === 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 sm:pb-6 transition-all duration-300">
            <div className="flex items-start sm:items-center gap-3.5">
              <button
                onClick={openSidebar}
                type="button"
                className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white md:hidden transition-colors cursor-pointer shrink-0 mt-0.5 sm:mt-0"
                aria-label="Abrir navegação lateral"
              >
                <Menu size={18} />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)] shrink-0">
                      <HelpCircle size={20} />
                    </div>
                    <span className="truncate">Banco de Provas & Simulados</span>
                  </h1>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-semibold tracking-wide shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SISTEMA ATIVO</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2 leading-tight">
                  Crie cadernos adaptativos com IA e acompanhe sua evolução.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (!isHistoryLoaded) fetchQuizHistory();
                  if (!isNotebookLoaded) loadErrorNotebookData();
                  setIsTimedLaunchModalOpen(true);
                }}
                className="w-full sm:w-auto justify-center bg-violet-600/20 border border-violet-500/40 hover:bg-violet-600/30 text-violet-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-violet-600/10 active:scale-95 hover:shadow-violet-600/20"
              >
                <Timer size={15} className="text-violet-400" />
                <span>Modo Cronometrado</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. NAVEGAÇÃO DE ABAS */}
        {!isZenMode && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => handleTabChange("create")}
              type="button"
              className={`py-2 px-3.5 sm:px-4 font-semibold text-xs tracking-wide rounded-xl flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-200 ${
                activeTab === "create"
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Home size={14} />
              <span>Início / Gerador</span>
            </button>
            <button
              onClick={() => handleTabChange("history")}
              type="button"
              className={`py-2 px-3.5 sm:px-4 font-semibold text-xs tracking-wide rounded-xl flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-200 ${
                activeTab === "history"
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <History size={14} />
              <span>Simulados Salvos</span>
            </button>
            <button
              onClick={() => handleTabChange("errors")}
              type="button"
              className={`py-2 px-3.5 sm:px-4 font-semibold text-xs tracking-wide rounded-xl flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-200 ${
                activeTab === "errors"
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <BookOpenCheck size={14} />
              <span>Caderno de Erros</span>
              {errorNotebookMetrics.pendingErrors > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold border border-rose-500/30">
                  {errorNotebookMetrics.pendingErrors}
                </span>
              )}
            </button>
          </div>
        )}

        {/* 3. CONTEÚDO DA ABA ATIVA COM TRANSIÇÃO SUAVE */}
        <AnimatePresence mode="wait">
          {activeTab === "create" && (
            <motion.div
              key="tab-create"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {isInitialLoading && subjects.length === 0 ? (
                <TabCreateSkeleton />
              ) : subjects.length === 0 ? (
                /* ETAPA OBRIGATÓRIA EDITAL */
                <div className="min-h-[50vh] flex items-center justify-center py-4">
                  <div className="relative overflow-hidden max-w-xl w-full bg-linear-to-b from-[#0c101d] via-[#080b14] to-[#04060c] border border-amber-500/30 rounded-3xl p-8 text-center shadow-2xl space-y-6">
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10 relative z-10">
                      <BookOpen size={28} />
                    </div>
                    <div className="space-y-2 relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                        <Lock size={12} /> Etapa Obrigatória
                      </div>
                      <h2 className="text-xl font-black text-white tracking-tight">
                        Cadastre seu Edital Primeiro
                      </h2>
                      <p className="text-slate-300 text-xs leading-relaxed max-w-sm mx-auto">
                        Para gerar simulados ou flashcards adaptados com IA para o seu
                        concurso, você precisa primeiro cadastrar matérias e tópicos
                        na aba de Editais.
                      </p>
                    </div>
                    <div className="pt-2 relative z-10">
                      <Link
                        href="/edital"
                        className="inline-flex items-center gap-2 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all shadow-xl shadow-amber-500/20 active:scale-95 cursor-pointer"
                      >
                        <BookOpen size={15} />
                        <span>Configurar Edital</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {questions.length === 0 ? (
                    <div className="space-y-6">
                      {pausedSession &&
                        pausedSession.questions &&
                        pausedSession.questions.length > 0 && (
                          <ResumeSessionCard
                            session={pausedSession}
                            onResume={() => {
                              setCurrentQuizId(pausedSession.quizId || null);
                              setBanca(pausedSession.banca || "FGV");
                              setQuestions(pausedSession.questions || []);
                              setSelectedAnswers(
                                pausedSession.selectedAnswers || {},
                              );
                              setCheckedQuestions(
                                pausedSession.checkedQuestions || {},
                              );
                              setCreatedFlashcards(
                                pausedSession.createdFlashcards || {},
                              );
                              setTimerSeconds(pausedSession.timerSeconds || 0);
                              setFocusedQuestionIndex(0);
                              setIsTimerRunning(true);
                            }}
                            onDiscard={(e) => {
                              e.stopPropagation();
                              localStorage.removeItem(STORAGE_KEY);
                              setPausedSession(null);
                            }}
                          />
                        )}

                      {/* HERO SPOTLIGHT - BANNER PRINCIPAL */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-violet-950/30 via-zinc-900/60 to-black/80 border border-violet-500/20 rounded-2xl p-7 relative overflow-hidden shadow-2xl hover:border-violet-500/30 transition-all duration-300"
                      >
                        {/* Luz radial ambiente em degradê violeta no canto superior direito */}
                        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl" />

                        <div className="relative z-10 space-y-5">
                          {/* Badge futurista */}
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(139,92,246,0.15)]">
                            <Sparkles
                              size={12}
                              className="text-violet-400 animate-pulse"
                            />
                            <span className="text-[10px] font-mono font-bold tracking-widest text-violet-300 uppercase">
                              CORE ENGINE V2.0 • IA GENERATIVA
                            </span>
                          </div>

                          {/* Título & Descrição */}
                          <div className="space-y-2 max-w-2xl">
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent leading-tight">
                              Pratique com questões inéditas e simulados direcionados
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                              Gere cadernos adaptativos configurados pela IA ou retome seus testes anteriores com feedback e correção comentada em tempo real.
                            </p>
                          </div>

                          {/* Métricas integradas no rodapé do banner */}
                          <div className="pt-3 flex flex-wrap items-center gap-2.5 sm:gap-3 border-t border-white/5">
                            {/* 1. Precisão Média */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-violet-500/20 backdrop-blur-md text-xs">
                              <Target size={14} className="text-violet-400 shrink-0" />
                              <span className="text-zinc-400 text-[11px]">Precisão Média:</span>
                              <span className="text-white font-bold font-mono">
                                {practiceMetrics.averageAccuracy}%
                              </span>
                            </div>

                            {/* 2. Total de Questões Praticadas */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-violet-500/20 backdrop-blur-md text-xs">
                              <Zap size={14} className="text-violet-400 shrink-0" />
                              <span className="text-zinc-400 text-[11px]">Questões Praticadas:</span>
                              <span className="text-white font-bold font-mono">
                                {practiceMetrics.totalAnswered}
                              </span>
                            </div>

                            {/* 3. Sequência Ativa */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-violet-500/20 backdrop-blur-md text-xs">
                              <Flame size={14} className="text-amber-400 shrink-0" />
                              <span className="text-zinc-400 text-[11px]">Sequência Ativa:</span>
                              <span className="text-white font-bold font-mono">
                                {gamificationStats?.streak?.currentDays ?? 0}{" "}
                                {gamificationStats?.streak?.currentDays === 1 ? "dia" : "dias"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* CARDS DE AÇÃO */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Card 1 - Gerar Simulado por IA */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.05 }}
                          onClick={() => setIsAIModalOpen(true)}
                          className="group relative backdrop-blur-xl bg-gradient-to-br from-violet-950/20 via-zinc-900/50 to-black/70 border border-violet-500/20 hover:border-violet-500/40 hover:-translate-y-0.5 rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between"
                        >
                          {/* Glow ambiente no hover */}
                          <div className="pointer-events-none absolute top-0 right-0 w-36 h-36 bg-violet-600/10 rounded-full blur-2xl group-hover:bg-violet-600/20 transition-all duration-300" />

                          <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between gap-3">
                              <div className="bg-violet-500/10 border border-violet-500/30 text-violet-400 p-3 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                                <Sparkles size={20} />
                              </div>
                              <span className="text-[10px] font-mono font-medium text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2.5 py-1 rounded-full">
                                Motor Ultrarrápido (&lt;5s)
                              </span>
                            </div>

                            <div>
                              <h3 className="text-lg font-bold text-white group-hover:text-violet-200 transition-colors">
                                Gerar Simulado por IA
                              </h3>
                              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                                Filtre por banca, disciplina e dificuldade para montar cadernos sob medida com questões inéditas e análise de pegadinhas.
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-white/5 relative z-10">
                            <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/20 group-hover:shadow-violet-600/35 transition-all">
                              <span>Configurar e Gerar</span>
                              <ArrowRight
                                size={14}
                                className="group-hover:translate-x-1 transition-transform duration-200"
                              />
                            </div>
                          </div>
                        </motion.div>

                        {/* Card 2 - Cadernos Salvos */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          onClick={() => {
                            handleTabChange("history");
                          }}
                          className="group relative backdrop-blur-xl bg-gradient-to-br from-indigo-950/20 via-zinc-900/50 to-black/70 border border-indigo-500/20 hover:border-indigo-500/40 hover:-translate-y-0.5 rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between"
                        >
                          {/* Glow ambiente no hover */}
                          <div className="pointer-events-none absolute top-0 right-0 w-36 h-36 bg-indigo-600/10 rounded-full blur-2xl group-hover:bg-indigo-600/20 transition-all duration-300" />

                          <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between gap-3">
                              <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 p-3 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                <History size={20} />
                              </div>
                              <span className="text-[10px] font-mono font-medium text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-full">
                                {quizHistory.length} {quizHistory.length === 1 ? "caderno" : "cadernos"}
                              </span>
                            </div>

                            <div>
                              <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition-colors">
                                Cadernos Salvos
                              </h3>
                              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                                {quizHistory.length > 0
                                  ? `${quizHistory.length} ${quizHistory.length === 1 ? "simulado arquivado pronto" : "simulados arquivados prontos"} para refazer com gabarito comentado.`
                                  : "Acesse e refaça cadernos salvos no seu histórico a qualquer momento com resolução detalhada."}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-white/5 relative z-10">
                            <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-200 text-xs font-bold transition-all">
                              <span>Ver Cadernos Salvos</span>
                              <ArrowRight
                                size={14}
                                className="group-hover:translate-x-1 transition-transform duration-200 text-zinc-400 group-hover:text-zinc-200"
                              />
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  ) : (
                    /* LISTA DE QUESTÕES COM PADDING INFERIOR ADEQUADO */
                    <div className="space-y-6 pb-40">
                      {questions.map((questao, index) => (
                        <QuestionCard
                          key={`questao-${index}`}
                          questao={questao}
                          index={index}
                          isFocused={index === focusedQuestionIndex}
                          respondida={Boolean(checkedQuestions[index])}
                          alternativaSelecionada={selectedAnswers[index]}
                          isSavedError={Boolean(savedErrors[index])}
                          isFlashcardCreated={Boolean(createdFlashcards[index])}
                          isCreatingFlashcard={creatingFlashcardIndex === index}
                          isFlagged={Boolean(flaggedQuestions[index])}
                          onSelectAnswer={(altId) =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [index]: altId,
                            }))
                          }
                          onAnswerQuestion={() => handleAnswerQuestion(index)}
                          onToggleSaveError={() =>
                            setSavedErrors((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }))
                          }
                          onCreateFlashcard={() => handleCreateFlashcard(index)}
                          onToggleFlag={() =>
                            setFlaggedQuestions((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }))
                          }
                          onClassifyError={(reason: ErrorClassification) =>
                            setErrorClassifications((prev) => ({
                              ...prev,
                              [index]: reason,
                            }))
                          }
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="tab-history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {isLoadingHistory && !isHistoryLoaded ? (
                <TabHistorySkeleton />
              ) : (
                <QuizHistoryTab
                  history={quizHistory}
                  isLoading={isLoadingHistory && !isHistoryLoaded}
                  searchTerm={searchTerm}
                  sortBy={sortBy}
                  confirmingDeleteId={confirmingDeleteId}
                  loadingQuizId={loadingQuizId}
                  onSearchChange={setSearchTerm}
                  onSortChange={setSortBy}
                  onLoadSavedQuiz={(savedQ, savedBanca, id) => {
                    setLoadingQuizId(id);
                    setTimeout(() => {
                      const randomized = randomizeQuizSession(savedQ);
                      setCurrentQuizId(id);
                      setSelectedAnswers({});
                      setCheckedQuestions({});
                      setFlaggedQuestions({});
                      setErrorClassifications({});
                      setSavedErrors({});
                      setCreatedFlashcards({});
                      setShowCompletionModal(false);
                      setQuestions(randomized);
                      setBanca(savedBanca);
                      handleTabChange("create");
                      setLoadingQuizId(null);
                      setTimerSeconds(0);
                      setFocusedQuestionIndex(0);
                      setIsTimerRunning(true);
                    }, 200);
                  }}
                  onConfirmDelete={setConfirmingDeleteId}
                  onDeleteSimulado={async (id) => {
                    try {
                      const res = await fetch(`/api/questions/${id}`, {
                        method: "DELETE",
                      });
                      if (res.ok) {
                        setQuizHistory((prev) => prev.filter((i) => i.id !== id));
                        setConfirmingDeleteId(null);
                      }
                    } catch (err) {
                      console.error("Erro ao deletar:", err);
                    }
                  }}
                  onBatchDeleteSuccess={(deletedIds) => {
                    setQuizHistory((prev) =>
                      prev.filter((i) => !deletedIds.includes(i.id)),
                    );
                  }}
                  onCreateNewQuiz={() => {
                    setQuestions([]);
                    setSelectedAnswers({});
                    setCheckedQuestions({});
                    setFlaggedQuestions({});
                    setErrorClassifications({});
                    setCurrentQuizId(null);
                    handleTabChange("create");
                    setIsZenMode(false);
                  }}
                />
              )}
            </motion.div>
          )}

          {activeTab === "errors" && (
            <motion.div
              key="tab-errors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {isLoadingNotebook && !isNotebookLoaded ? (
                <TabErrorsSkeleton />
              ) : (
                <ErrorNotebookView
                  initialMetrics={errorNotebookMetrics}
                  subjects={subjects}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MINIMAP FLUTUANTE */}
      {questions.length > 0 && activeTab === "create" && (
        <QuestionMinimap
          questions={questions}
          checkedQuestions={checkedQuestions}
          selectedAnswers={selectedAnswers}
          flaggedQuestions={flaggedQuestions}
          focusedIndex={focusedQuestionIndex}
          onSelectQuestion={(idx) => {
            setFocusedQuestionIndex(idx);
            document
              .getElementById(`question-card-${idx}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      )}

      {/* MODAL IA */}
      <GenerateAIModal
        isOpen={isAIModalOpen}
        isGenerating={isGenerating}
        banca={banca}
        materia={materia}
        selectedTopicId={selectedTopicId}
        specificTopic={specificTopic}
        qtdQuestoes={qtdQuestoes}
        fonteConteudo={fonteConteudo}
        dificuldade={dificuldade}
        textoBase={textoBase}
        subjects={subjects}
        availableTopics={availableTopics}
        onClose={() => setIsAIModalOpen(false)}
        onBancaChange={setBanca}
        onMateriaChange={(newMateria) => {
          setMateria(newMateria);
          const paramSubjectId = searchParams.get("subjectId");
          const decodedParam = paramSubjectId
            ? decodeURIComponent(paramSubjectId)
            : "";

          if (newMateria !== decodedParam) {
            setSelectedTopicId("");
          }
        }}
        onTopicChange={setSelectedTopicId}
        onSpecificTopicChange={setSpecificTopic}
        onFonteChange={setFonteConteudo}
        onTextoBaseChange={setTextoBase}
        onDificuldadeChange={setDificuldade}
        onQtdQuestoesChange={setQtdQuestoes}
        isAdaptiveMode={isAdaptiveMode}
        onAdaptiveModeChange={setIsAdaptiveMode}
        onSubmit={handleGenerateSimulado}
      />

      <SimuladoGenerationModal
        isOpen={isSimuladoModalOpen}
        isGenerating={isGenerating}
        banca={banca}
        materia={specificTopic.trim() ? `${materia} (${specificTopic.trim()})` : materia}
        qtdQuestoes={qtdQuestoes}
        error={simuladoGenerationError}
        onComplete={handleSimuladoModalComplete}
        onClose={() => {
          setIsSimuladoModalOpen(false);
          setSimuladoGenerationError(null);
        }}
      />

      {/* MODAIS DO MODO CRONOMETRADO INTEGRADO */}
      <TimedLaunchModal
        isOpen={isTimedLaunchModalOpen}
        onClose={() => setIsTimedLaunchModalOpen(false)}
        savedQuizzes={quizHistory}
        pendingErrorsCount={errorNotebookMetrics.pendingErrors}
        onSelectQuiz={(quiz) => {
          setIsTimedLaunchModalOpen(false);
          setTimedModalPacingTarget(quiz);
        }}
        onSelectErrors={() => {
          setIsTimedLaunchModalOpen(false);
          setIsErrorsPacingModalOpen(true);
        }}
      />

      {/* MODAL DE RITMO PARA SIMULADO ESPECÍFICO INICIADO PELO TOPO */}
      {timedModalPacingTarget && (
        <TimedPacingModal
          isOpen={Boolean(timedModalPacingTarget)}
          onClose={() => setTimedModalPacingTarget(null)}
          title={timedModalPacingTarget.subject}
          subtitle={`Banca ${timedModalPacingTarget.banca} • ${timedModalPacingTarget.topic?.title || "Tópicos Gerais"}`}
          totalQuestions={
            Array.isArray(timedModalPacingTarget.questions)
              ? timedModalPacingTarget.questions.length
              : 10
          }
          onConfirm={(config) => {
            const params = new URLSearchParams({
              examId: timedModalPacingTarget.id,
              pacing: config.pacingMode,
              pace: String(config.minutesPerQuestion),
              block: String(config.totalBlockMinutes),
              focus: config.strictAntiDistraction ? "true" : "false",
            });
            router.push(`/quiz/timed?${params.toString()}`);
            setTimedModalPacingTarget(null);
          }}
        />
      )}

      {/* MODAL DE RITMO PARA BATERIA DE ERROS */}
      <TimedPacingModal
        isOpen={isErrorsPacingModalOpen}
        onClose={() => setIsErrorsPacingModalOpen(false)}
        title="Bateria de Erros Pendentes"
        subtitle="Questões diagnosticadas no seu Caderno de Erros"
        totalQuestions={Math.max(1, errorNotebookMetrics.pendingErrors)}
        onConfirm={(config) => {
          const params = new URLSearchParams({
            source: "errors",
            pacing: config.pacingMode,
            pace: String(config.minutesPerQuestion),
            block: String(config.totalBlockMinutes),
            focus: config.strictAntiDistraction ? "true" : "false",
          });
          router.push(`/quiz/timed?${params.toString()}`);
          setIsErrorsPacingModalOpen(false);
        }}
      />

      {showCompletionModal && (
        <CompletionModal
          totalQuestions={totalQuestions}
          correctCount={correctCount}
          percentageAcc={percentageAcc}
          timerSeconds={timerSeconds}
          lastEarnedXp={lastEarnedXp}
          isSyncingSM2={isSyncingSM2}
          levelUpData={levelUpData}
          onRestart={() => {
            setSelectedAnswers({});
            setCheckedQuestions({});
            setFlaggedQuestions({});
            setErrorClassifications({});
            setTimerSeconds(0);
            setFocusedQuestionIndex(0);
            setIsTimerRunning(true);
            setShowCompletionModal(false);
          }}
          onReview={() => setShowCompletionModal(false)}
        />
      )}

      {pendingTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-[#090d16] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Deseja sair do simulado atual?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ao alternar de aba agora, as respostas não finalizadas neste
              caderno serão descartadas.
            </p>
            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                onClick={() => setPendingTab(null)}
                type="button"
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Continuar respondendo
              </button>
              <button
                onClick={confirmNavigation}
                type="button"
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Sair e descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
