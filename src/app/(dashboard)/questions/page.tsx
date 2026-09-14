"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  PlusCircle,
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
import { QuizHistoryTab } from "./_components/QuizHistoryTab";
import { GenerateAIModal } from "./_components/GenerateAIModal";
import { QuestionMinimap } from "./_components/QuestionMinimap";
import { TimedLaunchModal } from "./_components/TimedLaunchModal";
import { TimedPacingModal } from "./_components/TimedPacingModal";
import { ErrorNotebookView } from "../notebook/components/ErrorNotebookView";

import { PrintableQuestions } from "@/components/questions/printable-questions";
import { RegisterQuestionsModal } from "@/components/questions/register-questions-modal";

import { submitQuizAttemptAction } from "@/actions/quiz-actions";
import { generateTargetedDeckAction } from "@/actions/deck-actions";
import {
  getErrorNotebookItemsAction,
  getErrorMetricsAction,
} from "@/actions/error-notebook-actions";
import {
  ErrorClassification,
  QuestionAnswerSubmission,
  ErrorNotebookItem,
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

export default function QuestoesPage() {
  const router = useRouter();
  const { openSidebar, closeSidebar } = useSidebar();
  const searchParams = useSearchParams();

  // Estados gerais
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"create" | "history" | "notebook">(
    "create",
  );
  const [pendingTab, setPendingTab] = useState<
    "create" | "history" | "notebook" | null
  >(null);

  // Caderno de Erros Integrado
  const [errorNotebookItems, setErrorNotebookItems] = useState<
    ErrorNotebookItem[]
  >([]);
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

  // Cronômetro e conclusão
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isSyncingSM2, setIsSyncingSM2] = useState(false);
  const [lastEarnedXp, setLastEarnedXp] = useState(0);

  // Modal IA / Edital
  const [materia, setMateria] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
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
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const loadErrorNotebookData = useCallback(async () => {
    setIsLoadingNotebook(true);
    try {
      const [itemsRes, metricsRes] = await Promise.all([
        getErrorNotebookItemsAction({}),
        getErrorMetricsAction(),
      ]);
      if (itemsRes.success && itemsRes.data) {
        setErrorNotebookItems(itemsRes.data);
      }
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
    const tabParam = searchParams.get("tab");
    if (tabParam === "history") {
      setActiveTab("history");
      fetchQuizHistory();
    } else if (tabParam === "notebook") {
      setActiveTab("notebook");
      loadErrorNotebookData();
    } else if (tabParam === "create") {
      setActiveTab("create");
    }

    const openTimed = searchParams.get("openTimed");
    if (openTimed === "true") {
      fetchQuizHistory();
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
      fetch("/api/questions/list")
        .then((res) => res.json())
        .then((json) => {
          const historyList: QuizHistoryItem[] = json.data || [];
          const foundQuiz = historyList.find((q) => q.id === paramQuizId);

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
  }, [searchParams, fetchQuizHistory, loadErrorNotebookData]);

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && questions.length > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev + 1), 1000);
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
  }, [searchParams]);

  const currentSubjectObj = subjects.find(
    (s) =>
      s.id === materia ||
      s.name.trim().toLowerCase() === materia.trim().toLowerCase(),
  );
  const availableTopics = currentSubjectObj?.topics || [];

  const allModalTopics = subjects.flatMap(
    (s) =>
      s.topics?.map((t) => ({
        id: t.id,
        title: t.title,
        subjectName: s.name,
      })) || [],
  );

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(checkedQuestions).length;
  const correctCount = Object.keys(checkedQuestions).filter(
    (idxStr) =>
      selectedAnswers[Number(idxStr)] ===
      questions[Number(idxStr)]?.gabaritoCorreto,
  ).length;
  const percentageAcc =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  const handleTabChange = (newTab: "create" | "history" | "notebook") => {
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
    router.replace(`/questions?tab=${newTab}`, { scroll: false });
    if (newTab === "history") {
      fetchQuizHistory();
    } else if (newTab === "notebook") {
      loadErrorNotebookData();
    }
  };

  const confirmNavigation = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      router.replace(`/questions?tab=${pendingTab}`, { scroll: false });
      if (pendingTab === "history") {
        fetchQuizHistory();
      } else if (pendingTab === "notebook") {
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
    setIsGenerating(true);

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
          qtdQuestoes: parseInt(qtdQuestoes, 10),
          dificuldade,
          textoBase,
          fonteConteudo,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json.error || json.details || "Falha ao gerar simulado com IA.",
        );
      }

      if (!json.data || json.data.length === 0) {
        throw new Error(
          "A IA não retornou questões para o escopo selecionado.",
        );
      }

      setQuestions(json.data);
      setCurrentQuizId(json.quizId || null);
      setIsAIModalOpen(false);
      setSelectedAnswers({});
      setCheckedQuestions({});
      setFlaggedQuestions({});
      setErrorClassifications({});
      setSavedErrors({});
      setCreatedFlashcards({});
      setTimerSeconds(0);
      setFocusedQuestionIndex(0);
      setIsTimerRunning(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao gerar questões.";
      console.error("Erro ao gerar simulado:", msg);
    } finally {
      setIsGenerating(false);
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

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#02050e] text-slate-400 flex flex-col items-center justify-center gap-3 text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <span>Sincronizando banco de dados cognitivo...</span>
      </div>
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

      {/* Timer Flutuante apenas em Telas Médias/Grandes */}
      {questions.length > 0 && activeTab === "create" && (
        <div className="hidden sm:block">
          <FloatingTimer
            seconds={timerSeconds}
            isRunning={isTimerRunning}
            onToggleTimer={() => setIsTimerRunning((prev) => !prev)}
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* ================= 1. CABEÇALHO PRINCIPAL (SEM QUESTÕES ATIVAS) ================= */}
        {!isZenMode && questions.length === 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 sm:pb-6 transition-all duration-300">
            <div className="flex items-start sm:items-center gap-3">
              <button
                onClick={openSidebar}
                type="button"
                className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white md:hidden transition-colors cursor-pointer shrink-0 mt-0.5 sm:mt-0"
              >
                <Menu size={18} />
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 sm:gap-2.5">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-xs shrink-0">
                    <HelpCircle size={18} className="sm:w-5 sm:h-5" />
                  </div>
                  <span className="truncate">Banco de Provas & Simulados</span>
                </h1>

                <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 leading-tight">
                  Crie cadernos adaptativos com IA e acompanhe sua evolução.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  fetchQuizHistory();
                  loadErrorNotebookData();
                  setIsTimedLaunchModalOpen(true);
                }}
                className="w-full sm:w-auto justify-center bg-violet-600/20 border border-violet-500/40 hover:bg-violet-600/30 text-violet-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-violet-600/10 active:scale-95"
              >
                <Timer size={15} className="text-violet-400" />
                <span>Modo Cronometrado</span>
              </button>

              <button
                onClick={() => setIsRegisterModalOpen(true)}
                type="button"
                className="w-full sm:w-auto justify-center bg-white/5 border border-white/10 hover:border-indigo-500/40 text-indigo-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <PlusCircle size={15} />
                <span>Registrar Externo</span>
              </button>
            </div>
          </div>
        )}

        {/* ETAPA OBRIGATÓRIA EDITAL */}
        {subjects.length === 0 && questions.length === 0 && (
          <div className="min-h-[60vh] flex items-center justify-center py-4">
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
        )}

        {/* CONTEÚDO PRINCIPAL */}
        {subjects.length > 0 && (
          <>
            {/* HUD REORGANIZADO PARA MODO RESOLUÇÃO */}
            {questions.length > 0 && activeTab === "create" && (
              <div className="bg-[#090d16] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
                {/* LINHA 1: MENU + INFO MATÉRIA + TEMPO */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {!isZenMode && (
                      <button
                        onClick={openSidebar}
                        type="button"
                        className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white md:hidden shrink-0 cursor-pointer"
                      >
                        <Menu size={16} />
                      </button>
                    )}
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 font-bold text-indigo-300 text-[10px] shrink-0 uppercase">
                      {banca}
                    </span>
                    <span className="text-xs text-slate-200 font-bold truncate">
                      {materia || "Simulado"}
                    </span>
                  </div>

                  {/* CRONÔMETRO */}
                  <div className="flex items-center gap-1.5 bg-indigo-950/60 border border-indigo-500/40 px-2.5 py-1 rounded-xl text-xs font-mono text-indigo-300 shrink-0">
                    <Clock
                      size={12}
                      className="text-emerald-400 animate-pulse"
                    />
                    <span>{formatTimer(timerSeconds)}</span>
                    <button
                      onClick={() => setIsTimerRunning((prev) => !prev)}
                      className="p-0.5 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer ml-0.5"
                    >
                      {isTimerRunning ? (
                        <Pause size={11} />
                      ) : (
                        <Play size={11} />
                      )}
                    </button>
                  </div>
                </div>

                {/* LINHA 2: PROGRESSO + AÇÕES */}
                <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2 text-xs">
                  <div className="flex items-center gap-2 font-mono text-slate-300 text-[11px]">
                    <span className="font-bold text-emerald-400">
                      {answeredCount}/{totalQuestions}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>{percentageAcc}% Acerto</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsPrintMode(true)}
                      type="button"
                      className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-cyan-400 text-xs font-semibold cursor-pointer"
                      title="Imprimir"
                    >
                      <Printer size={13} />
                    </button>

                    <button
                      onClick={() => setIsZenMode((prev) => !prev)}
                      type="button"
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        isZenMode
                          ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}
                      title="Modo Zen"
                    >
                      {isZenMode ? (
                        <Minimize2 size={13} />
                      ) : (
                        <Maximize2 size={13} />
                      )}
                    </button>

                    <button
                      onClick={() => {
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
                      type="button"
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg shrink-0 cursor-pointer"
                    >
                      Sair
                    </button>
                  </div>
                </div>

                {/* BARRA DE PROGRESSO */}
                <div className="w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div
                    className="bg-linear-to-r from-indigo-500 via-indigo-400 to-emerald-400 h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* 3. NAVEGAÇÃO DE ABAS */}
            {!isZenMode && questions.length === 0 && (
              <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-px scrollbar-none">
                <button
                  onClick={() => handleTabChange("create")}
                  type="button"
                  className={`py-2.5 px-4 font-bold text-xs tracking-wider transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === "create"
                      ? "border-indigo-500 text-indigo-400 bg-white/5"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <Home size={14} />
                  <span>Início / Gerador</span>
                </button>
                <button
                  onClick={() => {
                    handleTabChange("history");
                    fetchQuizHistory();
                  }}
                  type="button"
                  className={`py-2.5 px-4 font-bold text-xs tracking-wider transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === "history"
                      ? "border-indigo-500 text-indigo-400 bg-white/5"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <History size={14} />
                  <span>Simulados Salvos</span>
                </button>
                <button
                  onClick={() => {
                    handleTabChange("notebook");
                    loadErrorNotebookData();
                  }}
                  type="button"
                  className={`py-2.5 px-4 font-bold text-xs tracking-wider transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === "notebook"
                      ? "border-rose-500 text-rose-400 bg-white/5"
                      : "border-transparent text-slate-400 hover:text-white"
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

            {/* 4. ABA 1: HUB OU CADERNO ATIVO */}
            {activeTab === "create" && (
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

                    {/* HERO SPOTLIGHT */}
                    <div className="relative overflow-hidden bg-linear-to-br from-[#0d1326] via-[#090d18] to-[#04060c] border border-indigo-500/20 sm:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-2xl">
                      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 sm:h-72 sm:w-72 rounded-full bg-indigo-500/20 blur-[60px] sm:blur-[100px]" />

                      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-8">
                        <div className="space-y-2.5 sm:space-y-4 max-w-xl">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-md">
                            <Sparkles
                              size={11}
                              className="text-indigo-400 animate-pulse"
                            />
                            <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-indigo-300 uppercase">
                              Central de Treinamento
                            </span>
                          </div>

                          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug sm:leading-tight">
                            Pratique com questões inéditas e simulados
                            direcionados
                          </h2>

                          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                            Gere cadernos adaptativos configurados pela IA ou
                            retome seus testes anteriores com feedback em tempo
                            real.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CARDS DE AÇÃO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
                      <div
                        onClick={() => setIsAIModalOpen(true)}
                        className="group relative bg-linear-to-br from-[#0c101d] via-[#090d18] to-[#05070e] active:scale-[0.98] sm:active:scale-[0.99] hover:border-indigo-500/50 border border-indigo-500/20 sm:border-white/10 p-5 sm:p-7 rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-200 shadow-xl flex flex-col justify-between overflow-hidden"
                      >
                        <div className="pointer-events-none absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />

                        <div className="space-y-3 sm:space-y-4 relative z-10">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                            <Sparkles size={20} className="sm:w-5 sm:h-5" />
                          </div>

                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                              <span>Gerar Simulado por IA</span>
                              <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full sm:hidden">
                                Recomendado
                              </span>
                            </h3>

                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                              Filtre por banca, disciplina e dificuldade para
                              montar cadernos sob medida.
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-8 flex items-center gap-2 text-xs font-extrabold text-indigo-400 group-hover:translate-x-1 transition-transform">
                          <span>Configurar Parâmetros</span>
                          <ArrowRight size={14} />
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          handleTabChange("history");
                          fetchQuizHistory();
                        }}
                        className="group relative bg-linear-to-br from-[#0c101d] via-[#090d18] to-[#05070e] active:scale-[0.98] sm:active:scale-[0.99] hover:border-white/30 border border-white/10 p-5 sm:p-7 rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-200 shadow-xl flex flex-col justify-between overflow-hidden"
                      >
                        <div className="space-y-3 sm:space-y-4 relative z-10">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shadow-inner">
                            <History size={20} className="sm:w-5 sm:h-5" />
                          </div>

                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-slate-200 transition-colors">
                              Meus Simulados Salvos
                            </h3>

                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                              Acesse e refaça cadernos salvos no seu histórico a
                              qualquer momento.
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-8 flex items-center gap-2 text-xs font-extrabold text-slate-400 group-hover:text-slate-200 group-hover:translate-x-1 transition-transform">
                          <span>Ver Cadernos Salvos</span>
                          <ArrowRight size={14} />
                        </div>
                      </div>
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

            {/* 5. ABA 2: HISTÓRICO */}
            {activeTab === "history" && (
              <QuizHistoryTab
                history={quizHistory}
                isLoading={isLoadingHistory}
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

            {/* 5. ABA 3: CADERNO DE ERROS COMPLETO */}
            {activeTab === "notebook" && questions.length === 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {!isNotebookLoaded || isLoadingNotebook ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 text-xs">
                    <Loader2 size={24} className="animate-spin text-rose-400" />
                    <span>Carregando diagnóstico do Caderno de Erros...</span>
                  </div>
                ) : (
                  <ErrorNotebookView
                    initialItems={errorNotebookItems}
                    initialMetrics={errorNotebookMetrics}
                    subjects={subjects}
                  />
                )}
              </div>
            )}
          </>
        )}
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
        onFonteChange={setFonteConteudo}
        onTextoBaseChange={setTextoBase}
        onDificuldadeChange={setDificuldade}
        onQtdQuestoesChange={setQtdQuestoes}
        onSubmit={handleGenerateSimulado}
      />

      <RegisterQuestionsModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        topics={allModalTopics}
        onSuccess={() => {
          if (refreshStats) refreshStats();
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
