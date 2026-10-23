"use client";

import { useSearchParams } from "next/navigation";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ErrorNotebookFilters,
  ErrorNotebookItem,
  ErrorNotebookMetrics,
  Question,
} from "@/types/quiz";
import { ErrorMetricsHeader } from "./ErrorMetricsHeader";
import { ErrorFiltersBar } from "./ErrorFiltersBar";
import { ErrorCard } from "./ErrorCard";
import { RemediationQuizModal } from "./RemediationQuizModal";
import { RedemptionExamModal } from "./RedemptionExamModal";
import { PrintableErrorBookModal } from "./PrintableErrorBookModal";
import {
  getErrorNotebookQuestionsAction,
  getErrorMetricsAction,
  batchClassifyTaxonomyOnlyAction,
  generateRedemptionExamAction,
  generateDirectRevengeExamAction,
  RedemptionExamQuestion,
  convertErrorToFlashcardAction,
} from "@/actions/error-notebook-actions";
import { convertBatchErrorsToFlashcardsAction } from "@/actions/error-flashcard-actions";
import {
  triggerOptimisticEnergyConsumption,
  triggerSynapticExhaustion,
  triggerAiQuotaRefresh,
} from "@/lib/quota-events";
import { triggerHaptic } from "@/lib/sensory/haptics";
import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle2,
  FileStack,
  Loader2,
  ArrowRight,
  Zap,
  HelpCircle,
  Brain,
  Sparkles,
  ShieldCheck,
  Flame,
  RotateCcw,
  Target,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import Link from "next/link";
import {
  PageSpotlightBanner,
  useSpotlight,
} from "@/components/onboarding/PageSpotlightBanner";

export interface SubjectOption {
  id: string;
  name: string;
  color?: string | null;
}

export interface ErrorNotebookViewProps {
  initialItems?: ErrorNotebookItem[];
  initialMetrics: ErrorNotebookMetrics;
  subjects: SubjectOption[];
}

export function ErrorNotebookView({
  initialItems,
  initialMetrics,
  subjects,
}: ErrorNotebookViewProps) {
  const spotlight = useSpotlight("synapse_spotlight_notebook");

  // Estado de Paginação (lotes de 10 em 10)
  const [questions, setQuestions] = useState<Question[]>(initialItems || []);
  const searchParams = useSearchParams();

  useEffect(() => {
    const shouldOpenRevenge = searchParams.get("openRevenge") === "1";
    if (shouldOpenRevenge && !isRedemptionOpen && !isGeneratingDirectRevenge) {
      handleStartDirectRevenge(10);
    }
  }, [searchParams]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Estados de Métricas e Filtros
  const [metrics, setMetrics] = useState<ErrorNotebookMetrics>(initialMetrics);
  const [filters, setFilters] = useState<ErrorNotebookFilters>({
    subjectId: "ALL",
    errorReason: "ALL",
    status: "ALL",
    period: "all",
    search: "",
    origin: "ALL",
  });
  const [isFiltering, setIsFiltering] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isRemediationOpen, setIsRemediationOpen] = useState(false);
  const [isCreatingBatchFlashcards, setIsCreatingBatchFlashcards] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportModalInitialTab, setExportModalInitialTab] = useState<"print" | "anki">("print");

  // Modo de visualização: Lista espaçada vs Modo Foco (1 por 1)
  const [viewMode, setViewMode] = useState<"list" | "focus">("list");
  const [focusIndex, setFocusIndex] = useState<number>(0);

  // Garante que focusIndex esteja dentro do range de questões
  useEffect(() => {
    if (focusIndex >= questions.length && questions.length > 0) {
      setFocusIndex(questions.length - 1);
    }
  }, [questions.length, focusIndex]);

  // Navegação por teclado no Modo Foco (Setas <- e ->)
  useEffect(() => {
    if (viewMode !== "focus") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusIndex((prev) => Math.max(0, prev - 1));
        triggerHaptic("light");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setFocusIndex((prev) => Math.min(questions.length - 1, prev + 1));
        triggerHaptic("light");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, questions.length]);

  const handleOpenExportModal = useCallback((tab: "print" | "anki" = "print") => {
    setExportModalInitialTab(tab);
    setIsExportModalOpen(true);
  }, []);

  // Notificações Toast
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback(
    (text: string, type: "success" | "info" | "error" = "success") => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToastMessage({ text, type });
      toastTimeoutRef.current = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Gerenciamento de criação de flashcard em 1-clique (Zero tokens IA)
  const [isConvertingId, setIsConvertingId] = useState<string | null>(null);
  const [convertedIds, setConvertedIds] = useState<Set<string>>(new Set());

  const handleSaveFlashcard = useCallback(async (itemId: string) => {
    if (isConvertingId === itemId || convertedIds.has(itemId)) return;
    setIsConvertingId(itemId);
    try {
      const res = await convertErrorToFlashcardAction(itemId);
      if (res.success) {
        triggerHaptic("success");
        setConvertedIds((prev) => new Set(prev).add(itemId));
        showToast("Flashcard criado com sucesso!", "success");
      } else {
        triggerHaptic("warning");
        showToast(res.error || "Falha ao salvar flashcard.", "error");
      }
    } catch (err) {
      console.error("Erro ao converter erro em flashcard:", err);
      showToast("Erro inesperado ao salvar flashcard.", "error");
    } finally {
      setIsConvertingId(null);
    }
  }, [convertedIds, isConvertingId, showToast]);

  // Estados do Simulado de Redenção com Questões Gêmeas e Revanche Direta
  const [isRedemptionOpen, setIsRedemptionOpen] = useState(false);
  const [isGeneratingRedemption, setIsGeneratingRedemption] = useState(false);
  const [isGeneratingDirectRevenge, setIsGeneratingDirectRevenge] = useState(false);
  const [redemptionMode, setRedemptionMode] = useState<"direct" | "ai">("ai");
  const [redemptionQuestions, setRedemptionQuestions] = useState<RedemptionExamQuestion[]>([]);

  // Refs de controle de requisição e Sentinela de Rolagem
  const requestIdRef = useRef(0);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Sincroniza métricas se atualizadas pelo componente pai
  useEffect(() => {
    setMetrics(initialMetrics);
  }, [initialMetrics]);

  // Função centralizada para carregar páginas (inicial/filtro ou próximo lote do scroll)
  const fetchQuestions = useCallback(
    async (
      targetPage: number,
      activeFilters: ErrorNotebookFilters,
      isReset: boolean = false
    ) => {
      if (isReset) {
        setIsFiltering(true);
      } else {
        setIsLoadingMore(true);
      }

      const reqId = ++requestIdRef.current;

      try {
        const res = await getErrorNotebookQuestionsAction({
          page: targetPage,
          limit: 10,
          ...activeFilters,
        });

        if (reqId === requestIdRef.current) {
          if (res.success && res.questions) {
            if (isReset) {
              setQuestions(res.questions);
            } else {
              setQuestions((prev) => {
                const existingIds = new Set(prev.map((q) => q.id));
                const newItems = res.questions.filter((q) => !existingIds.has(q.id));
                return [...prev, ...newItems];
              });
            }
            setPage(targetPage);
            setHasMore(res.hasMore);
          } else {
            if (isReset) {
              setQuestions([]);
            }
            setHasMore(false);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar questões do caderno de erros:", err);
        if (isReset) {
          setQuestions([]);
        }
        setHasMore(false);
      } finally {
        if (reqId === requestIdRef.current) {
          setIsFiltering(false);
          setIsLoadingMore(false);
        }
      }
    },
    []
  );

  // Carga inicial se não houver itens prévios injetados
  useEffect(() => {
    if (!initialItems || initialItems.length === 0) {
      fetchQuestions(1, filters, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Implementação da Sentinela de Rolagem com IntersectionObserver nativo
  useEffect(() => {
    if (!hasMore || isLoadingMore || isFiltering) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore && !isFiltering) {
          fetchQuestions(page + 1, filters, false);
        }
      },
      { rootMargin: "200px" }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, isFiltering, page, filters, fetchQuestions]);

  // Alteração de filtros: resetar para page = 1, zerar questions e buscar do início
  const handleFilterChange = (newFilters: Partial<ErrorNotebookFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setPage(1);
    setQuestions([]);
    setHasMore(true);
    fetchQuestions(1, updatedFilters, true);
  };

  // Reset de todos os filtros para o padrão
  const handleResetFilters = () => {
    const resetFilters: ErrorNotebookFilters = {
      subjectId: "ALL",
      errorReason: "ALL",
      status: "ALL",
      period: "all",
      search: "",
    };
    setFilters(resetFilters);
    setPage(1);
    setQuestions([]);
    setHasMore(true);
    fetchQuestions(1, resetFilters, true);
  };

  // Recalcula métricas do header dinamicamente após atualização de item
  const refreshMetrics = useCallback(async () => {
    const res = await getErrorMetricsAction();
    if (res.success && res.data) {
      setMetrics(res.data);
    }
  }, []);

  // Classificação taxonômica em lote (20 questões por clique)
  const handleBatchClassify = async () => {
    setIsClassifying(true);
    try {
      const res = await batchClassifyTaxonomyOnlyAction(20);
      if (res.success) {
        showToast(
          res.message || `${res.processed || 0} erros categorizados com sucesso!`,
          "success"
        );
        await refreshMetrics();
        setPage(1);
        setQuestions([]);
        setHasMore(true);
        fetchQuestions(1, filters, true);
      } else {
        showToast(res.error || "Falha ao classificar lote de erros.", "error");
      }
    } catch (err) {
      console.error("Erro ao classificar com IA:", err);
      showToast("Erro inesperado ao classificar lote de erros.", "error");
    } finally {
      setIsClassifying(false);
    }
  };

  // Callback de atualização de item no card
  const handleItemUpdated = (updatedItem: ErrorNotebookItem) => {
    setQuestions((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    refreshMetrics();
  };

  // Callback de exclusão de item no card
  const handleItemDeleted = (id: string) => {
    setQuestions((prev) => prev.filter((item) => item.id !== id));
    refreshMetrics();
  };

  // Callback de conclusão do simulado de remediação
  const handleRemediationFinished = async () => {
    await refreshMetrics();
    setPage(1);
    setQuestions([]);
    setHasMore(true);
    fetchQuestions(1, filters, true);
    showToast("Simulado de remediação concluído com sucesso!", "success");
  };

  // Conversão de erros em lote para Deck de Flashcards FSRS
  const handleBatchCreateFlashcards = async () => {
    const pendingQuestions = questions.filter((q) => q.status === "PENDING" || !q.status);
    const targetQuestions = pendingQuestions.length > 0 ? pendingQuestions : questions;

    if (!targetQuestions.length) {
      showToast("Nenhum erro encontrado para converter em flashcards.", "info");
      return;
    }

    setIsCreatingBatchFlashcards(true);
    try {
      const ids = targetQuestions.map((q) => q.id);
      const res = await convertBatchErrorsToFlashcardsAction(ids);
      if (res.success) {
        showToast(
          `⚡ ${res.createdCount ?? 0} cartões de memória adicionados ao baralho "${res.deckTitle}"!`,
          "success"
        );
      } else {
        showToast(res.error || "Falha ao gerar flashcards em lote.", "error");
      }
    } catch (err) {
      console.error("Erro ao gerar flashcards em lote:", err);
      showToast("Erro inesperado ao gerar flashcards.", "error");
    } finally {
      setIsCreatingBatchFlashcards(false);
    }
  };

  // Disparo de Revanche Direta (0⚡ Zero Cota de IA - Questões Originais)
  const handleStartDirectRevenge = async (count: number = 5) => {
    triggerHaptic("medium");
    setIsGeneratingDirectRevenge(true);
    try {
      const res = await generateDirectRevengeExamAction({
        subjectId: filters.subjectId,
        count,
      });

      if (res.success && res.questions && res.questions.length > 0) {
        triggerHaptic("success");
        setRedemptionQuestions(res.questions);
        setRedemptionMode("direct");
        setIsRedemptionOpen(true);
      } else {
        showToast(
          res.error || "Nenhum erro pendente para revanche no momento.",
          "info"
        );
      }
    } catch (err) {
      console.error("Erro ao iniciar revanche direta:", err);
      showToast("Falha ao carregar a Revanche Direta.", "error");
    } finally {
      setIsGeneratingDirectRevenge(false);
    }
  };

  // Disparo do Simulado de Redenção com Questões Gêmeas da IA (Consome Cota)
  const handleStartRedemption = async (count: number = 5) => {
    triggerHaptic("medium");
    setIsGeneratingRedemption(true);
    triggerOptimisticEnergyConsumption({
      cost: 1,
      feature: "SIMULADO",
      label: "Simulado Redenção IA",
    });

    try {
      const res = await generateRedemptionExamAction({
        subjectId: filters.subjectId,
        count,
      });

      if (res.isQuotaExceeded) {
        triggerHaptic("warning");
        triggerSynapticExhaustion({
          feature: "SIMULADO",
          reason: res.error || "Limite diário de simulados com IA atingido.",
        });
        showToast(
          res.error || "Cota de IA atingida. Use a Revanche Direta (0⚡)!",
          "error"
        );
        return;
      }

      if (res.success && res.questions && res.questions.length > 0) {
        triggerHaptic("success");
        triggerAiQuotaRefresh();
        setRedemptionQuestions(res.questions);
        setRedemptionMode("ai");
        setIsRedemptionOpen(true);
      } else {
        showToast(
          res.error || "Nenhum erro pendente elegível para redenção no momento.",
          "info"
        );
      }
    } catch (err) {
      console.error("Erro ao gerar simulado de redenção:", err);
      showToast("Falha ao gerar o Simulado de Redenção com a IA.", "error");
    } finally {
      setIsGeneratingRedemption(false);
    }
  };

  const handleRedemptionComplete = async () => {
    triggerHaptic("success");
    fetchQuestions(1, filters, true);
    try {
      const metricsRes = await getErrorMetricsAction();
      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
    } catch {}
    showToast(
      "Sessão de redenção finalizada! Erros superados foram atualizados no seu perfil.",
      "success"
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* SPOTLIGHT DICA DE PRIMEIRO ACESSO */}
      <PageSpotlightBanner
        storageKey="synapse_spotlight_notebook"
        externalIsOpen={spotlight.isOpen}
        onClose={spotlight.dismiss}
        badgeText="🎯 Como Funciona o Caderno de Erros"
        title="Transforme Questões Erradas na Chave da sua Aprovação"
        description="Errar durante a preparação é normal e valioso. Aqui, cada questão errada é diagnosticada pelo motivo real para que você treine exatamente onde precisa."
        accentColor="emerald"
        primaryActionLabel="Entendi, vou superar meus erros!"
        steps={[
          {
            icon: <HelpCircle size={18} />,
            title: "1. Descubra o Motivo do Erro",
            description:
              "Classifique se errou por Teoria/Matéria Nova, Pegadinha da Banca, Interpretação do Enunciado ou Falta de Tempo.",
            tag: "Diagnóstico",
          },
          {
            icon: <Zap size={18} />,
            title: "2. Treine com Questões Focadas",
            description:
              "Clique em 'Treinar Questões que Errei' para a IA montar um mini-simulado só com as matérias e armadilhas que você errou.",
            tag: "Remediação Ativa",
          },
          {
            icon: <CheckCircle2 size={18} />,
            title: "3. Domine e Zere os Erros",
            description:
              "Ao acertar as questões nos treinos, elas sobem de nível e passam para 'Superadas', elevando sua taxa de domínio até os 100%.",
            tag: "Evolução Real",
          },
        ]}
      />

      {/* 🚀 BANNER PRINCIPAL: PRATICAR QUESTÕES QUE ERREI */}
      {metrics.pendingErrors > 0 && (
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900/60 border border-rose-500/30 dark:border-rose-500/20 shadow-xl backdrop-blur-xl">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span>Hora de Superar seus Pontos Fracos</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Você tem</span>
                <span className="text-rose-400 font-black underline decoration-rose-500 underline-offset-4">
                  {metrics.pendingErrors} {metrics.pendingErrors === 1 ? "questão errada" : "questões erradas"}
                </span>
                <span>para revisar</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Escolha abaixo: você pode refazer exatamente as mesmas questões que errou (grátis) ou pedir para a IA criar novas questões parecidas para testar se você realmente aprendeu.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Botão 1: Refazer as Mesmas Questões (Grátis) */}
              <button
                disabled={isGeneratingDirectRevenge || isGeneratingRedemption}
                onClick={() => handleStartDirectRevenge(5)}
                className="px-4 py-2.5 sm:py-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                title="Tente acertar novamente as mesmas questões que você errou antes (sem gastar créditos de IA)"
              >
                {isGeneratingDirectRevenge ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Abrindo questões...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 text-emerald-400" />
                    <span>Refazer as Mesmas Questões (Grátis)</span>
                  </>
                )}
              </button>

              {/* Botão 2: Treinar Questões Parecidas (IA) */}
              <button
                disabled={isGeneratingRedemption || isGeneratingDirectRevenge}
                onClick={() => handleStartRedemption(5)}
                className="px-4.5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                title="A IA cria 5 questões novas cobrando o mesmo assunto que você errou"
              >
                {isGeneratingRedemption ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Criando questões parecidas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Treinar 5 Questões Parecidas (IA)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Métricas e Distribuição Taxonômica */}
      <ErrorMetricsHeader
        metrics={metrics}
        selectedReason={filters.errorReason || "ALL"}
        onSelectReason={(reason) => handleFilterChange({ errorReason: reason })}
        onBatchClassify={handleBatchClassify}
        isClassifying={isClassifying}
        onOpenRemediationModal={() => setIsRemediationOpen(true)}
        onToggleSpotlight={spotlight.toggle}
        onBatchCreateFlashcards={handleBatchCreateFlashcards}
        isCreatingBatchFlashcards={isCreatingBatchFlashcards}
        onStartRedemption={handleStartRedemption}
        isGeneratingRedemption={isGeneratingRedemption}
        onOpenExportModal={handleOpenExportModal}
      />

      {/* 2. Barra de Filtros */}
      <ErrorFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        subjects={subjects}
        onResetFilters={handleResetFilters}
        onStartRedemption={handleStartRedemption}
        isGeneratingRedemption={isGeneratingRedemption}
      />

      {/* 3. Indicador de Carregamento nos Filtros / Busca */}
      {isFiltering && (
        <div className="flex flex-col items-center justify-center py-12 text-violet-400 gap-3 text-sm">
          <Loader2 className="animate-spin text-violet-400" size={24} />
          <span className="text-slate-400 text-xs font-medium">
            Carregando erros...
          </span>
        </div>
      )}

      {/* 4. Barra de Modos de Exibição (Lista Espaçada vs Modo Foco 1 por 1) */}
      {!isFiltering && questions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-md mb-6">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-medium">Visualização:</span>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setViewMode("list");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers size={13} />
                <span>Lista Completa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setViewMode("focus");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "focus"
                    ? "bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 text-white shadow-sm shadow-violet-600/30 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Target size={13} />
                <span>🎯 Modo Foco (1 por 1)</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {viewMode === "list" ? (
              <span>Exibindo <strong>{questions.length}</strong> de <strong>{metrics.totalErrors}</strong> erros</span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-300">
                <Sparkles size={12} />
                <span>Dica: navegue com as setas <strong>←</strong> e <strong>→</strong></span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* MODO FOCO (1 POR 1) */}
      {!isFiltering && questions.length > 0 && viewMode === "focus" && (
        <div className="space-y-6">
          {/* Navegador Superior do Modo Foco */}
          <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <button
              type="button"
              disabled={focusIndex === 0}
              onClick={() => {
                triggerHaptic("light");
                setFocusIndex((prev) => Math.max(0, prev - 1));
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Erro Anterior</span>
            </button>

            <div className="flex flex-col items-center gap-1.5 w-full sm:w-auto">
              <span className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>Questão</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-violet-600/30 text-violet-300 border border-violet-500/30 font-black">
                  {focusIndex + 1}
                </span>
                <span className="text-slate-400 font-normal">de</span>
                <span>{questions.length}</span>
              </span>
              <div className="w-48 sm:w-64 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-violet-500 to-rose-500 transition-all duration-300"
                  style={{ width: `${Math.round(((focusIndex + 1) / questions.length) * 100)}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={focusIndex >= questions.length - 1}
              onClick={() => {
                triggerHaptic("light");
                setFocusIndex((prev) => Math.min(questions.length - 1, prev + 1));
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Próximo Erro</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* O Card Único Isolado */}
          {questions[focusIndex] && (
            <AnimatePresence mode="wait">
              <motion.div
                key={questions[focusIndex].id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ErrorCard
                  errorItem={questions[focusIndex]}
                  index={focusIndex + 1}
                  onItemUpdated={handleItemUpdated}
                  onItemDeleted={(id) => {
                    handleItemDeleted(id);
                    setFocusIndex((prev) => Math.max(0, prev - 1));
                  }}
                  isConvertingId={isConvertingId}
                  convertedIds={convertedIds}
                  onSaveFlashcard={handleSaveFlashcard}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}

      {/* MODO LISTA ESPAÇADA (SPACE-Y-8 E NUMERAÇÃO DE CARDS) */}
      {!isFiltering && questions.length > 0 && viewMode === "list" && (
        <div className="space-y-8">
          <motion.div layout className="space-y-8">
            <AnimatePresence mode="popLayout">
              {questions.map((item, idx) => (
                <ErrorCard
                  key={item.id}
                  index={idx + 1}
                  errorItem={item}
                  onItemUpdated={handleItemUpdated}
                  onItemDeleted={handleItemDeleted}
                  isConvertingId={isConvertingId}
                  convertedIds={convertedIds}
                  onSaveFlashcard={handleSaveFlashcard}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Sentinela de Rolagem para IntersectionObserver */}
          <div ref={observerTarget} className="h-6 w-full pointer-events-none" />

          {/* Loader compacto com glassmorphism no rodapé */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-6">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-lg text-xs font-medium text-slate-300">
                <Loader2 className="animate-spin text-violet-400" size={16} />
                <span>Carregando mais erros...</span>
              </div>
            </div>
          )}

          {/* Mensagem sutil quando todos os erros foram revisados */}
          {!hasMore && (
            <div className="text-center py-8">
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                Você revisou todos os erros catalogados.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. Empty State: Nenhum erro registrado ou nenhum match com filtro */}
      {!isFiltering && questions.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-xl shadow-violet-500/5">
            <BookOpenCheck size={32} />
          </div>

          {metrics.totalErrors === 0 ? (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 size={13} />
                  <span>Caderno 100% Preparado</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Seu Caderno de Erros está Limpo!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
                  Conforme você resolve simulados no Banco de Provas, as questões que você errar serão automaticamente catalogadas aqui para desarmar pegadinhas e fixar a teoria.
                </p>
              </div>

              {/* 3 Passos do Método de Remediação */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-violet-400 text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[10px] font-mono">1</span>
                    <span>Simulado Real</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Resolva questões das principais bancas com seu edital ativo.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-mono">2</span>
                    <span>Diagnóstico IA</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    A IA classifica a causa-raiz: pegadinha, lacuna teórica ou tempo.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-mono">3</span>
                    <span>Remediação</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Treine com micro-questões de fixação inéditas e supere seus erros.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/questions"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-violet-600/30 border border-violet-400/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FileStack size={16} />
                  <span>Iniciar Simulado no Banco de Provas</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-white">
                Nenhum erro encontrado com os filtros atuais
              </h3>
              <p className="text-sm text-slate-400">
                Tente selecionar outra matéria, categoria taxonômica ou limpar a busca textual.
              </p>
              <div className="pt-3">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-all cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast Flutuante de Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border pointer-events-auto ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50"
                : toastMessage.type === "error"
                ? "bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/50"
                : "bg-slate-900/90 border-slate-700 text-slate-100 shadow-slate-950/50"
            }`}
          >
            {toastMessage.type === "success" ? (
              <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={16} />
              </div>
            ) : toastMessage.type === "error" ? (
              <div className="p-1.5 rounded-full bg-rose-500/20 text-rose-400">
                <AlertCircle size={16} />
              </div>
            ) : (
              <div className="p-1.5 rounded-full bg-violet-500/20 text-violet-400">
                <Zap size={16} />
              </div>
            )}
            <span className="text-xs md:text-sm font-semibold pr-1">
              {toastMessage.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Modal de Simulado de Remediação Instantâneo */}
      <RemediationQuizModal
        isOpen={isRemediationOpen}
        onClose={() => setIsRemediationOpen(false)}
        subjects={subjects}
        initialTaxonomy={filters.errorReason || "ALL"}
        onFinished={handleRemediationFinished}
      />

      {/* 7. Modal de Simulado de Redenção com Questões Gêmeas da IA ou Revanche Direta */}
      <RedemptionExamModal
        isOpen={isRedemptionOpen}
        onClose={() => setIsRedemptionOpen(false)}
        questions={redemptionQuestions}
        onExamComplete={handleRedemptionComplete}
        mode={redemptionMode}
      />

      {/* 8. Modal de Apostila de Véspera (PDF/Imprimir) & Exportação Anki */}
      <PrintableErrorBookModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        items={questions}
        initialTab={exportModalInitialTab}
      />
    </div>
  );
}

// Alias de exportação para compatibilidade com abas
export { ErrorNotebookView as ErrorNotebookTab };

