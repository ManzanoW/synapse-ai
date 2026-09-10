"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Brain,
  Eye,
  AlertCircle,
  Flame,
  Layers,
} from "lucide-react";
import { TimedQuizQuestion } from "@/types/quiz";
import { ErrorClassification } from "@/types/quiz";

interface QuestionResultAudit {
  question: TimedQuizQuestion;
  userAnswer?: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  isFlagged?: boolean;
  errorReason?: ErrorClassification;
}

interface TimedExamResultViewProps {
  banca: string;
  materia: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
  totalTimeSpentSeconds: number;
  totalAllocatedSeconds: number;
  earnedXp: number;
  baseEarnedXp?: number;
  accuracyBonusXp?: number;
  timedBonusXp?: number;
  completedWithinTime?: boolean;
  questionsAudit: QuestionResultAudit[];
  onRestartExam: () => void;
  onNewExam: () => void;
}

const ERROR_BADGES: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  TIME_PRESSURE: {
    label: "Pressão de Tempo",
    icon: Clock,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
  THEORY_GAP: {
    label: "Lacuna Teórica",
    icon: Brain,
    color: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  },
  ATTENTION_LAPSE: {
    label: "Falta de Atenção",
    icon: Eye,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  MISINTERPRETATION: {
    label: "Interpretação",
    icon: AlertCircle,
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  },
  UNCLASSIFIED: {
    label: "Erro Não Classificado",
    icon: AlertTriangle,
    color: "text-slate-400 border-slate-500/30 bg-slate-500/10",
  },
};

export function TimedExamResultView({
  banca,
  materia,
  totalQuestions,
  correctAnswers,
  accuracyPercentage,
  totalTimeSpentSeconds,
  totalAllocatedSeconds,
  earnedXp,
  baseEarnedXp = 0,
  accuracyBonusXp = 0,
  timedBonusXp = 0,
  completedWithinTime = true,
  questionsAudit,
  onRestartExam,
  onNewExam,
}: TimedExamResultViewProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [filterReview, setFilterReview] = useState<"all" | "incorrect" | "correct">("all");

  const minutesSpent = Math.floor(totalTimeSpentSeconds / 60);
  const secondsSpent = totalTimeSpentSeconds % 60;
  const timeFormatted = `${String(minutesSpent).padStart(2, "0")}:${String(
    secondsSpent
  ).padStart(2, "0")}`;

  const avgSecondsPerQ = Math.round(
    totalTimeSpentSeconds / Math.max(1, totalQuestions)
  );
  const avgMinutes = Math.floor(avgSecondsPerQ / 60);
  const avgSeconds = avgSecondsPerQ % 60;

  const filteredAudit = questionsAudit.filter((item) => {
    if (filterReview === "incorrect") return !item.isCorrect;
    if (filterReview === "correct") return item.isCorrect;
    return true;
  });

  const incorrectCount = totalQuestions - correctAnswers;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-4">
      {/* 1. HERO COM RESULTADO E PONTUAÇÃO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-linear-to-br from-[#0e1424] via-[#090d18] to-[#04060c] border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
      >
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-3 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider">
              <Trophy size={14} className="text-amber-400" />
              Simulado Concluído • {banca} • {materia}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {accuracyPercentage >= 80
                ? "Desempenho de Alta Performance!"
                : accuracyPercentage >= 60
                ? "Bom Ritmo de Prova!"
                : "Treino Concluído — Hora da Correção!"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Você completou a prova sob estrita gestão temporal.
              {timedBonusXp > 0
                ? " O bônus de velocidade e precisão sob pressão foi computado com sucesso!"
                : " Continue lapidando seu tempo médio por questão para garantir margem de segurança."}
            </p>
          </div>

          {/* PLACAR CIRCULAR / DESTAQUE */}
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white/[0.03] border border-white/10 shadow-inner shrink-0 w-44">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              {accuracyPercentage}%
            </span>
            <span className="text-xs font-bold text-slate-400 mt-1">
              {correctAnswers} de {totalQuestions} Acertos
            </span>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-linear-to-r from-violet-500 to-emerald-400 h-full rounded-full"
                style={{ width: `${accuracyPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* ESTATÍSTICAS DETALHADAS & GAMIFICAÇÃO */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center justify-center sm:justify-start gap-1">
              <Clock size={11} /> Tempo Total
            </span>
            <span className="text-base font-mono font-bold text-white mt-0.5 block">
              {timeFormatted}
            </span>
            <span className="text-[10px] text-slate-500">
              {completedWithinTime ? "Dentro do limite" : "Limite esgotado"}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center justify-center sm:justify-start gap-1">
              <Flame size={11} className="text-amber-400" /> Média / Questão
            </span>
            <span className="text-base font-mono font-bold text-amber-300 mt-0.5 block">
              {avgMinutes}m {avgSeconds}s
            </span>
            <span className="text-[10px] text-slate-500">Alvo: ~3 min/q</span>
          </div>

          <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase text-violet-300 block flex items-center justify-center sm:justify-start gap-1">
              <Zap size={11} /> XP Obtido
            </span>
            <span className="text-base font-mono font-black text-violet-200 mt-0.5 block">
              +{earnedXp} XP
            </span>
            <span className="text-[10px] text-violet-400/80">
              Base: +{baseEarnedXp} XP
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase text-emerald-300 block flex items-center justify-center sm:justify-start gap-1">
              <Sparkles size={11} /> Bônus Prova Real
            </span>
            <span className="text-base font-mono font-black text-emerald-200 mt-0.5 block">
              +{timedBonusXp} XP
            </span>
            <span className="text-[10px] text-emerald-400/80">
              Precisão: +{accuracyBonusXp} XP
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. ATALHOS RÁPIDOS (CADERNO DE ERROS & FLASHCARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/notebook"
          className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-300">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white group-hover:text-violet-300">
                Caderno de Erros
              </h3>
              <p className="text-[11px] text-slate-400">
                {incorrectCount} questão(ões) registradas
              </p>
            </div>
          </div>
          <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
        </Link>

        <button
          onClick={onRestartExam}
          type="button"
          className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-all flex items-center justify-between group cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-300">
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white group-hover:text-indigo-300">
                Refazer Este Simulado
              </h3>
              <p className="text-[11px] text-slate-400">Embaralhar e tentar novo tempo</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onNewExam}
          type="button"
          className="p-4 rounded-2xl bg-linear-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/40 hover:border-violet-500 text-violet-200 transition-all flex items-center justify-between group cursor-pointer text-left shadow-lg shadow-violet-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/30 text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black text-white group-hover:text-violet-200">
                Novo Simulado
              </h3>
              <p className="text-[11px] text-violet-300/80">Configurar outro caderno</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-violet-300 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 3. REVISÃO DETALHADA QUESTÃO POR QUESTÃO */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>Auditoria & Gabarito Comentado</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-400">
              {questionsAudit.length}
            </span>
          </h2>

          {/* Filtros de Revisão */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterReview("all")}
              type="button"
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterReview === "all"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Todas ({questionsAudit.length})
            </button>
            <button
              onClick={() => setFilterReview("incorrect")}
              type="button"
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterReview === "incorrect"
                  ? "bg-rose-500/20 border border-rose-500/30 text-rose-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Erros ({incorrectCount})
            </button>
            <button
              onClick={() => setFilterReview("correct")}
              type="button"
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterReview === "correct"
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Acertos ({correctAnswers})
            </button>
          </div>
        </div>

        {/* LISTA DE QUESTÕES AUDITADAS */}
        <div className="space-y-3">
          {filteredAudit.map((item, idx) => {
            const isExpanded = expandedQuestion === idx;
            const errorBadge =
              !item.isCorrect && item.errorReason
                ? ERROR_BADGES[item.errorReason] || ERROR_BADGES.UNCLASSIFIED
                : !item.isCorrect
                ? ERROR_BADGES.UNCLASSIFIED
                : null;

            return (
              <div
                key={`audit-q-${idx}`}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  item.isCorrect
                    ? "bg-[#070b14] border-emerald-500/20"
                    : "bg-[#0c0d18] border-rose-500/30"
                }`}
              >
                {/* CABEÇALHO DO ITEM */}
                <div
                  onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        item.isCorrect
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {item.isCorrect ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-white">
                          Questão {idx + 1}
                        </span>

                        <span
                          className={`text-[10px] font-mono px-2 py-0.2 rounded-md ${
                            item.isCorrect
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-rose-500/15 text-rose-300 font-bold"
                          }`}
                        >
                          {item.isCorrect ? "Acertou" : "Errou"} • Sua resposta:{" "}
                          {item.userAnswer || "Em branco"} (Gabarito:{" "}
                          {item.question.gabaritoCorreto})
                        </span>

                        {errorBadge && (
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded-md border font-semibold flex items-center gap-1 ${errorBadge.color}`}
                          >
                            <errorBadge.icon size={10} />
                            {errorBadge.label}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 truncate mt-1 max-w-xl">
                        {item.question.enunciado.replace(/\*\*/g, "")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock size={12} className="text-slate-500" />
                      {item.timeSpentSeconds}s
                    </span>

                    <button
                      type="button"
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* DETALHAMENTO EXPANDIDO */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-white/5 bg-black/20 space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Enunciado Completo
                      </span>
                      <p className="text-slate-200 leading-relaxed">
                        {item.question.enunciado}
                      </p>
                    </div>

                    {/* ALTERNATIVAS */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Alternativas
                      </span>
                      {item.question.alternativas?.map((alt) => {
                        const isCorrectAlt = alt.id === item.question.gabaritoCorreto;
                        const isUserChoice = alt.id === item.userAnswer;

                        let style = "bg-white/[0.02] border-white/5 text-slate-400";
                        if (isCorrectAlt) {
                          style =
                            "bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-semibold";
                        } else if (isUserChoice && !item.isCorrect) {
                          style =
                            "bg-rose-500/15 border-rose-500/40 text-rose-200 font-semibold";
                        }

                        return (
                          <div
                            key={alt.id}
                            className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${style}`}
                          >
                            <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center font-bold font-mono text-[11px] shrink-0">
                              {alt.id}
                            </span>
                            <span className="leading-relaxed">{alt.texto}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* JUSTIFICATIVA */}
                    {item.question.justificativa && (
                      <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-slate-300 space-y-1">
                        <span className="text-[10px] uppercase font-black text-violet-400 flex items-center gap-1">
                          <Sparkles size={11} /> Justificativa da Banca
                        </span>
                        <p className="text-xs leading-relaxed text-slate-200">
                          {item.question.justificativa}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
