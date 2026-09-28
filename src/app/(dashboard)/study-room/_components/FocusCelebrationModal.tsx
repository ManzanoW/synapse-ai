"use client";

import React from "react";
import { Trophy, Zap, Flame, Shield, CheckCircle2, Clock, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { FinishFocusSessionResult } from "@/actions/focus-session-actions";

interface FocusCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: FinishFocusSessionResult | null;
  subjectName?: string;
  tasksCompletedCount: number;
}

export function FocusCelebrationModal({
  isOpen,
  onClose,
  result,
  subjectName,
  tasksCompletedCount,
}: FocusCelebrationModalProps) {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 text-center space-y-6">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Ícone de Troféu com Efeito Brilho */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Trophy size={32} />
          </div>
        </div>

        {/* Mensagem Principal */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white">
            Bloco de Foco Concluído!
          </h2>
          <p className="text-xs text-slate-400">
            {subjectName ? `Disciplina: ${subjectName}` : "Concentração e disciplina inabaláveis."}
          </p>
        </div>

        {/* Grid de Recompensas */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-semibold">
              <Zap size={13} />
              XP Ganho
            </div>
            <p className="text-lg font-bold font-mono text-white">
              +{result.xpGained}
            </p>
          </div>

          <div className="space-y-1 border-x border-slate-800/60">
            <div className="flex items-center justify-center gap-1 text-indigo-400 text-xs font-semibold">
              <Clock size={13} />
              Tempo
            </div>
            <p className="text-lg font-bold font-mono text-white">
              {result.durationMinutes}m
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-orange-400 text-xs font-semibold">
              <Flame size={13} />
              Ofensiva
            </div>
            <p className="text-lg font-bold font-mono text-white flex items-center justify-center gap-1">
              {result.streakDays}d
              {result.streakProtected && (
                <Shield size={12} className="text-cyan-400 fill-cyan-400/20" />
              )}
            </p>
          </div>
        </div>

        {/* Tarefas e Feedback */}
        {tasksCompletedCount > 0 && (
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2 px-3 rounded-xl">
            <CheckCircle2 size={14} />
            <span>{tasksCompletedCount} micro-meta(s) concluída(s) com sucesso!</span>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            Iniciar Próximo Bloco
          </button>
          <Link
            href="/questions"
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            Treinar Questões
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
