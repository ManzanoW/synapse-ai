"use client";

import React, { useState, useEffect } from "react";
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
  Lock,
  Crown,
  Film,
  Headphones,
  VolumeX,
  Layers,
  Flame,
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { tts } from "@/lib/tts-engine";
import { RewardedAdModal } from "@/components/quota/RewardedAdModal";
import {
  triggerAiQuotaRefresh,
  triggerOptimisticEnergyConsumption,
  triggerSynapticExhaustion,
} from "@/lib/quota-events";
import {
  ErrorNotebookItem,
  ErrorRemediationData,
  DrillQuestion,
} from "@/types/quiz";
import {
  analyzeSingleErrorAction,
  generateErrorRemediationAction,
  markErrorAsMasteredAction,
  markErrorAsPendingAction,
  deleteErrorNotebookItemAction,
  convertErrorToFlashcardAction,
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
  isConvertingId?: string | null;
  convertedIds?: Set<string>;
  onSaveFlashcard?: (id: string) => Promise<void> | void;
  index?: number;
  recurrentCount?: number;
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
  isConvertingId,
  convertedIds,
  onSaveFlashcard,
  index,
  recurrentCount,
}: ErrorCardProps) {
  const { refreshStats } = useGamification();

  // Estados locais
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [quotaErrorMessage, setQuotaErrorMessage] = useState<string | null>(null);
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
  const [isSpeakingMnemonic, setIsSpeakingMnemonic] = useState(false);

  // Estados para conversão em Flashcard em 1-Clique (Zero Tokens de IA)
  const [localConvertingId, setLocalConvertingId] = useState<string | null>(null);
  const [localConvertedIds, setLocalConvertedIds] = useState<Set<string>>(new Set());

  const isConverting =
    isConvertingId !== undefined
      ? isConvertingId === errorItem.id
      : localConvertingId === errorItem.id;
  const isConverted =
    convertedIds !== undefined
      ? convertedIds.has(errorItem.id)
      : localConvertedIds.has(errorItem.id);

  const handleSaveFlashcard = async () => {
    if (isConverting || isConverted) return;
    if (onSaveFlashcard) {
      await onSaveFlashcard(errorItem.id);
      return;
    }
    setLocalConvertingId(errorItem.id);
    try {
      const res = await convertErrorToFlashcardAction(errorItem.id);
      if (res.success) {
        setLocalConvertedIds((prev) => new Set(prev).add(errorItem.id));
      }
    } catch (err) {
      console.error("Erro ao converter em flashcard:", err);
    } finally {
      setLocalConvertingId(null);
    }
  };

  const handleToggleSpeakMnemonic = (text: string) => {
    if (isSpeakingMnemonic) {
      tts.stop();
      setIsSpeakingMnemonic(false);
    } else {
      setIsSpeakingMnemonic(true);
      tts.speak(text, {
        onEnd: () => setIsSpeakingMnemonic(false),
        onError: () => setIsSpeakingMnemonic(false),
      });
    }
  };

  useEffect(() => {
    return () => {
      tts.stop();
    };
  }, []);

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

    setIsGeneratingAi(true);
    setIsQuotaExceeded(false);

    // Disparo otimista visual (-1⚡ Sinapse para Remediação Cognitiva)
    triggerOptimisticEnergyConsumption({
      cost: 1,
      feature: "REMEDIATION",
      label: "Remediação de Erro",
    });

    try {
      const res = await analyzeSingleErrorAction({
        errorId: errorItem.id,
        questionText: errorItem.questionText,
        userAnswer: errorItem.userAnswer,
        correctAnswer: errorItem.correctAnswer,
        explanation: errorItem.explanation || undefined,
        errorReason: errorItem.errorReason,
        subjectName: errorItem.subject?.name,
        topicTitle: errorItem.topic?.title,
      });

      if (res.isQuotaExceeded) {
        setIsQuotaExceeded(true);
        setQuotaErrorMessage(
          res.error || "Limite diário de ajudas e macetes com IA atingido."
        );
        triggerSynapticExhaustion({
          feature: "REMEDIATION",
          reason: res.error || "Limite diário de remediações atingido.",
        });
        return;
      }

      if (res.success && res.data) {
        triggerAiQuotaRefresh();
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

  const handleRewardClaimed = async () => {
    setShowAdModal(false);
    setIsQuotaExceeded(false);
    setIsGeneratingAi(true);
    try {
      const res = await analyzeSingleErrorAction({
        errorId: errorItem.id,
        questionText: errorItem.questionText,
        userAnswer: errorItem.userAnswer,
        correctAnswer: errorItem.correctAnswer,
        explanation: errorItem.explanation || undefined,
        errorReason: errorItem.errorReason,
        subjectName: errorItem.subject?.name,
        topicTitle: errorItem.topic?.title,
      });

      if (res.isQuotaExceeded) {
        setIsQuotaExceeded(true);
        setQuotaErrorMessage(res.error || "Limite diário atingido.");
        return;
      }

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
      console.error("Erro ao gerar remediação pós-bônus:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Alterna o status Superado vs Pendente
  const handleToggleMastered = async () => {
    setIsUpdatingStatus(true);
    try {
      if (isMastered) {
        triggerHaptic("light");
        const res = await markErrorAsPendingAction(errorItem.id);
        if (res.success) {
          onItemUpdated({
            ...errorItem,
            status: "PENDING",
            masteredAt: null,
          });
        }
      } else {
        triggerHaptic("success");
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
      triggerHaptic("success");
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
    } else {
      triggerHaptic("warning");
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
      className={`rounded-3xl backdrop-blur-xl border transition-all duration-300 overflow-hidden shadow-2xl relative ${
        isMastered
          ? "bg-slate-900/80 border-emerald-500/30 hover:border-emerald-500/50 shadow-emerald-950/15 border-l-4 border-l-emerald-500"
          : "bg-slate-900/85 border-white/10 hover:border-rose-500/40 shadow-rose-950/20 border-l-4 border-l-rose-500"
      }`}
    >
      {/* 1. Header do Card */}
      <div className="p-4 sm:p-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {index !== undefined && (
            <span className="px-2.5 py-1 rounded-xl text-xs font-black font-mono bg-white/10 text-white border border-white/10 shadow-xs">
              #{index}
            </span>
          )}
          {recurrentCount !== undefined && recurrentCount > 1 && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs"
              title={`Questão com erro repetido (${recurrentCount} ocorrências registradas)`}
            >
              <Flame size={12} className="text-amber-400" />
              <span>Reincidente (${recurrentCount}x)</span>
            </span>
          )}
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
              <span>Dominada</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300">
              <AlertCircle size={12} />
              <span>Para Revisar</span>
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
        <div className="text-[15px] sm:text-base text-slate-100 font-sans leading-relaxed tracking-normal p-1">
          {renderFormattedText(errorItem.questionText)}
        </div>

        {/* Comparação: O que você marcou vs. Gabarito Oficial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3">
          {/* Alternativa marcada pelo aluno */}
          <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3 shadow-inner">
            <div className="p-1 rounded-full bg-rose-500/20 text-rose-400 mt-0.5 shrink-0">
              <X size={14} />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-rose-300 block mb-0.5">
                Sua Resposta:
              </span>
              <span className="text-sm font-bold text-white block mt-0.5">
                {errorItem.userAnswer || "Não informada"}
              </span>
            </div>
          </div>

          {/* Gabarito oficial correto */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3 shadow-inner">
            <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
              <Check size={14} />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-emerald-300 block mb-0.5">
                Resposta Correta (Gabarito):
              </span>
              <span className="text-sm font-bold text-emerald-200 block mt-0.5">
                {errorItem.correctAnswer}
              </span>
            </div>
          </div>
        </div>

        {/* Justificativa Original da Banca (se existir) */}
        {errorItem.explanation && (
          <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300 block mb-1">
              Explicação da Questão:
            </span>
            <p className="leading-relaxed">{errorItem.explanation}</p>
          </div>
        )}
      </div>

      {/* 3. Barra de Ações do Card */}
      <div className="px-4 sm:px-5 py-3 bg-slate-900/90 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Botão de Expansão IA */}
        <button
          onClick={handleToggleAiRemediation}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-md min-h-[44px] ${
            isExpanded
              ? "bg-violet-600/30 border-violet-400 text-violet-200"
              : "bg-gradient-to-r from-violet-600/20 to-rose-600/20 hover:from-violet-600/30 hover:to-rose-600/30 border-violet-500/40 text-violet-200 hover:border-violet-400 hover:shadow-violet-500/15"
          }`}
        >
          <Sparkles size={14} className="text-violet-400" />
          <span>
            {isExpanded ? "Ocultar Explicação" : "💡 Ver Explicação Fácil e Macete"}
          </span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Botão de Ação Rápida: Salvar Cartão de Memória em 1-Clique */}
        <button
          onClick={handleSaveFlashcard}
          disabled={isConverting || isConverted}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border min-h-[44px] ${
            isConverted
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 cursor-not-allowed opacity-90 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              : "bg-indigo-600/10 hover:bg-indigo-600/20 border-indigo-500/30 text-indigo-200 hover:text-white hover:border-indigo-400"
          }`}
          title={
            isConverted
              ? "Cartão de memória já salvo nos seus baralhos"
              : "Transformar esta questão em um Cartão de Memória para revisar depois"
          }
        >
          {isConverting ? (
            <Loader2 size={13} className="animate-spin text-indigo-400" />
          ) : isConverted ? (
            <Check size={13} className="text-emerald-400" />
          ) : (
            <Layers size={13} className="text-indigo-400" />
          )}
          <span>{isConverted ? "Cartão Criado ✓" : "🎴 Criar Cartão de Memória"}</span>
        </button>

        {/* Botão de Marcar como Dominada */}
        <button
          onClick={handleToggleMastered}
          disabled={isUpdatingStatus}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border min-h-[44px] ${
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
            {isMastered ? "Voltar para Revisão" : "✅ Já Aprendi (Marcar como Dominada)"}
          </span>
        </button>
      </div>

      {/* 4. Gaveta Expansível de Explicação com IA */}
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
                    Preparando uma explicação simples, um macete e um teste rápido para você...
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
                {/* 4.1 Micro-Explicação */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-wider">
                    <Brain size={15} />
                    <span>Por que você errou e como acertar na próxima</span>
                  </div>
                  <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-sm text-slate-200 leading-relaxed space-y-2">
                    {remediation.microExplanation
                      .split("\n\n")
                      .map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                  </div>
                </div>

                {/* 4.2 Macete ou Regra Prática de Memorização */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={15} />
                      <span>Macete Fácil para Lembrar na Prova</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleSpeakMnemonic(remediation.mnemonicOrRule)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                        isSpeakingMnemonic
                          ? "bg-amber-500/20 border-amber-400 text-amber-200"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                      }`}
                      title={isSpeakingMnemonic ? "Pausar leitura de áudio" : "Ouvir macete em voz alta"}
                    >
                      {isSpeakingMnemonic ? (
                        <VolumeX size={13} className="text-amber-400 animate-pulse" />
                      ) : (
                        <Headphones size={13} className="text-amber-400" />
                      )}
                      <span>{isSpeakingMnemonic ? "Pausar" : "Ouvir Áudio"}</span>
                    </button>
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
                        <span>🎯 Teste Rápido: Veja se você aprendeu</span>
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
                                triggerHaptic("light");
                                setSelectedDrillOption(alt.id);
                                setIsDrillChecked(false);
                              }
                            }}
                            className={`w-full p-3 sm:p-3.5 rounded-xl border text-left text-xs sm:text-sm flex items-start gap-3 transition-all cursor-pointer min-h-[48px] ${itemStyle}`}
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
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
                        >
                          Verificar Minha Resposta
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Ações de Interconexão com Trilhas, Simulado e Flashcards */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    🚀 Próximos Passos para Dominar este Conteúdo:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={
                        errorItem.topicId
                          ? `/trilhas?topicId=${encodeURIComponent(errorItem.topicId)}&openTheory=1`
                          : errorItem.subjectId
                            ? `/trilhas?subjectId=${encodeURIComponent(errorItem.subjectId)}`
                            : "/trilhas"
                      }
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                    >
                      <Sparkles size={12} className="text-amber-400" />
                      <span>📖 Revisar Aula na Trilha</span>
                    </Link>

                    <Link
                      href={`/questions?banca=${encodeURIComponent((errorItem as any).banca || "FGV")}` +
                        (errorItem.subjectId ? `&subjectId=${encodeURIComponent(errorItem.subjectId)}` : "") +
                        (errorItem.subject?.name ? `&subject=${encodeURIComponent(errorItem.subject.name)}` : "") +
                        (errorItem.topicId ? `&topicId=${encodeURIComponent(errorItem.topicId)}` : "") +
                        (errorItem.topic?.title ? `&topic=${encodeURIComponent(errorItem.topic.title)}` : "") +
                        `&qtd=5&autoStart=1`}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                    >
                      <Target size={12} className="text-indigo-400" />
                      <span>🎯 Treinar 5 Questões (${(errorItem as any).banca || "Banca"})</span>
                    </Link>

                    {errorItem.subject?.name && (
                      <Link
                        href={`/flashcards/decks?subject=${encodeURIComponent(errorItem.subject.name)}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                      >
                        <Layers size={12} className="text-emerald-400" />
                        <span>🗂️ Baralho da Matéria</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Paywall Amigável de Cota Atingida */}
            {!isGeneratingAi && isQuotaExceeded && !remediation && (
              <div className="py-6 px-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex flex-col items-center text-center space-y-4 shadow-xl">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Lock size={26} />
                  </div>
                  <div className="absolute -top-1 -right-1 p-1 rounded-md bg-amber-500 text-slate-950">
                    <Crown size={12} />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-md">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Limite Diário Atingido (1/1)
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    Você usou sua explicação gratuita de hoje
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {quotaErrorMessage ||
                      "Assista a um vídeo rápido para liberar mais 1 explicação passo a passo agora mesmo ou conheça o plano Pro."}
                  </p>
                </div>

                <div className="w-full max-w-sm space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer group"
                  >
                    <Film size={15} className="text-amber-300 group-hover:scale-110 transition-transform" />
                    <span>Assistir Vídeo (+1 Explicação com IA)</span>
                  </button>

                  <Link
                    href="/pricing"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                  >
                    <Crown size={14} />
                    <span>Desbloquear Synapse Pro (Alta Capacidade)</span>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <RewardedAdModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        onRewardClaimed={handleRewardClaimed}
        feature="REMEDIATION"
      />
    </motion.div>
  );
}
