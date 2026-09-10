"use client";

import React from "react";
import Link from "next/link";
import {
  Timer,
  FileStack,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  BookOpen,
  Zap,
  Target,
} from "lucide-react";

export default function QuizHubPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-4 pb-16">
      {/* HEADER HERO */}
      <div className="relative overflow-hidden bg-linear-to-br from-[#0d1326] via-[#090d18] to-[#04060c] border border-violet-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl">
        <div className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-violet-400" />
            Central de Simulados & Resolução
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Escolha sua Modalidade de Treinamento
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Selecione o modo de treino ideal para o seu momento de estudo: teste a
            pressão temporal com o simulador cronometrado ou estude no seu ritmo
            com feedback detalhado questão por questão.
          </p>
        </div>
      </div>

      {/* CARDS DE MODALIDADE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CARD 1: MODO SIMULADO CRONOMETRADO (DESTAQUE) */}
        <Link
          href="/questions?openTimed=true"
          className="group relative bg-linear-to-br from-[#0f1426] via-[#0a0e1c] to-[#05070e] border border-violet-500/30 hover:border-violet-500/60 p-6 sm:p-8 rounded-3xl cursor-pointer transition-all duration-300 shadow-2xl flex flex-col justify-between overflow-hidden"
        >
          <div className="pointer-events-none absolute top-0 right-0 w-44 h-44 bg-violet-600/15 rounded-full blur-3xl group-hover:bg-violet-600/25 transition-all" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <Timer size={24} />
              </div>

              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-xs">
                Modo Prova Real
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black text-white group-hover:text-violet-200 transition-colors">
                Simulado Cronometrado
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Experiência de pressão psicológica com Pacing Bar dinâmica, grade
                de gabarito interativa, cockpit anti-distração e bônus de XP para
                alta performance dentro do tempo limite.
              </p>
            </div>

            <ul className="space-y-2 pt-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-violet-400 shrink-0" />
                <span>Régua de tempo configurável (3 min/q ou bloco)</span>
              </li>
              <li className="flex items-center gap-2">
                <Target size={14} className="text-violet-400 shrink-0" />
                <span>Auditoria e Grade de Gabarito retrátil (Exam Sheet)</span>
              </li>
              <li className="flex items-center gap-2">
                <Zap size={14} className="text-amber-400 shrink-0" />
                <span>Bônus de até +100 XP por velocidade e precisão</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-black text-violet-300 group-hover:text-white transition-colors">
            <span>Iniciar Simulado Cronometrado</span>
            <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
          </div>
        </Link>

        {/* CARD 2: BANCO DE PROVAS & TREINO LIVRE */}
        <Link
          href="/questions"
          className="group relative bg-linear-to-br from-[#0c101d] via-[#090d18] to-[#05070e] border border-white/10 hover:border-white/25 p-6 sm:p-8 rounded-3xl cursor-pointer transition-all duration-300 shadow-2xl flex flex-col justify-between overflow-hidden"
        >
          <div className="pointer-events-none absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                <FileStack size={24} />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
                Treino Convencional
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black text-white group-hover:text-slate-200 transition-colors">
                Banco de Provas & Treino Livre
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Resolva questões com correção imediata, geração de flashcards por
                IA para cada alternativa incorreta, modo zen e histórico de cadernos.
              </p>
            </div>

            <ul className="space-y-2 pt-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Feedback e justificativa instantânea</span>
              </li>
              <li className="flex items-center gap-2">
                <BookOpen size={14} className="text-indigo-400 shrink-0" />
                <span>Geração de flashcard direcionado com IA</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={14} className="text-slate-400 shrink-0" />
                <span>Acesso ao histórico de simulados salvos</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
            <span>Acessar Banco de Provas</span>
            <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
