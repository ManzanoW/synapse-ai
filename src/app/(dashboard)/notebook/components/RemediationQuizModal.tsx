"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
  Brain,
  Eye,
  AlertCircle,
  Clock,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { ErrorNotebookItem } from "@/types/quiz";
import {
  getRemediationQuestionsAction,
  submitRemediationAnswerAction,
} from "@/actions/error-notebook-actions";
import { TAXONOMY_METADATA, normalizeTaxonomy } from "@/lib/error-taxonomy";
import { useGamification } from "@/context/GamificationContext";

interface SubjectOption {
  id: string;
  name: string;
  color?: string | null;
}

interface RemediationQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: SubjectOption[];
  initialTaxonomy?: string;
  onFinished: () => void;
}

const TAXONOMY_ICONS: Record<string, React.ElementType> = {
  CONTENT_GAP: Brain,
  TRICK_QUESTION: Eye,
  INTERPRETATION: AlertCircle,
  TIME_PRESSURE: Clock,
  UNCLASSIFIED: HelpCircle,
};

// Web Audio API sintetizador de feedback sonoro
function playSound(type: "correct" | "incorrect" | "victory") {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "correct") {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + idx * 0.08 + 0.25
        );

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.26);
      });
    } else if (type === "incorrect") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.26);
    } else if (type === "victory") {
      const melody = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      melody.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + idx * 0.1 + 0.35
        );

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.36);
      });
    }
  } catch {
    // Silenciosamente ignorado
  }
}

export function RemediationQuizModal({
  isOpen,
  onClose,
  subjects,
  initialTaxonomy = "ALL",
  onFinished,
}: RemediationQuizModalProps) {
  const { refreshStats } = useGamification();

  // Fases do Modal: SETUP -> IN_PROGRESS -> COMPLETED
  const [phase, setPhase] = useState<"SETUP" | "IN_PROGRESS" | "COMPLETED">("SETUP");

  // Configurações do simulado
  const [selectedTaxonomy, setSelectedTaxonomy] = useState(initialTaxonomy);
  const [selectedSubjectId, setSelectedSubjectId] = useState("ALL");
  const [questionLimit, setQuestionLimit] = useState<number>(5);

  // Estados de execução
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<ErrorNotebookItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Estado da questão atual
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string | null;
    mnemonic?: string | null;
    earnedXp: number;
  } | null>(null);

  // Registro de respostas da rodada
  const [sessionResults, setSessionResults] = useState<
    Array<{
      questionId: string;
      questionText: string;
      isCorrect: boolean;
      earnedXp: number;
      subjectName?: string;
    }>
  >([]);

  // Sincroniza taxonomia inicial quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setSelectedTaxonomy(initialTaxonomy || "ALL");
      setPhase("SETUP");
      setSessionResults([]);
      setCurrentIndex(0);
      setSelectedOption(null);
      setHasAnswered(false);
      setLastResult(null);
    }
  }, [isOpen, initialTaxonomy]);

  // Busca e inicia o simulado
  const handleStartQuiz = async () => {
    setIsLoading(true);
    try {
      const res = await getRemediationQuestionsAction({
        taxonomy: selectedTaxonomy,
        subjectId: selectedSubjectId,
        limit: questionLimit,
      });

      if (res.success && res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
        setCurrentIndex(0);
        setSelectedOption(null);
        setHasAnswered(false);
        setLastResult(null);
        setSessionResults([]);
        setPhase("IN_PROGRESS");
      } else {
        alert(
          "Nenhuma questão pendente de remediação encontrada para os filtros selecionados."
        );
      }
    } catch (err) {
      console.error("Erro ao carregar simulado:", err);
      alert("Falha ao iniciar simulado de remediação.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  // Alternativas formatadas da questão atual
  const parsedOptions = useMemo(() => {
    if (!currentQuestion) return [];
    if (
      Array.isArray(currentQuestion.options) &&
      currentQuestion.options.length > 0
    ) {
      return currentQuestion.options as Array<{ id: string; texto: string }>;
    }
    return [
      { id: "A", texto: "Alternativa A" },
      { id: "B", texto: "Alternativa B" },
      { id: "C", texto: "Alternativa C" },
      { id: "D", texto: "Alternativa D" },
    ];
  }, [currentQuestion]);

  // Submissão da resposta da questão atual
  const handleSubmitAnswer = async () => {
    if (!selectedOption || !currentQuestion || hasAnswered || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await submitRemediationAnswerAction({
        errorId: currentQuestion.id,
        selectedAnswer: selectedOption,
      });

      if (res.success) {
        const isCorrect = Boolean(res.isCorrect);
        setHasAnswered(true);
        setLastResult({
          isCorrect,
          correctAnswer: res.correctAnswer || currentQuestion.correctAnswer,
          explanation: res.explanation,
          mnemonic: res.mnemonic,
          earnedXp: res.earnedXp || 0,
        });

        // Som e efeitos visuais
        if (isCorrect) {
          playSound("correct");
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 },
          });
          refreshStats();
          window.dispatchEvent(new Event("xp-updated"));
        } else {
          playSound("incorrect");
        }

        // Armazena no relatório da sessão
        setSessionResults((prev) => [
          ...prev,
          {
            questionId: currentQuestion.id,
            questionText: currentQuestion.questionText,
            isCorrect,
            earnedXp: res.earnedXp || 0,
            subjectName: currentQuestion.subject?.name,
          },
        ]);
      }
    } catch (err) {
      console.error("Erro ao enviar resposta:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Avança para a próxima questão ou conclui o simulado
  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
      setLastResult(null);
    } else {
      // Fim do simulado
      playSound("victory");
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
      setPhase("COMPLETED");
    }
  };

  // Fechamento e conclusão
  const handleFinishAndClose = () => {
    onFinished();
    onClose();
  };

  // Renderizador de texto formatado com destaque em negrito
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

  if (!isOpen) return null;

  const totalMasteredInSession = sessionResults.filter((r) => r.isCorrect).length;
  const totalXpInSession = sessionResults.reduce((acc, r) => acc + r.earnedXp, 0);
  const masteryPercentage =
    sessionResults.length > 0
      ? Math.round((totalMasteredInSession / sessionResults.length) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-violet-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl" />

        {/* CABEÇALHO DO MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/40 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30">
              <Zap size={18} className="fill-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Simulado de Remediação</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  +25 XP p/ acerto
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Reteste falhas anteriores e transforme erros em domínio absoluto.
              </p>
            </div>
          </div>

          <button
            onClick={phase === "COMPLETED" ? handleFinishAndClose : onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* CORPO DINÂMICO CONFORME A FASE */}
        <div className="p-6 overflow-y-auto flex-1 relative z-10 space-y-6">
          {/* FASE 1: CONFIGURAÇÃO DO SIMULADO */}
          {phase === "SETUP" && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  1. Foco da Causa-Raiz (Taxonomia)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTaxonomy("ALL")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer min-h-[84px] flex flex-col justify-start ${
                      selectedTaxonomy === "ALL"
                        ? "bg-violet-600/20 border-violet-500 text-white shadow-md shadow-violet-900/30 scale-[1.02]"
                        : "bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Sparkles size={15} className="text-violet-400" />
                      <span>Todas as Falhas</span>
                    </div>
                    <p className="text-[11px] text-slate-300/80 mt-1.5 leading-snug break-words">
                      Misto geral de todos os erros pendentes
                    </p>
                  </button>

                  {Object.entries(TAXONOMY_METADATA).map(([key, meta]) => {
                    const Icon = TAXONOMY_ICONS[key] || AlertCircle;
                    const isSelected = selectedTaxonomy === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedTaxonomy(key)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer min-h-[84px] flex flex-col justify-start ${
                          isSelected
                            ? "scale-[1.02] shadow-md"
                            : "bg-slate-800/40 border-white/5 opacity-80 hover:opacity-100 hover:bg-slate-800"
                        }`}
                        style={{
                          backgroundColor: isSelected ? `${meta.color}20` : undefined,
                          borderColor: isSelected ? meta.color : undefined,
                          color: isSelected ? "#fff" : undefined,
                        }}
                      >
                        <div
                          className="flex items-center gap-2 font-bold text-xs"
                          style={{ color: meta.color }}
                        >
                          <Icon size={14} />
                          <span className="truncate">{meta.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-300/80 mt-1.5 leading-snug break-words">
                          {meta.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seletor de Matéria */}
              {subjects && subjects.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    2. Filtrar por Matéria (Opcional)
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
                  >
                    <option value="ALL">Todas as Matérias</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Seletor de Tamanho da Rodada */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  3. Quantidade de Questões
                </label>
                <div className="flex items-center gap-3">
                  {[5, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionLimit(num)}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                        questionLimit === num
                          ? "bg-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30"
                          : "bg-slate-800/60 border-white/10 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {num} Questões
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-rose-600 hover:from-violet-500 hover:via-indigo-500 hover:to-rose-500 text-white font-extrabold text-sm sm:text-base tracking-wide shadow-xl shadow-violet-600/30 border border-violet-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Montando Simulado de Remediação...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={18} className="fill-white" />
                      <span>Iniciar Simulado de Remediação Agora</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* FASE 2: EM RESOLUÇÃO DO SIMULADO */}
          {phase === "IN_PROGRESS" && currentQuestion && (
            <div className="space-y-5">
              {/* Barra de Progresso e Indicadores */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-violet-300">
                    Questão {currentIndex + 1} de {questions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    {currentQuestion.subject?.name && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-white/10 text-[10px] text-slate-300 font-medium">
                        {currentQuestion.subject.name}
                      </span>
                    )}
                    {(() => {
                      const norm = normalizeTaxonomy(currentQuestion.errorReason);
                      const meta = TAXONOMY_METADATA[norm];
                      const Icon = TAXONOMY_ICONS[norm] || AlertCircle;
                      return (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border"
                          style={{
                            backgroundColor: `${meta.color}20`,
                            borderColor: `${meta.color}40`,
                            color: meta.color,
                          }}
                        >
                          <Icon size={11} />
                          <span>{meta.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-400 transition-all duration-300"
                    style={{
                      width: `${((currentIndex + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Enunciado da Questão */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/50 border border-white/10">
                <div className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                  {renderFormattedText(currentQuestion.questionText)}
                </div>
              </div>

              {/* Lista de Alternativas */}
              <div className="space-y-2.5">
                {parsedOptions.map((opt) => {
                  const optLetter = opt.id.trim().toUpperCase();
                  const isSelected = selectedOption === optLetter;
                  const isCorrect =
                    hasAnswered &&
                    optLetter === lastResult?.correctAnswer?.trim().toUpperCase();
                  const isWrongSelection =
                    hasAnswered && isSelected && !lastResult?.isCorrect;

                  let cardStyle =
                    "bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800/80 hover:border-white/20";
                  let badgeStyle = "bg-slate-700/60 text-slate-300 border-white/10";

                  if (hasAnswered) {
                    if (isCorrect) {
                      cardStyle =
                        "bg-emerald-500/20 border-emerald-500/70 text-emerald-100 shadow-md shadow-emerald-950/40";
                      badgeStyle = "bg-emerald-500 text-slate-950 font-black";
                    } else if (isWrongSelection) {
                      cardStyle =
                        "bg-rose-500/20 border-rose-500/70 text-rose-100 shadow-md shadow-rose-950/40";
                      badgeStyle = "bg-rose-500 text-white font-black";
                    }
                  } else if (isSelected) {
                    cardStyle =
                      "bg-violet-600/20 border-violet-500 text-white shadow-md shadow-violet-950/40";
                    badgeStyle = "bg-violet-600 text-white font-black";
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={hasAnswered || isSubmitting}
                      onClick={() => setSelectedOption(optLetter)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${cardStyle} disabled:cursor-default`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${badgeStyle}`}
                      >
                        {optLetter}
                      </div>
                      <div className="text-xs sm:text-sm pt-0.5 leading-relaxed flex-1">
                        {opt.texto}
                      </div>
                      {hasAnswered && isCorrect && (
                        <CheckCircle2
                          size={18}
                          className="text-emerald-400 shrink-0 mt-0.5"
                        />
                      )}
                      {hasAnswered && isWrongSelection && (
                        <XCircle
                          size={18}
                          className="text-rose-400 shrink-0 mt-0.5"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback pedagógico pós-resposta */}
              <AnimatePresence>
                {hasAnswered && lastResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border ${
                      lastResult.isCorrect
                        ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                        : "bg-rose-950/30 border-rose-500/40 text-rose-200"
                    } space-y-2`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                      {lastResult.isCorrect ? (
                        <>
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span>
                            Superado com Sucesso! Erro promovido para MASTERED (+25 XP)
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} className="text-rose-400" />
                          <span>
                            Resposta Incorreta. O gabarito é ({lastResult.correctAnswer}).
                          </span>
                        </>
                      )}
                    </div>

                    {(lastResult.explanation || lastResult.mnemonic) && (
                      <div className="text-xs text-slate-300 pt-1 leading-relaxed border-t border-white/5">
                        {lastResult.explanation && (
                          <p className="mb-1">{lastResult.explanation}</p>
                        )}
                        {lastResult.mnemonic && (
                          <p className="text-amber-300 font-medium">
                            💡 Regra de ouro: {lastResult.mnemonic}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botões de Ação */}
              <div className="pt-2 flex items-center justify-between gap-3">
                {!hasAnswered ? (
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption || isSubmitting}
                    className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30 border border-violet-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Validando...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} className="fill-white" />
                        <span>Confirmar Resposta</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 border border-emerald-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <span>
                      {currentIndex + 1 < questions.length
                        ? "Próxima Questão"
                        : "Ver Relatório de Superação"}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* FASE 3: RELATÓRIO DE SUPERAÇÃO FINAL */}
          {phase === "COMPLETED" && (
            <div className="text-center py-4 space-y-6">
              <div className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-amber-500/20 via-violet-600/20 to-emerald-500/20 border border-violet-500/30 shadow-2xl shadow-violet-900/30">
                <Trophy size={48} className="text-amber-400 animate-bounce" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Simulado de Remediação Concluído!
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  Você retestou seus pontos fracos e fortaleceu sua retenção de longo prazo.
                </p>
              </div>

              {/* Grid de Resultados */}
              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Superados
                  </span>
                  <span className="text-2xl font-black text-emerald-400">
                    {totalMasteredInSession}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    de {sessionResults.length}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Aproveitamento
                  </span>
                  <span className="text-2xl font-black text-violet-300">
                    {masteryPercentage}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    remediados
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    XP Ganho
                  </span>
                  <span className="text-2xl font-black text-amber-400">
                    +{totalXpInSession}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    pontos
                  </span>
                </div>
              </div>

              {/* Ações Finais */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPhase("SETUP");
                    setSessionResults([]);
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <RotateCcw size={15} />
                  <span>Nova Rodada de Remediação</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinishAndClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-violet-600/30 border border-violet-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <CheckCircle2 size={16} />
                  <span>Concluir e Atualizar Caderno</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
