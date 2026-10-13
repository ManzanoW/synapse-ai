// src/components/quiz/CebraspeRiskOracleModal.tsx
"use client";

import React, { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Target,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Percent,
  Sliders,
  Crown,
  HelpCircle,
  Lightbulb,
  Loader2,
  Scale,
  Brain,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  runCebraspeOracleSimulationAction,
  CebraspeSimulationInput,
  CebraspeSimulationResult,
} from "@/actions/cebraspe-oracle-actions";
import { useSound } from "@/hooks/useSound";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface CebraspeRiskOracleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTotalQuestions?: number;
}

const PRESETS = [
  {
    name: "Polícia Federal (Agente)",
    total: 120,
    cutoff: 76,
    sure: 74,
    doubt: 28,
  },
  {
    name: "Polícia Rodoviária Federal",
    total: 120,
    cutoff: 74,
    sure: 72,
    doubt: 32,
  },
  {
    name: "TCU (Auditor de Controle)",
    total: 120,
    cutoff: 82,
    sure: 80,
    doubt: 25,
  },
  {
    name: "INSS (Técnico do Seguro)",
    total: 120,
    cutoff: 88,
    sure: 86,
    doubt: 22,
  },
];

export function CebraspeRiskOracleModal({
  isOpen,
  onClose,
  defaultTotalQuestions = 120,
}: CebraspeRiskOracleModalProps) {
  const [totalQuestions, setTotalQuestions] = useState(defaultTotalQuestions);
  const [targetCutoff, setTargetCutoff] = useState(76);
  const [sureCount, setSureCount] = useState(74);
  const [sureAccuracy, setSureAccuracy] = useState(92);
  const [doubtCount, setDoubtCount] = useState(28);
  const [doubtAccuracy, setDoubtAccuracy] = useState(55);
  const [usePersonalData, setUsePersonalData] = useState(false);

  const [simulationResult, setSimulationResult] = useState<CebraspeSimulationResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { playClick, playChime } = useSound();

  const handleRunSimulation = () => {
    playClick();
    triggerHaptic("medium");

    startTransition(async () => {
      const res = await runCebraspeOracleSimulationAction({
        totalQuestions,
        targetCutoffScore: targetCutoff,
        sureCount,
        sureAccuracy: sureAccuracy / 100,
        doubtCount,
        doubtAccuracy: doubtAccuracy / 100,
        blankCount: Math.max(0, totalQuestions - sureCount - doubtCount),
        usePersonalHistoricalData: usePersonalData,
      });

      if (res.success) {
        setSimulationResult(res);
        playChime();
      }
    });
  };

  useEffect(() => {
    if (isOpen && !simulationResult) {
      handleRunSimulation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    playClick();
    triggerHaptic("light");
    setTotalQuestions(preset.total);
    setTargetCutoff(preset.cutoff);
    setSureCount(preset.sure);
    setDoubtCount(preset.doubt);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl z-10 space-y-6 text-slate-100 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER DO MODAL */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Scale size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    Oráculo de Risco Cebraspe
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">
                    Monte Carlo 2.000x
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Calculadora Matemática de Ponto de Equilíbrio: Chutar vs. Deixar em Branco
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* PRESETS RÁPIDOS */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Selecione o Cenário do Concurso Alvo:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer shrink-0"
                >
                  {p.name} (~{p.cutoff} pts)
                </button>
              ))}
            </div>
          </div>

          {/* PAINEL DE CONTROLES E PARÂMETROS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Nota de Corte Alvo:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={targetCutoff}
                  onChange={(e) => setTargetCutoff(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-400 font-mono">pts</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Questões com Certeza:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={sureCount}
                  onChange={(e) => setSureCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-mono">itens</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Questões em Dúvida:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={doubtCount}
                  onChange={(e) => setDoubtCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-400 font-mono">itens</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Deixadas em Branco:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  disabled
                  value={Math.max(0, totalQuestions - sureCount - doubtCount)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-3 py-2 text-sm font-mono text-slate-400"
                />
                <span className="text-xs text-slate-500 font-mono">itens</span>
              </div>
            </div>
          </div>

          {/* TOGGLE EXCLUSIVO PRO: DADOS REAIS DO CADERNO DE ERROS */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Brain size={18} className="text-indigo-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  Calibrar com meu Histórico do Caderno de Erros
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-extrabold uppercase">
                    PRO
                  </span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Usa sua taxa real de erro em pegadinhas e interpretação do Synapse AI
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playClick();
                setUsePersonalData(!usePersonalData);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                usePersonalData
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              {usePersonalData ? "Ativo ✅" : "Ativar Calibração"}
            </button>
          </div>

          {/* BOTÃO EXECUTAR SIMULAÇÃO */}
          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={isPending}
            className="w-full py-3.5 rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs transition-all shadow-xl shadow-indigo-600/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processando 2.000 Provas no Simulador...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Simular Probabilidade & Ponto de Equilíbrio</span>
              </>
            )}
          </button>

          {/* RESULTADOS COMPARATIVOS DAS ESTRATÉGIAS */}
          {simulationResult?.success && (
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. CONSERVADORA */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    {simulationResult.strategies.conservative.name}
                  </span>
                  <div>
                    <span className="text-3xl font-black text-white">
                      {simulationResult.strategies.conservative.expectedNetScore}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">pts líquidos</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Prob. Aprovação:</span>
                      <strong className="text-emerald-400">
                        {simulationResult.strategies.conservative.probabilityOfPassing}%
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Risco Catástrofe:</span>
                      <strong className="text-slate-300">
                        {simulationResult.strategies.conservative.catastropheRisk}%
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Em Branco:</span>
                      <strong className="text-white">
                        {simulationResult.strategies.conservative.blanksRecommended} itens
                      </strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 border-t border-white/5 pt-2">
                    {simulationResult.strategies.conservative.summary}
                  </p>
                </div>

                {/* 2. AGRESSIVA */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-rose-500/20 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase text-rose-400 tracking-wider block">
                    {simulationResult.strategies.aggressive.name}
                  </span>
                  <div>
                    <span className="text-3xl font-black text-rose-300">
                      {simulationResult.strategies.aggressive.expectedNetScore}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">pts líquidos</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Prob. Aprovação:</span>
                      <strong className="text-amber-400">
                        {simulationResult.strategies.aggressive.probabilityOfPassing}%
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Risco Catástrofe:</span>
                      <strong className="text-rose-400">
                        {simulationResult.strategies.aggressive.catastropheRisk}%
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Em Branco:</span>
                      <strong className="text-white">
                        {simulationResult.strategies.aggressive.blanksRecommended} itens
                      </strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 border-t border-white/5 pt-2">
                    {simulationResult.strategies.aggressive.summary}
                  </p>
                </div>

                {/* 3. PONTO DE EQUILÍBRIO ÓTIMO (DESTAQUE) */}
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 shadow-lg shadow-indigo-600/10 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider block">
                      {simulationResult.strategies.optimal.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-extrabold uppercase">
                      RECOMENDADO
                    </span>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-indigo-200">
                      {simulationResult.strategies.optimal.expectedNetScore}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">pts líquidos</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Prob. Aprovação:</span>
                      <strong className="text-emerald-300">
                        {simulationResult.strategies.optimal.probabilityOfPassing}%
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Risco Catástrofe:</span>
                      <strong className="text-slate-300">
                        {simulationResult.strategies.optimal.catastropheRisk}%
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Em Branco Ideal:</span>
                      <strong className="text-indigo-300">
                        {simulationResult.strategies.optimal.blanksRecommended} itens
                      </strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-indigo-200/90 border-t border-indigo-500/20 pt-2">
                    {simulationResult.strategies.optimal.summary}
                  </p>
                </div>
              </div>

              {/* PARECER DO EXAMINADOR TÁTICO */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Lightbulb size={15} /> Parecer Tático do Examinador Synapse:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {simulationResult.examinerRecommendation}
                </p>
                <div className="pt-2 text-[11px] text-slate-400 italic">
                  💡 {simulationResult.tacticalTip}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
