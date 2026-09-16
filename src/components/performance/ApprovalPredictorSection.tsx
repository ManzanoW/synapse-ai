"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  BrainCircuit,
  Target,
  Sparkles,
  TrendingUp,
  Sliders,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Scale,
  Award,
} from "lucide-react";
import {
  ApprovalPredictorData,
  getApprovalPredictorDataAction,
} from "@/actions/approval-predictor-actions";

interface ApprovalPredictorSectionProps {
  initialData?: ApprovalPredictorData | null;
}

const CUTOFF_PRESETS = [
  { id: "POLICIAL", label: "👮‍♂️ Policial / Adm", score: 75 },
  { id: "TRIBUNAIS", label: "⚖️ Tribunais / Analista", score: 82 },
  { id: "FISCAL", label: "🏛️ Fiscal / Controle", score: 86 },
  { id: "CUSTOM", label: "⚙️ Personalizado", score: 80 },
];

export function ApprovalPredictorSection({
  initialData,
}: ApprovalPredictorSectionProps) {
  const [data, setData] = useState<ApprovalPredictorData | null>(
    initialData ?? null,
  );
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // Configuração da Nota de Corte
  const [selectedPreset, setSelectedPreset] = useState<string>("TRIBUNAIS");
  const [cutoffScore, setCutoffScore] = useState<number>(82);

  // Simulador Interativo "E se..." (What-If)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  // Mapa de notas hipotéticas por subjectId: { [subjectId]: accuracyPercentage }
  const [simulatedAccuracies, setSimulatedAccuracies] = useState<
    Record<string, number>
  >({});

  // Carrega nota de corte salva no localStorage se disponível
  useEffect(() => {
    try {
      const savedCutoff = localStorage.getItem("synapse_target_cutoff");
      const savedPreset = localStorage.getItem("synapse_target_preset");
      if (savedCutoff) {
        const parsed = Number(savedCutoff);
        if (!isNaN(parsed) && parsed >= 50 && parsed <= 95) {
          setCutoffScore(parsed);
          setSelectedPreset(savedPreset || "CUSTOM");
        }
      }
    } catch {}
  }, []);

  // Busca dados caso não passados via props
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getApprovalPredictorDataAction();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Erro ao carregar preditor de aprovação:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [initialData, fetchData]);

  // Inicializa o simulador com as notas reais quando os dados carregam
  useEffect(() => {
    if (data?.subjects) {
      const initialMap: Record<string, number> = {};
      data.subjects.forEach((s) => {
        initialMap[s.id] = s.accuracy;
      });
      setSimulatedAccuracies(initialMap);
    }
  }, [data]);

  // Atualização de Preset de Nota de Corte
  const handleSelectPreset = (preset: (typeof CUTOFF_PRESETS)[0]) => {
    setSelectedPreset(preset.id);
    if (preset.id !== "CUSTOM") {
      setCutoffScore(preset.score);
      try {
        localStorage.setItem("synapse_target_cutoff", String(preset.score));
        localStorage.setItem("synapse_target_preset", preset.id);
      } catch {}
    }
  };

  const handleCustomCutoffChange = (val: number) => {
    setCutoffScore(val);
    setSelectedPreset("CUSTOM");
    try {
      localStorage.setItem("synapse_target_cutoff", String(val));
      localStorage.setItem("synapse_target_preset", "CUSTOM");
    } catch {}
  };

  // Cálculo da Nota Ponderada Simulada
  const simulatedWeightedScore = useMemo(() => {
    if (!data || !data.subjects || data.subjects.length === 0) return 0;
    if (data.totalWeight <= 0) return 0;

    const sum = data.subjects.reduce((acc, s) => {
      const accVal = simulatedAccuracies[s.id] ?? s.accuracy;
      return acc + accVal * s.weight;
    }, 0);

    return Number((sum / data.totalWeight).toFixed(1));
  }, [data, simulatedAccuracies]);

  // Diferença entre a simulação e a nota real
  const realScore = data?.currentWeightedScore ?? 0;
  const scoreDiffFromSimulation = Number(
    (simulatedWeightedScore - realScore).toFixed(1),
  );
  const isSimulationActive = scoreDiffFromSimulation !== 0;

  // Pontuação em análise (simulada se ativa, senão a real)
  const activeScore = isSimulationActive ? simulatedWeightedScore : realScore;

  // Delta em relação à Nota de Corte
  const deltaToCutoff = Number((activeScore - cutoffScore).toFixed(1));

  // Diagnóstico de Zona
  const zone = useMemo(() => {
    if (deltaToCutoff >= 0) {
      return {
        id: "VAGAS",
        label: "Classificado nas Vagas",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
        accentBg: "from-emerald-500/20 to-teal-500/10 border-emerald-500/40",
        message: `Você está ${deltaToCutoff > 0 ? `+${deltaToCutoff}% acima` : "no limite exato"} da nota de corte estimada. Excelente rendimento!`,
      };
    } else if (deltaToCutoff >= -5) {
      return {
        id: "BATALHA",
        label: "Zona de Batalha (Cadastro de Reserva)",
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
        accentBg: "from-amber-500/20 to-orange-500/10 border-amber-500/40",
        message: `Apenas ${Math.abs(deltaToCutoff)}% para entrar nas vagas diretas. Pequenos ajustes em disciplinas de peso alto garantem a vaga.`,
      };
    } else {
      return {
        id: "RISCO",
        label: "Abaixo da Linha de Corte",
        color: "text-rose-400",
        bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
        accentBg: "from-rose-500/20 to-violet-500/10 border-rose-500/40",
        message: `Faltam ${Math.abs(deltaToCutoff)}% para alcançar a nota de corte. Foque na matriz de maior alavancagem abaixo para encurtar o caminho.`,
      };
    }
  }, [deltaToCutoff]);

  // Cálculo da Probabilidade de Aprovação (0 a 99%)
  const approvalProbability = useMemo(() => {
    // Relação entre a nota ativa e o corte
    const ratio = activeScore / Math.max(1, cutoffScore);
    let baseChance = Math.round(ratio * 70);

    if (deltaToCutoff >= 5) baseChance = 92 + Math.min(6, deltaToCutoff);
    else if (deltaToCutoff >= 0) baseChance = 78 + Math.round(deltaToCutoff * 2.5);
    else if (deltaToCutoff >= -5) baseChance = 55 + Math.round((5 + deltaToCutoff) * 4);
    else baseChance = Math.max(8, Math.round(50 + deltaToCutoff * 3));

    // Pondera com a cobertura do edital se disponível
    const coverage = data?.coveragePercentage ?? 50;
    const finalOdds = Math.round(baseChance * 0.8 + coverage * 0.2);

    return Math.min(99, Math.max(5, finalOdds));
  }, [activeScore, cutoffScore, deltaToCutoff, data?.coveragePercentage]);

  // Reset do simulador
  const handleResetSimulator = () => {
    if (data?.subjects) {
      const resetMap: Record<string, number> = {};
      data.subjects.forEach((s) => {
        resetMap[s.id] = s.accuracy;
      });
      setSimulatedAccuracies(resetMap);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:p-8 backdrop-blur-2xl animate-pulse space-y-4">
        <div className="h-5 w-48 bg-white/5 rounded-full" />
        <div className="h-24 w-full bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (!data || data.subjects.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0a0f1f] via-[#070a16] to-[#04060c] border border-violet-500/30 p-6 md:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
      {/* Luz Neon Cósmica Superior */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-violet-500/60 to-transparent" />
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-600/10 blur-3xl" />

      {/* 1. CABEÇALHO HERO & SELETOR DE NOTA DE CORTE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider">
            <BrainCircuit size={14} className="text-violet-400" />
            <span>Preditor de Aprovação & Pesos Reais do Edital</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Diagnóstico Preditivo da Prova</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
              SM-2 Neural
            </span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Sua nota real calculada multiplicando o peso de cada disciplina do edital pelo seu aproveitamento em simulados.
          </p>
        </div>

        {/* Seletor de Nota de Corte do Concurso */}
        <div className="space-y-2 lg:text-right">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Nota de Corte Alvo do Concurso:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {CUTOFF_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedPreset === preset.id
                    ? "bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-900/40 scale-105"
                    : "bg-slate-800/60 border-white/10 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {preset.label} ({preset.score}%)
              </button>
            ))}
          </div>

          {selectedPreset === "CUSTOM" && (
            <div className="flex items-center justify-end gap-3 pt-1">
              <span className="text-xs font-mono font-bold text-violet-300">
                {cutoffScore}%
              </span>
              <input
                type="range"
                min="50"
                max="95"
                step="1"
                value={cutoffScore}
                onChange={(e) => handleCustomCutoffChange(Number(e.target.value))}
                className="w-36 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. PLACAR PRINCIPAL: NOTA PONDERADA VS NOTA DE CORTE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Sua Nota Ponderada Real */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/80 border border-white/10 p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Scale size={15} className="text-violet-400" />
              <span>Nota Ponderada Global</span>
            </span>
            {isSimulationActive && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                Simulado
              </span>
            )}
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
              {activeScore}%
            </span>
            <span className="text-xs text-slate-400 font-medium">da prova</span>
          </div>

          {isSimulationActive && (
            <div className="mt-2 text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
              <TrendingUp size={14} />
              <span>
                +{scoreDiffFromSimulation}% vs nota real ({realScore}%)
              </span>
            </div>
          )}

          <p className="text-[11px] text-slate-400 mt-2">
            Calculada a partir de {data.totalWeight.toFixed(1)} pontos de peso distribuídos no edital.
          </p>
        </div>

        {/* Card 2: Comparativo com o Corte & Zona de Classificação */}
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${zone.accentBg} border p-5 shadow-xl flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Linha de Corte: {cutoffScore}%
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${zone.bg}`}>
              {zone.id}
            </span>
          </div>

          <div className="mt-3">
            <h3 className={`text-lg font-black tracking-tight ${zone.color}`}>
              {zone.label}
            </h3>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">
              {zone.message}
            </p>
          </div>

          {/* Barra de comparação visual */}
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Sua Nota: {activeScore}%</span>
              <span>Corte: {cutoffScore}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/10 relative">
              {/* Marcador da Nota de Corte */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white z-10 shadow-[0_0_8px_#fff]"
                style={{ left: `${cutoffScore}%` }}
                title={`Nota de Corte: ${cutoffScore}%`}
              />
              {/* Barra do aluno */}
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  activeScore >= cutoffScore
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                    : activeScore >= cutoffScore - 5
                    ? "bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                    : "bg-gradient-to-r from-rose-500 to-violet-500"
                }`}
                style={{ width: `${Math.min(100, activeScore)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Probabilidade Estatística de Aprovação */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/80 border border-white/10 p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles size={15} className="text-cyan-400" />
              <span>Chance Estimada de Vaga</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-cyan-300">
              Previsão IA
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 font-mono tracking-tight">
              {approvalProbability}%
            </span>
            <span className="text-xs text-slate-400 font-medium">probabilidade</span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2 overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${approvalProbability}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 rounded-full"
            />
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            Pondera precisão das disciplinas, cobertura do edital ({data.coveragePercentage}%) e margem de corte.
          </p>
        </div>
      </div>

      {/* 3. CAMINHO CRÍTICO DE MAIOR ALAVANCAGEM (MENOR ESFORÇO) */}
      {data.topLeverageSubjects && data.topLeverageSubjects.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-indigo-950/20 to-slate-900/60 border border-violet-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-400 fill-amber-400" />
              <h3 className="text-sm font-extrabold text-white">
                Caminho Crítico de Maior Alavancagem (Menor Esforço)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Máximo Retorno por Hora
            </span>
          </div>

          <p className="text-xs text-slate-300">
            A IA analisou os pesos do edital e sua precisão atual. Estas são as matérias onde seu tempo terá o maior impacto direto na nota final:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {data.topLeverageSubjects.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 hover:border-violet-500/40 transition-all flex flex-col justify-between space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                    {item.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Peso {item.weight.toFixed(1)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-snug">
                  {item.recommendation}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                  <span className="text-slate-400">
                    Acerto atual: <strong className="text-white">{item.accuracy}%</strong>
                  </span>
                  <Link
                    href={`/questions?subjectId=${item.id}`}
                    className="text-violet-400 hover:text-white font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>Treinar</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SIMULADOR INTERATIVO "E SE..." (WHAT-IF) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsSimulatorOpen((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Simulador de Impacto &quot;E se...&quot;</span>
                {isSimulationActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    Ativo (+{scoreDiffFromSimulation} pts)
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Ajuste os sliders para projetar como aumentos de rendimento em matérias específicas alavancam sua aprovação.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            {isSimulatorOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        <AnimatePresence>
          {isSimulatorOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="p-5 sm:p-6 border-t border-white/10 space-y-5 bg-slate-950/40"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">
                  Ajuste o rendimento hipotético (%) em cada disciplina:
                </span>
                {isSimulationActive && (
                  <button
                    type="button"
                    onClick={handleResetSimulator}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Resetar Simulação</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.subjects.map((sub) => {
                  const simulatedValue = simulatedAccuracies[sub.id] ?? sub.accuracy;
                  const diff = simulatedValue - sub.accuracy;

                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate max-w-[200px]">
                          <span className="font-bold text-slate-200 truncate">
                            {sub.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-[10px] text-slate-400">
                            Peso {sub.weight.toFixed(1)} ({sub.weightPercentage}%)
                          </span>
                          <span
                            className={`font-black text-xs ${
                              diff > 0
                                ? "text-emerald-400"
                                : diff < 0
                                ? "text-rose-400"
                                : "text-white"
                            }`}
                          >
                            {simulatedValue}%
                            {diff !== 0 && (
                              <span className="text-[10px] ml-1">
                                ({diff > 0 ? `+${diff}` : diff}%)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={simulatedValue}
                        onChange={(e) =>
                          setSimulatedAccuracies((prev) => ({
                            ...prev,
                            [sub.id]: Number(e.target.value),
                          }))
                        }
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                      />

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Real: {sub.accuracy}%</span>
                        <span>
                          Impacto máx: +{sub.leverageScore.toFixed(1)} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
