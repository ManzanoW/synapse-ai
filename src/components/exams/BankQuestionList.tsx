"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  SearchX,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Check,
  Building2,
  Calendar,
  Briefcase,
  BookOpen,
  Award,
  AlertTriangle,
} from "lucide-react";
import { BankQuestionWithExam } from "@/actions/bank-exam-actions";
import { BankFilterValues } from "./BankExamFilters";

interface BankQuestionListProps {
  questions: BankQuestionWithExam[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  filters: BankFilterValues;
  onPageChange: (newPage: number) => void;
  onResetFilters: () => void;
}

interface NormalizedAlt {
  id: string;
  texto: string;
}

function normalizeAlternatives(
  rawAlts: unknown,
  tipo: string
): NormalizedAlt[] {
  let parsed: unknown = rawAlts;
  if (typeof rawAlts === "string") {
    try {
      parsed = JSON.parse(rawAlts);
    } catch {
      parsed = [];
    }
  }

  const arr = Array.isArray(parsed) ? parsed : [];
  let result: NormalizedAlt[] = arr.map((item, idx) => {
    const id = (item.id || item.letra || String.fromCharCode(65 + idx))
      .toString()
      .trim()
      .toUpperCase();
    const texto = (item.texto || item.text || "").toString().trim();
    return { id, texto };
  });

  if (tipo === "CERTO_ERRADO" && result.length === 0) {
    result = [
      { id: "C", texto: "Certo" },
      { id: "E", texto: "Errado" },
    ];
  }

  return result;
}

function isMatchGabarito(selectedOrAltId?: string, officialGabarito?: string): boolean {
  if (!selectedOrAltId || !officialGabarito) return false;
  const a = selectedOrAltId.trim().toUpperCase();
  const b = officialGabarito.trim().toUpperCase();
  if (a === b) return true;
  if ((a === "C" || a === "CERTO") && (b === "C" || b === "CERTO")) return true;
  if ((a === "E" || a === "ERRADO") && (b === "E" || b === "ERRADO")) return true;
  return false;
}

function renderEnunciado(texto: string) {
  if (!texto) return null;
  const partes = texto.split(/(\*\*.*?\*\*)/g);
  return partes.map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      const conteudoLimpo = parte.slice(2, -2);
      return (
        <span
          key={`highlight-${i}`}
          className="inline-block bg-violet-500/15 text-violet-200 px-1.5 py-0.5 mx-0.5 rounded-md border border-violet-400/30 font-semibold align-baseline shadow-xs"
        >
          {conteudoLimpo}
        </span>
      );
    }
    return <React.Fragment key={`text-${i}`}>{parte}</React.Fragment>;
  });
}

export function BankQuestionList({
  questions,
  totalCount,
  totalPages,
  currentPage,
  isLoading,
  filters,
  onPageChange,
  onResetFilters,
}: BankQuestionListProps) {
  // Store user interactive answers per question id
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  // Store toggle for revealing answers and justifications
  const [revealedJustifications, setRevealedJustifications] = useState<
    Record<string, boolean>
  >({});

  const handleSelectAlternative = (questionId: string, altId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: altId,
    }));
    // Auto-reveal explanation when answered for instant feedback
    setRevealedJustifications((prev) => ({
      ...prev,
      [questionId]: true,
    }));
  };

  const handleToggleJustification = (questionId: string) => {
    setRevealedJustifications((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Build a summary text for active filters
  const buildFilterSummary = () => {
    const parts: string[] = [];
    if (filters.banca && filters.banca !== "Todas") parts.push(filters.banca);
    if (filters.orgao && filters.orgao !== "Todos") parts.push(filters.orgao);
    if (filters.ano && filters.ano !== "Todos") parts.push(filters.ano);
    if (filters.disciplina && filters.disciplina !== "Todas")
      parts.push(filters.disciplina);
    if (filters.tipo && filters.tipo !== "Todas") {
      parts.push(
        filters.tipo === "MULTIPLA_ESCOLHA"
          ? "Múltipla Escolha"
          : "Certo/Errado"
      );
    }
    if (filters.query && filters.query.trim().length > 0) {
      parts.push(`"${filters.query.trim()}"`);
    }

    if (parts.length === 0) {
      return "todas as bancas e órgãos cadastrados";
    }
    return parts.join(" • ");
  };

  return (
    <div className="space-y-4">
      {/* Header bar: Count & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-mono font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-lg">
            {isLoading ? "..." : totalCount.toLocaleString("pt-BR")}{" "}
            {totalCount === 1 ? "questão" : "questões"}
          </span>
          <span className="text-slate-500">encontradas para</span>
          <span className="font-semibold text-slate-200 truncate max-w-md">
            {buildFilterSummary()}
          </span>
        </div>

        {totalCount > 0 && totalPages > 1 && (
          <div className="text-slate-400 font-mono text-[11px] shrink-0">
            Página <span className="text-white font-bold">{currentPage}</span> de{" "}
            <span>{totalPages}</span>
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={`skeleton-${n}`}
              className="rounded-2xl p-5 sm:p-6 bg-[#080c18]/70 border border-white/5 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-5 w-20 bg-white/5 rounded-md" />
                <div className="h-5 w-28 bg-white/5 rounded-md" />
                <div className="h-5 w-16 bg-white/5 rounded-md" />
                <div className="h-5 w-36 bg-white/5 rounded-md" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-4 bg-white/5 rounded-md w-full" />
                <div className="h-4 bg-white/5 rounded-md w-11/12" />
                <div className="h-4 bg-white/5 rounded-md w-4/5" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-10 bg-white/5 rounded-xl w-full" />
                <div className="h-10 bg-white/5 rounded-xl w-full" />
                <div className="h-10 bg-white/5 rounded-xl w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && questions.length === 0 && (
        <div className="relative overflow-hidden bg-gradient-to-b from-[#0c101d] via-[#090d18] to-[#04060c] border border-white/10 rounded-3xl p-8 sm:p-12 text-center shadow-xl space-y-5">
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto shadow-xl shadow-violet-500/10 relative z-10">
            <SearchX size={30} />
          </div>
          <div className="space-y-2 relative z-10 max-w-md mx-auto">
            <h4 className="text-lg font-black text-white tracking-tight">
              Nenhuma questão encontrada
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Não localizamos nenhuma questão para os filtros aplicados (
              {buildFilterSummary()}). Tente afrouxar os critérios, remover termos específicos de busca ou selecionar todas as bancas.
            </p>
          </div>
          <div className="pt-2 relative z-10">
            <button
              onClick={onResetFilters}
              type="button"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-violet-500/40 text-slate-200 hover:text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Limpar Filtros e Ver Todas</span>
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      {!isLoading && questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const alts = normalizeAlternatives(q.alternativas, q.tipo);
            const selectedAlt = selectedAnswers[q.id];
            const isRevealed = revealedJustifications[q.id];
            const gabaritoOficial = (q.gabarito || "").trim().toUpperCase();
            const hasAnswered = Boolean(selectedAlt);
            const isCorrect = isMatchGabarito(selectedAlt, gabaritoOficial);

            return (
              <div
                key={q.id}
                className="relative overflow-hidden rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-[#0c101d] via-[#090d18] to-[#05070e] border border-white/10 hover:border-violet-500/30 transition-all duration-200 shadow-xl space-y-4"
              >
                {/* Header: Badges and Metadata */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3 gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Number if available */}
                    {q.numeroQuestao ? (
                      <span className="text-[11px] font-mono font-extrabold text-violet-400 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-md">
                        #{q.numeroQuestao}
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                        Item {idx + 1}
                      </span>
                    )}

                    {/* Banca */}
                    {q.exam?.banca && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-300">
                        <Building2 size={10} />
                        <span>{q.exam.banca}</span>
                      </span>
                    )}

                    {/* Órgão */}
                    {q.exam?.orgao && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                        <span>{q.exam.orgao}</span>
                      </span>
                    )}

                    {/* Ano */}
                    {q.exam?.ano && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        <Calendar size={10} />
                        <span>{q.exam.ano}</span>
                      </span>
                    )}

                    {/* Cargo */}
                    {q.exam?.cargo && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-300 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 max-w-[220px] truncate">
                        <Briefcase size={10} className="shrink-0 text-slate-400" />
                        <span className="truncate">{q.exam.cargo}</span>
                      </span>
                    )}

                    {/* Disciplina */}
                    {q.disciplina && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                        <BookOpen size={10} />
                        <span>{q.disciplina}</span>
                      </span>
                    )}

                    {/* Flags */}
                    {q.anulada && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 uppercase">
                        <AlertTriangle size={10} />
                        <span>Anulada</span>
                      </span>
                    )}
                    {q.desatualizada && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase">
                        <AlertTriangle size={10} />
                        <span>Desatualizada</span>
                      </span>
                    )}
                  </div>

                  {/* Top Right: Toggle Justification / Answer Status */}
                  <div className="flex items-center gap-2">
                    {hasAnswered && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          isCorrect
                            ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                            : "bg-rose-500/15 border border-rose-500/40 text-rose-300"
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 size={11} />
                            <span>Acertou!</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={11} />
                            <span>Gabarito: {gabaritoOficial}</span>
                          </>
                        )}
                      </span>
                    )}

                    <button
                      onClick={() => handleToggleJustification(q.id)}
                      type="button"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      {isRevealed ? (
                        <>
                          <EyeOff size={12} />
                          <span>Ocultar Gabarito</span>
                        </>
                      ) : (
                        <>
                          <Eye size={12} />
                          <span>Ver Gabarito</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Enunciado */}
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line select-text">
                  {renderEnunciado(q.enunciado)}
                </div>

                {/* Alternativas */}
                <div className="space-y-2 pt-1">
                  {alts.map((alt) => {
                    const isSelected = selectedAlt === alt.id;
                    const isTheCorrectOne = isMatchGabarito(alt.id, gabaritoOficial);

                    let btnStyle =
                      "bg-[#090d18] border-white/10 text-slate-300 hover:border-violet-500/40 hover:bg-[#0f1426]";
                    let badgeStyle =
                      "bg-white/5 text-slate-400 border-white/10";

                    if (isRevealed || hasAnswered) {
                      if (isTheCorrectOne) {
                        btnStyle =
                          "bg-emerald-950/25 border-emerald-500/60 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
                        badgeStyle =
                          "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold";
                      } else if (isSelected && !isCorrect) {
                        btnStyle =
                          "bg-rose-950/25 border-rose-500/60 text-rose-200";
                        badgeStyle =
                          "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold";
                      } else {
                        btnStyle = "bg-[#090d18]/60 border-white/5 text-slate-500";
                        badgeStyle = "bg-white/5 text-slate-600 border-white/5";
                      }
                    } else if (isSelected) {
                      btnStyle =
                        "bg-violet-950/30 border-violet-500 text-violet-200";
                      badgeStyle =
                        "bg-violet-500/20 text-violet-300 border-violet-500/40 font-bold";
                    }

                    return (
                      <button
                        key={alt.id}
                        onClick={() => handleSelectAlternative(q.id, alt.id)}
                        type="button"
                        className={`w-full text-left p-3 sm:p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3 cursor-pointer group shadow-xs ${btnStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono shrink-0 border transition-colors ${badgeStyle}`}
                        >
                          {(isRevealed || hasAnswered) && isTheCorrectOne ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (isRevealed || hasAnswered) && isSelected && !isCorrect ? (
                            <XCircle size={13} className="text-rose-400" />
                          ) : (
                            alt.id
                          )}
                        </span>
                        <span className="text-xs sm:text-sm leading-snug flex-1 pt-0.5">
                          {alt.texto}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Justificativa / Comentário Oficial */}
                {isRevealed && (
                  <div className="rounded-xl p-4 bg-[#050711] border border-violet-500/30 text-xs space-y-2 mt-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5 text-violet-300 font-bold">
                        <Award size={14} className="text-violet-400" />
                        <span>Gabarito Comentado & Justificativa</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                        Gabarito Oficial: {gabaritoOficial}
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                      {q.justificativa ||
                        `Questão oficial aplicada no concurso ${q.exam?.orgao || "Público"} (${q.exam?.ano || ""}) pela banca ${q.exam?.banca || "Organizadora"}. Cargo: ${q.exam?.cargo || "Geral"}.`}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5">
          <div className="text-xs text-slate-400 font-mono">
            Mostrando{" "}
            <span className="text-slate-200 font-bold">
              {(currentPage - 1) * 20 + 1}
            </span>{" "}
            a{" "}
            <span className="text-slate-200 font-bold">
              {Math.min(currentPage * 20, totalCount)}
            </span>{" "}
            de{" "}
            <span className="text-slate-200 font-bold">{totalCount}</span>{" "}
            questões
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Anterior</span>
            </button>

            {/* Numeric page pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  p = Math.min(totalPages - 4 + i, Math.max(1, currentPage - 2 + i));
                }
                const isActive = p === currentPage;
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    type="button"
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-400/40"
                        : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span>Próxima</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
