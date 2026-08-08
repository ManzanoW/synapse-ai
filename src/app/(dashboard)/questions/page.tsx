"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSidebar } from "@/lib/sidebar-context";
import { useGamification } from "@/context/GamificationContext";
import {
  Menu,
  HelpCircle,
  Sparkles,
  History,
  Home,
  ArrowRight,
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
  const { openSidebar } = useSidebar();
  const searchParams = useSearchParams();

  // Estados gerais
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
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

  // Efeitos de Persistência e Notificações
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
        console.error("Erro ao carregar do localStorage:", e);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const paramTopicId = searchParams.get("topicId");
    if (paramTopicId) {
      const timer = setTimeout(() => {
        setSelectedTopicId(paramTopicId);
        setIsAIModalOpen(true);
      }, 0);
      return () => clearTimeout(timer);
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
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
      }
    } catch (e) {
      console.error("Erro ao salvar no localStorage:", e);
    }
  }, [
    currentQuizId,
    banca,
    questions,
    selectedAnswers,
    checkedQuestions,
    createdFlashcards,
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
    if (isAIModalOpen) {
      fetch("/api/edital?mode=subjects")
        .then((res) => res.json())
        .then((json) => {
          const loadedSubjects: SubjectItem[] = json.data || [];
          setSubjects(loadedSubjects);
          if (loadedSubjects.length > 0 && !materia) {
            setMateria(loadedSubjects[0].name);
          }
        })
        .catch(console.error);
    }
  }, [isAIModalOpen, materia]);

  // Auxiliares derivados
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

  // Ações da página
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
    setIsGenerating(true);
    setSelectedAnswers({});
    setCheckedQuestions({});
    setSavedErrors({});
    setCreatedFlashcards({});
    setShowCompletionModal(false);
    setTimerSeconds(0);
    setFocusedQuestionIndex(0);
    setIsTimerRunning(true);

    try {
      const response = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banca,
          materia,
          topicoId: selectedTopicId || null,
          qtdQuestoes,
          fonteConteudo,
          dificuldade,
          textoBase: fonteConteudo === "texto" ? textoBase : "",
        }),
      });

      const json = await response.json();
      const generatedQuestions = json.data || [];
      setQuestions(generatedQuestions);
      setIsAIModalOpen(false);

      if (generatedQuestions.length > 0) {
        const saveRes = await fetch("/api/questions/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            banca,
            subject: materia,
            topicId: selectedTopicId || null,
            difficulty: dificuldade,
            questions: generatedQuestions,
          }),
        });
        const saveData = await saveRes.json();
        if (saveData.id) setCurrentQuizId(saveData.id);
      }
    } catch (error) {
      console.error("Erro ao gerar simulado:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Atalhos de teclado
  // Atalhos de teclado
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

      // TRAVA: Se a questão focada já foi respondida, bloqueia a mudança de opção
      const isAlreadyAnswered = Boolean(checkedQuestions[focusedQuestionIndex]);

      if (["1", "2", "3", "4", "5"].includes(e.key)) {
        if (isAlreadyAnswered) return; // Bloqueia alteração pós-resposta

        const num = parseInt(e.key, 10);
        if (currentQuestion.formato === "multipla") {
          const altIndex = num - 1;
          if (currentQuestion.alternativas?.[altIndex]) {
            const selectedAltId = currentQuestion.alternativas[altIndex].id;
            setSelectedAnswers((prev) => ({
              ...prev,
              [focusedQuestionIndex]: selectedAltId,
            }));
          }
        } else {
          if (num === 1) {
            setSelectedAnswers((prev) => ({
              ...prev,
              [focusedQuestionIndex]: "Certo",
            }));
          } else if (num === 2) {
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

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased relative">
      {questions.length > 0 && activeTab === "create" && (
        <FloatingTimer
          seconds={timerSeconds}
          isRunning={isTimerRunning}
          onToggleTimer={() => setIsTimerRunning((prev) => !prev)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-900 pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={openSidebar}
              type="button"
              className="p-2 bg-[#090d16] border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 md:hidden transition-colors cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <HelpCircle size={24} className="text-indigo-400" />
                Questões & Simulados
              </h1>
              <p className="text-sm text-slate-400 mt-0.5 max-w-xl">
                Simulado inédito focado na banca {banca || "selecionada"}.
                Avalie seu rendimento em tempo real.
              </p>
            </div>
          </div>

          {questions.length > 0 && activeTab === "create" && (
            <button
              onClick={() => setIsAIModalOpen(true)}
              type="button"
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-slate-100 text-xs px-3 py-2 rounded-xl transition-all font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/40 cursor-pointer"
            >
              <Sparkles size={14} />
              Novo Simulado com IA
            </button>
          )}
        </div>

        {/* BARRA DE PROGRESSO */}
        {questions.length > 0 && activeTab === "create" && (
          <div className="bg-[#090d16]/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-300">
                <span>Progresso do Caderno</span>
                <span className="text-slate-500">•</span>
                <span className="text-indigo-400 font-mono">
                  {answeredCount}/{totalQuestions} respondidas
                </span>
              </div>
              <div className="flex items-center gap-3 font-semibold text-xs">
                <span className="text-emerald-400">
                  {correctCount} Acerto(s)
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-indigo-300 font-mono">
                  Aproveitamento: {percentageAcc}%
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/60">
              <div
                className="bg-linear-to-r from-indigo-500 via-indigo-400 to-emerald-400 h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* SELETORES DE ABA */}
        <div className="flex border-b border-slate-900 gap-2">
          <button
            onClick={() => handleTabChange("create")}
            type="button"
            className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === "create"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {questions.length > 0 ? (
              <>
                <span>📝</span>
                <span>Caderno Atual</span>
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
            className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === "history"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <History size={14} />
            Meus Simulados Salvos
          </button>
        </div>

        {/* ABA 1: HUB OU CADERNO ATIVO */}
        {activeTab === "create" && (
          <>
            {questions.length === 0 ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                {pausedSession &&
                  pausedSession.questions &&
                  pausedSession.questions.length > 0 && (
                    <ResumeSessionCard
                      session={pausedSession}
                      onResume={() => {
                        setCurrentQuizId(pausedSession.quizId || null);
                        setBanca(pausedSession.banca || "FGV");
                        setQuestions(pausedSession.questions || []);
                        setSelectedAnswers(pausedSession.selectedAnswers || {});
                        setCheckedQuestions(
                          pausedSession.checkedQuestions || {},
                        );
                        setCreatedFlashcards(
                          pausedSession.createdFlashcards || {},
                        );
                        setIsTimerRunning(true);
                      }}
                      onDiscard={(e) => {
                        e.stopPropagation();
                        localStorage.removeItem(STORAGE_KEY);
                        setPausedSession(null);
                      }}
                    />
                  )}

                {/* BANNER HERO */}
                <div className="relative overflow-hidden bg-linear-to-br from-[#0c0f1d] via-[#090d16] to-[#05070c] border border-indigo-500/20 rounded-3xl p-8 shadow-[0_0_50px_-12px_rgba(79,70,229,0.15)]">
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-4 max-w-xl">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md">
                        <Sparkles
                          size={12}
                          className="text-indigo-400 animate-pulse"
                        />
                        <span className="text-[11px] font-bold tracking-wider text-indigo-300 uppercase">
                          Central de Treinamento
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                        Pratique com questões inéditas e simulados direcionados
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        Gere cadernos adaptativos configurados por IA ou retome
                        seus testes anteriores.
                      </p>
                    </div>
                  </div>
                </div>

                {/* OPCÕES DE CRIAÇÃO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div
                    onClick={() => setIsAIModalOpen(true)}
                    className="group relative bg-linear-to-b from-[#0e1222]/90 to-[#090d16]/90 hover:from-[#12182e] hover:to-[#0c101d] border border-indigo-500/20 hover:border-indigo-500/50 p-7 rounded-3xl cursor-pointer transition-all duration-300 active:scale-[0.98] shadow-xl flex flex-col justify-between overflow-hidden"
                  >
                    <div className="space-y-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Sparkles size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                          Novo Simulado por IA
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          Filtre por banca, disciplina e grau de complexidade
                          para gerar testes exclusivos.
                        </p>
                      </div>
                    </div>
                    <div className="mt-8 flex items-center gap-2 text-xs font-bold text-indigo-400">
                      <span>Configurar Simulado</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      handleTabChange("history");
                      fetchQuizHistory();
                    }}
                    className="group relative bg-linear-to-b from-[#0e1222]/60 to-[#090d16]/90 hover:from-[#12182e] hover:to-[#0c101d] border border-slate-800 hover:border-slate-700 p-7 rounded-3xl cursor-pointer transition-all duration-300 active:scale-[0.98] shadow-xl flex flex-col justify-between overflow-hidden"
                  >
                    <div className="space-y-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300">
                        <History size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-slate-200 transition-colors">
                          Meus Simulados Salvos
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          Acesse cadernos criados anteriormente e treine
                          novamente de forma gratuita.
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
              <div className="space-y-6">
                <div className="bg-[#090d16]/90 border border-indigo-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 px-2 py-0.5 rounded uppercase tracking-wider">
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
                    className="text-xs text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/40 bg-slate-950 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
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

        {/* ABA 2: HISTÓRICO */}
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
      </div>

      {/* MODAL 1: GERAR POR IA */}
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
        onMateriaChange={(val) => {
          setMateria(val);
          setSelectedTopicId("");
        }}
        onTopicChange={setSelectedTopicId}
        onFonteChange={setFonteConteudo}
        onTextoBaseChange={setTextoBase}
        onDificuldadeChange={setDificuldade}
        onQtdQuestoesChange={setQtdQuestoes}
        onSubmit={handleGenerateSimulado}
      />

      {/* MODAL 2: DIAGNÓSTICO COGNITIVO */}
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

      {/* MODAL NAVEGAÇÃO PENDENTE */}
      {pendingTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-semibold text-slate-100 mb-2">
              Deseja sair do simulado atual?
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Se mudar para o histórico agora, o progresso não salvo será
              perdido.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setPendingTab(null)}
                type="button"
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Continuar respondendo
              </button>
              <button
                onClick={confirmNavigation}
                type="button"
                className="px-4 py-2 bg-rose-600/20 text-rose-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Sim, sair e descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
