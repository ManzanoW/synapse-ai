"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
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
  Zap,
  FileStack,
  ArrowRight,
  ShieldCheck,
  Printer,
  Table,
  Download,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import { ErrorNotebookMetrics, ErrorTaxonomyMetric } from "@/types/quiz";
import { SpotlightTriggerButton } from "@/components/onboarding/PageSpotlightBanner";

interface ErrorMetricsHeaderProps {
  metrics: ErrorNotebookMetrics;
  selectedReason?: string;
  onSelectReason?: (reason: string) => void;
  onBatchClassify?: () => Promise<void> | void;
  onAutoClassify?: () => Promise<void> | void;
  isClassifying?: boolean;
  onOpenRemediationModal?: () => void;
  onToggleSpotlight?: () => void;
  onBatchCreateFlashcards?: () => Promise<void> | void;
  isCreatingBatchFlashcards?: boolean;
  onStartRedemption?: (count?: number) => Promise<void> | void;
  isGeneratingRedemption?: boolean;
  onOpenExportModal?: (tab?: "print" | "anki" | "notion") => void;
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
  onBatchClassify,
  onAutoClassify,
  isClassifying = false,
  onOpenRemediationModal,
  onToggleSpotlight,
  onBatchCreateFlashcards,
  isCreatingBatchFlashcards = false,
  onStartRedemption,
  isGeneratingRedemption = false,
  onOpenExportModal,
}: ErrorMetricsHeaderProps) {
  const [showMoreTools, setShowMoreTools] = React.useState(false);
  const classifyHandler = onBatchClassify || onAutoClassify;
  const { totalErrors, pendingErrors, masteredErrors, masteryRate, taxonomyDistribution } =
    metrics;

  const unclassifiedItem = taxonomyDistribution.find(
    (item) => item.reason === "UNCLASSIFIED"
  );
  const unclassifiedCount = unclassifiedItem?.count ?? 0;

  return (
    <div className="space-y-6 mb-8">
      {/* 1. Header Hero Title & Action Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-medium mb-2 backdrop-blur-md">
              <Sparkles size={14} className="text-violet-400 animate-pulse" />
              <span>Aprenda com seus Erros & Fixe o Conteúdo</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-xl bg-gradient-to-br from-violet-600/30 to-rose-600/30 border border-violet-500/30 text-violet-300 shadow-lg shadow-violet-500/10">
                <BookOpenCheck className="w-7 h-7" />
              </span>
              Caderno de Erros Inteligente
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-1 max-w-2xl">
              Converta falhas em aprovação: entenda por que errou cada questão (falta de atenção, pegadinha ou matéria nova) e faça exercícios com IA para nunca mais errar na prova.
            </p>
          </div>

          {/* Ação Primária em Destaque ao lado do título (se houver pendentes) */}
          {onOpenRemediationModal && pendingErrors > 0 && (
            <div className="w-full sm:w-auto shrink-0 flex items-center">
              <button
                type="button"
                onClick={onOpenRemediationModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-violet-600 to-rose-600 hover:from-amber-400 hover:via-violet-500 hover:to-rose-500 text-white text-xs md:text-sm font-extrabold shadow-lg shadow-violet-600/30 border border-amber-400/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group min-h-[44px]"
              >
                <Zap size={16} className="text-amber-300 fill-amber-300 animate-pulse group-hover:scale-110 transition-transform" />
                <span>Treinar Questões que Errei</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black/30 text-amber-200 border border-white/20">
                  {pendingErrors} pendentes
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Barra de Ferramentas Secundárias Agrupadas ("Mais ferramentas") */}
        <div className="space-y-2.5 pt-2 border-t border-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {onToggleSpotlight && (
                <SpotlightTriggerButton
                  accentColor="emerald"
                  onClick={onToggleSpotlight}
                  label="Como Funciona?"
                />
              )}

              <button
                type="button"
                onClick={() => setShowMoreTools((prev) => !prev)}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[38px] ${
                  showMoreTools
                    ? "bg-violet-600/20 border-violet-500/40 text-violet-200"
                    : "bg-slate-800/70 hover:bg-slate-800 border-white/10 text-slate-300 hover:text-white"
                }`}
              >
                <SlidersHorizontal size={14} className="text-violet-400" />
                <span>Mais ferramentas</span>
                {showMoreTools ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            <Link
              href="/questions"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-all min-h-[38px]"
            >
              <FileStack size={14} />
              <span>Ir para Questões</span>
              <ArrowRight size={12} className="opacity-70" />
            </Link>
          </div>

          {showMoreTools && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-900/80 border border-white/10 animate-in fade-in slide-in-from-top-1 duration-200">
              {onBatchCreateFlashcards && pendingErrors > 0 && (
                <button
                  type="button"
                  onClick={onBatchCreateFlashcards}
                  disabled={isCreatingBatchFlashcards}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 text-xs font-bold shadow-sm transition-all cursor-pointer min-h-[38px]"
                  title="Cria Cartões de Memória com todos os seus erros pendentes para revisar depois"
                >
                  {isCreatingBatchFlashcards ? (
                    <Loader2 size={15} className="animate-spin text-indigo-400" />
                  ) : (
                    <Layers size={15} className="text-indigo-400" />
                  )}
                  <span>Virar Cartões de Memória</span>
                </button>
              )}

              {classifyHandler && unclassifiedCount > 0 && (
                <button
                  type="button"
                  onClick={classifyHandler}
                  disabled={isClassifying}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/40 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 min-h-[38px]"
                  title={`Pedir para a IA descobrir o motivo de até 20 erros (${unclassifiedCount} sem motivo definido)`}
                >
                  {isClassifying ? (
                    <Loader2 size={14} className="animate-spin text-amber-300" />
                  ) : (
                    <Zap size={14} className="text-amber-400" />
                  )}
                  <span>Classificar Motivos com IA ({unclassifiedCount})</span>
                </button>
              )}

              {onOpenExportModal && totalErrors > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenExportModal("print")}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-200 border border-violet-500/40 text-xs font-bold shadow-sm transition-all cursor-pointer min-h-[38px]"
                    title="Apostila diagramada para impressão/PDF das suas questões erradas"
                  >
                    <Printer size={15} className="text-violet-400" />
                    <span>Apostila (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenExportModal("anki")}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-500/40 text-xs font-bold shadow-sm transition-all cursor-pointer min-h-[38px]"
                    title="Exportar Caderno de Erros diretamente para o Anki (.txt)"
                  >
                    <Download size={15} className="text-blue-400" />
                    <span>Exportar Anki</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenExportModal("notion")}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 text-xs font-bold shadow-sm transition-all cursor-pointer min-h-[38px]"
                    title="Exportar para Notion, Planilhas e Excel (.CSV)"
                  >
                    <Table size={15} className="text-emerald-400" />
                    <span>Exportar Notion (.csv)</span>
                  </button>
                </>
              )}
            </div>
          )}
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
              Questões para Rever
            </span>
            <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {pendingErrors}
            </span>
            <span className="text-xs text-rose-300/80">para acertar</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {pendingErrors === 0
              ? "Parabéns! Nenhum erro pendente no momento."
              : "Questões que você errou e pode refazer para aprender."}
          </p>
          {pendingErrors > 0 && onOpenRemediationModal && (
            <button
              type="button"
              onClick={onOpenRemediationModal}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer group"
            >
              <Zap size={13} className="fill-rose-400 group-hover:scale-110 transition-transform" />
              <span className="underline underline-offset-2">Praticar essas questões agora ➔</span>
            </button>
          )}
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
              Erros Já Superados
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
              ({masteredErrors} de {totalErrors} aprendidos)
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
              Total no Caderno
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {totalErrors}
            </span>
            <span className="text-xs text-slate-400">questões salvas</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {masteredErrors} questões que você já acertou na revisão.
          </p>
        </motion.div>
      </div>

      {/* 3. Gráfico / Barra de Motivo dos Erros */}
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
                <span>Por que eu errei essas questões?</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Filtrar por Motivo
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clique em um motivo abaixo para ver apenas as questões daquele tipo.
              </p>
            </div>

            {classifyHandler && unclassifiedCount > 0 && (
              <button
                type="button"
                onClick={classifyHandler}
                disabled={isClassifying}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-violet-600/30 to-rose-500/20 hover:from-amber-500/30 hover:via-violet-600/40 hover:to-rose-500/30 border border-violet-500/50 hover:border-violet-400 text-violet-100 hover:text-white text-xs font-bold transition-all shadow-lg shadow-violet-950/40 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 group"
                title={`Pedir para a IA descobrir o motivo de até 20 erros (${unclassifiedCount} sem motivo definido)`}
              >
                {isClassifying ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-amber-300 shrink-0" />
                    <span>Descobrindo motivos com IA...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} className="text-amber-400 fill-amber-400/30 group-hover:scale-110 transition-transform shrink-0" />
                    <span>⚡ Descobrir Motivo dos Erros com IA</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {unclassifiedCount} pendentes
                    </span>
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
