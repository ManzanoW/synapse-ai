"use client";

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
import {
  getErrorNotebookQuestionsAction,
  getErrorMetricsAction,
  batchClassifyTaxonomyOnlyAction,
  generateRedemptionExamAction,
  RedemptionExamQuestion,
  convertErrorToFlashcardAction,
} from "@/actions/error-notebook-actions";
import { convertBatchErrorsToFlashcardsAction } from "@/actions/error-flashcard-actions";
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
  });
  const [isFiltering, setIsFiltering] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isRemediationOpen, setIsRemediationOpen] = useState(false);
  const [isCreatingBatchFlashcards, setIsCreatingBatchFlashcards] = useState(false);

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
        setConvertedIds((prev) => new Set(prev).add(itemId));
        showToast("Flashcard criado com sucesso!", "success");
      } else {
        showToast(res.error || "Falha ao salvar flashcard.", "error");
      }
    } catch (err) {
      console.error("Erro ao converter erro em flashcard:", err);
      showToast("Erro inesperado ao salvar flashcard.", "error");
    } finally {
      setIsConvertingId(null);
    }
  }, [convertedIds, isConvertingId, showToast]);

  // Estados do Simulado de Redenção com Questões Gêmeas
  const [isRedemptionOpen, setIsRedemptionOpen] = useState(false);
  const [isGeneratingRedemption, setIsGeneratingRedemption] = useState(false);
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
          `⚡ ${res.createdCount ?? 0} flashcards FSRS adicionados ao deck "${res.deckTitle}"!`,
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

  // Disparo do Simulado de Redenção com Questões Gêmeas da IA
  const handleStartRedemption = async (count: number = 5) => {
    setIsGeneratingRedemption(true);
    try {
      const res = await generateRedemptionExamAction({
        subjectId: filters.subjectId,
        count,
      });

      if (res.success && res.questions && res.questions.length > 0) {
        setRedemptionQuestions(res.questions);
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

      {/* 🚀 BANNER ULTRA-PREMIUM: SIMULADO DE REDENÇÃO (CICATRIZAÇÃO ATIVA DE FALHAS) */}
      {metrics.pendingErrors > 0 && (
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900/60 border border-rose-500/30 dark:border-rose-500/20 shadow-xl backdrop-blur-xl">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span>Cicatrização Ativa com IA • Questões Gêmeas</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>Você tem</span>
                <span className="text-rose-400 font-black underline decoration-rose-500 underline-offset-4">
                  {metrics.pendingErrors} erros pendentes
                </span>
                <span>de domínio</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Supere suas falhas antes da prova real. A IA gera questões gêmeas inéditas
                focadas exatamente nas pegadinhas e conceitos que te derrubaram.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                disabled={isGeneratingRedemption}
                onClick={() => handleStartRedemption(5)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {isGeneratingRedemption ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gerando Questões Gêmeas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Iniciar Simulado de Redenção (5Q)</span>
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
      />

      {/* 2. Barra de Filtros */}
      <ErrorFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        subjects={subjects}
        onResetFilters={handleResetFilters}
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

      {/* 4. Lista de Cards de Erro com Infinite Scroll */}
      {!isFiltering && questions.length > 0 && (
        <div className="space-y-4">
          <motion.div layout className="space-y-4">
            <AnimatePresence mode="popLayout">
              {questions.map((item) => (
                <ErrorCard
                  key={item.id}
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

      {/* 7. Modal de Simulado de Redenção com Questões Gêmeas da IA */}
      <RedemptionExamModal
        isOpen={isRedemptionOpen}
        onClose={() => setIsRedemptionOpen(false)}
        questions={redemptionQuestions}
        onExamComplete={handleRedemptionComplete}
      />
    </div>
  );
}

// Alias de exportação para compatibilidade com abas
export { ErrorNotebookView as ErrorNotebookTab };

