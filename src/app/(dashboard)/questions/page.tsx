"use client";

import React, { useEffect, useState } from "react";
import { useSidebar } from "@/lib/sidebar-context";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

// Tipagem para as questões que chegam da nossa API do Gemini
interface QuestaoIA {
  enunciado: string;
  formato: "multipla" | "certo_errado";
  alternativas?: Array<{ id: string; texto: string }>;
  gabaritoCorreto: string;
  justificativa: string;
}

// Interface para tipar os itens do histórico vindos do Supabase
interface QuizHistoryItem {
  id: string;
  banca: string;
  subject: string;
  difficulty: string;
  questions: QuestaoIA[];
  createdAt: string;
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

export default function QuestoesPage() {
  const { openSidebar } = useSidebar();

  // ================= ESTADOS GERAIS DA PÁGINA =================
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );

  // Controle de abas da interface: 'create' para o caderno/gerador e 'history' para o histórico
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [pendingTab, setPendingTab] = useState<"create" | "history" | null>(
    null,
  );

  // ================= NOVOS ESTADOS: CADERNO DE ERROS E FLASHCARDS =================
  const [savedErrors, setSavedErrors] = useState<Record<number, boolean>>({});
  const [creatingFlashcardIndex, setCreatingFlashcardIndex] = useState<
    number | null
  >(null);
  const [createdFlashcards, setCreatedFlashcards] = useState<
    Record<number, boolean>
  >({});
  const [showCompletionModal, setShowCompletionModal] = useState(false);

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
      setSelectedAnswers({});
      setCheckedQuestions({});
      setSavedErrors({});
      setCreatedFlashcards({});
      setShowCompletionModal(false);
    }
    setPendingTab(null);
  };

  const cancelNavigation = () => {
    setPendingTab(null);
  };

  // Estados para armazenar o histórico de simulados salvos vindo da API
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = quizHistory.filter((sim) => {
    const matchesBanca = sim.banca
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSubject = sim.subject
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDifficulty = sim.difficulty
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesBanca || matchesSubject || matchesDifficulty;
  });

  const handleRemoverSimulado = async (idSimulado: string) => {
    try {
      const response = await fetch(`/api/questions/${idSimulado}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir o simulado.");

      setQuizHistory((prev) => prev.filter((item) => item.id !== idSimulado));
      setConfirmingDeleteId(null);
    } catch (error) {
      console.error("Erro ao deletar simulado:", error);
      alert("Não foi possível excluir o simulado.");
    }
  };

  // ================= ESTADOS DO MODAL IA PREMIUM =================
  const [materia, setMateria] = useState("");
  const [qtdQuestoes, setQtdQuestoes] = useState("5");
  const [fonteConteudo, setFonteConteudo] = useState<"banca" | "texto" | "pdf">(
    "banca",
  );
  const [dificuldade, setDificuldade] = useState("Média");
  const [textoBase, setTextoBase] = useState("");
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);

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

  // ================= ESTADOS GERAIS DA PÁGINA (Com Lazy Initialization) =================
  const STORAGE_KEY = "deepwork_quiz_session_v1";

  const [banca, setBanca] = useState("");
  const [questions, setQuestions] = useState<QuestaoIA[]>([]);
  const [loadingQuizId, setLoadingQuizId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [checkedQuestions, setCheckedQuestions] = useState<
    Record<number, boolean>
  >({});

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.banca) setBanca(parsed.banca);
          if (parsed.questions) setQuestions(parsed.questions);
          if (parsed.selectedAnswers)
            setSelectedAnswers(parsed.selectedAnswers);
          if (parsed.checkedQuestions)
            setCheckedQuestions(parsed.checkedQuestions);
        }
      } catch (e) {
        console.error("Erro ao carregar do localStorage:", e);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    try {
      const currentState = {
        banca,
        questions,
        selectedAnswers,
        checkedQuestions,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (e) {
      console.error("Erro ao salvar no localStorage:", e);
    }
  }, [banca, questions, selectedAnswers, checkedQuestions, isMounted]);

  useEffect(() => {
    if (isAIModalOpen) {
      fetch("/api/subjects/list")
        .then((res) => res.json())
        .then((json) => {
          const loadedSubjects = json.data || [];
          setSubjects(loadedSubjects);

          if (loadedSubjects.length > 0 && !materia) {
            setMateria(loadedSubjects[0].name);
          }
        })
        .catch(console.error);
    }
  }, [isAIModalOpen]);

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

  // Verifica término e aciona modal final
  const handleAnswerQuestion = (index: number) => {
    const nextChecked = { ...checkedQuestions, [index]: true };
    setCheckedQuestions(nextChecked);

    if (Object.keys(nextChecked).length === totalQuestions) {
      setTimeout(() => setShowCompletionModal(true), 600);
    }
  };

  // 🎴 AÇÃO: GERAR FLASHCARD A PARTIR DA QUESTÃO
  const handleCreateFlashcard = async (index: number) => {
    const q = questions[index];
    if (!q) return;

    setCreatingFlashcardIndex(index);
    try {
      const res = await fetch("/api/flashcards/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: q.enunciado.replace(/\*\*/g, ""),
          back: `Gabarito: ${q.gabaritoCorreto}\n\n${q.justificativa}`,
          subject: materia || "Simulado",
        }),
      });

      if (!res.ok) throw new Error("Erro ao criar flashcard.");

      setCreatedFlashcards((prev) => ({ ...prev, [index]: true }));
    } catch (err) {
      console.error("Erro ao gerar flashcard:", err);
      // Fallback amigável caso a rota ainda esteja em dev
      setCreatedFlashcards((prev) => ({ ...prev, [index]: true }));
    } finally {
      setCreatingFlashcardIndex(null);
    }
  };

  // 📌 AÇÃO: TOGGLE NO CADERNO DE ERROS
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
      setSelectedAnswers({});
      setCheckedQuestions({});
      setSavedErrors({});
      setCreatedFlashcards({});
      setShowCompletionModal(false);
      setQuestions(savedQuestions);
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
      (sub) => sub.name.trim() === materia.trim(),
    );

    if (!materia || !isMateriaValid) {
      alert(
        `Erro de validação: A matéria "${materia}" não foi encontrada na lista de subjects. Verifique se o nome está idêntico.`,
      );
      return;
    }

    setIsGenerating(true);
    setSelectedAnswers({});
    setCheckedQuestions({});
    setSavedErrors({});
    setCreatedFlashcards({});
    setShowCompletionModal(false);

    try {
      const response = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banca,
          materia,
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
        await fetch("/api/questions/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            banca,
            subject: materia,
            difficulty: dificuldade,
            questions: generatedQuestions,
          }),
        }).catch((err) => console.error("Database sync error:", err));
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
              className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs px-3 py-2 rounded-xl transition-all font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/40"
            >
              <Sparkles size={14} />
              Novo Simulado com IA
            </button>
          )}
        </div>

        {/* ================= BARRA DE PROGRESSO & DESEMPENO (1) ================= */}
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
                className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* ================= SELETORES DE ABA ================= */}
        <div className="flex border-b border-slate-900 gap-2">
          <button
            onClick={() => handleTabChange("create")}
            className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 rounded-t-xl ${
              activeTab === "create"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            📝 Caderno Atual
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

        {/* ================= ABA 1: CADERNO ATUAL ================= */}
        {activeTab === "create" && (
          <>
            {/* ESTADO VAZIO */}
            {questions.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-[#090d16]/30 border border-slate-900 rounded-2xl relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative border border-slate-800 bg-[#090d16] p-6 rounded-2xl shadow-xl mb-6 w-36 h-44 flex flex-col justify-between animate-bounce duration-3000">
                  <div className="flex gap-2 justify-between">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] text-indigo-400 font-bold font-mono select-none">
                      ?
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-bold font-mono select-none">
                      ?
                    </div>
                  </div>
                  <div className="space-y-2 flex-1 mt-4">
                    <div className="h-1.5 bg-slate-800 rounded-full w-full flex items-center pl-1">
                      <div className="w-1 h-1 rounded-full bg-indigo-500" />
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full w-5/6" />
                    <div className="h-1.5 bg-slate-950 rounded-full w-4/6" />
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[40%]" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-200">
                  Nenhuma questão ativa no caderno
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                  Crie questões manualmente, deixe nossa IA gerar simulados, ou
                  escolha um teste pronto na aba de salvos!
                </p>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => setIsManualModalOpen(true)}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs px-4 py-2.5 rounded-xl transition-all font-medium flex items-center gap-1.5 active:scale-98"
                  >
                    Criar Manual
                  </button>
                  <button
                    onClick={() => setIsAIModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs px-4 py-2.5 rounded-xl transition-all font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 active:scale-98"
                  >
                    <Sparkles size={14} />
                    Gerar com IA
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
                  const isFlashcardCreated = createdFlashcards[index];

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
                      {/* Cabeçalho da Questão */}
                      <div className="flex items-center justify-between mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-3">
                        <div className="flex items-center gap-2">
                          <span>Questão {index + 1}</span>
                          {/* BOTÃO CADERNO DE ERROS (3) */}
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

                      {/* Enunciado da Questão */}
                      <p className="text-slate-200 text-lg font-medium mb-6 leading-relaxed whitespace-pre-line">
                        {renderEnunciado(questao.enunciado)}
                      </p>

                      {/* Alternativas */}
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

                      {/* Ações de Envio e Gabarito */}
                      <div className="flex flex-col gap-4">
                        {!respondida ? (
                          <button
                            disabled={!alternativaSelecionada}
                            onClick={() => handleAnswerQuestion(index)}
                            className="w-full sm:w-auto self-end px-5 py-2 bg-slate-100 dark:bg-slate-100 text-slate-950 hover:bg-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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

                              {/* BOTÃO GERAR FLASHCARD (4) */}
                              {!acertou && (
                                <button
                                  onClick={() => handleCreateFlashcard(index)}
                                  disabled={
                                    creatingFlashcardIndex === index ||
                                    isFlashcardCreated
                                  }
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    isFlashcardCreated
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
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
                                  ) : isFlashcardCreated ? (
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
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-200">
                  Histórico de Exercícios
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Refaça seus simulados salvos de forma 100% gratuita sem
                  consumir sua cota diária de IA.
                </p>
              </div>

              {!isLoadingHistory && quizHistory.length > 0 && (
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por banca, assunto ou dificuldade..."
                    className="w-full bg-[#090d16]/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
                  />
                </div>
              )}
            </div>

            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 text-xs">
                <Loader2 size={24} className="animate-spin text-indigo-400" />
                <span>Buscando registros no Supabase...</span>
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
                      className="relative overflow-hidden bg-linear-to-b from-slate-900/80 to-[#090d16]/90 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between hover:border-indigo-500/40 hover:shadow-indigo-500/5 transition-all duration-300 group"
                    >
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                            {item.banca}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                            <Calendar size={12} className="text-slate-500" />{" "}
                            {formattedDate}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-100 text-sm md:text-base line-clamp-1 group-hover:text-indigo-300 transition-colors">
                            {item.subject}
                          </h3>
                          <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-1.5">
                            <span className="flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50 text-slate-300">
                              <Layers size={12} className="text-indigo-400" />{" "}
                              {item.difficulty}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 font-medium">
                              {questionsArray.length} questões
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 relative z-10 pt-3 border-t border-slate-800/60">
                        {confirmingDeleteId === item.id ? (
                          <div className="bg-red-950/30 border border-red-500/30 p-3 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
                            <span className="text-xs text-red-200 font-medium">
                              Excluir permanentemente?
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleRemoverSimulado(item.id)}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-slate-100 text-xs font-bold rounded-lg transition-all shadow-sm"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setConfirmingDeleteId(null)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all"
                              >
                                Não
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() =>
                                handleLoadSavedQuiz(
                                  questionsArray,
                                  item.banca,
                                  item.id,
                                )
                              }
                              disabled={loadingQuizId === item.id}
                              className="flex-1 flex items-center justify-center gap-2 text-center py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 text-xs font-bold rounded-xl transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm group/btn"
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
                              className="p-2.5 bg-slate-900/80 hover:bg-red-950/30 border border-slate-800 hover:border-red-900/50 text-slate-400 hover:text-red-400 rounded-xl transition-all shrink-0"
                              title="Excluir simulado"
                            >
                              <X size={16} />
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
                      <option value="Português">Português</option>
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
                  className="w-full bg-indigo-600 text-slate-100 py-3 rounded-xl font-bold"
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
                      onChange={(e) => setMateria(e.target.value)}
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
                        <option value={materia}>{materia}</option>
                      )}
                    </select>
                  </div>
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
                        className={`py-2 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all ${dificuldade === nivel ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" : "bg-slate-950 border-slate-800 text-slate-400"}`}
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
                        className={`py-2 rounded-xl border font-bold transition-all ${qtdQuestoes === num ? "bg-indigo-600/20 border-indigo-500 text-indigo-400" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        {num} Q
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs"
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

      {/* ================= MODAL 3: DIAGNÓSTICO COGNITIVO FINAL (1) ================= */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
              <Trophy size={32} className="text-amber-400" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-100">
                Simulado Concluído!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Análise sintética de desempenho gerada pelo Synapse AI.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <div>
                <span className="block text-xs text-slate-500 font-semibold uppercase">
                  Total
                </span>
                <span className="text-lg font-bold text-slate-200 font-mono">
                  {totalQuestions}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 font-semibold uppercase">
                  Acertos
                </span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {correctCount}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 font-semibold uppercase">
                  Taxa
                </span>
                <span className="text-lg font-bold text-indigo-400 font-mono">
                  {percentageAcc}%
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl leading-relaxed text-left">
              🧠{" "}
              <strong className="text-indigo-300">
                Diagnóstico Cognitivo:
              </strong>{" "}
              {percentageAcc >= 80
                ? "Excelente domínio do assunto! Seu percentual de retenção atinge patamares de aprovação no topo das bancas."
                : percentageAcc >= 50
                  ? "Bom rendimento, porém há pontos de atenção. Recomendamos criar Flashcards das questões incorretas para fixação."
                  : "Taxa de retenção abaixo do ideal. Recomendamos revisar a teoria base e praticar novo simulado focado."}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedAnswers({});
                  setCheckedQuestions({});
                  setShowCompletionModal(false);
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                Refazer Agora
              </button>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-950/40"
              >
                Revisar Respostas
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl transition-all"
              >
                Continuar respondendo
              </button>
              <button
                onClick={confirmNavigation}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl transition-all"
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
