"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Eye,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Trash2,
  HelpCircle,
  Zap,
  RotateCcw,
  Check,
  X,
  Loader2,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  ErrorNotebookItem,
  ErrorRemediationData,
  DrillQuestion,
} from "@/types/quiz";
import {
  generateErrorRemediationAction,
  markErrorAsMasteredAction,
  markErrorAsPendingAction,
  deleteErrorNotebookItemAction,
} from "@/actions/error-notebook-actions";
import {
  TAXONOMY_METADATA,
  normalizeTaxonomy,
} from "@/lib/error-taxonomy";
import { useGamification } from "@/context/GamificationContext";

interface ErrorCardProps {
  errorItem: ErrorNotebookItem;
  onItemUpdated: (updatedItem: ErrorNotebookItem) => void;
  onItemDeleted: (id: string) => void;
}

const TAXONOMY_ICONS: Record<string, React.ElementType> = {
  CONTENT_GAP: Brain,
  TRICK_QUESTION: Eye,
  INTERPRETATION: AlertCircle,
  TIME_PRESSURE: Clock,
  UNCLASSIFIED: HelpCircle,
};

export function ErrorCard({
  errorItem,
  onItemUpdated,
  onItemDeleted,
}: ErrorCardProps) {
  const { refreshStats } = useGamification();

  // Estados locais
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [remediation, setRemediation] = useState<ErrorRemediationData | null>(
    errorItem.aiExplanation && errorItem.mnemonic && errorItem.drillQuestion
      ? {
          microExplanation: errorItem.aiExplanation,
          mnemonicOrRule: errorItem.mnemonic,
          drillQuestion: errorItem.drillQuestion,
        }
      : null
  );

  // Estados da questão de fixação
  const [selectedDrillOption, setSelectedDrillOption] = useState<string | null>(
    null
  );
  const [isDrillChecked, setIsDrillChecked] = useState(false);
  const [isDrillCorrect, setIsDrillCorrect] = useState<boolean | null>(null);

  // Estado de mutação
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const normalizedReason = normalizeTaxonomy(errorItem.errorReason);
  const meta = TAXONOMY_METADATA[normalizedReason] || TAXONOMY_METADATA.UNCLASSIFIED;
  const TaxonomyIcon = TAXONOMY_ICONS[normalizedReason] || AlertCircle;
  const isMastered = errorItem.status === "MASTERED";

  // Formatação do enunciado com negritos
  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={i}
            className="text-violet-200 font-semibold bg-violet-500/15 px-1 py-0.5 rounded border border-violet-500/20"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  // Dispara a geração ou expansão de remediação com IA
  const handleToggleAiRemediation = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    setIsExpanded(true);

    if (remediation) return;

    setIsGeneratingAi(true);
    try {
      const res = await generateErrorRemediationAction({
        errorId: errorItem.id,
        questionText: errorItem.questionText,
        userAnswer: errorItem.userAnswer,
        correctAnswer: errorItem.correctAnswer,
        explanation: errorItem.explanation || undefined,
        errorReason: errorItem.errorReason,
        subjectName: errorItem.subject?.name,
        topicTitle: errorItem.topic?.title,
      });

      if (res.success && res.data) {
        setRemediation(res.data);
        onItemUpdated({
          ...errorItem,
          aiExplanation: res.data.microExplanation,
          mnemonic: res.data.mnemonicOrRule,
          drillQuestion: res.data.drillQuestion,
        });
      }
    } catch (err) {
      console.error("Erro ao gerar remediação:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Alterna o status Superado vs Pendente
  const handleToggleMastered = async () => {
    setIsUpdatingStatus(true);
    try {
      if (isMastered) {
        const res = await markErrorAsPendingAction(errorItem.id);
        if (res.success) {
          onItemUpdated({
            ...errorItem,
            status: "PENDING",
            masteredAt: null,
          });
        }
      } else {
        const res = await markErrorAsMasteredAction(errorItem.id, false);
        if (res.success) {
          onItemUpdated({
            ...errorItem,
            status: "MASTERED",
            masteredAt: new Date(),
          });
          confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.7 },
          });
          await refreshStats();
          window.dispatchEvent(new Event("xp-updated"));
        }
      }
    } catch (err) {
      console.error("Erro ao alternar status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Responde à micro-questão de fixação
  const handleVerifyDrillAnswer = async () => {
    if (!selectedDrillOption || !remediation?.drillQuestion) return;

    const correct =
      selectedDrillOption.trim().toUpperCase() ===
      remediation.drillQuestion.gabaritoCorreto.trim().toUpperCase();

    setIsDrillChecked(true);
    setIsDrillCorrect(correct);

    if (correct) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Marca o erro como superado com ganho adicional de XP e progresso na missão diária
      if (!isMastered) {
        setIsUpdatingStatus(true);
        try {
          const res = await markErrorAsMasteredAction(errorItem.id, true);
          if (res.success) {
            onItemUpdated({
              ...errorItem,
              status: "MASTERED",
              masteredAt: new Date(),
            });
            await refreshStats();
            window.dispatchEvent(new Event("xp-updated"));
          }
        } finally {
          setIsUpdatingStatus(false);
        }
      }
    }
  };

  // Deleta o item do caderno
  const handleDelete = async () => {
    if (!window.confirm("Deseja realmente remover esta questão do Caderno de Erros?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteErrorNotebookItemAction(errorItem.id);
      if (res.success) {
        onItemDeleted(errorItem.id);
      }
    } catch (err) {
      console.error("Erro ao excluir questão:", err);
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl backdrop-blur-xl border transition-all duration-300 overflow-hidden shadow-xl ${
        isMastered
          ? "bg-slate-900/50 border-emerald-500/30 hover:border-emerald-500/50 shadow-emerald-950/10"
          : "bg-slate-900/70 border-violet-500/20 hover:border-violet-500/40 shadow-violet-950/15"
      }`}
    >
      {/* 1. Header do Card */}
      <div className="p-4 sm:p-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Matéria e Tópico */}
          {errorItem.subject && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: `${errorItem.subject.color || "#6366F1"}20`,
                color: errorItem.subject.color || "#818CF8",
                borderColor: `${errorItem.subject.color || "#6366F1"}40`,
                borderWidth: 1,
              }}
            >
              <span>{errorItem.subject.name}</span>
              {errorItem.topic && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="opacity-90">{errorItem.topic.title}</span>
                </>
              )}
            </span>
          )}

          {/* Badge de Causa-Raiz Taxonômica */}
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
            style={{
              backgroundColor: `${meta.color}15`,
              color: meta.color,
              borderColor: `${meta.color}35`,
            }}
          >
            <TaxonomyIcon size={13} />
            <span>{meta.label}</span>
          </span>

          {/* Badge de Status */}
          {isMastered ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              <CheckCircle2 size={12} />
              <span>Superado</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300">
              <AlertCircle size={12} />
              <span>Pendente</span>
            </span>
          )}
        </div>

        {/* Ações de topo */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Remover do Caderno de Erros"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* 2. Corpo do Card: Enunciado e Comparação de Respostas */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Enunciado */}
        <div className="text-sm md:text-base text-slate-200 leading-relaxed">
          {renderFormattedText(errorItem.questionText)}
        </div>

        {/* Comparação: O que você marcou vs. Gabarito Oficial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Alternativa marcada pelo aluno */}
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5">
            <div className="p-1 rounded-full bg-rose-500/20 text-rose-400 mt-0.5 shrink-0">
              <X size={14} />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-rose-300 block mb-0.5">
                Sua Resposta:
              </span>
              <span className="text-slate-200">
                {errorItem.userAnswer || "Não informada"}
              </span>
            </div>
          </div>

          {/* Gabarito oficial correto */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5">
            <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
              <Check size={14} />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-emerald-300 block mb-0.5">
                Gabarito Oficial:
              </span>
              <span className="text-slate-200 font-medium">
                {errorItem.correctAnswer}
              </span>
            </div>
          </div>
        </div>

        {/* Justificativa Original da Banca (se existir) */}
        {errorItem.explanation && (
          <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300 block mb-1">
              Justificativa da Banca:
            </span>
            <p className="leading-relaxed">{errorItem.explanation}</p>
          </div>
        )}
      </div>

      {/* 3. Barra de Ações do Card */}
      <div className="px-4 sm:px-5 py-3 bg-slate-900/90 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
        {/* Botão de Expansão IA */}
        <button
          onClick={handleToggleAiRemediation}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-md ${
            isExpanded
              ? "bg-violet-600/30 border-violet-400 text-violet-200"
              : "bg-gradient-to-r from-violet-600/20 to-rose-600/20 hover:from-violet-600/30 hover:to-rose-600/30 border-violet-500/40 text-violet-200 hover:border-violet-400 hover:shadow-violet-500/15"
          }`}
        >
          <Sparkles size={14} className="text-violet-400" />
          <span>{isExpanded ? "Ocultar Análise IA" : "✨ Analisar Causa com IA"}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Botão de Marcar como Superado */}
        <button
          onClick={handleToggleMastered}
          disabled={isUpdatingStatus}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
            isMastered
              ? "bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700"
              : "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300"
          }`}
        >
          {isUpdatingStatus ? (
            <Loader2 size={13} className="animate-spin" />
          ) : isMastered ? (
            <RotateCcw size={13} />
          ) : (
            <CheckCircle2 size={13} />
          )}
          <span>
            {isMastered ? "Reabrir para Treino" : "Marcar como Superado"}
          </span>
        </button>
      </div>

      {/* 4. Gaveta Expansível de Remediação com IA */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-violet-500/20 bg-gradient-to-b from-violet-950/20 via-slate-900/90 to-slate-950 p-4 sm:p-6 space-y-6"
          >
            {/* Loading Skeleton da IA */}
            {isGeneratingAi && (
              <div className="p-6 rounded-2xl bg-violet-500/5 border border-violet-500/20 space-y-4 animate-pulse">
                <div className="flex items-center gap-3 text-violet-300 text-sm font-semibold">
                  <Loader2 size={18} className="animate-spin text-violet-400" />
                  <span>
                    A IA pedagógica está desarmando a pegadinha e gerando item de fixação...
                  </span>
                </div>
                <div className="h-4 bg-violet-500/15 rounded-md w-3/4" />
                <div className="h-4 bg-violet-500/10 rounded-md w-full" />
                <div className="h-4 bg-violet-500/10 rounded-md w-5/6" />
              </div>
            )}

            {/* Conteúdo de Remediação Carregado */}
            {!isGeneratingAi && remediation && (
              <div className="space-y-6">
                {/* 4.1 Micro-Explicação: Desarmamento Cognitivo */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-wider">
                    <Brain size={15} />
                    <span>Desarmamento Conceitual da Causa-Raiz</span>
                  </div>
                  <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-sm text-slate-200 leading-relaxed space-y-2">
                    {remediation.microExplanation
                      .split("\n\n")
                      .map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                  </div>
                </div>

                {/* 4.2 Mnemônico ou Regra Prática de Memorização */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Lightbulb size={15} />
                    <span>Mnemônico / Regra de Ouro</span>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-transparent border border-amber-500/30 text-sm text-amber-200 font-medium leading-relaxed flex items-start gap-3 shadow-inner">
                    <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>{remediation.mnemonicOrRule}</div>
                  </div>
                </div>

                {/* 4.3 Micro-Questão Inédita de Fixação Ativa */}
                {remediation.drillQuestion && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                        <Target size={15} />
                        <span>Item de Fixação Imediata (Treino Ativo)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                        +50 XP ao acertar
                      </span>
                    </div>

                    <div className="text-sm font-medium text-white leading-relaxed">
                      {remediation.drillQuestion.enunciado}
                    </div>

                    {/* Alternativas da Questão Inédita */}
                    <div className="space-y-2 pt-1">
                      {remediation.drillQuestion.alternativas.map((alt) => {
                        const isSelected = selectedDrillOption === alt.id;
                        const isCorrectAlt =
                          alt.id.toUpperCase() ===
                          remediation.drillQuestion?.gabaritoCorreto.toUpperCase();

                        let itemStyle =
                          "bg-slate-800/60 border-white/10 hover:bg-slate-800 hover:border-indigo-500/40 text-slate-300";

                        if (isDrillChecked) {
                          if (isCorrectAlt) {
                            itemStyle =
                              "bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold";
                          } else if (isSelected && !isCorrectAlt) {
                            itemStyle =
                              "bg-rose-500/20 border-rose-500 text-rose-200 font-semibold";
                          } else {
                            itemStyle =
                              "bg-slate-800/40 border-white/5 text-slate-500 opacity-60";
                          }
                        } else if (isSelected) {
                          itemStyle =
                            "bg-indigo-600/30 border-indigo-500 text-indigo-200 font-semibold shadow-md shadow-indigo-500/10";
                        }

                        return (
                          <button
                            key={alt.id}
                            disabled={isDrillChecked && isDrillCorrect === true}
                            onClick={() => {
                              if (!isDrillChecked || isDrillCorrect === false) {
                                setSelectedDrillOption(alt.id);
                                setIsDrillChecked(false);
                              }
                            }}
                            className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm flex items-start gap-3 transition-all cursor-pointer ${itemStyle}`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected
                                  ? "bg-indigo-500 text-white"
                                  : "bg-slate-700/60 text-slate-300"
                              }`}
                            >
                              {alt.id}
                            </span>
                            <span className="flex-1 mt-0.5 leading-relaxed">
                              {alt.texto}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback e Justificativa da Questão de Fixação */}
                    {isDrillChecked && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 ${
                          isDrillCorrect
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                            : "bg-rose-500/15 border-rose-500/30 text-rose-200"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          {isDrillCorrect ? (
                            <>
                              <CheckCircle2 size={16} className="text-emerald-400" />
                              <span>Fixação Concluída com Sucesso! (+50 XP)</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={16} className="text-rose-400" />
                              <span>Não foi dessa vez. Revise a justificativa abaixo:</span>
                            </>
                          )}
                        </div>
                        <p className="text-slate-300 pt-1">
                          {remediation.drillQuestion.justificativa}
                        </p>
                      </motion.div>
                    )}

                    {/* Botão de Verificação do Drill */}
                    {(!isDrillChecked || isDrillCorrect === false) && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={handleVerifyDrillAnswer}
                          disabled={!selectedDrillOption}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          Confirmar Resposta de Fixação
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
