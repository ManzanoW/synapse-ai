"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  Target,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface DailyBriefingCardProps {
  userName?: string | null;
  targetRole?: string | null;
  firstSubjectName?: string | null;
  dueFlashcardsCount?: number;
  streakDays?: number;
}

export function DailyBriefingCard({
  userName,
  targetRole,
  firstSubjectName,
  dueFlashcardsCount = 0,
  streakDays = 0,
}: DailyBriefingCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("synapse_daily_briefing_collapsed");
      if (saved === "true") setIsCollapsed(true);
    } catch {}
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        text: "Bom dia",
        icon: <Sunrise size={18} className="text-amber-400" />,
        phrase: "Hora de começar o dia construindo sua posse!",
      };
    }
    if (hour >= 12 && hour < 18) {
      return {
        text: "Boa tarde",
        icon: <Sun size={18} className="text-amber-400" />,
        phrase: "Mantenha a consistência: cada bloco de estudo conta.",
      };
    }
    return {
      text: "Boa noite",
      icon: <Moon size={18} className="text-indigo-400" />,
      phrase: "Reta final do dia: feche suas metas antes de descansar.",
    };
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    triggerHaptic("light");
    try {
      localStorage.setItem("synapse_daily_briefing_collapsed", String(next));
    } catch {}
  };

  const displayName = userName ? userName.split(" ")[0] : "Concurseiro";
  const prioritySubject = firstSubjectName || "Língua Portuguesa";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-900/95 via-[#0c1222]/95 to-slate-900/95 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Glow de fundo */}
      <div className="absolute -top-14 -left-14 w-40 h-40 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-14 -right-14 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3">
        {/* Saudação com Ícone do Horário */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
            {greeting.icon}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>
                {greeting.text}, {displayName}!
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hidden sm:inline-block">
                FOCO DO DIA
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {greeting.phrase}
            </p>
          </div>
        </div>

        {/* Botão de Recolher */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={isCollapsed ? "Expandir resumo diário" : "Recolher resumo diário"}
        >
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-150">
          {/* Missão do Dia em 1 Frase */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-300 font-medium">
                🎯 Sua meta principal de hoje:
              </span>
              <span className="text-xs font-bold text-white bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
                {prioritySubject}
              </span>
              {dueFlashcardsCount > 0 && (
                <span className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-lg">
                  +{dueFlashcardsCount} flashcards para revisar
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-orange-400 font-semibold">
                <Flame size={13} />
                <span>{streakDays} dias de ofensiva</span>
              </span>
              <span className="text-slate-600">•</span>
              <span>{targetRole ? `Foco: ${targetRole}` : "Concurso Geral"}</span>
            </div>
          </div>

          {/* Botão de Ação Direta em 1 Toque */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/week"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-black shadow-lg shadow-indigo-950/50 transition-all cursor-pointer active:scale-95"
            >
              <Play size={14} className="fill-white" />
              <span>Começar Estudos de Hoje</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
