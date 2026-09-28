"use client";

import React from "react";
import {
  X,
  Check,
  CheckSquare,
  Sparkles,
  SlidersHorizontal,
  Target,
  Zap,
  BookOpen,
  BrainCircuit,
  Trophy,
  Headphones,
  Calendar,
  Gauge,
} from "lucide-react";
import type { DashboardCardVisibility } from "@/app/(dashboard)/dashboard/dashboard-client";

interface CustomizeCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleCards: DashboardCardVisibility;
  onToggleCard: (key: keyof DashboardCardVisibility) => void;
  onApplyPreset: (mode: "minimal" | "practice" | "full") => void;
  currentMode: "full" | "minimal" | "practice" | "custom";
}

interface CardItemConfig {
  key: keyof DashboardCardVisibility;
  title: string;
  category: "essencial" | "analitico" | "foco";
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

const CARDS_CONFIG: CardItemConfig[] = [
  {
    key: "heroJourney",
    title: "Jornada & Dias Restantes",
    category: "essencial",
    description: "Contador regressivo de dias até a prova e % de cobertura do edital.",
    icon: Target,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10 border-indigo-500/30",
  },
  {
    key: "quickActions",
    title: "Atalhos Rápidos",
    category: "essencial",
    description: "Botões de acesso veloz para Questões, Flashcards, Edital e Conquistas.",
    icon: Zap,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/30",
  },
  {
    key: "dailyQuests",
    title: "Missões Diárias & Metas",
    category: "essencial",
    description: "Checklist de tarefas do dia e progresso de horas de estudo.",
    icon: CheckSquare,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/30",
  },
  {
    key: "subjects",
    title: "Minhas Matérias",
    category: "essencial",
    description: "Grade de disciplinas com acurácia, tempo dedicado e tópicos pendentes.",
    icon: BookOpen,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10 border-blue-500/30",
  },
  {
    key: "keyMetrics",
    title: "Métricas de Desempenho",
    category: "analitico",
    description: "Tempo total de estudo, precisão geral e média por sessão.",
    icon: Gauge,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10 border-cyan-500/30",
  },
  {
    key: "radarDomain",
    title: "Radar de Matérias vs Peso da Prova",
    category: "analitico",
    description: "Compara seu aproveitamento atual com a importância de cada matéria no concurso.",
    icon: BrainCircuit,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10 border-violet-500/30",
  },
  {
    key: "approvalOdds",
    title: "Chance de Aprovação (IA)",
    category: "analitico",
    description: "Estimativa calculada pela IA com base nos seus simulados, matérias e constância.",
    icon: Trophy,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/30",
  },
  {
    key: "aiSuggestions",
    title: "Sugestões de Estudo com IA",
    category: "analitico",
    description: "Recomendações da IA para priorizar matérias que mais precisam de revisão.",
    icon: Sparkles,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10 border-cyan-500/30",
  },
  {
    key: "gamification",
    title: "Nível, XP & Ofensiva",
    category: "foco",
    description: "Painel de gamificação, nível do concurseiro e streak freeze de dias ativos.",
    icon: Trophy,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10 border-purple-500/30",
  },
  {
    key: "focusRoom",
    title: "Sala de Foco & Concentração",
    category: "foco",
    description: "Timer de estudo pomodoro com sons ambientes e ondas para manter o foco.",
    icon: Headphones,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10 border-indigo-500/30",
  },
  {
    key: "heatmap",
    title: "Mapa de Frequência Anual",
    category: "analitico",
    description: "Visualização dos dias em que você estudou ao longo de todo o ano.",
    icon: Calendar,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/30",
  },
];

export function CustomizeCardsModal({
  isOpen,
  onClose,
  visibleCards,
  onToggleCard,
  onApplyPreset,
  currentMode,
}: CustomizeCardsModalProps) {
  if (!isOpen) return null;

  const activeCount = Object.values(visibleCards).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="bg-slate-950 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Topbar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  Personalizar Cards do Dashboard
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {activeCount} ativos
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Escolha o que você deseja ver na tela principal para um estudo mais focado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Presets Rápidos */}
        <div className="p-4 bg-slate-900/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2.5">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Modos Pré-definidos:
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onApplyPreset("minimal")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentMode === "minimal"
                  ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10"
              }`}
            >
              <span>🌟 Essencial</span>
            </button>

            <button
              type="button"
              onClick={() => onApplyPreset("practice")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentMode === "practice"
                  ? "bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/20"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10"
              }`}
            >
              <span>🎯 Prática</span>
            </button>

            <button
              type="button"
              onClick={() => onApplyPreset("full")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentMode === "full"
                  ? "bg-cyan-600 text-white font-black shadow-md shadow-cyan-600/20"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10"
              }`}
            >
              <span>🚀 Completo</span>
            </button>
          </div>
        </div>

        {/* Lista de Cards para Seleção */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 custom-scrollbar flex-1">
          {CARDS_CONFIG.map((card) => {
            const isChecked = Boolean(visibleCards[card.key]);
            const Icon = card.icon;

            return (
              <button
                key={card.key}
                type="button"
                onClick={() => onToggleCard(card.key)}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  isChecked
                    ? "bg-slate-900/90 border-indigo-500/40 shadow-sm"
                    : "bg-slate-900/20 border-white/5 opacity-60 hover:opacity-100 hover:bg-slate-900/40"
                }`}
              >
                <div
                  className={`mt-0.5 w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${card.iconBg} ${card.iconColor}`}
                >
                  <Icon size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isChecked ? "text-white" : "text-slate-400"
                      }`}
                    >
                      {card.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        card.category === "essencial"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : card.category === "analitico"
                          ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}
                    >
                      {card.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="shrink-0 mt-0.5">
                  {isChecked ? (
                    <div className="w-5 h-5 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                      <Check size={13} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-lg border border-slate-700 bg-slate-800" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-white/10 bg-slate-900/95 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Preferências salvas no seu navegador.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
