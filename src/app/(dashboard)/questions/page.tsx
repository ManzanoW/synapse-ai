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
  ShieldAlert,
  RotateCcw,
  ChevronRight,
  Award,
  Compass,
  Layers,
  Calendar,
  FileSpreadsheet,
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
import { SimuladoGenerationModal } from "@/components/study/SimuladoGenerationModal";
import { QuizResolutionView } from "@/components/study/QuizResolutionView";
import { OpticalAnswerSheetModal } from "@/components/questions/OpticalAnswerSheetModal";
import { SpeedQuizModal } from "@/components/questions/SpeedQuizModal";

import { PrintableQuestions } from "@/components/questions/printable-questions";
import { StarterEditalSelector } from "@/components/edital/StarterEditalSelector";
import { triggerAiQuotaRefresh } from "@/lib/quota-events";

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
  MentorGuidance,
  SubjectDomainMetric,
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
  mentorGuidance?: MentorGuidance;
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
  color?: string;
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
  const [domainStats, setDomainStats] = useState<SubjectDomainMetric[]>([]);

  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"create" | "history">(
    () => {
      const tabParam = searchParams.get("tab");
      if (tabParam === "history") return "history";
      return "create";
    },
  );
  const [pendingTab, setPendingTab] = useState<
    "create" | "history" | null
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

  // Modal de Folha Óptica de Respostas (Modo Dia D)
  const [isOpticalSheetOpen, setIsOpticalSheetOpen] = useState(false);
  // Modal de Desafio Relâmpago 45s (Speed Quiz)
  const [isSpeedQuizOpen, setIsSpeedQuizOpen] = useState(false);
  const [pendingLaunchSpeedQuiz, setPendingLaunchSpeedQuiz] = useState(false);

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
  const [formatoQuestao, setFormatoQuestao] = useState<
    "auto" | "certo_errado" | "multipla_4" | "multipla_5" | "casos_praticos"
  >("auto");
  const [nivelCargo, setNivelCargo] = useState<
    "medio" | "superior" | "juridico"
  >("superior");
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
    try {
      const metricsRes = await getErrorMetricsAction();
      if (metricsRes.success && metricsRes.data) {
        setErrorNotebookMetrics(metricsRes.data);
      }
    } catch (err) {
      console.error("Erro ao carregar caderno de erros:", err);
    }
  }, []);

  useEffect(() => {
    // Carrega histórico para contagem de cadernos salvos e pré-carregamento
    fetchQuizHistory();

    // Carrega métricas agregadas de treino (precisão e total de questões)
    getSubjectDomainStatsAction()
      .then((res) => {
        if (res.success && res.data) {
          setDomainStats(res.data);
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
      router.replace("/notebook");
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
    const paramMode = searchParams.get("mode");

    if (paramMode === "speed") {
      queueMicrotask(() => {
        setPendingLaunchSpeedQuiz(true);
        handleQuickQuiz({ qtd: 5 });
      });
      return;
    }

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
        router.replace("/notebook");
      } else {
        setActiveTab("create");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isHistoryLoaded, fetchQuizHistory, router]);

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

  const fetchSubjects = useCallback(async () => {
    setIsInitialLoading(true);

    try {
      const res = await fetch("/api/edital?mode=subjects");
      const json = await res.json();
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
      } else if (paramTopicId) {
        const owningSubject = loadedSubjects.find((s) =>
          s.topics?.some(
            (t) =>
              t.id === paramTopicId ||
              t.title.trim().toLowerCase() ===
                paramTopicId.trim().toLowerCase(),
          ),
        );

        if (owningSubject) {
          setMateria(owningSubject.name);
          const matchedTopic = owningSubject.topics?.find(
            (t) =>
              t.id === paramTopicId ||
              t.title.trim().toLowerCase() ===
                paramTopicId.trim().toLowerCase(),
          );
          setSelectedTopicId(matchedTopic ? matchedTopic.id : paramTopicId);
        } else {
          setSelectedTopicId(paramTopicId);
        }
      } else if (loadedSubjects.length > 0) {
        setMateria((prev) => prev || loadedSubjects[0].name);
      }

      if (paramTopicId || paramSubjectId) {
        setIsAIModalOpen(true);
      }
    } catch (err) {
      console.error("Erro ao carregar matérias:", err);
    } finally {
      setIsInitialLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

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
    (newTab: "create" | "history") => {
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
      }
    },
    [
      activeTab,
      questions.length,
      selectedAnswers,
      isHistoryLoaded,
      fetchQuizHistory,
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
          formatoQuestao,
          nivelCargo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.details || "Falha ao gerar simulado com IA.",
        );
      }

      // Notifica em tempo real a Sidebar e os badges de cota
      triggerAiQuotaRefresh();

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

      // Notifica em tempo real a Sidebar para refletir a cota atingida
      triggerAiQuotaRefresh();

      // Mantém o modal aberto exibindo o aviso amigável e o botão de upgrade
      setSimuladoGenerationError(msg);
      setIsSimuladoModalOpen(true);
      setIsAIModalOpen(false);
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

      if (pendingLaunchSpeedQuiz) {
        setPendingLaunchSpeedQuiz(false);
        setIsSpeedQuizOpen(true);
      }

      // Rola suavemente até o primeiro card de questão
      setTimeout(() => {
        document
          .getElementById("question-card-0")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  };

  const handleLoadSavedQuiz = useCallback(
    (savedQ: QuestaoIA[], savedBanca: string, id: string) => {
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
        setBanca(savedBanca || "FGV");
        handleTabChange("create");
        setLoadingQuizId(null);
        setTimerSeconds(0);
        setFocusedQuestionIndex(0);
        setIsTimerRunning(true);
      }, 200);
    },
    [handleTabChange],
  );

  const handleQuickQuiz = useCallback(
    async (options?: {
      materia?: string;
      banca?: string;
      qtd?: number;
      dificuldade?: string;
    }) => {
      const targetBanca = options?.banca || banca || "FGV";
      const targetMateria =
        options?.materia ||
        materia ||
        (subjects.length > 0 ? subjects[0].name : "Direito Constitucional");
      const targetQtd = options?.qtd || 10;
      const targetDiff = options?.dificuldade || dificuldade || "Média";

      setBanca(targetBanca);
      setMateria(targetMateria);
      setQtdQuestoes(String(targetQtd));
      setDificuldade(targetDiff);

      setIsAIModalOpen(false);
      setIsGenerating(true);
      setSimuladoGenerationError(null);
      setPendingSimuladoData(null);
      setIsSimuladoModalOpen(true);

      try {
        const response = await fetch("/api/questions/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            banca: targetBanca,
            materia: targetMateria,
            topicoId: "ALL",
            topicoNome: "Todos os Tópicos",
            qtdQuestoes: targetQtd,
            dificuldade: targetDiff,
            fonteConteudo: "banca",
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Erro ao gerar simulado com IA.");
        }

        // Notifica em tempo real a Sidebar e os badges de cota
        triggerAiQuotaRefresh();

        setPendingSimuladoData({
          questions: data.data.questions,
          quizId: data.data.quizId || null,
        });
      } catch (err: any) {
        console.error("Erro na geração rápida:", err);
        triggerAiQuotaRefresh();
        setSimuladoGenerationError(
          err.message || "Não foi possível gerar as questões no momento.",
        );
        setIsSimuladoModalOpen(true);
      } finally {
        setIsGenerating(false);
      }
    },
    [banca, materia, subjects, dificuldade],
  );

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
        banca={banca}
        quizId={currentQuizId}
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
                format: q.formato,
                justification: q.justificativa,
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
          onOpenOpticalSheet={() => setIsOpticalSheetOpen(true)}
          onOpenSpeedQuiz={() => setIsSpeedQuizOpen(true)}
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

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (questions.length >= 5) {
                    setIsSpeedQuizOpen(true);
                  } else {
                    setPendingLaunchSpeedQuiz(true);
                    handleQuickQuiz({ qtd: 5 });
                  }
                }}
                className="w-full sm:w-auto justify-center bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/10 active:scale-95"
                title="Desafio de 5 questões com 45s por questão e combo de XP"
              >
                <Zap size={15} className="text-amber-400 fill-amber-400" />
                <span>Desafio Relâmpago ⚡</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isHistoryLoaded) fetchQuizHistory();
                  loadErrorNotebookData();
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
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-2 shrink-0">
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
                {quizHistory.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono font-bold border border-violet-500/30">
                    {quizHistory.length}
                  </span>
                )}
              </button>
            </div>

            {/* ATALHO DIRETO PARA O MÓDULO VIP CADERNO DE ERROS */}
            <Link
              href="/notebook"
              className="py-2 px-3.5 sm:px-4 font-semibold text-xs tracking-wide rounded-xl flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-200 text-rose-300/90 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/30 group ml-auto"
            >
              <BookOpenCheck size={14} className="text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Caderno de Erros Inteligente</span>
              <span className="sm:hidden">Caderno de Erros</span>
              {errorNotebookMetrics.pendingErrors > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold border border-rose-500/30">
                  {errorNotebookMetrics.pendingErrors}
                </span>
              )}
              <ArrowRight size={13} className="text-rose-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
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
                /* ETAPA OBRIGATÓRIA EDITAL - COM ATIVAÇÃO EM 1 CLIQUE */
                <div className="min-h-[50vh] flex items-center justify-center py-4">
                  <div className="relative overflow-hidden max-w-3xl w-full bg-linear-to-b from-[#0c101d] via-[#080b14] to-[#04060c] border border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="text-center space-y-3 relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10">
                        <BookOpen size={28} />
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                        <Lock size={12} /> Primeiro Passo para Simulados
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Cadastre seu Edital ou Escolha um Modelo Pronto
                      </h2>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
                        Para a inteligência artificial gerar questões personalizadas, você precisa de matérias cadastradas. Ative um modelo pronto em 1 clique abaixo ou importe seu próprio edital.
                      </p>
                    </div>

                    <div className="relative z-10 pt-2">
                      <StarterEditalSelector onSuccess={() => fetchSubjects()} />
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

                      {/* 1. HERO SPOTLIGHT / COCKPIT PRINCIPAL */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-violet-950/35 via-zinc-900/70 to-black/85 border border-violet-500/25 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-2xl hover:border-violet-500/35 transition-all duration-300"
                      >
                        <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 bg-violet-600/15 rounded-full blur-3xl" />

                        <div className="relative z-10 space-y-5">
                          {/* Badge futurista */}
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(139,92,246,0.15)]">
                            <Sparkles
                              size={12}
                              className="text-violet-400 animate-pulse"
                            />
                            <span className="text-[10px] font-mono font-bold tracking-widest text-violet-300 uppercase">
                              CENTRAL DE TREINO INTELIGENTE • QUESTÕES ADAPTATIVAS
                            </span>
                          </div>

                          {/* Título & Descrição */}
                          <div className="space-y-2 max-w-2xl">
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent leading-tight">
                              Pratique com foco na sua aprovação
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                              Simulados cronometrados, filtros por banca e regeneração cirúrgica dos seus pontos fracos potencializados por Inteligência Artificial.
                            </p>
                          </div>

                          {/* 4 Métricas Integradas no Cockpit */}
                          <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 border-t border-white/5">
                            {/* 1. Precisão Média */}
                            <div className="flex flex-col p-3 rounded-xl bg-zinc-900/60 border border-violet-500/20 backdrop-blur-md">
                              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                                <span className="text-[11px]">Precisão Média</span>
                                <Target size={13} className="text-violet-400" />
                              </div>
                              <span className="text-white font-bold font-mono text-base sm:text-lg">
                                {practiceMetrics.averageAccuracy}%
                              </span>
                              <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full transition-all duration-500"
                                  style={{ width: `${practiceMetrics.averageAccuracy}%` }}
                                />
                              </div>
                            </div>

                            {/* 2. Questões Resolvidas */}
                            <div className="flex flex-col p-3 rounded-xl bg-zinc-900/60 border border-violet-500/20 backdrop-blur-md">
                              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                                <span className="text-[11px]">Resolvidas</span>
                                <Zap size={13} className="text-violet-400" />
                              </div>
                              <span className="text-white font-bold font-mono text-base sm:text-lg">
                                {practiceMetrics.totalAnswered}
                              </span>
                              <span className="text-[10px] text-zinc-400 mt-1">questões registradas</span>
                            </div>

                            {/* 3. Sequência Ativa */}
                            <div className="flex flex-col p-3 rounded-xl bg-zinc-900/60 border border-amber-500/20 backdrop-blur-md">
                              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                                <span className="text-[11px]">Ofensiva</span>
                                <Flame size={13} className="text-amber-400" />
                              </div>
                              <span className="text-amber-400 font-bold font-mono text-base sm:text-lg">
                                {gamificationStats?.streak?.currentDays ?? 0}{" "}
                                <span className="text-xs font-normal text-zinc-400">
                                  {gamificationStats?.streak?.currentDays === 1 ? "dia" : "dias"}
                                </span>
                              </span>
                              <span className="text-[10px] text-zinc-400 mt-1">ritmo contínuo</span>
                            </div>

                            {/* 4. Caderno de Erros */}
                            <div
                              onClick={() => {
                                if (errorNotebookMetrics.pendingErrors > 0) {
                                  setIsErrorsPacingModalOpen(true);
                                } else {
                                  router.push("/notebook");
                                }
                              }}
                              className="flex flex-col p-3 rounded-xl bg-zinc-900/60 border border-rose-500/20 backdrop-blur-md cursor-pointer hover:border-rose-500/40 hover:bg-rose-950/10 transition-all"
                            >
                              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                                <span className="text-[11px]">Caderno de Erros</span>
                                <ShieldAlert size={13} className="text-rose-400" />
                              </div>
                              <span className="text-rose-400 font-bold font-mono text-base sm:text-lg">
                                {errorNotebookMetrics.pendingErrors}{" "}
                                <span className="text-xs font-normal text-zinc-400">pendentes</span>
                              </span>
                              <span className="text-[10px] text-rose-400/80 mt-1 flex items-center gap-1">
                                Treinar erros <ChevronRight size={10} />
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* 2. GRID DE 4 MODOS DE TREINO RÁPIDO */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                            <Sparkles size={16} className="text-violet-400" />
                            Modos de Treino Rápido
                          </h3>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            Escolha uma modalidade para começar
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* MODO 1: Simulado Relâmpago */}
                          <motion.div
                            whileHover={{ y: -3, transition: { duration: 0.15 } }}
                            onClick={() => handleQuickQuiz({ qtd: 10 })}
                            className="group relative backdrop-blur-xl bg-gradient-to-b from-amber-950/20 via-zinc-900/60 to-zinc-950 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-5 cursor-pointer transition-all shadow-lg flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                                  <Zap size={18} />
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                                  10 Questões
                                </span>
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
                                  Simulado Relâmpago
                                </h4>
                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                  Aquecimento ágil com 10 questões gerais do seu edital em 1 clique.
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-amber-400 font-semibold">
                              <span>Iniciar Agora</span>
                              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                          </motion.div>

                          {/* MODO 2: Exterminador de Erros */}
                          <motion.div
                            whileHover={{ y: -3, transition: { duration: 0.15 } }}
                            onClick={() => {
                              if (errorNotebookMetrics.pendingErrors > 0) {
                                setIsErrorsPacingModalOpen(true);
                              } else {
                                router.push("/notebook");
                              }
                            }}
                            className="group relative backdrop-blur-xl bg-gradient-to-b from-rose-950/20 via-zinc-900/60 to-zinc-950 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl p-5 cursor-pointer transition-all shadow-lg flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
                                  <ShieldAlert size={18} />
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300">
                                  {errorNotebookMetrics.pendingErrors} Pendentes
                                </span>
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white group-hover:text-rose-200 transition-colors">
                                  Exterminador de Erros
                                </h4>
                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                  Zere as pendências do seu Caderno de Erros e supere suas fraquezas.
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-rose-400 font-semibold">
                              <span>Bateria de Erros</span>
                              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                          </motion.div>

                          {/* MODO 3: Gerador Personalizado por IA */}
                          <motion.div
                            whileHover={{ y: -3, transition: { duration: 0.15 } }}
                            onClick={() => setIsAIModalOpen(true)}
                            className="group relative backdrop-blur-xl bg-gradient-to-b from-violet-950/25 via-zinc-900/60 to-zinc-950 border border-violet-500/20 hover:border-violet-500/40 rounded-2xl p-5 cursor-pointer transition-all shadow-lg flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.2)]">
                                  <Sparkles size={18} />
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300">
                                  Customizado
                                </span>
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white group-hover:text-violet-200 transition-colors">
                                  Gerador por IA
                                </h4>
                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                  Filtre por matéria, tópico específico, banca, quantidade e nível.
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-violet-400 font-semibold">
                              <span>Configurar Filtros</span>
                              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                          </motion.div>

                          {/* MODO 4: Modo Prova Real */}
                          <motion.div
                            whileHover={{ y: -3, transition: { duration: 0.15 } }}
                            onClick={() => setIsTimedLaunchModalOpen(true)}
                            className="group relative backdrop-blur-xl bg-gradient-to-b from-emerald-950/20 via-zinc-900/60 to-zinc-950 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-5 cursor-pointer transition-all shadow-lg flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                                  <Timer size={18} />
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                                  Pacing Estrito
                                </span>
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors">
                                  Modo Prova Real
                                </h4>
                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                  Simule as condições de prova com limite de tempo e bloqueio de distrações.
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                              <span>Definir Ritmo</span>
                              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                          </motion.div>
                        </div>
                      </div>

                      {/* 3. SELETOR DE GRANDES BANCAS EXAMINADORAS */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                            <Compass size={16} className="text-violet-400" />
                            Treinar por Banca Examinadora
                          </h3>
                          <span className="text-[11px] text-zinc-400">
                            Padrão de cobrança e estilo calibrados
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            {
                              sigla: "FGV",
                              nome: "Fundação Getulio Vargas",
                              desc: "Casos práticos, textos densos e jurisprudência.",
                              badge: "Densa & Prática",
                              border: "hover:border-violet-500/40",
                            },
                            {
                              sigla: "Cebraspe",
                              nome: "Cebraspe / UnB",
                              desc: "Certo ou Errado e múltipla escolha, penalização por chute.",
                              badge: "Rigor Conceitual",
                              border: "hover:border-sky-500/40",
                            },
                            {
                              sigla: "FCC",
                              nome: "Fundação Carlos Chagas",
                              desc: "Letra da lei, assertivas literais e casos pontuais.",
                              badge: "Letra de Lei",
                              border: "hover:border-indigo-500/40",
                            },
                            {
                              sigla: "Vunesp",
                              nome: "Fundação Vunesp",
                              desc: "Cobrança direta do edital e pragmatismo nas alternativas.",
                              badge: "Objetiva & Direta",
                              border: "hover:border-teal-500/40",
                            },
                          ].map((b) => (
                            <div
                              key={b.sigla}
                              onClick={() => {
                                setBanca(b.sigla);
                                setIsAIModalOpen(true);
                              }}
                              className={`p-4 rounded-xl bg-[#0b0f19]/70 border border-white/10 ${b.border} hover:bg-white/[0.04] transition-all cursor-pointer group flex flex-col justify-between space-y-3`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold font-mono text-white group-hover:text-violet-300 transition-colors">
                                    {b.sigla}
                                  </span>
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                                    {b.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-snug pt-0.5">
                                  {b.desc}
                                </p>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-zinc-400 group-hover:text-zinc-200 pt-1 border-t border-white/5">
                                <span>Filtrar questões</span>
                                <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 4. DISCIPLINAS DO SEU EDITAL (MINI-RADAR) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                            <Layers size={16} className="text-violet-400" />
                            Disciplinas do seu Edital
                          </h3>
                          <Link
                            href="/edital"
                            className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                          >
                            Gerenciar Edital <ChevronRight size={12} />
                          </Link>
                        </div>

                        {subjects.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {subjects.slice(0, 6).map((sub) => {
                              const domain = domainStats.find(
                                (d) =>
                                  d.subjectId === sub.id ||
                                  d.subjectName?.trim().toLowerCase() ===
                                    sub.name.trim().toLowerCase(),
                              );
                              const totalAnsweredSub = domain?.totalAnswered ?? 0;
                              const accSub = domain?.domainPercentage ?? 0;
                              const subColor = sub.color || "#8b5cf6";

                              return (
                                <div
                                  key={sub.id}
                                  className="p-4 rounded-xl bg-[#0b0f19]/70 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3 group"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div
                                          className="w-2.5 h-2.5 rounded-full shrink-0"
                                          style={{ backgroundColor: subColor }}
                                        />
                                        <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                                          {sub.name}
                                        </h4>
                                      </div>
                                      <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                                        {sub.topics?.length ?? 0} tópicos
                                      </span>
                                    </div>

                                    {/* Aproveitamento na disciplina */}
                                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400">
                                      <span>Aproveitamento</span>
                                      <span className="text-white font-mono font-bold">
                                        {totalAnsweredSub > 0 ? `${accSub}%` : "Não iniciado"}
                                      </span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1 rounded-full mt-1.5 overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                          width: `${totalAnsweredSub > 0 ? accSub : 0}%`,
                                          backgroundColor: subColor,
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleQuickQuiz({ materia: sub.name, qtd: 5 })}
                                      className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-violet-600 hover:text-white text-zinc-300 text-xs font-semibold transition-all text-center cursor-pointer"
                                    >
                                      Treinar 5 questões
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMateria(sub.name);
                                        setIsAIModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                      title="Configurar simulado detalhado"
                                    >
                                      <Sparkles size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl bg-violet-950/20 border border-violet-500/20 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="space-y-1 text-center sm:text-left">
                              <h4 className="text-sm font-bold text-white">
                                Comece cadastrando o edital do seu concurso
                              </h4>
                              <p className="text-xs text-zinc-400 max-w-lg">
                                Importe disciplinas e tópicos para que a IA crie simulados 100% alinhados ao seu objetivo.
                              </p>
                            </div>
                            <Link
                              href="/edital"
                              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shrink-0 shadow-lg shadow-violet-600/20"
                            >
                              Configurar Edital
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* 5. ÚLTIMOS SIMULADOS REALIZADOS */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                            <RotateCcw size={16} className="text-violet-400" />
                            Últimos Simulados Realizados
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleTabChange("history")}
                            className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                          >
                            Ver histórico completo ({quizHistory.length}) <ChevronRight size={12} />
                          </button>
                        </div>

                        {quizHistory.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            {quizHistory.slice(0, 3).map((quiz) => {
                              const qCount = Array.isArray(quiz.questions)
                                ? quiz.questions.length
                                : 0;
                              const formattedDate = new Date(
                                quiz.createdAt,
                              ).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                              });

                              return (
                                <div
                                  key={quiz.id}
                                  className="p-4 rounded-xl bg-[#0b0f19]/70 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3 group"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                      <span className="font-mono font-semibold text-violet-300 px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
                                        {quiz.banca || "Banca Geral"}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Calendar size={11} /> {formattedDate}
                                      </span>
                                    </div>

                                    <div>
                                      <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-violet-200 transition-colors">
                                        {quiz.subject || "Simulado Geral"}
                                      </h4>
                                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                        {quiz.topic?.title || "Tópicos variados"} • {qCount} questões
                                      </p>
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      disabled={loadingQuizId === quiz.id}
                                      onClick={() =>
                                        handleLoadSavedQuiz(
                                          quiz.questions,
                                          quiz.banca,
                                          quiz.id,
                                        )
                                      }
                                      className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-violet-600 hover:text-white text-zinc-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                      {loadingQuizId === quiz.id ? (
                                        <>
                                          <Loader2 size={12} className="animate-spin" />
                                          <span>Carregando...</span>
                                        </>
                                      ) : (
                                        <>
                                          <RotateCcw size={12} />
                                          <span>Refazer Simulado</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-5 rounded-xl bg-zinc-900/40 border border-white/5 text-center">
                            <p className="text-xs text-zinc-400">
                              Nenhum simulado finalizado ainda. Escolha um dos modos acima para iniciar sua primeira sessão!
                            </p>
                          </div>
                        )}
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
                  onLoadSavedQuiz={handleLoadSavedQuiz}
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
          onOpenOpticalSheet={() => setIsOpticalSheetOpen(true)}
          onOpenSpeedQuiz={() => setIsSpeedQuizOpen(true)}
          onSelectQuestion={(idx) => {
            setFocusedQuestionIndex(idx);
            document
              .getElementById(`question-card-${idx}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      )}

      {/* MODAL FOLHA ÓPTICA DE RESPOSTAS (MODO DIA D) */}
      <OpticalAnswerSheetModal
        isOpen={isOpticalSheetOpen}
        onClose={() => setIsOpticalSheetOpen(false)}
        questions={questions}
        selectedAnswers={selectedAnswers}
        checkedQuestions={checkedQuestions}
        flaggedQuestions={flaggedQuestions}
        banca={banca}
        onSelectAnswer={(qIdx, altId) => {
          setSelectedAnswers((prev) => ({
            ...prev,
            [qIdx]: altId,
          }));
        }}
        onJumpToQuestion={(idx) => {
          setFocusedQuestionIndex(idx);
          document
            .getElementById(`question-card-${idx}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />

      {/* MODAL DESAFIO RELÂMPAGO 45s (SPEED QUIZ) */}
      <SpeedQuizModal
        isOpen={isSpeedQuizOpen}
        onClose={() => setIsSpeedQuizOpen(false)}
        questions={questions}
        onFinish={(stats) => {
          setLastEarnedXp(stats.totalXp);
        }}
      />

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
        formatoQuestao={formatoQuestao}
        onFormatoQuestaoChange={setFormatoQuestao}
        nivelCargo={nivelCargo}
        onNivelCargoChange={setNivelCargo}
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
        onRewardedBonusEarned={() => {
          setIsSimuladoModalOpen(false);
          setSimuladoGenerationError(null);
          setIsAIModalOpen(true);
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
