"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  RotateCcw,
  Zap,
  Building2,
  Calendar,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  getExamFilterOptionsAction,
  generateTargetedExamAction,
  ExamFilterOptions,
} from "@/actions/bank-exam-actions";

export interface BankFilterValues {
  banca: string;
  orgao: string;
  ano: string;
  disciplina: string;
  tipo: string;
  query: string;
}

interface BankExamFiltersProps {
  filters: BankFilterValues;
  onFilterChange: (newFilters: Partial<BankFilterValues>) => void;
  onResetFilters: () => void;
  totalFound?: number;
}

const FALLBACK_BANCAS = [
  "CEBRASPE",
  "FGV",
  "FCC",
  "VUNESP",
  "CESGRANRIO",
  "IBFC",
  "QUADRIX",
];

const FALLBACK_ORGAOS = [
  "Polícia Federal",
  "Polícia Rodoviária Federal",
  "Receita Federal",
  "INSS",
  "TSE Unificado",
  "Banco do Brasil",
  "Caixa Econômica Federal",
  "TCU",
  "CGU",
];

const FALLBACK_ANOS = [2025, 2024, 2023, 2022, 2021, 2020];

const FALLBACK_DISCIPLINAS = [
  "Língua Portuguesa",
  "Direito Constitucional",
  "Direito Administrativo",
  "Raciocínio Lógico e Matemático",
  "Tecnologia da Informação",
  "Informática Básica",
  "Direito Penal",
  "Direito Processual Penal",
  "Direito Tributário",
  "Administração Pública",
];

export function BankExamFilters({
  filters,
  onFilterChange,
  onResetFilters,
  totalFound,
}: BankExamFiltersProps) {
  const router = useRouter();
  const [options, setOptions] = useState<ExamFilterOptions>({
    bancas: [],
    orgaos: [],
    anos: [],
    disciplinas: [],
  });
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Local state for debounced search
  const [searchInput, setSearchInput] = useState(filters.query || "");

  // Sync external search updates into local input
  useEffect(() => {
    setSearchInput(filters.query || "");
  }, [filters.query]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== (filters.query || "")) {
        onFilterChange({ query: searchInput });
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput, filters.query, onFilterChange]);

  // Load dynamic filter options from database
  useEffect(() => {
    let mounted = true;
    setIsLoadingOptions(true);

    getExamFilterOptionsAction()
      .then((res) => {
        if (mounted && res.success && res.data) {
          setOptions({
            bancas:
              res.data.bancas.length > 0 ? res.data.bancas : FALLBACK_BANCAS,
            orgaos:
              res.data.orgaos.length > 0 ? res.data.orgaos : FALLBACK_ORGAOS,
            anos: res.data.anos.length > 0 ? res.data.anos : FALLBACK_ANOS,
            disciplinas:
              res.data.disciplinas.length > 0
                ? res.data.disciplinas
                : FALLBACK_DISCIPLINAS,
          });
        } else if (mounted) {
          setOptions({
            bancas: FALLBACK_BANCAS,
            orgaos: FALLBACK_ORGAOS,
            anos: FALLBACK_ANOS,
            disciplinas: FALLBACK_DISCIPLINAS,
          });
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar opções de filtros:", err);
        if (mounted) {
          setOptions({
            bancas: FALLBACK_BANCAS,
            orgaos: FALLBACK_ORGAOS,
            anos: FALLBACK_ANOS,
            disciplinas: FALLBACK_DISCIPLINAS,
          });
        }
      })
      .finally(() => {
        if (mounted) setIsLoadingOptions(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Handler to generate targeted real exam and redirect to timed resolution
  const handleGenerateExam = async () => {
    setIsGeneratingExam(true);
    setGenerationError(null);

    try {
      const selectedAno =
        filters.ano && filters.ano !== "Todos"
          ? parseInt(filters.ano, 10)
          : undefined;

      const res = await generateTargetedExamAction({
        banca:
          filters.banca && filters.banca !== "Todas"
            ? filters.banca
            : undefined,
        orgao:
          filters.orgao && filters.orgao !== "Todos"
            ? filters.orgao
            : undefined,
        anos: selectedAno ? [selectedAno] : undefined,
        disciplina:
          filters.disciplina && filters.disciplina !== "Todas"
            ? filters.disciplina
            : undefined,
        limit: 15,
      });

      if (!res.success || !res.data || res.data.length === 0) {
        setGenerationError(
          res.error ||
            "Nenhuma questão disponível para montar o simulado com os filtros atuais. Experimente selecionar menos restrições."
        );
        return;
      }

      // Store generated questions in sessionStorage for immediate instant launch
      if (typeof window !== "undefined") {
        sessionStorage.setItem("synapse_targeted_exam", JSON.stringify(res));
      }

      const queryParams = new URLSearchParams({
        source: "bank",
        banca: filters.banca && filters.banca !== "Todas" ? filters.banca : "Real",
        pacing: "per_question",
        pace: "3",
      });

      if (filters.orgao && filters.orgao !== "Todos") {
        queryParams.set("orgao", filters.orgao);
      }
      if (filters.disciplina && filters.disciplina !== "Todas") {
        queryParams.set("disciplina", filters.disciplina);
      }

      router.push(`/quiz/timed?${queryParams.toString()}`);
    } catch (err) {
      console.error("Erro ao gerar simulado da banca:", err);
      setGenerationError(
        "Ocorreu um erro ao gerar o simulado. Tente novamente em instantes."
      );
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const activeFiltersCount = [
    filters.banca && filters.banca !== "Todas",
    filters.orgao && filters.orgao !== "Todos",
    filters.ano && filters.ano !== "Todos",
    filters.disciplina && filters.disciplina !== "Todas",
    filters.tipo && filters.tipo !== "Todas",
    Boolean(filters.query && filters.query.trim().length > 0),
  ].filter(Boolean).length;

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#0c101d] via-[#090d18] to-[#04060c] border border-violet-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5">
      {/* Background ambient glow accents */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-indigo-600/10 blur-3xl" />

      {/* Top Bar: Title, Badge & Total Counter */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.25)]">
              <Filter size={16} />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>Raio-X de Provas de Concursos</span>
              {activeFiltersCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                  {activeFiltersCount} {activeFiltersCount === 1 ? "filtro ativo" : "filtros ativos"}
                </span>
              )}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Filtre por banca, órgão, ano e disciplina para explorar questões reais ou gerar cadernos cronometrados.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                setSearchInput("");
                onResetFilters();
              }}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Limpar todos os filtros"
            >
              <RotateCcw size={13} />
              <span>Limpar Filtros</span>
            </button>
          )}

          <button
            onClick={handleGenerateExam}
            disabled={isGeneratingExam}
            type="button"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 active:scale-95 transition-all cursor-pointer border border-violet-400/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGeneratingExam ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Montando Simulado...</span>
              </>
            ) : (
              <>
                <Zap size={14} className="text-amber-300 fill-amber-300" />
                <span>Gerar Simulado da Banca</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error notification if generation failed */}
      {generationError && (
        <div className="relative z-10 flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Aviso: </span>
            {generationError}
          </div>
          <button
            onClick={() => setGenerationError(null)}
            type="button"
            className="p-1 hover:bg-rose-500/20 rounded-md text-rose-300 hover:text-white cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Search Bar with Debounce */}
      <div className="relative z-10">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Pesquisar por palavras-chave no enunciado, assunto ou tema..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#090d18] border border-white/10 focus:border-violet-500/80 text-xs text-white placeholder:text-slate-500 rounded-xl outline-none transition-all shadow-inner focus:ring-2 focus:ring-violet-500/20"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                onFilterChange({ query: "" });
              }}
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Selectors Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Banca Examinadora */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Building2 size={11} className="text-violet-400" />
            <span>Banca Examinadora</span>
          </label>
          <div className="relative">
            <select
              value={filters.banca || "Todas"}
              onChange={(e) => onFilterChange({ banca: e.target.value })}
              className="w-full bg-[#0d1326] border border-white/10 hover:border-violet-500/40 focus:border-violet-500 text-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium appearance-none cursor-pointer outline-none transition-all shadow-inner focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="Todas">Todas as Bancas</option>
              {options.bancas.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        {/* 2. Concurso / Órgão */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Building2 size={11} className="text-cyan-400" />
            <span>Concurso / Órgão</span>
          </label>
          <div className="relative">
            <select
              value={filters.orgao || "Todos"}
              onChange={(e) => onFilterChange({ orgao: e.target.value })}
              className="w-full bg-[#0d1326] border border-white/10 hover:border-cyan-500/40 focus:border-cyan-500 text-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium appearance-none cursor-pointer outline-none transition-all shadow-inner focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="Todos">Todos os Órgãos</option>
              {options.orgaos.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        {/* 3. Ano da Prova */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar size={11} className="text-amber-400" />
            <span>Ano da Prova</span>
          </label>
          <div className="relative">
            <select
              value={filters.ano || "Todos"}
              onChange={(e) => onFilterChange({ ano: e.target.value })}
              className="w-full bg-[#0d1326] border border-white/10 hover:border-amber-500/40 focus:border-amber-500 text-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium appearance-none cursor-pointer outline-none transition-all shadow-inner focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="Todos">Todos os Anos</option>
              {options.anos.map((a) => (
                <option key={a} value={String(a)}>
                  {a}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        {/* 4. Disciplina */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen size={11} className="text-indigo-400" />
            <span>Disciplina</span>
          </label>
          <div className="relative">
            <select
              value={filters.disciplina || "Todas"}
              onChange={(e) => onFilterChange({ disciplina: e.target.value })}
              className="w-full bg-[#0d1326] border border-white/10 hover:border-indigo-500/40 focus:border-indigo-500 text-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium appearance-none cursor-pointer outline-none transition-all shadow-inner focus:ring-2 focus:ring-indigo-500/20 truncate"
            >
              <option value="Todas">Todas as Disciplinas</option>
              {options.disciplinas.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        {/* 5. Tipo de Questão */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 size={11} className="text-emerald-400" />
            <span>Tipo de Questão</span>
          </label>
          <div className="relative">
            <select
              value={filters.tipo || "Todas"}
              onChange={(e) => onFilterChange({ tipo: e.target.value })}
              className="w-full bg-[#0d1326] border border-white/10 hover:border-emerald-500/40 focus:border-emerald-500 text-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium appearance-none cursor-pointer outline-none transition-all shadow-inner focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="Todas">Todos os Tipos</option>
              <option value="MULTIPLA_ESCOLHA">Múltipla Escolha</option>
              <option value="CERTO_ERRADO">Certo / Errado</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
