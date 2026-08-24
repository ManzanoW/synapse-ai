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

// Importações dos novos recursos reutilizáveis de src/components/questions/
import { PrintableQuestions } from "@/components/questions/printable-questions";
import { RegisterQuestionsModal } from "@/components/questions/register-questions-modal";

export interface QuestaoIA {
  enunciado: string;
  formato: string;
  justificativa: string;
  alternativas: { id: string; texto: string }[];
  gabaritoCorreto: string;
  flashcardFrente: string;
  flashcardVerso: string;
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

export default function QuestoesPage() {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const searchParams = useSearchParams();

  // Estados gerais
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [pendingTab, setPendingTab] = useState<"create" | "history" | null>(
    null,
  );

  // Estados do caderno / questões
  const [banca, setBanca] = useState("FGV");
  const [questions, setQuestions] = useState<QuestaoIA[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [checkedQuestions, setCheckedQuestions] = useState<
    Record<number, boolean>
  >({});
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const [savedErrors, setSavedErrors] = useState<Record<number, boolean>>({});
  const [creatingFlashcardIndex, setCreatingFlashcardIndex] = useState<
    number | null
  >(null);
  const [createdFlashcards, setCreatedFlashcards] = useState<
    Record<number, boolean>
  >({});
  const [focusedQuestionIndex, setFocusedQuestionIndex] = useState(0);

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

  useEffect(() => {
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
  }, [searchParams]);

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

  // Carrega as matérias do Edital
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

  // Mapeamento de tópicos achatados para o Modal
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

  const handleTabChange = (newTab: "create" | "history") => {
    if (
      activeTab === "create" &&
      newTab === "history" &&
      Object.keys(selectedAnswers).length > 0
    ) {
      setPendingTab(newTab);
      return;
    }
    setActiveTab(newTab);
  };

  const confirmNavigation = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setQuestions([]);
      setSelectedAnswers({});
      setCheckedQuestions({});
      setSavedErrors({});
      setCreatedFlashcards({});
      setShowCompletionModal(false);
      setCurrentQuizId(null);
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
              })),
            }),
          });

          const data = await response.json();
          if (data.earnedXp !== undefined) setLastEarnedXp(data.earnedXp);

          window.dispatchEvent(
            new CustomEvent("xp-updated", {
              detail: {
                totalXp: data.totalXp,
                earnedXp: data.earnedXp,
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
          console.error("Erro ao creditar XP:", error);
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
      dificuldade,
      gamificationStats,
      refreshStats,
    ],
  );

  const handleCreateFlashcard = async (index: number) => {
    const q = questions[index];
    if (!q) return;

    setCreatingFlashcardIndex(index);
    try {
      const res = await fetch("/api/flashcards", {
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

      if (res.ok) {
        setCreatedFlashcards((prev) => ({ ...prev, [index]: true }));
      }
    } catch (err) {
      console.error("Erro ao gerar flashcard:", err);
    } finally {
      setCreatingFlashcardIndex(null);
    }
  };

  const fetchQuizHistory = async () => {
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
      setSavedErrors({});
      setCreatedFlashcards({});
      setTimerSeconds(0);
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

  // VIZUALIZAÇÃO MODO IMPRESSÃO / PDF
  if (isPrintMode) {
    return (
      <div>
        <div className="print:hidden fixed top-4 right-4 z-50">
          <button
            onClick={() => setIsPrintMode(false)}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-slate-700 transition-all cursor-pointer"
          >
            Voltar ao Sistema
          </button>
        </div>
        <PrintableQuestions
          title={materia ? `Simulado - ${materia}` : "Simulado de Questões Geral"}
          totalQuestions={questions.length > 0 ? questions.length : 20}
          estimatedTimeMinutes={
            questions.length > 0 ? questions.length * 2 : 40
          }
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
      </div>
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
    <div className="min-h-screen bg-[#02050e] text-slate-100 p-4 md:p-8 font-sans antialiased relative selection:bg-indigo-500/30">
      {questions.length > 0 && activeTab === "create" && (
        <FloatingTimer
          seconds={timerSeconds}
          isRunning={isTimerRunning}
          onToggleTimer={() => setIsTimerRunning((prev) => !prev)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* ================= 1. CABEÇALHO PRINCIPAL ================= */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={openSidebar}
              type="button"
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white md:hidden transition-colors cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <HelpCircle size={20} />
                </div>
                Banco de Provas & Simulados
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Simulados inteligentes focados na banca{" "}
                <strong className="text-indigo-400">{banca || "FGV"}</strong>.
                Treine com feedback em tempo real.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* BOTÃO NOVO 1: IMPRESSÃO / PDF */}
            <button
              onClick={() => setIsPrintMode(true)}
              type="button"
              className="bg-white/5 border border-white/10 hover:border-cyan-500/40 text-cyan-400 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer size={15} />
              <span>Versão Impressa</span>
            </button>

            {/* BOTÃO NOVO 2: REGISTRO MANUAL EXTERNO */}
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              type="button"
              className="bg-white/5 border border-white/10 hover:border-indigo-500/40 text-indigo-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>Registrar Externo</span>
            </button>

            {questions.length > 0 &&
              activeTab === "create" &&
              subjects.length > 0 && (
                <button
                  onClick={() => setIsAIModalOpen(true)}
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs px-4 py-2.5 rounded-xl transition-all font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <Sparkles size={14} className="text-indigo-200" />
                  <span>Novo Simulado IA</span>
                </button>
              )}
          </div>
        </div>

        {/* COMPONENTE OBRIGATÓRIO BLOQUEANTE SE O EDITAL ESTIVER VAZIO */}
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

        {/* CONTEÚDO NORMAL DA PÁGINA (SÓ RENDERIZA SE TIVER SUBJECTS) */}
        {subjects.length > 0 && (
          <>
            {/* 2. BARRA DE PROGRESSO DO SIMULADO */}
            {questions.length > 0 && activeTab === "create" && (
              <div className="bg-[#090d16]/90 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <span className="text-indigo-400">
                      Progresso do Caderno
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-slate-300">
                      {answeredCount}/{totalQuestions} respondidas
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-xs">
                    <span className="text-emerald-400 font-mono">
                      {correctCount} Acerto(s)
                    </span>
                    <span className="text-slate-700">|</span>
                    <span className="text-indigo-300 font-mono font-bold">
                      Aproveitamento: {percentageAcc}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className="bg-linear-to-r from-indigo-500 via-indigo-400 to-emerald-400 h-full transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{
                      width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* 3. NAVEGAÇÃO DE ABAS */}
            <div className="flex border-b border-white/10 gap-2">
              <button
                onClick={() => handleTabChange("create")}
                type="button"
                className={`py-2.5 px-4 font-bold text-xs tracking-wider transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
                  activeTab === "create"
                    ? "border-indigo-500 text-indigo-400 bg-white/5"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {questions.length > 0 ? (
                  <>
                    <Zap size={14} className="text-indigo-400" />
                    <span>Caderno Ativo</span>
                  </>
                ) : (
                  <>
                    <Home size={14} />
                    <span>Início</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  handleTabChange("history");
                  fetchQuizHistory();
                }}
                type="button"
                className={`py-2.5 px-4 font-bold text-xs tracking-wider transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
                  activeTab === "history"
                    ? "border-indigo-500 text-indigo-400 bg-white/5"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <History size={14} />
                <span>Simulados Salvos</span>
              </button>
            </div>

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
                            setIsTimerRunning(true);
                          }}
                          onDiscard={(e) => {
                            e.stopPropagation();
                            localStorage.removeItem(STORAGE_KEY);
                            setPausedSession(null);
                          }}
                        />
                      )}

                    {/* BANNER HERO SPOTLIGHT */}
                    <div className="relative overflow-hidden bg-linear-to-br from-[#0a0f1d] via-[#070b16] to-[#04060c] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl">
                      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px]" />
                      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-4 max-w-xl">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md">
                            <Sparkles
                              size={12}
                              className="text-indigo-400 animate-pulse"
                            />
                            <span className="text-[10px] font-extrabold tracking-widest text-indigo-300 uppercase">
                              Central de Treinamento
                            </span>
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
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

                    {/* OPÇÕES DE CRIAÇÃO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div
                        onClick={() => setIsAIModalOpen(true)}
                        className="group relative bg-linear-to-br from-[#0c101d] via-[#090d18] to-[#05070e] hover:border-indigo-500/40 border border-white/10 p-7 rounded-3xl cursor-pointer transition-all duration-300 active:scale-[0.99] shadow-xl flex flex-col justify-between overflow-hidden"
                      >
                        <div className="space-y-4 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <Sparkles size={22} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                              Gerar Simulado por IA
                            </h3>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                              Filtre por banca, disciplina e dificuldade para
                              montar cadernos sob medida.
                            </p>
                          </div>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-xs font-bold text-indigo-400">
                          <span>Configurar Parâmetros</span>
                          <ArrowRight size={14} />
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          handleTabChange("history");
                          fetchQuizHistory();
                        }}
                        className="group relative bg-linear-to-br from-[#0c101d] via-[#090d18] to-[#05070e] hover:border-white/20 border border-white/10 p-7 rounded-3xl cursor-pointer transition-all duration-300 active:scale-[0.99] shadow-xl flex flex-col justify-between overflow-hidden"
                      >
                        <div className="space-y-4 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                            <History size={22} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-slate-200 transition-colors">
                              Meus Simulados Salvos
                            </h3>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                              Acesse e refaça cadernos salvos no seu histórico a
                              qualquer momento.
                            </p>
                          </div>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-xs font-bold text-slate-400">
                          <span>Ver Cadernos Salvos</span>
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CADERNO DE QUESTÕES EM RESOLUÇÃO */
                  <div className="space-y-6">
                    <div className="bg-[#090d16]/90 border border-indigo-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {banca}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            Caderno em Resolução
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-100">
                          {materia || "Simulado Customizado"}
                        </h2>
                      </div>

                      <button
                        onClick={() => {
                          setQuestions([]);
                          setSelectedAnswers({});
                          setCheckedQuestions({});
                          localStorage.removeItem(STORAGE_KEY);
                          setPausedSession(null);
                          setCurrentQuizId(null);
                          setIsTimerRunning(false);
                        }}
                        type="button"
                        className="text-xs text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 bg-slate-950 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-medium"
                      >
                        Encerrar Caderno
                      </button>
                    </div>

                    <div className="space-y-6 pb-12">
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
                        />
                      ))}
                    </div>
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
                  setCurrentQuizId(null);
                  handleTabChange("create");
                }}
              />
            )}
          </>
        )}
      </div>

      {/* MODAL: GERAR POR IA */}
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

      {/* MODAL NOVO: REGISTRAR QUESTÕES EXTERNAS (QConcursos, Tec Concursos) */}
      <RegisterQuestionsModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        topics={allModalTopics}
        onSuccess={() => {
          if (refreshStats) refreshStats();
        }}
      />

      {/* MODAL: DIAGNÓSTICO E RECOMPENSAS */}
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
            setTimerSeconds(0);
            setFocusedQuestionIndex(0);
            setIsTimerRunning(true);
            setShowCompletionModal(false);
          }}
          onReview={() => setShowCompletionModal(false)}
        />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE NAVEGAÇÃO PENDENTE */}
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
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Continuar respondendo
              </button>
              <button
                onClick={confirmNavigation}
                type="button"
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
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
