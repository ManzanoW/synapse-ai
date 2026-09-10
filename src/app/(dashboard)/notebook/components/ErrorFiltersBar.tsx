"use client";

import React from "react";
import { Search, Filter, BookOpen, Brain, CheckCircle, Clock, X } from "lucide-react";
import { ErrorNotebookFilters } from "@/types/quiz";
import { TAXONOMY_METADATA } from "@/lib/error-taxonomy";

interface SubjectOption {
  id: string;
  name: string;
  color?: string | null;
}

interface ErrorFiltersBarProps {
  filters: ErrorNotebookFilters;
  onFilterChange: (newFilters: Partial<ErrorNotebookFilters>) => void;
  subjects: SubjectOption[];
  onResetFilters: () => void;
}

export function ErrorFiltersBar({
  filters,
  onFilterChange,
  subjects,
  onResetFilters,
}: ErrorFiltersBarProps) {
  const [searchValue, setSearchValue] = React.useState(filters.search || "");

  // Sincroniza estado local se o filtro for resetado ou alterado externamente
  React.useEffect(() => {
    setSearchValue(filters.search || "");
  }, [filters.search]);

  // Debounce para digitação de busca
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search || "") !== searchValue) {
        onFilterChange({ search: searchValue });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, filters.search, onFilterChange]);

  const hasActiveFilters =
    (filters.subjectId && filters.subjectId !== "ALL") ||
    (filters.errorReason && filters.errorReason !== "ALL") ||
    (filters.status && filters.status !== "ALL") ||
    (filters.period && filters.period !== "all") ||
    (filters.search && filters.search.trim() !== "");

  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl mb-6 space-y-3 shadow-lg">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="flex-1 min-w-[240px] relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Pesquisar por palavra-chave no enunciado ou justificativa..."
            className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-all"
          />
          {searchValue && (
            <button
              onClick={() => {
                setSearchValue("");
                onFilterChange({ search: "" });
              }}
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Agrupamento de Seletores */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Matéria */}
          <div className="relative min-w-[150px] flex-1 sm:flex-initial">
            <select
              value={filters.subjectId || "ALL"}
              onChange={(e) => onFilterChange({ subjectId: e.target.value })}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-xl bg-slate-800/80 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer appearance-none pr-8"
            >
              <option value="ALL">Todas as Matérias</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
            <BookOpen
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Seletor de Causa-Raiz */}
          <div className="relative min-w-[160px] flex-1 sm:flex-initial">
            <select
              value={filters.errorReason || "ALL"}
              onChange={(e) => onFilterChange({ errorReason: e.target.value })}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-xl bg-slate-800/80 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer appearance-none pr-8"
            >
              <option value="ALL">Todas as Causas-Raiz</option>
              {Object.entries(TAXONOMY_METADATA).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
            <Brain
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Seletor de Status (Pendente vs Superado) */}
          <div className="relative min-w-[130px] flex-1 sm:flex-initial">
            <select
              value={filters.status || "ALL"}
              onChange={(e) =>
                onFilterChange({
                  status: e.target.value as "ALL" | "PENDING" | "MASTERED",
                })
              }
              className="w-full px-3 py-2 text-xs md:text-sm rounded-xl bg-slate-800/80 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer appearance-none pr-8 font-medium"
            >
              <option value="ALL">Status: Todos</option>
              <option value="PENDING">⚠️ Pendentes</option>
              <option value="MASTERED">✅ Superados</option>
            </select>
            <CheckCircle
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Seletor de Período */}
          <div className="relative min-w-[120px] flex-1 sm:flex-initial">
            <select
              value={filters.period || "all"}
              onChange={(e) =>
                onFilterChange({
                  period: e.target.value as "7d" | "30d" | "90d" | "all",
                })
              }
              className="w-full px-3 py-2 text-xs md:text-sm rounded-xl bg-slate-800/80 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer appearance-none pr-8"
            >
              <option value="all">Todo o Período</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
            <Clock
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Botão de Limpar Filtros */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all cursor-pointer"
            >
              <X size={13} />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
