"use client";

import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Sparkles,
  Printer,
  ChevronDown,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { EssayEvaluationResult } from "@/actions/essay-actions";
import { GoldenVersionSplitView } from "./GoldenVersionSplitView";

interface EssayResultViewProps {
  result: EssayEvaluationResult;
  onNewEssay: () => void;
  onViewHistory: () => void;
}

export function EssayResultView({
  result,
  onNewEssay,
  onViewHistory,
}: EssayResultViewProps) {
  const [copiedGolden, setCopiedGolden] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"feedback" | "golden" | "original">("feedback");

  const scorePercentage = Math.round((result.score / result.maxScore) * 100);
  const isApproved = result.isApproved;

  const handleCopyGolden = () => {
    if (result.goldenVersion) {
      navigator.clipboard.writeText(result.goldenVersion);
      setCopiedGolden(true);
      setTimeout(() => setCopiedGolden(false), 2000);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* CARD PRINCIPAL DO VEREDITO DA BANCA */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xl dark:shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
          isApproved
            ? "bg-emerald-50/70 border-emerald-200 text-slate-900 dark:bg-slate-950 dark:bg-gradient-to-br dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-950 dark:border-emerald-500/30 dark:shadow-emerald-950/20"
            : "bg-rose-50/70 border-rose-200 text-slate-900 dark:bg-slate-950 dark:bg-gradient-to-br dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-950 dark:border-rose-500/30 dark:shadow-rose-950/20"
        }`}
      >
        {/* Lado Esquerdo: Dados da Prova e Veredito */}
        <div className="flex flex-col gap-2 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 dark:bg-white/10 dark:text-white dark:border-transparent shadow-2xs">
              Banca {result.banca}
            </span>
            {result.subjectArea && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30">
                {result.subjectArea}
              </span>
            )}
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 flex items-center gap-1">
              <Sparkles size={11} />
              +120 XP Ganho
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mt-1">
            {result.themeTitle}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed break-words">
            {result.generalFeedback}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>⏱️ Tempo: {Math.round(result.durationSeconds / 60)} min</span>
            <span>📝 {result.wordCount} palavras</span>
            <span>📄 {result.lineCount} linhas</span>
          </div>
        </div>

        {/* Lado Direito: Carimbo Oficial e Nota */}
        <div className="flex flex-col items-center justify-center shrink-0 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 p-6 rounded-2xl min-w-[220px] text-center shadow-xs dark:shadow-xl">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            Nota Discursiva
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            {result.score.toFixed(1)}
            <span className="text-base sm:text-lg font-normal text-slate-400">
              /{result.maxScore}
            </span>
          </div>

          {/* Selo de Aprovação ou Reprovação */}
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-2xs ${
              isApproved
                ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                : "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40"
            }`}
          >
            {isApproved ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Aprovado na Discursiva</span>
              </>
            ) : (
              <>
                <XCircle size={14} className="text-rose-600 dark:text-rose-400" />
                <span>Abaixo da Nota de Corte</span>
              </>
            )}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
            {scorePercentage}% de aproveitamento
          </div>

          {result.notaConteudo !== undefined && result.descontoFormal !== undefined && (
            <div className="mt-2 text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-lg">
              <span>NC: <strong>{result.notaConteudo.toFixed(1)}</strong></span>
              <span className="mx-1 text-slate-400 dark:text-slate-500">•</span>
              <span>Desc: <strong className="text-rose-600 dark:text-rose-400">-{result.descontoFormal.toFixed(2)}</strong> ({result.numeroErros ?? 0} {result.numeroErros === 1 ? "erro" : "erros"})</span>
            </div>
          )}
        </div>
      </div>

      {/* BARRA DE BOTÕES DE AÇÃO */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("feedback")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "feedback"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Parecer da Banca
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("golden")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "golden"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Sparkles size={13} />
            <span>Versão Padrão Ouro (Nota 100)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("original")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "original"
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Texto Enviado
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-white/10 transition-colors cursor-pointer shadow-2xs"
            title="Imprimir Relatório de Correção"
          >
            <Printer size={13} />
            <span>Imprimir / PDF</span>
          </button>

          <button
            type="button"
            onClick={onViewHistory}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-white/10 transition-colors cursor-pointer shadow-2xs"
          >
            Histórico
          </button>

          <button
            type="button"
            onClick={onNewEssay}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/30 transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Nova Redação</span>
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA SELECIONADA */}

      {/* ABA 1: PARECER DA BANCA & CRITÉRIOS */}
      {activeTab === "feedback" && (
        <div className="flex flex-col gap-6">
          {/* GRADE DOS 4 CRITÉRIOS OFICIAIS */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Award size={16} className="text-violet-600 dark:text-violet-400" />
              <span>Desdobramento por Critérios de Avaliação</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.criteriaScores.map((crit, idx) => {
                const perc = Math.round((crit.awardedScore / crit.maxScore) * 100);
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xs dark:shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                          {crit.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-violet-700 dark:text-violet-300 shrink-0">
                          {crit.awardedScore.toFixed(1)} / {crit.maxScore} pts
                        </span>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            perc >= 75
                              ? "bg-emerald-500"
                              : perc >= 55
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, perc))}%` }}
                        />
                      </div>

                      <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {crit.comments}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABELA DETALHADA: APONTAMENTOS LINHA A LINHA */}
          {result.lineErrors && result.lineErrors.length > 0 && (
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xs dark:shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-500 dark:text-amber-400" size={16} />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Apontamentos Linha a Linha do Examinador ({result.lineErrors.length} ocorrências)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Identificação direta no texto
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5 overflow-x-auto">
                {result.lineErrors.map((err, i) => (
                  <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 font-mono text-[11px] font-bold dark:border-indigo-500/30">
                        Linha {err.line.toString().padStart(2, "0")}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-transparent font-mono text-[10px] font-semibold">
                        {err.errorType}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1.5 rounded-md border border-rose-200 dark:border-rose-500/20 inline-block mb-1.5 break-words break-all max-w-full font-bold">
                        &quot;{err.excerpt}&quot;
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-1.5 break-words">
                        {err.explanation}
                      </p>
                      {err.suggestion && (
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                          <span>💡 Sugestão da Banca:</span>
                          <span className="font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 px-1.5 py-0.5 rounded dark:border-emerald-500/20 font-bold">
                            {err.suggestion}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PONTOS FORTES E PONTOS CRÍTICOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pontos Fortes */}
            <div className="bg-emerald-50/70 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-500/20 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 size={16} />
                <span>Pontos Fortes (O que Manter)</span>
              </div>
              <ul className="space-y-2">
                {result.strengths.map((st, i) => (
                  <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pontos Críticos */}
            <div className="bg-rose-50/70 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-500/20 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-2 text-rose-800 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle size={16} />
                <span>Pontos Críticos (Corrigir Urgente)</span>
              </div>
              <ul className="space-y-2">
                {result.improvements.map((im, i) => (
                  <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0">✕</span>
                    <span>{im}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: VERSÃO PADRÃO OURO COMPARATIVA */}
      {activeTab === "golden" && (
        <GoldenVersionSplitView
          originalText={result.content}
          goldenVersion={result.goldenVersion}
          banca={result.banca}
          score={result.score}
          maxScore={result.maxScore}
          lineCount={result.lineCount}
          wordCount={result.wordCount}
          lineErrors={result.lineErrors}
          strengths={result.strengths}
        />
      )}

      {/* ABA 3: TEXTO ORIGINAL DO ALUNO */}
      {activeTab === "original" && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xs dark:shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Texto Original Submetido
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {result.wordCount} palavras • {result.lineCount} linhas registradas
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 sm:p-6 text-slate-800 dark:text-slate-200 text-sm font-serif leading-relaxed whitespace-pre-wrap break-words overflow-x-hidden shadow-2xs">
            {result.content}
          </div>
        </div>
      )}
    </div>
  );
}
