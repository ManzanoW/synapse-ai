"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  X,
  Zap,
  AlertTriangle,
  Layers,
  Calendar,
  ArrowRight,
  Sparkles,
  FileText,
  Search,
} from "lucide-react";

interface QuizHistoryItem {
  id: string;
  banca: string;
  subject: string;
  difficulty: string;
  questions: any[];
  createdAt: string;
  topic?: { title: string } | null;
}

interface TimedLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedQuizzes: QuizHistoryItem[];
  pendingErrorsCount: number;
  onSelectQuiz: (quiz: QuizHistoryItem) => void;
  onSelectErrors: () => void;
}

export function TimedLaunchModal({
  isOpen,
  onClose,
  savedQuizzes,
  pendingErrorsCount,
  onSelectQuiz,
  onSelectErrors,
}: TimedLaunchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredQuizzes = savedQuizzes.filter((q) => {
    const term = searchTerm.toLowerCase();
    return (
      q.banca?.toLowerCase().includes(term) ||
      q.subject?.toLowerCase().includes(term) ||
      q.topic?.title?.toLowerCase().includes(term)
    );
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-linear-to-b from-[#0f1426] via-[#090d18] to-[#04060c] border border-violet-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-violet-950/50 text-slate-100 space-y-6 max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-indigo-600/15 blur-3xl" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 relative z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-300 flex items-center justify-center shadow-inner">
                <Timer size={24} className="text-violet-400 animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Sparkles size={11} className="text-violet-400" />
                  Central de Execução Cronometrada
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Iniciar Simulado Sob Pressão
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-slate-300 relative z-10 -mt-2 leading-relaxed">
            Selecione uma base de questões para treinar com Pacing Bar e HUD de
            prova real. Zero espera e zero consumo de tokens.
          </p>

          <div className="space-y-4 overflow-y-auto pr-1 flex-1 relative z-10">
            {/* OPÇÃO 1: BATERIA DE ERROS PENDENTES */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>Modo Especial de Recuperação</span>
                {pendingErrorsCount > 0 && (
                  <span className="text-rose-400 font-bold">
                    {pendingErrorsCount} pendente(s)
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={pendingErrorsCount === 0}
                onClick={onSelectErrors}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 group cursor-pointer ${
                  pendingErrorsCount > 0
                    ? "bg-linear-to-r from-rose-950/40 via-slate-900/80 to-slate-900/60 border-rose-500/30 hover:border-rose-500/60 hover:shadow-lg hover:shadow-rose-950/30"
                    : "bg-slate-900/30 border-slate-800/60 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      pendingErrorsCount > 0
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-500"
                    }`}
                  >
                    <AlertTriangle size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-rose-200 transition-colors">
                        Bateria de Erros Pendentes (Caderno de Erros)
                      </h4>
                      {pendingErrorsCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Prioritário
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {pendingErrorsCount > 0
                        ? "Treine cronometrado apenas as questões que você já errou para fixar os conceitos."
                        : "Nenhum erro pendente no seu Caderno de Erros no momento."}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-rose-400 group-hover:translate-x-1 transition-transform">
                  <span>Configurar Ritmo</span>
                  <ArrowRight size={14} />
                </div>
              </button>
            </div>

            {/* OPÇÃO 2: SIMULADOS SALVOS DO USUÁRIO */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>Seus Simulados Salvos ({savedQuizzes.length})</span>
                {savedQuizzes.length > 0 && (
                  <span className="text-violet-400">Cadernos Pessoais</span>
                )}
              </div>

              {savedQuizzes.length > 3 && (
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por banca ou matéria..."
                    className="w-full bg-black/40 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50"
                  />
                </div>
              )}

              {savedQuizzes.length === 0 ? (
                <div className="p-8 text-center bg-black/30 border border-slate-800/80 rounded-2xl space-y-2">
                  <Layers
                    size={24}
                    className="text-slate-500 mx-auto opacity-60"
                  />
                  <p className="text-xs text-slate-300 font-bold">
                    Nenhum simulado salvo encontrado
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Gere seu primeiro caderno na aba &quot;Início&quot; para
                    desbloquear o modo cronometrado com zero tokens.
                  </p>
                </div>
              ) : filteredQuizzes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  Nenhum simulado encontrado para a busca.
                </p>
              ) : (
                <div className="grid gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {filteredQuizzes.map((quiz) => {
                    const qCount = Array.isArray(quiz.questions)
                      ? quiz.questions.length
                      : 0;
                    const dateStr = new Date(
                      quiz.createdAt
                    ).toLocaleDateString("pt-BR");

                    return (
                      <button
                        key={quiz.id}
                        type="button"
                        onClick={() => onSelectQuiz(quiz)}
                        className="w-full text-left p-3 sm:p-3.5 rounded-xl bg-[#090d18] hover:bg-[#0e1324] border border-white/5 hover:border-violet-500/40 transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-xs"
                      >
                        <div className="min-w-0 space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/25 text-violet-300">
                              {quiz.banca || "Geral"}
                            </span>
                            <span className="text-xs font-bold text-slate-200 group-hover:text-violet-200 truncate">
                              {quiz.subject}
                            </span>
                          </div>

                          {quiz.topic?.title && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <FileText
                                size={10}
                                className="text-violet-400 shrink-0"
                              />
                              <span className="truncate">
                                {quiz.topic.title}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-3 text-right">
                          <div className="space-y-0.5">
                            <span className="inline-block text-[11px] font-mono font-bold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                              {qCount} questões
                            </span>
                            <p className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                              <Calendar size={10} />
                              <span>{dateStr}</span>
                            </p>
                          </div>

                          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-violet-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-colors">
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
