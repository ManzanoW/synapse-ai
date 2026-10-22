"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Gauge,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sliders,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface DDayPacingWidgetProps {
  totalBlocks: number;
  completedBlocks: number;
  totalMinutes: number;
  weeklyGoalHours: number;
  activeDaysPerWeek: number;
  onOpenEmergencyModal?: () => void;
}

export function DDayPacingWidget({
  totalBlocks,
  completedBlocks,
  totalMinutes,
  weeklyGoalHours,
  activeDaysPerWeek,
  onOpenEmergencyModal,
}: DDayPacingWidgetProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [examDateStr, setExamDateStr] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("synapse_dday_target_date");
      if (saved) return saved;
    }
    // Padrão: 60 dias a partir de hoje
    const target = new Date();
    target.setDate(target.getDate() + 60);
    return target.toISOString().split("T")[0];
  });

  const [simulatedDailyHours, setSimulatedDailyHours] = useState<number>(() => {
    return Number((weeklyGoalHours / Math.max(1, activeDaysPerWeek)).toFixed(1)) || 3;
  });

  // Salvar data no localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("synapse_dday_target_date", examDateStr);
    }
  }, [examDateStr]);

  // Cálculos do D-Day
  const calculations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const examDate = new Date(examDateStr + "T00:00:00");
    const diffTime = examDate.getTime() - today.getTime();
    const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const effectiveTotalBlocks = Math.max(1, totalBlocks);
    const remainingBlocks = Math.max(0, effectiveTotalBlocks - completedBlocks);
    const completionPercent = Math.min(
      100,
      Math.round((completedBlocks / effectiveTotalBlocks) * 100)
    );

    // Média de minutos por bloco (padrão 50min se totalMinutes for 0)
    const minutesPerBlock =
      totalBlocks > 0 && totalMinutes > 0
        ? totalMinutes / totalBlocks
        : 50;

    const remainingMinutes = remainingBlocks * minutesPerBlock;
    const remainingHours = remainingMinutes / 60;

    // Ritmo atual planejado por dia
    const currentDailyHours =
      Number((weeklyGoalHours / Math.max(1, activeDaysPerWeek)).toFixed(1)) || 2.5;

    // Ritmo necessário para fechar 100% até a prova
    const requiredDailyHours = Number((remainingHours / daysRemaining).toFixed(1));
    const requiredBlocksPerDay = Number((remainingBlocks / daysRemaining).toFixed(1));

    // Data estimada em que fechará com o ritmo atual
    const daysToFinishWithCurrentPace =
      currentDailyHours > 0
        ? Math.ceil(remainingHours / currentDailyHours)
        : 999;

    const projectedFinishDate = new Date();
    projectedFinishDate.setDate(projectedFinishDate.getDate() + daysToFinishWithCurrentPace);

    // Status do velocímetro
    // Se o ritmo atual for >= necessário -> NO RITMO
    // Se o ritmo atual for entre 70% e 99% -> ATENÇÃO
    // Se for < 70% -> ATRASO CRÍTICO
    const pacingRatio =
      requiredDailyHours > 0
        ? currentDailyHours / requiredDailyHours
        : 1;

    let status: "NO_RITMO" | "ATENCAO" | "ATRASO" = "NO_RITMO";
    if (pacingRatio >= 1) {
      status = "NO_RITMO";
    } else if (pacingRatio >= 0.75) {
      status = "ATENCAO";
    } else {
      status = "ATRASO";
    }

    return {
      daysRemaining,
      remainingBlocks,
      completionPercent,
      remainingHours: Math.round(remainingHours),
      currentDailyHours,
      requiredDailyHours,
      requiredBlocksPerDay,
      daysToFinishWithCurrentPace,
      projectedFinishDate: projectedFinishDate.toLocaleDateString("pt-BR"),
      status,
      pacingRatio,
    };
  }, [examDateStr, totalBlocks, completedBlocks, totalMinutes, weeklyGoalHours, activeDaysPerWeek]);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-xl transition-all">
      {/* ================= CABEÇALHO RESUMO ================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${
              calculations.status === "NO_RITMO"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : calculations.status === "ATENCAO"
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                : "bg-rose-500/15 border-rose-500/30 text-rose-400"
            }`}
          >
            <Gauge size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                Velocímetro do Edital & Reta Final
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  calculations.status === "NO_RITMO"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : calculations.status === "ATENCAO"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                }`}
              >
                {calculations.status === "NO_RITMO"
                  ? "🟢 No Ritmo Ideal"
                  : calculations.status === "ATENCAO"
                  ? "🟡 Atenção ao Ritmo"
                  : "🔴 Atraso no Edital"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {calculations.status === "NO_RITMO"
                ? `Você fecha 100% do edital antes do Dia D com folga para revisões!`
                : calculations.status === "ATENCAO"
                ? `Aumente cerca de 30-45min por dia para garantir a cobertura completa.`
                : `No ritmo atual, o edital não será 100% vencido até a prova. Rebalanceie.`}
            </p>
          </div>
        </div>

        {/* D-Day Countdown & Botão Expandir */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <Calendar size={14} className="text-indigo-400" />
            <span className="text-slate-300 font-medium">Dia D:</span>
            <input
              type="date"
              value={examDateStr}
              onChange={(e) => {
                if (e.target.value) {
                  triggerHaptic("light");
                  setExamDateStr(e.target.value);
                }
              }}
              className="bg-transparent text-white font-mono font-bold text-xs outline-none cursor-pointer"
            />
            <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-black text-[10px]">
              {calculations.daysRemaining}d
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setIsExpanded(!isExpanded);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* ================= BARRA DE PROGRESSO & INDICADORES RÁPIDOS ================= */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <TrendingUp size={13} className="text-indigo-400" />
            <span>Cobertura do Edital:</span>
            <strong className="text-white">{calculations.completionPercent}%</strong>
          </span>
          <span className="text-slate-400 text-[11px] font-mono">
            {completedBlocks}/{totalBlocks} blocos concluídos ({calculations.remainingBlocks} restantes)
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              calculations.status === "NO_RITMO"
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : calculations.status === "ATENCAO"
                ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                : "bg-gradient-to-r from-rose-500 to-orange-400"
            }`}
            style={{ width: `${Math.max(5, calculations.completionPercent)}%` }}
          />
        </div>
      </div>

      {/* ================= DETALHAMENTO EXPANSÍVEL & SIMULADOR ================= */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in duration-200">
          {/* Grid de 3 Métricas Críticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[11px] text-slate-400 font-medium block">
                Ritmo Diário Atual
              </span>
              <div className="text-lg font-black text-white font-mono mt-0.5">
                {calculations.currentDailyHours}h
                <span className="text-xs font-normal text-slate-400">/dia útil</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Baseado em {weeklyGoalHours}h na meta semanal
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[11px] text-slate-400 font-medium block">
                Ritmo Necessário para Fechar
              </span>
              <div
                className={`text-lg font-black font-mono mt-0.5 ${
                  calculations.requiredDailyHours <= calculations.currentDailyHours
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {calculations.requiredDailyHours}h
                <span className="text-xs font-normal text-slate-400">/dia corrido</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                ≈ {calculations.requiredBlocksPerDay} blocos/dia em {calculations.daysRemaining} dias
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[11px] text-slate-400 font-medium block">
                Conclusão Estimada
              </span>
              <div className="text-lg font-black text-indigo-400 font-mono mt-0.5">
                {calculations.projectedFinishDate}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                No ritmo atual de estudos
              </span>
            </div>
          </div>

          {/* SIMULADOR INTERATIVO DE META */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 w-full sm:w-auto">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sliders size={14} />
                <span>Simulador de Horas Diárias</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Ajuste suas horas por dia para ver quando você fechará todo o conteúdo:
              </p>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={simulatedDailyHours}
                  onChange={(e) => setSimulatedDailyHours(parseFloat(e.target.value))}
                  className="w-36 accent-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-lg">
                  {simulatedDailyHours}h / dia
                </span>
                <span className="text-xs text-emerald-400 font-medium">
                  → Fecha em {Math.ceil(calculations.remainingHours / Math.max(0.5, simulatedDailyHours))} dias
                </span>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {onOpenEmergencyModal && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("medium");
                    onOpenEmergencyModal();
                  }}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <AlertTriangle size={13} />
                  <span>Rebalancear de Emergência</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  window.dispatchEvent(new CustomEvent("open-pocket-summary"));
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Zap size={13} />
                <span>Folha de Véspera (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
