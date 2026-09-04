"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  BookOpenCheck,
  Brain,
  Eye,
  Clock,
  Sparkles,
  Layers,
  Loader2,
} from "lucide-react";
import { ErrorNotebookMetrics, ErrorTaxonomyMetric } from "@/types/quiz";

interface ErrorMetricsHeaderProps {
  metrics: ErrorNotebookMetrics;
  selectedReason?: string;
  onSelectReason?: (reason: string) => void;
  onAutoClassify?: () => Promise<void> | void;
  isClassifying?: boolean;
}

const TAXONOMY_ICONS: Record<string, React.ElementType> = {
  CONTENT_GAP: Brain,
  TRICK_QUESTION: Eye,
  INTERPRETATION: AlertCircle,
  TIME_PRESSURE: Clock,
  UNCLASSIFIED: Layers,
};

export function ErrorMetricsHeader({
  metrics,
  selectedReason = "ALL",
  onSelectReason,
  onAutoClassify,
  isClassifying = false,
}: ErrorMetricsHeaderProps) {
  const { totalErrors, pendingErrors, masteredErrors, masteryRate, taxonomyDistribution } =
    metrics;

  const unclassifiedItem = taxonomyDistribution.find(
    (item) => item.reason === "UNCLASSIFIED"
  );
  const unclassifiedCount = unclassifiedItem?.count ?? 0;

  return (
    <div className="space-y-6 mb-8">
      {/* 1. Header Hero Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-medium mb-2 backdrop-blur-md">
            <Sparkles size={14} className="text-violet-400 animate-pulse" />
            <span>Diagnóstico Taxonômico & Aprendizado Ativo</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-violet-600/30 to-rose-600/30 border border-violet-500/30 text-violet-300 shadow-lg shadow-violet-500/10">
              <BookOpenCheck className="w-7 h-7" />
            </span>
            Caderno de Erros Inteligente
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-1 max-w-2xl">
            Converta falhas em aprovação: diagnostique a causa-raiz de cada erro em
            simulado, gere desarmamentos conceituais e resolva questões de fixação sob demanda via IA.
          </p>
        </div>
      </div>

      {/* 2. Grid de Métricas Principais com Glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Erros Pendentes */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-rose-950/20 border border-rose-500/30 p-5 backdrop-blur-xl shadow-xl shadow-rose-950/20"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
              Pendentes de Revisão
            </span>
            <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {pendingErrors}
            </span>
            <span className="text-xs text-rose-300/80">questões a superar</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {pendingErrors === 0
              ? "Parabéns! Nenhum erro pendente no momento."
              : "Requerem análise de causa-raiz e fixação ativa."}
          </p>
        </motion.div>

        {/* Card 2: Taxa de Superação */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-violet-950/20 border border-violet-500/30 p-5 backdrop-blur-xl shadow-xl shadow-violet-950/20"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
              Taxa de Superação
            </span>
            <div className="p-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {masteryRate}%
            </span>
            <span className="text-xs text-violet-300/80">
              ({masteredErrors} de {totalErrors})
            </span>
          </div>
          {/* Barra de Progresso */}
          <div className="w-full bg-slate-800/80 rounded-full h-2 mt-3 overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${masteryRate}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-400 rounded-full"
            />
          </div>
        </motion.div>

        {/* Card 3: Total Registrado */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/40 border border-white/10 p-5 backdrop-blur-xl shadow-xl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Total Catalogado
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {totalErrors}
            </span>
            <span className="text-xs text-slate-400">erros mapeados</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {masteredErrors} dominados após treino com fixação sob demanda.
          </p>
        </motion.div>
      </div>

      {/* 3. Gráfico / Barra de Distribuição Taxonômica */}
      {totalErrors > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Distribuição da Causa-Raiz dos Erros</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Taxonomia Ativa
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clique nas categorias para filtrar a lista de questões instantaneamente.
              </p>
            </div>

            {onAutoClassify && (
              <button
                type="button"
                onClick={onAutoClassify}
                disabled={isClassifying || unclassifiedCount === 0}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600/30 via-indigo-600/30 to-violet-600/30 hover:from-violet-600/50 hover:to-indigo-600/50 border border-violet-500/40 hover:border-violet-500/70 text-violet-200 hover:text-white text-xs font-bold transition-all shadow-lg shadow-violet-950/40 active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                title={
                  unclassifiedCount === 0
                    ? "Todas as falhas pendentes já foram diagnosticadas"
                    : `Diagnosticar ${unclassifiedCount} questão(ões) não classificadas com IA`
                }
              >
                {isClassifying ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-violet-300 shrink-0" />
                    <span>Diagnosticando falhas com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-violet-300 animate-pulse shrink-0" />
                    <span>✨ Diagnosticar Falhas Pendentes com IA</span>
                    {unclassifiedCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-violet-500/30 text-violet-200 border border-violet-500/30">
                        {unclassifiedCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Barra multicolorida representativa */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            {taxonomyDistribution
              .filter((item) => item.count > 0)
              .map((item) => (
                <div
                  key={item.reason}
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                  className="h-full transition-all duration-500 hover:opacity-85 relative group"
                  title={`${item.label}: ${item.count} (${item.percentage}%)`}
                />
              ))}
          </div>

          {/* Badges Interativas */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => onSelectReason?.("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                selectedReason === "ALL"
                  ? "bg-white/15 border-white text-white shadow-md"
                  : "bg-slate-800/60 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              Todas ({totalErrors})
            </button>

            {taxonomyDistribution.map((item) => {
              const Icon = TAXONOMY_ICONS[item.reason] || AlertCircle;
              const isSelected = selectedReason === item.reason;

              return (
                <button
                  key={item.reason}
                  onClick={() => onSelectReason?.(item.reason)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? "shadow-md scale-105"
                      : "opacity-80 hover:opacity-100 hover:scale-102"
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? `${item.color}25`
                      : `${item.color}10`,
                    borderColor: isSelected ? item.color : `${item.color}40`,
                    color: item.color,
                  }}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                  <span
                    className="ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-bold"
                    style={{
                      backgroundColor: `${item.color}30`,
                    }}
                  >
                    {item.count} ({item.percentage}%)
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
