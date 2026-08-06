"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSidebar } from "@/lib/sidebar-context";
import { useGamification } from "@/context/GamificationContext";
import { motion } from "framer-motion";
import {
  Menu,
  HelpCircle,
  Plus,
  Sparkles,
  X,
  Loader2,
  Target,
  BookOpen,
  CheckCircle2,
  XCircle,
  History,
  Calendar,
  Layers,
  Bookmark,
  BookmarkCheck,
  BrainCircuit,
  Trophy,
  RotateCcw,
  FileText,
  Search,
  ChevronDown,
  ArrowRight,
  Play,
  Home,
} from "lucide-react";

// Tipagem para as questões que chegam da nossa API do Gemini
export interface QuestaoIA {
  enunciado: string;
  formato: string;
  justificativa: string;
  alternativas: { id: string; texto: string }[];
  gabaritoCorreto: string;
  flashcardFrente: string;
  flashcardVerso: string;
}

// Interface para tipar os itens do histórico vindos do banco
interface QuizHistoryItem {
  id: string;
  banca: string;
  subject: string;
  difficulty: string;
  questions: QuestaoIA[];
  createdAt: string;
  topic?: { title: string } | null;
}

interface TopicItem {
  id: string;
  title: string;
}

interface SubjectItem {
  id: string;
  name: string;
  topics?: TopicItem[];
}

const renderEnunciado = (texto: string) => {
  if (!texto) return null;

  const partes = texto.split(/(\*\*.*?\*\*)/g);

  return partes.map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      const conteudoLimpo = parte.slice(2, -2);
      return (
        <span
          key={`highlight-${i}`}
          className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 font-bold mx-0.5"
        >
          {conteudoLimpo}
        </span>
      );
    }
    return <React.Fragment key={`text-${i}`}>{parte}</React.Fragment>;
  });
};

// Helper para embaralhar um array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Embaralha tanto a ordem das questões quanto a ordem das alternativas de cada uma
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
      if (alt.texto === textoCorreto) {
        novoGabarito = novaLetra;
      }
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

  // ================= ESTADOS GERAIS DA PÁGINA =================
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );

  // Controle de abas da interface
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [pendingTab, setPendingTab] = useState<"create" | "history" | null>(
    null,
  );

  // ================= CADERNO DE ERROS E FLASHCARDS =================
  const [savedErrors, setSavedErrors] = useState<Record<number, boolean>>({});
  const [creatingFlashcardIndex, setCreatingFlashcardIndex] = useState<
    number | null
  >(null);
  const [createdFlashcards, setCreatedFlashcards] = useState<
    Record<number, boolean>
  >({});
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isSyncingSM2, setIsSyncingSM2] = useState(false);
  const [lastEarnedXp, setLastEarnedXp] = useState<number>(0);

  // ================= ESTADOS DO MODAL IA PREMIUM =================
  const [materia, setMateria] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [qtdQuestoes, setQtdQuestoes] = useState("5");
  const [fonteConteudo, setFonteConteudo] = useState<"banca" | "texto" | "pdf">(
    "banca",
  );
  const [dificuldade, setDificuldade] = useState("Média");
  const [textoBase, setTextoBase] = useState("");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // ================= ESTADOS DO MODAL MANUAL =================
  const [tipoFormato, setTipoFormato] = useState<"multipla" | "certo_errado">(
    "multipla",
  );
  const [alternativas, setAlternativas] = useState([
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
    { id: "D", text: "" },
  ]);
  const [alternativaCorreta, setAlternativaCorreta] = useState("A");

  // Estado para capturar se subiu de nível no último quiz
  const [levelUpData, setLevelUpData] = useState<{
    leveledUp: boolean;
    newLevel: number;
  } | null>(null);

  // ================= ESTADOS GERAIS DA PÁGINA =================
  const STORAGE_KEY = "deepwork_quiz_session_v1";

  const [banca, setBanca] = useState("FGV");
  const [questions, setQuestions] = useState<QuestaoIA[]>([]);
  const [loadingQuizId, setLoadingQuizId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [checkedQuestions, setCheckedQuestions] = useState<
    Record<number, boolean>
  >({});
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  // Guarda os dados recuperados do localStorage para o Card de Retomada no Hub
  const [pausedSession, setPausedSession] = useState<{
    quizId?: string | null;
    banca: string;
    questions: QuestaoIA[];
    selectedAnswers: Record<number, string>;
    checkedQuestions: Record<number, boolean>;
    createdFlashcards: Record<number, boolean>;
  } | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  const handleTabChange = (newTab: "create" | "history") => {
    const hasUnsavedProgress = Object.keys(selectedAnswers).length > 0;

    if (activeTab === "create" && newTab === "history" && hasUnsavedProgress) {
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

  const cancelNavigation = () => {
    setPendingTab(null);
  };

  // Histórico de simulados
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");

  const filteredHistory = quizHistory
    .filter((sim) => {
      const term = searchTerm.toLowerCase();
      const matchesBanca = sim.banca?.toLowerCase().includes(term);
      const matchesSubject = sim.subject?.toLowerCase().includes(term);
      const matchesDifficulty = sim.difficulty?.toLowerCase().includes(term);
      const topicMatch = sim.topic?.title?.toLowerCase().includes(term);
      return matchesBanca || matchesSubject || matchesDifficulty || topicMatch;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sortBy === "subject") {
        return (a.subject || "").localeCompare(b.subject || "");
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // 1. CARREGA DO LOCALSTORAGE AO MONTAR
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.questions && parsed.questions.length > 0) {
            setPausedSession(parsed);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar do localStorage:", e);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // CARREGA PARÂMETROS DA URL (EX: DASHBOARD SUGESTÃO DE REBALANCEAMENTO)
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

  // 2. SALVA NO LOCALSTORAGE QUANDO O ESTADO MUDA
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

  // 3. CARREGA MATÉRIAS COM TÓPICOS INCLUSOS
  useEffect(() => {
    if (isAIModalOpen) {
      fetch("/api/edital?mode=subjects")
        .then((res) => res.json())
        .then((json) => {
          const loadedSubjects: SubjectItem[] = json.data || [];
          setSubjects(loadedSubjects);

          if (loadedSubjects.length > 0) {
            if (selectedTopicId) {
              const matchedSubject = loadedSubjects.find((sub) =>
                sub.topics?.some(
                  (t) =>
                    t.id === selectedTopicId || t.title === selectedTopicId,
                ),
              );
              if (matchedSubject) {
                setMateria(matchedSubject.name);
                return;
              }
            }

            const exists = loadedSubjects.some(
              (s) =>
                s.name.trim().toLowerCase() === materia.trim().toLowerCase() ||
                s.id === materia,
            );
            if (!materia || !exists) {
              setMateria(loadedSubjects[0].name);
            }
          }
        })
        .catch(console.error);
    }
  }, [isAIModalOpen, selectedTopicId, materia]);

  const currentSubjectObj = subjects.find(
    (s) =>
      s.id === materia ||
      s.name.trim().toLowerCase() === materia.trim().toLowerCase(),
  );

  const availableTopics = currentSubjectObj?.topics || [];

  const handleRemoverSimulado = async (idSimulado: string) => {
    try {
      const response = await fetch(`/api/questions/${idSimulado}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir o simulado.");

      setQuizHistory((prev) => prev.filter((item) => item.id !== idSimulado));
      setConfirmingDeleteId(null);
      if (currentQuizId === idSimulado) {
        setCurrentQuizId(null);
      }
    } catch (error) {
      console.error("Erro ao deletar simulado:", error);
      alert("Não foi possível excluir o simulado.");
    }
  };

  // Funções de Retomada do Caderno Pausado
  const handleResumePausedSession = () => {
    if (!pausedSession) return;
    setCurrentQuizId(pausedSession.quizId || null);
    setBanca(pausedSession.banca || "FGV");
    setQuestions(pausedSession.questions || []);
    setSelectedAnswers(pausedSession.selectedAnswers || {});
    setCheckedQuestions(pausedSession.checkedQuestions || {});
    setCreatedFlashcards(pausedSession.createdFlashcards || {});
  };

  const handleDiscardPausedSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem(STORAGE_KEY);
    setPausedSession(null);
  };

  // ================= CÁLCULO DAS ESTATÍSTICAS E CONCLUÍDOS =================
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(checkedQuestions).length;
  const correctCount = Object.keys(checkedQuestions).filter(
    (indexStr) =>
      selectedAnswers[Number(indexStr)] ===
      questions[Number(indexStr)]?.gabaritoCorreto,
  ).length;

  const percentageAcc =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  const syncQuizWithSM2 = async (finalAccuracy: number) => {
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
      console.error("Erro ao sincronizar SM-2 pós-quiz:", err);
    } finally {
      setIsSyncingSM2(false);
    }
  };

  const { stats: gamificationStats, refreshStats } = useGamification();

  const handleAnswerQuestion = async (index: number) => {
    const nextChecked = { ...checkedQuestions, [index]: true };
    setCheckedQuestions(nextChecked);

    // Quando TODAS as questões do caderno forem respondidas:
    if (Object.keys(nextChecked).length === totalQuestions) {
      const finalCorrect = Object.keys(nextChecked).filter(
        (idxStr) =>
          selectedAnswers[Number(idxStr)] ===
          questions[Number(idxStr)]?.gabaritoCorreto,
      ).length;
      const finalAcc = Math.round((finalCorrect / totalQuestions) * 100);

      // 1. Atualiza SM-2
      syncQuizWithSM2(finalAcc);

      // 2. ⚡ Re-notifica a API do quiz/save enviando os resultados para creditar o XP
      try {
        const subjectName = materia?.trim() || "Geral";

        const response = await fetch("/api/questions/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId: currentQuizId,
            banca: banca || "Geral",
            subject: subjectName,
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

        if (data.earnedXp !== undefined) {
          setLastEarnedXp(data.earnedXp);
        }

        // 🟢 VERIFICA LEVEL UP COMPARANDO O NÍVEL ANTERIOR COM O NÍVEL NOVO DA API
        if (data.levelInfo?.level) {
          const newLevel = data.levelInfo.level;
          // 🟢 Captura o nível anterior acessando a propriedade interna gamification
          const previousLevel = gamificationStats?.gamification?.level ?? 1;

          if (data.levelInfo?.level) {
            const newLevel = data.levelInfo.level;

            // Se o novo nível for maior que o nível salvo anteriormente:
            if (newLevel > previousLevel) {
              setLevelUpData({
                leveledUp: true,
                newLevel: newLevel,
              });

              // 💾 Salva no localStorage para notificar a Dashboard
              localStorage.setItem(
                "pending_levelup_notification",
                JSON.stringify({
                  level: newLevel,
                  title: data.levelInfo.title || "Iniciante Consciente",
                  timestamp: Date.now(),
                }),
              );
            }
          }
        }

        if (refreshStats) {
          await refreshStats();
        }
      } catch (error) {
        console.error("Erro ao creditar XP das questões:", error);
      } finally {
        // Apenas abre o modal APÓS processar a resposta da API
        setShowCompletionModal(true);
      }

      setTimeout(() => setShowCompletionModal(true), 600);
    }
  };

  const handleCreateFlashcard = async (index: number) => {
    const q = questions[index];
    if (!q) return;

    setCreatingFlashcardIndex(index);
    try {
      const rawMateria = materia as unknown;
      const nomeMateria =
        typeof rawMateria === "string" && rawMateria.trim() !== ""
          ? rawMateria
          : typeof rawMateria === "object" &&
              rawMateria !== null &&
              "name" in rawMateria
            ? String((rawMateria as { name: unknown }).name)
            : "Banco de Provas";

      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.flashcardFrente || q.enunciado.replace(/\*\*/g, ""),
          answer:
            q.flashcardVerso ||
            `Gabarito: ${q.gabaritoCorreto}\n\n${q.justificativa}`,
          details: q.justificativa,
          subject: nomeMateria,
          topicId: selectedTopicId || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Erro (${res.status}) ao criar flashcard.`,
        );
      }

      setCreatedFlashcards((prev) => {
        const updated = { ...prev, [index]: true };
        localStorage.setItem("created_flashcards", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Erro ao gerar flashcard:", err);
    } finally {
      setCreatingFlashcardIndex(null);
    }
  };

  const handleToggleSaveError = (index: number) => {
    setSavedErrors((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const fetchQuizHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/questions/list");
      const json = await response.json();
      setQuizHistory(json.data || []);
    } catch (error: unknown) {
      console.error("Failed to fetch quiz history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLoadSavedQuiz = (
    savedQuestions: QuestaoIA[],
    savedBanca: string,
    id: string,
  ) => {
    setLoadingQuizId(id);

    setTimeout(() => {
      const randomizedQuestions = randomizeQuizSession(savedQuestions);

      setCurrentQuizId(id);
      setSelectedAnswers({});
      setCheckedQuestions({});
      setSavedErrors({});
      setCreatedFlashcards({});
      setShowCompletionModal(false);
      setQuestions(randomizedQuestions);
      setBanca(savedBanca);
      handleTabChange("create");
      setLoadingQuizId(null);
    }, 200);
  };

  const handleAddAlternativa = () => {
    if (alternativas.length >= 5) return;
    const proximaLetra = String.fromCharCode(65 + alternativas.length);
    setAlternativas([...alternativas, { id: proximaLetra, text: "" }]);
  };

  const handleRemoveAlternativa = () => {
    if (alternativas.length <= 2) return;
    setAlternativas(alternativas.slice(0, -1));
  };

  const handleGenerateSimulado = async (e: React.FormEvent) => {
    e.preventDefault();

    const isMateriaValid = subjects.some(
      (sub) => sub.name.trim().toLowerCase() === materia.trim().toLowerCase(),
    );

    if (!materia || !isMateriaValid) {
      alert(
        `Erro de validação: A matéria "${materia}" não foi encontrada. Verifique se as seleções foram feitas corretamente.`,
      );
      return;
    }

    const matchedTopic = availableTopics.find(
      (t) => t.id === selectedTopicId || t.title === selectedTopicId,
    );
    const topicoNome = matchedTopic ? matchedTopic.title : selectedTopicId;

    setIsGenerating(true);
    setSelectedAnswers({});
    setCheckedQuestions({});
    setSavedErrors({});
    setCreatedFlashcards({});
    setShowCompletionModal(false);
    setCurrentQuizId(null);

    try {
      const response = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banca,
          materia,
          topicoId: selectedTopicId || null,
          topicoNome: topicoNome || null,
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
        if (saveData.id) {
          setCurrentQuizId(saveData.id);
        }

        if (selectedTopicId) {
          await fetch("/api/edital/complete-suggestion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topicId: selectedTopicId,
              type: "SIMULADO_GERADO",
            }),
          }).catch((err) =>
            console.error("Erro ao consumir sugestão do dashboard:", err),
          );
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error(error);
      alert(`Erro: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* ================= HEADER ================= */}
        <div className="flex items-start justify-between border-b border-slate-900 pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={openSidebar}
              className="p-2 bg-[#090d16] border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 md:hidden transition-colors"
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
                Avalie seu rendimento em tempo real com feedbacks inteligentes.
              </p>
            </div>
          </div>

          {questions.length > 0 && activeTab === "create" && (
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-slate-100 text-xs px-3 py-2 rounded-xl transition-all font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/40"
            >
              <Sparkles size={14} />
              Novo Simulado com IA
            </button>
          )}
        </div>

        {/* ================= BARRA DE PROGRESSO & DESEMPENHO ================= */}
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
                  {correctCount} Acerto{correctCount !== 1 ? "s" : ""}
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

        {/* ================= SELETORES DE ABA COM NOMENCLATURA DINÂMICA ================= */}
        <div className="flex border-b border-slate-900 gap-2">
          <button
            onClick={() => handleTabChange("create")}
            className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 rounded-t-xl flex items-center gap-2 ${
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
            className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 rounded-t-xl flex items-center gap-2 ${
              activeTab === "history"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <History size={14} />
            Meus Simulados Salvos
          </button>
        </div>

        {/* ================= ABA 1: HUB INICIAL OU CADERNO EM RESOLUÇÃO ================= */}
        {activeTab === "create" && (
          <>
            {/* ================= HUB CENTRAL DE ENTRADA (SE NENHUM SIMULADO ESTÁ EM EXECUÇÃO) ================= */}
            {questions.length === 0 ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* CARD DE RETOMADA RÁPIDA (SESSÃO PAUSADA NO LOCALSTORAGE) */}
                {pausedSession &&
                  pausedSession.questions &&
                  pausedSession.questions.length > 0 && (
                    <div className="relative overflow-hidden bg-linear-to-r from-emerald-950/40 via-[#090d16] to-[#090d16] border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 animate-in slide-in-from-top-3 duration-300">
                      <div className="space-y-2 relative z-10 max-w-lg">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                          <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
                            Simulado em Andamento
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white">
                          {pausedSession.banca} —{" "}
                          {pausedSession.questions.length} Questões
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>
                            <strong className="text-emerald-300">
                              {
                                Object.keys(
                                  pausedSession.checkedQuestions || {},
                                ).length
                              }
                            </strong>{" "}
                            de {pausedSession.questions.length} respondidas
                          </span>
                          <span>•</span>
                          <div className="w-24 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{
                                width: `${(Object.keys(pausedSession.checkedQuestions || {}).length / pausedSession.questions.length) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto relative z-10">
                        <button
                          onClick={handleResumePausedSession}
                          className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
                        >
                          <Play size={14} className="fill-slate-950" />
                          Continuar de onde parou
                        </button>
                        <button
                          onClick={handleDiscardPausedSession}
                          className="p-2.5 bg-slate-900/80 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/40 text-slate-500 hover:text-rose-400 rounded-xl transition-all"
                          title="Descartar simulado pausado"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  )}

                {/* BANNER HERO PRINCIPAL COM GLOW E MÉTRICAS */}
                <div className="relative overflow-hidden bg-linear-to-br from-[#0c0f1d] via-[#090d16] to-[#05070c] border border-indigo-500/20 rounded-3xl p-8 shadow-[0_0_50px_-12px_rgba(79,70,229,0.15)]">
                  <div className="absolute -top-24 -left-20 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
                  <div className="absolute top-1/2 -right-20 w-72 h-72 bg-purple-600/10 rounded-full blur-[90px] pointer-events-none" />

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

                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                        Gere cadernos adaptativos configurados por IA ou retome
                        seus testes anteriores para reforçar a retenção de
                        conteúdo sem consumir cota.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 shrink-0 lg:w-72">
                      <div className="bg-[#0f1424]/60 border border-slate-800/80 backdrop-blur-sm p-4 rounded-2xl flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Simulados
                        </span>
                        <span className="text-xl font-black text-white mt-1">
                          12
                        </span>
                        <span className="text-[10px] text-emerald-400 mt-0.5 font-medium">
                          +3 esta semana
                        </span>
                      </div>

                      <div className="bg-[#0f1424]/60 border border-slate-800/80 backdrop-blur-sm p-4 rounded-2xl flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Aproveitamento
                        </span>
                        <span className="text-xl font-black text-indigo-400 mt-1">
                          78%
                        </span>
                        <span className="text-[10px] text-indigo-300/70 mt-0.5 font-medium">
                          Média global
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div
                    onClick={() => setIsAIModalOpen(true)}
                    className="group relative bg-linear-to-b from-[#0e1222]/90 to-[#090d16]/90 hover:from-[#12182e] hover:to-[#0c101d] border border-indigo-500/20 hover:border-indigo-500/50 p-7 rounded-3xl cursor-pointer transition-all duration-300 active:scale-[0.98] shadow-xl hover:shadow-[0_10px_30px_-10px_rgba(79,70,229,0.25)] flex flex-col justify-between overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />

                    <div className="space-y-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-indigo-500/10">
                        <Sparkles size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                          Novo Simulado por IA
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          Filtre por banca, disciplina, sub-tópico do edital e
                          grau de complexidade para gerar testes exclusivos sob
                          demanda.
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center gap-2 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-all relative z-10">
                      <span>Configurar Simulado</span>
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1.5 transition-transform"
                      />
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
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:border-slate-600 group-hover:text-white transition-all duration-300">
                        <History size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-slate-200 transition-colors">
                          Meus Simulados Salvos
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          Acesse cadernos criados anteriormente e treine
                          novamente com algoritmo de embaralhamento total de
                          alternativas.
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-white transition-all relative z-10">
                      <span>Ver Cadernos Salvos</span>
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1.5 transition-transform"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= BANNER HERO DO SIMULADO ATIVO ================= */
              <div className="space-y-6">
                <div className="bg-[#090d16]/90 border border-indigo-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="space-y-1 relative z-10">
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
                    }}
                    className="text-xs text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/40 bg-slate-950 px-3 py-1.5 rounded-xl transition-all self-end sm:self-auto shrink-0 active:scale-[0.98]"
                  >
                    Encerrar Caderno
                  </button>
                </div>
              </div>
            )}

            {/* LISTA DE QUESTÕES */}
            {questions.length > 0 && (
              <div className="space-y-6 pb-12">
                {questions.map((questao, index) => {
                  const respondida = checkedQuestions[index];
                  const alternativaSelecionada = selectedAnswers[index];
                  const acertou =
                    alternativaSelecionada === questao.gabaritoCorreto;
                  const isSavedError = savedErrors[index];

                  return (
                    <motion.div
                      key={`questao-card-${index}`}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`rounded-2xl p-6 border shadow-xl transition-all duration-500 relative ${
                        respondida
                          ? acertou
                            ? "bg-[#090d16]/80 border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]"
                            : "bg-[#090d16]/80 border-rose-500/30 shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)]"
                          : "bg-[#090d16]/60 border-slate-900 shadow-xl"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-3">
                        <div className="flex items-center gap-2">
                          <span>Questão {index + 1}</span>
                          <button
                            onClick={() => handleToggleSaveError(index)}
                            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[11px] ${
                              isSavedError
                                ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                                : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                            }`}
                            title="Salvar no Caderno de Erros/Favoritos"
                          >
                            {isSavedError ? (
                              <>
                                <BookmarkCheck
                                  size={13}
                                  className="text-amber-400"
                                />
                                <span className="font-bold">
                                  Salva no Caderno de Erros
                                </span>
                              </>
                            ) : (
                              <>
                                <Bookmark size={13} />
                                <span>Salvar no Caderno de Erros</span>
                              </>
                            )}
                          </button>
                        </div>

                        <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full text-[10px]">
                          {questao.formato === "multipla"
                            ? "Múltipla Escolha"
                            : "Certo / Errado"}
                        </span>
                      </div>

                      <p className="text-slate-200 text-lg font-medium mb-6 leading-relaxed whitespace-pre-line">
                        {renderEnunciado(questao.enunciado)}
                      </p>

                      <div className="space-y-3 mb-6">
                        {questao.formato === "multipla"
                          ? questao.alternativas?.map((alt) => {
                              const isSelected =
                                alternativaSelecionada === alt.id;
                              return (
                                <button
                                  key={`q-${index}-alt-${alt.id}`}
                                  disabled={respondida}
                                  onClick={() =>
                                    setSelectedAnswers((prev) => ({
                                      ...prev,
                                      [index]: alt.id,
                                    }))
                                  }
                                  className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-start gap-3 
                                  ${
                                    respondida
                                      ? alt.id === questao.gabaritoCorreto
                                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                                        : isSelected
                                          ? "bg-rose-500/10 border-rose-500 text-rose-400"
                                          : "bg-slate-950/20 border-slate-900 text-slate-600"
                                      : isSelected
                                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30"
                                        : "bg-slate-950/40 border-slate-900 hover:bg-slate-900/40 text-slate-300"
                                  }`}
                                >
                                  <span
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                                    ${isSelected ? "bg-indigo-600 text-slate-100" : "bg-slate-900 border border-slate-800 text-slate-400"}`}
                                  >
                                    {alt.id}
                                  </span>
                                  <span className="pt-0.5">{alt.texto}</span>
                                </button>
                              );
                            })
                          : ["Certo", "Errado"].map((opcao) => {
                              const isSelected =
                                alternativaSelecionada === opcao;
                              return (
                                <button
                                  key={`q-${index}-ce-${opcao}`}
                                  disabled={respondida}
                                  onClick={() =>
                                    setSelectedAnswers((prev) => ({
                                      ...prev,
                                      [index]: opcao,
                                    }))
                                  }
                                  className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all flex items-center gap-3
                                  ${
                                    respondida
                                      ? opcao === questao.gabaritoCorreto
                                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                                        : isSelected
                                          ? "bg-rose-500/10 border-rose-500 text-rose-400"
                                          : "bg-slate-950/20 border-slate-900 text-slate-600"
                                      : isSelected
                                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30"
                                        : "bg-slate-950/40 border-slate-900 hover:bg-slate-900/40 text-slate-300"
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${opcao === "Certo" ? "bg-emerald-500" : "bg-rose-500"}`}
                                  />
                                  {opcao}
                                </button>
                              );
                            })}
                      </div>

                      <div className="flex flex-col gap-4">
                        {!respondida ? (
                          <button
                            disabled={!alternativaSelecionada}
                            onClick={() => handleAnswerQuestion(index)}
                            className="w-full sm:w-auto self-end px-5 py-2 bg-slate-100 dark:bg-slate-100 text-slate-950 hover:bg-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                          >
                            Responder Questão
                          </button>
                        ) : (
                          <div className="rounded-xl p-4 animate-in fade-in duration-300 bg-slate-950/60 border border-slate-900 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-bold text-xs">
                                {acertou ? (
                                  <span className="text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 size={14} /> Você acertou!
                                  </span>
                                ) : (
                                  <span className="text-rose-400 flex items-center gap-1">
                                    <XCircle size={14} /> Resposta incorreta
                                  </span>
                                )}
                                <span className="text-slate-500 font-normal">
                                  |
                                </span>
                                <span className="text-slate-400 font-normal">
                                  Gabarito oficial:{" "}
                                  <strong className="text-slate-200 font-bold">
                                    {questao.gabaritoCorreto}
                                  </strong>
                                </span>
                              </div>

                              {!acertou && (
                                <button
                                  onClick={() => handleCreateFlashcard(index)}
                                  disabled={
                                    creatingFlashcardIndex === index ||
                                    Boolean(createdFlashcards[index])
                                  }
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-[0.98] ${
                                    createdFlashcards[index]
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-not-allowed opacity-90"
                                      : "bg-indigo-600/10 hover:bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
                                  }`}
                                >
                                  {creatingFlashcardIndex === index ? (
                                    <>
                                      <Loader2
                                        size={12}
                                        className="animate-spin"
                                      />
                                      <span>Gerando Flashcard...</span>
                                    </>
                                  ) : createdFlashcards[index] ? (
                                    <>
                                      <CheckCircle2 size={12} />
                                      <span>Flashcard Criado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <BrainCircuit
                                        size={13}
                                        className="text-indigo-400"
                                      />
                                      <span>🎴 Gerar Flashcard</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed">
                              <strong className="text-slate-300 font-semibold">
                                Justificativa teórica:
                              </strong>{" "}
                              {questao.justificativa}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ================= ABA 2: HISTÓRICO DE SIMULADOS ================= */}
        {activeTab === "history" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-slate-100 tracking-tight">
                      Histórico de Exercícios
                    </h2>
                    {!isLoadingHistory && (
                      <span className="text-[11px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full">
                        {quizHistory.length}{" "}
                        {quizHistory.length === 1 ? "caderno" : "cadernos"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Refaça seus simulados salvos de forma 100% gratuita sem
                    consumir sua cota diária de IA.
                  </p>
                </div>
              </div>

              {!isLoadingHistory && quizHistory.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                      <Search size={15} />
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por banca, matéria, tópico ou dificuldade..."
                      className="w-full bg-[#090d16]/80 border border-slate-800/80 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
                    />
                  </div>

                  <div className="relative w-full sm:w-auto shrink-0">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full sm:w-auto bg-[#090d16]/80 border border-slate-800/80 focus:border-indigo-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none cursor-pointer transition-all appearance-none pr-8 font-medium"
                    >
                      <option value="newest">Mais recentes</option>
                      <option value="oldest">Mais antigos</option>
                      <option value="subject">Por Matéria (A-Z)</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 text-xs">
                <Loader2 size={24} className="animate-spin text-indigo-400" />
                <span>Buscando registros no banco de dados...</span>
              </div>
            ) : quizHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl my-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  Nenhum simulado salvo ainda
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-5">
                  Gere novos cadernos de questões para treinar. Seus simulados
                  concluídos ou salvos aparecerão listados aqui automaticamente.
                </p>
                <button
                  onClick={() => {
                    setQuestions([]);
                    setSelectedAnswers({});
                    setCheckedQuestions({});
                    setCurrentQuizId(null);
                    handleTabChange("create");
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-98"
                >
                  Criar meu primeiro simulado
                </button>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <p className="text-xs text-slate-400">
                  Nenhum simulado encontrado para &quot;
                  <span className="text-slate-200 font-medium">
                    {searchTerm}
                  </span>
                  &quot;.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 items-start">
                {filteredHistory.map((item) => {
                  const questionsArray = Array.isArray(item.questions)
                    ? item.questions
                    : [];
                  const formattedDate = new Date(
                    item.createdAt,
                  ).toLocaleDateString("pt-BR");

                  return (
                    <div
                      key={`quiz-history-${item.id}`}
                      className="relative overflow-hidden bg-[#090d16]/90 border border-slate-800/80 hover:border-indigo-500/40 p-5 rounded-2xl shadow-xl flex flex-col justify-between hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.15)] transition-all duration-300 group"
                    >
                      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-inner">
                            {item.banca}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                            <Calendar size={12} className="text-slate-600" />
                            {formattedDate}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-bold text-slate-100 text-base line-clamp-1 group-hover:text-indigo-300 transition-colors tracking-tight">
                            {item.subject}
                          </h3>

                          {item.topic?.title && (
                            <div className="flex items-center">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 max-w-full">
                                <FileText
                                  size={11}
                                  className="shrink-0 text-indigo-400"
                                />
                                <span className="truncate">
                                  {item.topic.title}
                                </span>
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800/80 text-[11px] text-slate-300 font-medium">
                              <Layers size={11} className="text-indigo-400" />
                              {item.difficulty}
                            </span>

                            <span className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800/80 text-[11px] text-slate-300 font-medium">
                              <HelpCircle
                                size={11}
                                className="text-indigo-400"
                              />
                              {questionsArray.length} questões
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 relative z-10 pt-3 border-t border-slate-800/60">
                        {confirmingDeleteId === item.id ? (
                          <div className="bg-rose-950/20 border border-rose-500/30 p-2 rounded-xl flex items-center justify-between gap-2 animate-in fade-in duration-200">
                            <span className="text-[11px] text-rose-300 font-medium pl-1">
                              Excluir simulado?
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleRemoverSimulado(item.id)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-slate-100 text-[11px] font-bold rounded-lg transition-all"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setConfirmingDeleteId(null)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-all"
                              >
                                Não
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleLoadSavedQuiz(
                                  questionsArray,
                                  item.banca,
                                  item.id,
                                )
                              }
                              disabled={loadingQuizId === item.id}
                              className="flex-1 flex items-center justify-center gap-1.5 text-center py-2.5 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/35 hover:border-indigo-500/60 text-indigo-200 text-xs font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm group/btn"
                            >
                              {loadingQuizId === item.id ? (
                                <>
                                  <Loader2
                                    size={14}
                                    className="animate-spin text-indigo-400"
                                  />
                                  <span>Carregando...</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-amber-400 group-hover/btn:scale-110 transition-transform">
                                    ⚡
                                  </span>
                                  <span>Refazer Caderno (Grátis)</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => setConfirmingDeleteId(item.id)}
                              className="p-2.5 bg-slate-900/80 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/50 text-slate-500 hover:text-rose-400 rounded-xl transition-all shrink-0"
                              title="Excluir simulado"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= MODAL 1: CRIAR MANUAL ================= */}
        {isManualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 scrollbar-none">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <Plus size={18} className="text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-200">
                    Criar Questão Customizada
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Monte sua própria base de dados de treino com total
                    controle.
                  </p>
                </div>
              </div>
              <form className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                      Vincular à Matéria
                    </label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200">
                      {subjects.map((sub) => (
                        <option key={`man-sub-${sub.id}`} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                      Formato da Resposta
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl h-9.5 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setTipoFormato("multipla");
                          setAlternativaCorreta("A");
                        }}
                        className={`py-1 rounded-lg font-bold transition-all text-center ${tipoFormato === "multipla" ? "bg-indigo-600 text-slate-100" : "text-slate-400"}`}
                      >
                        Múltipla Escolha
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipoFormato("certo_errado");
                          setAlternativaCorreta("Certo");
                        }}
                        className={`py-1 rounded-lg font-bold transition-all text-center ${tipoFormato === "certo_errado" ? "bg-indigo-600 text-slate-100" : "text-slate-400"}`}
                      >
                        Certo / Errado
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                    Enunciado da Questão
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Escreva o caso, lei ou pergunta da questão aqui..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 resize-none"
                  />
                </div>
                <div className="space-y-2 border-t border-slate-900 pt-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                      Opções e Gabarito Alvo
                    </label>
                    {tipoFormato === "multipla" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleRemoveAlternativa}
                          disabled={alternativas.length <= 2}
                          className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-slate-400 disabled:opacity-30"
                        >
                          - Remover
                        </button>
                        <button
                          type="button"
                          onClick={handleAddAlternativa}
                          disabled={alternativas.length >= 5}
                          className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-indigo-400 disabled:opacity-30"
                        >
                          + Adicionar
                        </button>
                      </div>
                    )}
                  </div>
                  {tipoFormato === "multipla" ? (
                    <div className="space-y-2">
                      {alternativas.map((alt) => (
                        <div
                          key={`manual-alt-${alt.id}`}
                          className="flex items-center gap-3 bg-slate-950/50 border border-slate-900 rounded-xl p-2"
                        >
                          <input
                            type="radio"
                            name="gabarito_manual"
                            checked={alternativaCorreta === alt.id}
                            onChange={() => setAlternativaCorreta(alt.id)}
                            className="w-4 h-4 accent-indigo-500 cursor-pointer"
                          />
                          <span className="font-mono font-bold text-indigo-400">
                            {alt.id})
                          </span>
                          <input
                            type="text"
                            placeholder={`Texto da alternativa ${alt.id}...`}
                            className="bg-transparent border-0 w-full text-slate-200 focus:outline-hidden p-0"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {["Certo", "Errado"].map((opcao) => (
                        <label
                          key={`manual-ce-${opcao}`}
                          className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer ${alternativaCorreta === opcao ? "bg-indigo-600/10 border-indigo-500 text-indigo-300" : "bg-slate-950/50 border-slate-900"}`}
                        >
                          <input
                            type="radio"
                            name="gabarito_cebraspe"
                            checked={alternativaCorreta === opcao}
                            onChange={() => setAlternativaCorreta(opcao)}
                            className="w-4 h-4 accent-indigo-500"
                          />
                          <span className="font-bold">{opcao}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 border-t border-slate-900 pt-3">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                    Justificativa do Gabarito (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Insira o embasamento legal..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 resize-none"
                  />
                </div>
                <button
                  type="button"
                  className="w-full bg-indigo-600 text-slate-100 py-3 rounded-xl font-bold active:scale-[0.98]"
                >
                  Salvar Questão no Banco
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL 2: GERAR COM IA ================= */}
        {isAIModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 scrollbar-none">
              <button
                onClick={() => !isGenerating && setIsAIModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors"
                disabled={isGenerating}
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-3.5 border-b border-slate-900 pb-3.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl animate-pulse">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-200">
                    Gerador Cognitivo por IA
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configure o escopo e o motor neural para simular sua prova.
                  </p>
                </div>
              </div>
              <form
                onSubmit={handleGenerateSimulado}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Target size={12} className="text-indigo-400" /> Banca
                      Alvo
                    </label>
                    <select
                      value={banca}
                      onChange={(e) => setBanca(e.target.value)}
                      disabled={isGenerating}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 cursor-pointer"
                    >
                      <option value="Cebraspe">Cebraspe</option>
                      <option value="FGV">FGV</option>
                      <option value="FCC">FCC</option>
                      <option value="IBAM">IBAM</option>
                      <option value="Vunesp">Vunesp</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <BookOpen size={12} className="text-indigo-400" /> Matéria
                      Principal
                    </label>
                    <select
                      value={materia}
                      onChange={(e) => {
                        setMateria(e.target.value);
                        setSelectedTopicId("");
                      }}
                      disabled={isGenerating}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 cursor-pointer"
                    >
                      {subjects.length > 0 ? (
                        subjects.map((sub) => (
                          <option key={`sub-${sub.id}`} value={sub.name}>
                            {sub.name}
                          </option>
                        ))
                      ) : (
                        <option value={materia}>
                          {materia || "Carregando..."}
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-900 pt-3.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <FileText size={12} className="text-indigo-400" /> Tópico
                    Específico (Opcional)
                  </label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    disabled={isGenerating || availableTopics.length === 0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 cursor-pointer disabled:opacity-50"
                  >
                    <option value="">
                      {availableTopics.length === 0
                        ? "Nenhum tópico encontrado nesta matéria"
                        : "Todos os Tópicos da Matéria"}
                    </option>
                    {availableTopics.map((top, index) => {
                      const topicKey = top.id
                        ? `top-${top.id}`
                        : `top-idx-${index}-${top.title}`;
                      const topicValue = top.id || top.title;

                      return (
                        <option key={topicKey} value={topicValue}>
                          {top.title}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1.5 border-t border-slate-900 pt-3.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                    Origem do Conteúdo da IA
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl h-9.5 items-center">
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setFonteConteudo("banca")}
                      className={`py-1 rounded-lg font-bold text-[10px] transition-all text-center ${fonteConteudo === "banca" ? "bg-indigo-600 text-slate-100" : "text-slate-400"}`}
                    >
                      Histórico da Banca
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setFonteConteudo("texto")}
                      className={`py-1 rounded-lg font-bold text-[10px] transition-all text-center ${fonteConteudo === "texto" ? "bg-indigo-600 text-slate-100" : "text-slate-400"}`}
                    >
                      Colar Texto/Lei
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setFonteConteudo("pdf")}
                      className={`py-1 rounded-lg font-bold text-[10px] transition-all text-center ${fonteConteudo === "pdf" ? "bg-indigo-600 text-slate-100" : "text-slate-400"}`}
                    >
                      Upload de PDF
                    </button>
                  </div>
                </div>

                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  {fonteConteudo === "banca" && (
                    <p className="text-[11px] text-slate-500 bg-slate-950/40 border border-slate-900 rounded-xl p-3">
                      💡 A IA irá mapear o banco de dados público de concursos
                      para prever e projetar tendências.
                    </p>
                  )}
                  {fonteConteudo === "texto" && (
                    <textarea
                      rows={3}
                      value={textoBase}
                      onChange={(e) => setTextoBase(e.target.value)}
                      disabled={isGenerating}
                      placeholder="Cole aqui o artigo da lei..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 resize-none"
                    />
                  )}
                  {fonteConteudo === "pdf" && (
                    <div className="border border-dashed border-slate-800 bg-slate-950/30 rounded-xl p-5 text-center cursor-pointer text-slate-300 font-semibold text-[11px]">
                      Arraste seu PDF ou clique para buscar
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 border-t border-slate-900 pt-3.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                    Nível de Dificuldade
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Fácil", "Média", "Difícil", "Aleatória"].map((nivel) => (
                      <button
                        key={`diff-${nivel}`}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => setDificuldade(nivel)}
                        className={`py-2 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all active:scale-[0.98] ${dificuldade === nivel ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        {nivel}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-900 pt-3.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                    Volume do Simulado
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["5", "10", "15", "20"].map((num) => (
                      <button
                        key={`qtd-${num}`}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => setQtdQuestoes(num)}
                        className={`py-2 rounded-xl border font-bold transition-all active:scale-[0.98] ${qtdQuestoes === num ? "bg-indigo-600/20 border-indigo-500 text-indigo-400" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        {num} Q
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-slate-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all shadow-lg shadow-indigo-950/40"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Sincronizando sinapses...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Gerar Simulado Inédito</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL 3: DIAGNÓSTICO COGNITIVO FINAL (COM GAMIFICAÇÃO PERFEITA) ================= */}
      {showCompletionModal &&
        (() => {
          const isPerfect =
            totalQuestions > 0 && correctCount === totalQuestions;

          // Dispara confetes se gabaritou
          if (isPerfect && typeof window !== "undefined") {
            import("canvas-confetti").then((confetti) => {
              confetti.default({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
              });
            });
          }

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
              <div
                className={`bg-[#090d16] border rounded-3xl p-7 max-w-lg w-full shadow-2xl relative text-center space-y-6 animate-in zoom-in-95 duration-200 ${
                  isPerfect
                    ? "border-amber-500/40 shadow-[0_0_50px_-10px_rgba(245,158,11,0.25)]"
                    : "border-slate-800"
                }`}
              >
                {/* ÍCONE / TROFÉU COM GLOW DINÂMICO */}
                <div className="relative inline-block mx-auto">
                  {isPerfect && (
                    <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl animate-pulse" />
                  )}
                  <div
                    className={`w-20 h-20 rounded-full border flex items-center justify-center relative z-10 transition-transform hover:scale-105 ${
                      isPerfect
                        ? "bg-linear-to-tr from-amber-500/20 via-amber-400/10 to-yellow-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/20"
                        : "bg-linear-to-tr from-indigo-500/20 to-emerald-500/20 border-indigo-500/30 text-indigo-400"
                    }`}
                  >
                    <Trophy
                      size={38}
                      className={
                        isPerfect
                          ? "text-amber-400 animate-bounce"
                          : "text-indigo-400"
                      }
                    />
                  </div>
                </div>

                {/* HEADER DINÂMICO */}
                <div className="space-y-1">
                  {isPerfect ? (
                    <>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-block">
                        🏆 Desempenho Impecável
                      </span>
                      <h3 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-r from-amber-200 via-amber-400 to-yellow-500 pt-2">
                        GABARITO PERFEITO!
                      </h3>
                    </>
                  ) : (
                    <h3 className="text-xl font-bold text-slate-100">
                      Simulado Concluído!
                    </h3>
                  )}
                  <p className="text-xs text-slate-400">
                    Análise sintética de desempenho gerada pelo Synapse AI.
                  </p>
                </div>

                {/* GRID DE MÉTRICAS */}
                <div className="grid grid-cols-4 gap-2.5 bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl text-center shadow-inner items-stretch">
                  <div className="flex flex-col justify-center">
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      Total
                    </span>
                    <span className="text-base font-bold text-slate-200 font-mono mt-0.5">
                      {totalQuestions}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center">
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      Acertos
                    </span>
                    <span className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                      {correctCount}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center">
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      Taxa
                    </span>
                    <span
                      className={`text-base font-bold font-mono mt-0.5 ${
                        isPerfect ? "text-amber-400" : "text-indigo-400"
                      }`}
                    >
                      {percentageAcc}%
                    </span>
                  </div>

                  {/* CARD DE XP DESTACADO */}
                  <div
                    className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all ${
                      isPerfect
                        ? "bg-amber-500/10 border border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]"
                        : ""
                    }`}
                  >
                    <span className="block text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      XP Ganho
                    </span>
                    <span className="text-base font-black text-amber-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                      <span className="text-orange-400">⚡</span> +
                      {lastEarnedXp}
                    </span>

                    {/* BADGE DE BÔNUS MAIOR E MAIS LEGÍVEL */}
                    {isPerfect && (
                      <span className="mt-1.5 bg-linear-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.7)] border border-amber-200 animate-bounce tracking-wider whitespace-nowrap">
                        🔥 BÔNUS 25%
                      </span>
                    )}
                  </div>
                </div>

                {/* 🟣 BANNER DE LEVEL UP (COLOCAR AQUI) */}
                {levelUpData?.leveledUp && (
                  <div className="relative overflow-hidden bg-linear-to-r from-purple-900/50 via-indigo-900/50 to-purple-900/50 border border-purple-500/50 p-4 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.3)] animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl animate-bounce">🎉</span>
                      <div className="text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 block">
                          LEVEL UP ALCANÇADO!
                        </span>
                        <h4 className="text-base font-black text-white tracking-tight">
                          Você subiu para o{" "}
                          <span className="text-purple-400">
                            Nível {levelUpData.newLevel}
                          </span>
                          ! 🚀
                        </h4>
                      </div>
                    </div>
                  </div>
                )}

                {/* DIAGNÓSTICO COGNITIVO */}
                <p
                  className={`text-xs p-3.5 rounded-2xl leading-relaxed text-left border ${
                    isPerfect
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-200/90"
                      : "bg-indigo-500/10 border-indigo-500/20 text-slate-300"
                  }`}
                >
                  🧠{" "}
                  <strong
                    className={isPerfect ? "text-amber-300" : "text-indigo-300"}
                  >
                    Diagnóstico Cognitivo:
                  </strong>{" "}
                  {isPerfect
                    ? "Domínio absoluto do conteúdo! Você gabaritou todas as questões com precisão cirúrgica."
                    : percentageAcc >= 80
                      ? "Excelente domínio do assunto! Seu percentual de retenção atinge patamares de aprovação no topo das bancas."
                      : percentageAcc >= 50
                        ? "Bom rendimento, porém há pontos de atenção. Recomendamos criar Flashcards das questões incorretas para fixação."
                        : "Taxa de retenção abaixo do ideal. Recomendamos revisar a teoria base e praticar novo simulado focado."}
                </p>

                {/* SINCRONIZAÇÃO SM-2 */}
                <div className="flex items-center justify-between text-[11px] font-mono bg-slate-950 border border-slate-800/80 px-4 py-2.5 rounded-xl text-slate-400 shadow-inner">
                  <span className="flex items-center gap-2">
                    {isSyncingSM2 ? (
                      <Loader2
                        size={12}
                        className="animate-spin text-indigo-400"
                      />
                    ) : (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    )}
                    Sincronização SM-2:
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {isSyncingSM2
                      ? "Calculando novo espaçamento..."
                      : isPerfect
                        ? "Revisão estendida ao máximo! 🚀"
                        : percentageAcc >= 70
                          ? "Próxima revisão estendida pelo algoritmo 🚀"
                          : "Revisão priorizada na grade de amanhã ⚠️"}
                  </span>
                </div>

                {/* BOTOES DE AÇÃO */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedAnswers({});
                      setCheckedQuestions({});
                      setShowCompletionModal(false);
                    }}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <RotateCcw size={14} />
                    Refazer Agora
                  </button>
                  <button
                    onClick={() => setShowCompletionModal(false)}
                    className={`flex-1 py-3 text-slate-100 text-xs font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] ${
                      isPerfect
                        ? "bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-950/40 text-slate-950 font-black"
                        : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/40"
                    }`}
                  >
                    Revisar Respostas
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ================= MODAL NAVEGAÇÃO PENDENTE ================= */}
      {pendingTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 className="text-base font-semibold text-slate-100 mb-2">
              Deseja sair do simulado atual?
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Você tem respostas marcadas no seu caderno atual. Se mudar para o
              histórico agora, o progresso não salvo será perdido.
            </p>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={cancelNavigation}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl transition-all active:scale-[0.98]"
              >
                Continuar respondendo
              </button>
              <button
                onClick={confirmNavigation}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl transition-all active:scale-[0.98]"
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
