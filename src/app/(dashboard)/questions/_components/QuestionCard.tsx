"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  BrainCircuit,
  CornerDownLeft,
  EyeOff,
  Eye,
  Flag,
  Brain,
  AlertTriangle,
  Target,
  X,
  Clock,
  AlertCircle,
  Check,
} from "lucide-react";
import { QuestaoIA } from "../page";
import { ErrorClassification } from "@/types/quiz";

interface QuestionCardProps {
  questao: QuestaoIA;
  index: number;
  isFocused: boolean;
  respondida: boolean;
  alternativaSelecionada?: string;
  isSavedError: boolean;
  isFlashcardCreated: boolean;
  isCreatingFlashcard: boolean;
  isFlagged?: boolean;
  onSelectAnswer: (altId: string) => void;
  onAnswerQuestion: () => void;
  onToggleSaveError: () => void;
  onCreateFlashcard: () => void;
  onToggleFlag?: () => void;
  onClassifyError?: (reason: ErrorClassification) => void;
}

const ERROR_TAXONOMY: {
  key: ErrorClassification;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bgActive: string;
}[] = [
  {
    key: "THEORY_GAP",
    label: "Lacuna Teórica",
    desc: "Não conhecia ou esqueci o conceito teórico da matéria.",
    icon: Brain,
    color: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    bgActive: "border-violet-500 bg-violet-500/20 text-violet-200",
  },
  {
    key: "ATTENTION_LAPSE",
    label: "Falta de Atenção",
    desc: "Sabia a teoria, mas caí em pegadinha ou li com pressa.",
    icon: Eye,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    bgActive: "border-amber-500 bg-amber-500/20 text-amber-200",
  },
  {
    key: "MISINTERPRETATION",
    label: "Erro de Interpretação",
    desc: "Interpretei errado o enunciado ou o comando da questão.",
    icon: AlertCircle,
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    bgActive: "border-cyan-500 bg-cyan-500/20 text-cyan-200",
  },
  {
    key: "TIME_PRESSURE",
    label: "Pressão de Tempo",
    desc: "Faltou tempo para calcular ou analisar as opções com calma.",
    icon: Clock,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    bgActive: "border-rose-500 bg-rose-500/20 text-rose-200",
  },
];

const renderEnunciado = (texto: string) => {
  if (!texto) return null;
  const partes = texto.split(/(\*\*.*?\*\*)/g);
  return partes.map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      const conteudoLimpo = parte.slice(2, -2);
      return (
        <span
          key={`highlight-${i}`}
          className="inline-block bg-indigo-500/15 text-indigo-200 px-1.5 py-0.5 mx-0.5 rounded-md border border-indigo-400/30 font-semibold align-baseline shadow-xs"
        >
          {conteudoLimpo}
        </span>
      );
    }
    return <React.Fragment key={`text-${i}`}>{parte}</React.Fragment>;
  });
};

export function QuestionCard({
  questao,
  index,
  respondida,
  isFocused = false,
  alternativaSelecionada,
  isFlashcardCreated,
  isCreatingFlashcard,
  isFlagged = false,
  onSelectAnswer,
  onAnswerQuestion,
  onCreateFlashcard,
  onToggleFlag,
  onClassifyError,
}: QuestionCardProps) {
  const [eliminatedAlts, setEliminatedAlts] = useState<Record<string, boolean>>({});
  const [showErrorDiagnosis, setShowErrorDiagnosis] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ErrorClassification | null>(null);

  const toggleEliminate = (e: React.MouseEvent, altId: string) => {
    e.stopPropagation();
    if (respondida) return;
    setEliminatedAlts((prev) => ({ ...prev, [altId]: !prev[altId] }));
  };

  const acertou = alternativaSelecionada === questao.gabaritoCorreto;

  const handleSelectReason = (reason: ErrorClassification) => {
    setSelectedReason(reason);
    if (onClassifyError) {
      onClassifyError(reason);
    }
  };

  const getCardStyle = () => {
    if (isFocused) {
      if (respondida) {
        return acertou
          ? "bg-linear-to-br from-emerald-950/20 via-[#0a0e1a] to-[#080b13] border-y border-r border-slate-800/80 border-l-4 border-l-emerald-400 shadow-[0_0_30px_-5px_rgba(16,185,129,0.25)] opacity-100 z-20 scale-[1.01]"
          : "bg-linear-to-br from-rose-950/20 via-[#0a0e1a] to-[#080b13] border-y border-r border-slate-800/80 border-l-4 border-l-rose-500 shadow-[0_0_30px_-5px_rgba(244,63,94,0.25)] opacity-100 z-20 scale-[1.01]";
      }
      return "bg-linear-to-br from-indigo-950/30 via-[#0a0e1a] to-[#080b13] border-y border-r border-slate-800/80 border-l-4 border-l-indigo-500 shadow-[0_0_30px_-5px_rgba(99,102,241,0.25)] opacity-100 z-20 scale-[1.01]";
    }

    if (respondida) {
      return acertou
        ? "bg-[#060810]/70 border border-emerald-500/20 opacity-70 hover:opacity-100 transition-all z-0"
        : "bg-[#060810]/70 border border-rose-500/20 opacity-70 hover:opacity-100 transition-all z-0";
    }

    return "bg-[#060810]/70 border border-slate-800/60 opacity-80 hover:opacity-100 transition-all z-0";
  };

  return (
    <motion.div
      id={`question-card-${index}`}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`rounded-2xl p-4 sm:p-6 transition-all duration-300 relative ${getCardStyle()}`}
    >
      {/* BADGE FLUTUANTE DE FOCO */}
      {isFocused && (
        <div
          className={`absolute -top-3.5 right-4 sm:right-8 px-3 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1.5 shadow-xl z-30 border font-extrabold uppercase tracking-widest ${
            respondida
              ? acertou
                ? "bg-[#080b13] border-emerald-500/80 text-emerald-400"
                : "bg-[#080b13] border-rose-500/80 text-rose-400"
              : "bg-[#080b13] border-indigo-500/80 text-indigo-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              respondida
                ? acertou
                  ? "bg-emerald-500"
                  : "bg-rose-500"
                : "bg-indigo-500"
            }`}
          />
          <span>Em Foco</span>
        </div>
      )}

      {/* HEADER DA QUESTÃO */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black tracking-wider text-indigo-400 uppercase">
            QUESTÃO {index + 1}
          </span>
          {questao.formato && (
            <span className="text-[10px] font-bold bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-md uppercase">
              {questao.formato === "multipla"
                ? "Múltipla Escolha"
                : "Certo / Errado"}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleFlag}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 ${
            isFlagged
              ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
              : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
          }`}
          title="Marcar questão para revisar depois"
        >
          <Flag
            size={13}
            className={isFlagged ? "fill-amber-300 text-amber-300" : ""}
          />
          <span className="text-[11px]">
            {isFlagged ? "Marcada" : "Revisar"}
          </span>
        </button>
      </div>

      {/* ENUNCIADO */}
      <p className="text-slate-200 text-sm sm:text-base font-medium mb-5 leading-relaxed whitespace-pre-line">
        {renderEnunciado(questao.enunciado)}
      </p>

      {/* ALTERNATIVAS */}
      <div className="space-y-2.5 mb-6">
        {questao.formato === "multipla"
          ? questao.alternativas?.map((alt, altIdx) => {
              const isSelected = alternativaSelecionada === alt.id;
              const isEliminated = Boolean(eliminatedAlts[alt.id]);
              const atalhoNum = altIdx + 1;

              return (
                <div
                  key={`q-${index}-alt-${alt.id}`}
                  className="relative flex items-center gap-1.5 group"
                >
                  <button
                    disabled={respondida}
                    onClick={() => !isEliminated && onSelectAnswer(alt.id)}
                    type="button"
                    className={`w-full text-left px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start justify-between cursor-pointer disabled:cursor-default active:scale-[0.99] min-h-12 ${
                      isEliminated && !respondida
                        ? "opacity-30 line-through bg-slate-950/20 border-slate-900/50 text-slate-500"
                        : respondida
                          ? alt.id === questao.gabaritoCorreto
                            ? "bg-emerald-500/10 border-emerald-500/80 text-emerald-300 font-semibold shadow-xs"
                            : isSelected
                              ? "bg-rose-500/10 border-rose-500/80 text-rose-300"
                              : "bg-slate-950/30 border-slate-900 text-slate-600"
                          : isSelected
                            ? "bg-indigo-600/15 border-indigo-500/80 text-slate-100 ring-1 ring-indigo-500/40 shadow-xs"
                            : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/40 text-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3 pr-2">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                          isEliminated && !respondida
                            ? "bg-slate-950 border border-slate-900 text-slate-600"
                            : isSelected
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-900 border border-slate-800 text-slate-400 group-hover:border-slate-700 group-hover:text-slate-200"
                        }`}
                      >
                        {alt.id}
                      </span>
                      <span className="pt-0.5 leading-relaxed">
                        {alt.texto}
                      </span>
                    </div>

                    {!respondida && (
                      <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-600 group-hover:text-slate-400 border border-slate-800/80 group-hover:border-slate-700 px-1.5 py-0.5 rounded shrink-0 self-center transition-colors">
                        {atalhoNum}
                      </kbd>
                    )}
                  </button>

                  {!respondida && (
                    <button
                      type="button"
                      onClick={(e) => toggleEliminate(e, alt.id)}
                      title={
                        isEliminated
                          ? "Restaurar alternativa"
                          : "Riscar alternativa"
                      }
                      className={`p-2 rounded-lg transition-all shrink-0 cursor-pointer ${
                        isEliminated
                          ? "text-rose-400 hover:text-rose-300 opacity-100"
                          : "text-slate-600 hover:text-slate-300 sm:opacity-0 sm:group-hover:opacity-100"
                      }`}
                    >
                      {isEliminated ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  )}
                </div>
              );
            })
          : ["Certo", "Errado"].map((opcao, altIdx) => {
              const isSelected = alternativaSelecionada === opcao;
              const atalhoNum = altIdx + 1;

              return (
                <button
                  key={`q-${index}-ce-${opcao}`}
                  disabled={respondida}
                  onClick={() => onSelectAnswer(opcao)}
                  type="button"
                  className={`w-full text-left px-4 py-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between group cursor-pointer disabled:cursor-default active:scale-[0.99] min-h-12 ${
                    respondida
                      ? opcao === questao.gabaritoCorreto
                        ? "bg-emerald-500/10 border-emerald-500/80 text-emerald-300 shadow-xs"
                        : isSelected
                          ? "bg-rose-500/10 border-rose-500/80 text-rose-300"
                          : "bg-slate-950/30 border-slate-900 text-slate-600"
                      : isSelected
                        ? "bg-indigo-600/15 border-indigo-500/80 text-slate-100 ring-1 ring-indigo-500/40 shadow-xs"
                        : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/40 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        opcao === "Certo" ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <span>{opcao}</span>
                  </div>
                  {!respondida && (
                    <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-600 group-hover:text-slate-400 border border-slate-800/80 group-hover:border-slate-700 px-1.5 py-0.5 rounded transition-colors">
                      {atalhoNum}
                    </kbd>
                  )}
                </button>
              );
            })}
      </div>

      {/* RODAPÉ / BOTÃO DE SUBMISSÃO */}
      <div className="flex flex-col gap-4">
        {!respondida ? (
          <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 gap-4">
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <kbd className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  ↑
                </kbd>
                <kbd className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  ↓
                </kbd>
                <span className="text-slate-600 ml-0.5">Navegar</span>
              </span>

              <span className="text-slate-700">•</span>

              <span className="flex items-center gap-1">
                <kbd className="bg-slate-900 border border-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                  <CornerDownLeft size={10} /> Enter
                </kbd>
                <span className="text-slate-600 ml-0.5">Confirmar</span>
              </span>
            </div>

            <button
              disabled={!alternativaSelecionada}
              onClick={onAnswerQuestion}
              type="button"
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md shadow-indigo-950/50 ml-auto cursor-pointer min-h-11"
            >
              Responder Questão
            </button>
          </div>
        ) : (
          <div className="rounded-xl p-3.5 sm:p-4 animate-in fade-in duration-300 bg-slate-950/80 border border-slate-800/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2 font-bold text-xs">
                {acertou ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Você acertou!
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <XCircle size={15} /> Resposta incorreta
                  </span>
                )}
                <span className="text-slate-700">•</span>
                <span className="text-slate-300 font-medium">
                  Gabarito:{" "}
                  <strong className="text-emerald-400 font-bold">
                    {questao.gabaritoCorreto}
                  </strong>
                </span>
              </div>

              {!acertou && (
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowErrorDiagnosis(true)}
                    className={`w-full sm:w-auto px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs ${
                      selectedReason
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300"
                    }`}
                    title="Ver pegadinha da banca e diagnosticar motivo do erro"
                  >
                    <Brain size={13} className={selectedReason ? "text-emerald-400" : "text-amber-400"} />
                    <span>{selectedReason ? "Diagnóstico Salvo ✓" : "Por que errei? 🧠"}</span>
                  </button>

                  <button
                    onClick={onCreateFlashcard}
                    disabled={isCreatingFlashcard || isFlashcardCreated}
                    type="button"
                    className={`w-full sm:w-auto px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                      isFlashcardCreated
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-not-allowed opacity-90"
                        : "bg-indigo-600/10 hover:bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
                    }`}
                  >
                    {isCreatingFlashcard ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Gerando Flashcard...</span>
                      </>
                    ) : isFlashcardCreated ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>Flashcard Criado!</span>
                      </>
                    ) : (
                      <>
                        <BrainCircuit size={13} className="text-indigo-400" />
                        <span>🎴 Criar Flashcard</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-indigo-300 font-semibold block mb-1">
                Explicação & Justificativa:
              </strong>
              {renderEnunciado(questao.justificativa)}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DIAGNÓSTICO DE ERRO */}
      <AnimatePresence>
        {showErrorDiagnosis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowErrorDiagnosis(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0c101d] border border-amber-500/30 rounded-2xl w-full max-w-xl shadow-2xl shadow-amber-950/20 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
                    <Brain size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                      Diagnóstico de Erro & Ponto Cego 🧠
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Questão {index + 1} • Classifique seu motivo para calibrar a IA
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowErrorDiagnosis(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* MODAL CONTENT */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
                {/* Resumo da resposta */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Sua resposta:</span>
                    <span className="font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-500/20">
                      {alternativaSelecionada || "Nenhuma"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Gabarito correto:</span>
                    <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                      {questao.gabaritoCorreto}
                    </span>
                  </div>
                </div>

                {/* Bloco: Seleção do Motivo do Erro */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
                    Qual foi a causa principal do erro?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ERROR_TAXONOMY.map((reason) => {
                      const Icon = reason.icon;
                      const isChosen = selectedReason === reason.key;
                      return (
                        <button
                          key={reason.key}
                          type="button"
                          onClick={() => handleSelectReason(reason.key)}
                          className={`cursor-pointer p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                            isChosen
                              ? reason.bgActive
                              : "border-white/5 bg-slate-950/60 hover:bg-slate-900/60 hover:border-white/15"
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg border shrink-0 ${reason.color}`}>
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-100 leading-tight">
                                {reason.label}
                              </span>
                              {isChosen && <Check size={13} className="text-emerald-400 shrink-0" />}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                              {reason.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bloco 1: Pegadinha da Banca */}
                <div className="rounded-xl p-4 bg-amber-950/15 border border-amber-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle size={15} />
                    <span>Pegadinha da Banca / Armadilha</span>
                  </div>
                  <div className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {renderEnunciado(
                      questao.pegadinhaBanca ||
                        "A banca utilizou distratores formulados para desviar a atenção do núcleo do comando e induzir o candidato ao erro conceitual.",
                    )}
                  </div>
                </div>

                {/* Bloco 2: Ponto Cego & Explicação do Erro */}
                <div className="rounded-xl p-4 bg-indigo-950/20 border border-indigo-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <Target size={15} />
                    <span>Ponto Cego & Por que você errou</span>
                  </div>
                  <div className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {renderEnunciado(
                      questao.explicacaoErro ||
                        "Confusão comum na interpretação das regras ou detalhes do enunciado. Revise os conceitos-chave e as exceções associadas a este tópico.",
                    )}
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-800/80 bg-slate-900/40">
                <button
                  type="button"
                  onClick={() => setShowErrorDiagnosis(false)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-950/40 active:scale-95"
                >
                  Entendi o erro
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
