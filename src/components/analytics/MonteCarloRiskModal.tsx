// src/components/analytics/MonteCarloRiskModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Target,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Sliders,
  Printer,
  ShieldCheck,
  Zap,
  ArrowRight,
  Activity,
  CheckCircle2,
} from "lucide-react";
import {
  runMonteCarloSimulationAction,
  MonteCarloSimulationResult,
} from "@/actions/monte-carlo-actions";
import { useSound } from "@/hooks/useSound";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface MonteCarloRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDossier: () => void;
}

export function MonteCarloRiskModal({
  isOpen,
  onClose,
  onOpenDossier,
}: MonteCarloRiskModalProps) {
  const [data, setData] = useState<MonteCarloSimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cutoff, setCutoff] = useState<number>(80);
  const { playClick, playChime } = useSound();

  const fetchSimulation = async (cutoffVal?: number) => {
    setIsLoading(true);
    try {
      const res = await runMonteCarloSimulationAction(cutoffVal);
      if (res.success && res.data) {
        setData(res.data);
        setCutoff(res.data.cutoffScore);
      }
    } catch (err) {
      console.error("Erro ao carregar simulação de Monte Carlo:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSimulation();
    }
  }, [isOpen]);

  const handleCutoffChange = (newVal: number) => {
    setCutoff(newVal);
    triggerHaptic("light");
  };

  const handleApplyCutoff = () => {
    playClick();
    triggerHaptic("medium");
    fetchSimulation(cutoff);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/70 dark:bg-black/85 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#07090e] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-5 sm:p-7 overflow-y-auto z-10 space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Activity size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Raio-X Preditivo de Aprovação
                  </h2>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono">
                    Monte Carlo 1.000x
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Simulação estocástica multivariada calculando o risco real e ganho marginal por matéria
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onOpenDossier();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                title="Abrir relatório formatado para impressão em PDF"
              >
                <Printer size={15} />
                <span className="hidden sm:inline">Dossiê Semanal</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {isLoading || !data ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Processando 1.000 iterações estocásticas de prova...
              </p>
              <span className="text-[11px] text-slate-400">
                Calculando desvios padrões e matriz de custo de oportunidade
              </span>
            </div>
          ) : (
            <>
              {/* Cockpit com Probabilidade & Percentis P10 / P50 / P90 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Probabilidade Real de Aprovação */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Probabilidade Estimada
                  </span>
                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white">
                      {data.approvalProbability}%
                    </span>
                    <span className="text-xs text-slate-400 font-medium">de chance</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Corte de referência: <strong>{data.cutoffScore} pts</strong>
                  </span>
                </div>

                {/* 2. P10 (Cenário Conservador) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                    P10 • Cenário Conservador
                  </span>
                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                      {data.p10Score}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Pior caso estatístico (dia ruim ou prova atípica)
                  </span>
                </div>

                {/* 3. P50 (Cenário Mediano) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    P50 • Cenário Mediano
                  </span>
                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                      {data.p50Score}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Nota mais provável com sua acurácia atual
                  </span>
                </div>

                {/* 4. P90 (Cenário Otimista) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    P90 • Cenário Otimista
                  </span>
                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                      {data.p90Score}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Teto de desempenho se a prova encaixar
                  </span>
                </div>
              </div>

              {/* Slider de Calibração da Nota de Corte */}
              <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 justify-center sm:justify-start">
                    <Sliders size={14} className="text-indigo-500" />
                    <span>Calibrar Nota de Corte do Concurso</span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ajuste conforme o histórico da banca do seu cargo
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <input
                    type="range"
                    min={60}
                    max={95}
                    value={cutoff}
                    onChange={(e) => handleCutoffChange(Number(e.target.value))}
                    className="w-full sm:w-44 accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 min-w-[50px] text-right">
                    {cutoff} pts
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyCutoff}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                  >
                    Recalcular
                  </button>
                </div>
              </div>

              {/* Histograma da Curva de Gauss (Monte Carlo) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BarChart3 size={15} className="text-indigo-500" />
                    <span>Curva Estocástica de Desempenho (1.000 Provas)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Barras verdes = Acima da Nota de Corte ({data.cutoffScore} pts)
                  </span>
                </div>

                <div className="p-4 bg-slate-50/60 dark:bg-white/[0.01] border border-slate-200/80 dark:border-white/5 rounded-2xl flex items-end gap-1.5 sm:gap-2 h-36 pt-6">
                  {data.distributionCurve.map((bucket, idx) => {
                    const maxFreq = Math.max(...data.distributionCurve.map((b) => b.frequency), 1);
                    const heightPercent = Math.max(8, Math.round((bucket.frequency / maxFreq) * 100));

                    return (
                      <div
                        key={`bar-${idx}`}
                        className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                      >
                        {/* Tooltip Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-mono whitespace-nowrap pointer-events-none z-20 shadow-md">
                          {bucket.scoreRange} pts: {bucket.frequency} provas
                        </div>

                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            bucket.isCutoffOrAbove
                              ? "bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                              : "bg-slate-300 dark:bg-white/10 group-hover:bg-slate-400 dark:group-hover:bg-white/20"
                          }`}
                        />
                        <span className="text-[9px] font-mono text-slate-400 truncate max-w-full">
                          {bucket.scoreMid}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Matriz de Custo de Oportunidade & Ganho Marginal por Matéria */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Target size={15} className="text-indigo-500" />
                    <span>Custo de Oportunidade: Maior Retorno por Hora Investida</span>
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    🚀 Ponto Focal: {data.highestLeverageSubject}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-200/80 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-transparent">
                  {data.subjectsRisk.map((sub, sIdx) => (
                    <div
                      key={`sub-risk-${sIdx}`}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {sub.subjectName}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.2 rounded-full border ${
                              sub.riskLevel === "CRITICO"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                : sub.riskLevel === "MODERADO"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {sub.riskLevel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {sub.recommendation}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Acurácia Atual
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-200">
                            {sub.currentAccuracy}%
                          </span>
                        </div>

                        <div className="text-right pl-3 border-l border-slate-200 dark:border-white/10">
                          <span className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase font-bold block">
                            Ganho / +3h
                          </span>
                          <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                            +{sub.marginalGainPer3Hours} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo Executivo Prescritivo */}
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-950 dark:text-indigo-100 flex items-start gap-3 text-xs leading-relaxed">
                <Sparkles size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                <span>{data.executiveSummary}</span>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
            <span className="text-[11px] text-slate-400">
              Metodologia de Risco Estocástico • Synapse AI Lab
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              Fechar Análise
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
