"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Flame,
  X,
  BookOpen,
  Headphones,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface FirstDayMissionCardProps {
  firstSubjectName?: string;
  hasSubjects: boolean;
  questionsCount: number;
  getHref: (path: string) => string;
}

export function FirstDayMissionCard({
  firstSubjectName = "Língua Portuguesa",
  hasSubjects,
  questionsCount,
  getHref,
}: FirstDayMissionCardProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [preferredBanca, setPreferredBanca] = useState<string>("CEBRASPE");

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("synapse_dismiss_first_day_mission") === "true";
      const banca = localStorage.getItem("synapse_preferred_banca") || "CEBRASPE";
      setPreferredBanca(banca);
      if (dismissed) {
        setIsDismissed(true);
      }
    } catch {}
  }, []);

  // Se o aluno já resolveu mais de 5 questões ou dispensou o card, não precisa mais do guia de 1º dia
  if (isDismissed || questionsCount >= 5) {
    return null;
  }

  const handleDismiss = () => {
    triggerHaptic("light");
    setIsDismissed(true);
    try {
      localStorage.setItem("synapse_dismiss_first_day_mission", "true");
    } catch {}
  };

  const diagnosticQuizUrl = getHref(
    `/questions?banca=${encodeURIComponent(preferredBanca)}&autoStart=1&count=3${
      hasSubjects ? `&subject=${encodeURIComponent(firstSubjectName)}` : ""
    }`
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-linear-to-br from-[#0e1326] via-[#090e1c] to-[#060812] p-5 sm:p-6 shadow-2xl backdrop-blur-2xl"
    >
      {/* Glow de ambientação */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/60 to-transparent" />
      <div className="pointer-events-none absolute -top-16 -left-16 h-36 w-36 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[10px] font-mono font-black text-indigo-300">
              <Sparkles size={11} className="text-indigo-400" />
              Sua 1ª Missão de Hoje • Comece Aqui
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300">
              <Flame size={10} className="fill-amber-400 text-amber-400" />
              Recompensa: +50 XP & Streak Dia 1 🔥
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              Desafio Diagnóstico Rápido: 3 Questões da Banca {preferredBanca}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Descubra seu percentual de acertos em menos de 2 minutos com feedback socrático e comentários de lei. Isso ativa seu algoritmo de repetição FSRS para o resto da semana!
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-slate-300">
              <BookOpen size={13} className="text-cyan-400" />
              Matéria: <strong className="text-white font-bold">{firstSubjectName}</strong>
            </span>
            <span>•</span>
            <span>Tempo estimado: ~2 minutos</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Sem pegadinhas sem explicação</span>
          </div>
        </div>

        {/* Botões de Ação Imediata */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch gap-2.5 shrink-0">
          <Link
            href={diagnosticQuizUrl}
            onClick={() => triggerHaptic("medium")}
            className="px-5 py-3 rounded-xl bg-linear-to-r from-indigo-500 via-indigo-600 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/25 active:scale-95 transition-all text-center inline-flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Fazer Desafio Agora</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href={getHref("/study-room")}
            onClick={() => triggerHaptic("light")}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs transition-all text-center inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Headphones size={13} className="text-slate-400" />
            <span>Ou Abrir Sala de Foco (10 min)</span>
          </Link>
        </div>
      </div>

      {/* Botão de Fechar no canto superior */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3.5 right-3.5 p-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        title="Dispensar recomendação"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
