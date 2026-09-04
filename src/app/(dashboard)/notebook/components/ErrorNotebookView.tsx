"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ErrorNotebookFilters,
  ErrorNotebookItem,
  ErrorNotebookMetrics,
} from "@/types/quiz";
import { ErrorMetricsHeader } from "./ErrorMetricsHeader";
import { ErrorFiltersBar } from "./ErrorFiltersBar";
import { ErrorCard } from "./ErrorCard";
import {
  getErrorNotebookItemsAction,
  getErrorMetricsAction,
  autoClassifyPendingErrorsAction,
} from "@/actions/error-notebook-actions";
import {
  BookOpenCheck,
  CheckCircle2,
  FileStack,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface SubjectOption {
  id: string;
  name: string;
  color?: string | null;
}

interface ErrorNotebookViewProps {
  initialItems: ErrorNotebookItem[];
  initialMetrics: ErrorNotebookMetrics;
  subjects: SubjectOption[];
}

export function ErrorNotebookView({
  initialItems,
  initialMetrics,
  subjects,
}: ErrorNotebookViewProps) {
  const [items, setItems] = useState<ErrorNotebookItem[]>(initialItems);
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
  const filterRequestIdRef = useRef(0);

  // Sincroniza dados caso initialItems ou initialMetrics sejam carregados ou atualizados externamente
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setMetrics(initialMetrics);
  }, [initialMetrics]);

  // Executa busca com novos filtros
  const handleFilterChange = (newFilters: Partial<ErrorNotebookFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    const reqId = ++filterRequestIdRef.current;
    setIsFiltering(true);

    getErrorNotebookItemsAction(updatedFilters)
      .then((res) => {
        if (reqId === filterRequestIdRef.current && res.success && res.data) {
          setItems(res.data);
        }
      })
      .catch((err) => {
        console.error("Erro ao filtrar caderno de erros:", err);
      })
      .finally(() => {
        if (reqId === filterRequestIdRef.current) {
          setIsFiltering(false);
        }
      });
  };

  // Reseta filtros
  const handleResetFilters = () => {
    const resetFilters: ErrorNotebookFilters = {
      subjectId: "ALL",
      errorReason: "ALL",
      status: "ALL",
      period: "all",
      search: "",
    };
    setFilters(resetFilters);

    const reqId = ++filterRequestIdRef.current;
    setIsFiltering(true);

    getErrorNotebookItemsAction(resetFilters)
      .then((res) => {
        if (reqId === filterRequestIdRef.current && res.success && res.data) {
          setItems(res.data);
        }
      })
      .catch((err) => {
        console.error("Erro ao resetar filtros:", err);
      })
      .finally(() => {
        if (reqId === filterRequestIdRef.current) {
          setIsFiltering(false);
        }
      });
  };

  // Recalcula métricas do header dinamicamente após atualização de item
  const refreshMetrics = useCallback(async () => {
    const res = await getErrorMetricsAction();
    if (res.success && res.data) {
      setMetrics(res.data);
    }
  }, []);

  // Diagnóstico em lote de erros pendentes via IA
  const handleAutoClassify = async () => {
    setIsClassifying(true);
    try {
      const res = await autoClassifyPendingErrorsAction();
      if (res.success) {
        await refreshMetrics();
        const itemsRes = await getErrorNotebookItemsAction(filters);
        if (itemsRes.success && itemsRes.data) {
          setItems(itemsRes.data);
        }
      }
    } catch (err) {
      console.error("Erro ao classificar com IA:", err);
    } finally {
      setIsClassifying(false);
    }
  };

  // Callback de atualização de item no card
  const handleItemUpdated = (updatedItem: ErrorNotebookItem) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    refreshMetrics();
  };

  // Callback de exclusão de item no card
  const handleItemDeleted = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    refreshMetrics();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Métricas e Distribuição Taxonômica */}
      <ErrorMetricsHeader
        metrics={metrics}
        selectedReason={filters.errorReason || "ALL"}
        onSelectReason={(reason) => handleFilterChange({ errorReason: reason })}
        onAutoClassify={handleAutoClassify}
        isClassifying={isClassifying}
      />

      {/* 2. Barra de Filtros */}
      <ErrorFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        subjects={subjects}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Indicador de Carregamento nos Filtros */}
      {isFiltering && (
        <div className="flex items-center justify-center py-6 text-violet-400 gap-2 text-sm">
          <Loader2 className="animate-spin" size={18} />
          <span>Filtrando caderno de erros...</span>
        </div>
      )}

      {/* 4. Lista de Cards de Erro com Framer Motion */}
      {!isFiltering && items.length > 0 && (
        <motion.div layout className="space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <ErrorCard
                key={item.id}
                errorItem={item}
                onItemUpdated={handleItemUpdated}
                onItemDeleted={handleItemDeleted}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 5. Empty State: Nenhum erro registrado ou nenhum match com filtro */}
      {!isFiltering && items.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-xl shadow-violet-500/5">
            <BookOpenCheck size={32} />
          </div>

          {metrics.totalErrors === 0 ? (
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-white">
                Seu Caderno de Erros está Limpo!
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Você ainda não possui erros registrados ou todas as suas questões foram acertadas. Realize simulados no Banco de Provas para mapear suas causas-raiz.
              </p>
              <div className="pt-4">
                <Link
                  href="/questions"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
                >
                  <FileStack size={16} />
                  <span>Ir para o Banco de Provas</span>
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
    </div>
  );
}
