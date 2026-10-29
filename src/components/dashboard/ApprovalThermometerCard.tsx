"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Target,
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { DashboardSubject } from "@/types";

interface ApprovalThermometerCardProps {
  subjects: DashboardSubject[];
  precisionText?: string;
  completedTopicsCount?: number;
  totalTopicsCount?: number;
  banca?: string;
  targetRole?: string;
}

export function ApprovalThermometerCard({
  subjects = [],
  precisionText = "0%",
  completedTopicsCount = 0,
  totalTopicsCount = 0,
  banca = "CEBRASPE",
  targetRole = "Concurso Público",
}: ApprovalThermometerCardProps) {
  const calculation = useMemo(() => {
    // 1. Extrai precisão numérica (ex: "74%" -> 74)
    const rawPrecision = parseFloat(precisionText.replace("%", "").trim()) || 0;

    // 2. Cobertura do edital
    const coverage =
      totalTopicsCount > 0
        ? Math.min(100, Math.round((completedTopicsCount / totalTopicsCount) * 100))
        : 0;

    // 3. Nota de corte de referência por banca/estilo
    const upperBanca = (banca || "CEBRASPE").toUpperCase();
    const cutoffBaseline = upperBanca.includes("FGV")
      ? 82
      : upperBanca.includes("FCC")
        ? 80
        : upperBanca.includes("VUNESP")
          ? 78
          : 76; // Padrão Cebraspe (onde 1 errada anula 1 certa)

    // 4. Estimativa ponderada de prova (Precisão nas questões x Cobertura do edital)
    // Se o aluno ainda não fez questões, baseia-se no início da jornada
    let estimatedScore = 0;
    if (rawPrecision > 0 && coverage > 0) {
      estimatedScore = Math.round(rawPrecision * 0.75 + coverage * 0.25);
    } else if (rawPrecision > 0) {
      estimatedScore = Math.round(rawPrecision * 0.65);
    } else if (coverage > 0) {
      estimatedScore = Math.round(coverage * 0.4);
    }

    // 5. Distância da nota de corte
    const diff = estimatedScore - cutoffBaseline;
    const isAboveCutoff = diff >= 0;
    const distancePoints = Math.abs(diff);

    // 6. Matéria com maior oportunidade de ganho rápido (menor desempenho)
    let weakestSubject = subjects[0];
    let minPerf = 100;
    for (const sub of subjects) {
      const perf = (sub as any).performance || 50;
      if (perf < minPerf) {
        minPerf = perf;
        weakestSubject = sub;
      }
    }

    return {
      estimatedScore,
      cutoffBaseline,
      diff,
      isAboveCutoff,
      distancePoints,
      weakestSubject,
      coverage,
      rawPrecision,
    };
  }, [precisionText, completedTopicsCount, totalTopicsCount, banca, subjects]);

  const {
    estimatedScore,
    cutoffBaseline,
    isAboveCutoff,
    distancePoints,
    weakestSubject,
    coverage,
    rawPrecision,
  } = calculation;

  // Cor e status do termômetro
  const statusColor = isAboveCutoff
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    : estimatedScore >= 65
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-rose-400 bg-rose-500/10 border-rose-500/30";

  const statusLabel = isAboveCutoff
    ? "Zona das Vagas (Aprovado)"
    : estimatedScore >= 65
      ? "Zona Competitiva"
      : "Base em Construção";

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#070b16] to-slate-950 border border-slate-800 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-white">
                Termômetro de Aprovação & Corte
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulação calibrada para {targetRole} • Padrão {banca}
            </p>
          </div>
        </div>

        <div className="text-right flex items-center gap-3 sm:block">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">
              Sua Nota Estimada
            </span>
            <span className="text-2xl font-black text-white font-mono">
              {estimatedScore}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 sm:mt-0.5">
            Corte médio: <span className="text-amber-400 font-bold font-mono">{cutoffBaseline}%</span>
          </div>
        </div>
      </div>

      {/* BARRA GRADIENTE DO TERMÔMETRO */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-rose-400 font-bold">0% (Início)</span>
          <span className="text-amber-400 font-bold">65% (Competitivo)</span>
          <span className="text-indigo-400 font-bold">
            {cutoffBaseline}% (Corte Alvo)
          </span>
          <span className="text-emerald-400 font-bold">100% (Gabarito)</span>
        </div>

        <div className="relative h-4 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden p-0.5">
          {/* Marcador da Nota de Corte */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 shadow-sm"
            style={{ left: `${cutoffBaseline}%` }}
            title={`Nota de corte estimada da banca: ${cutoffBaseline}%`}
          />

          {/* Barra de Progresso do Aluno */}
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isAboveCutoff
                ? "bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 shadow-md shadow-emerald-500/20"
                : estimatedScore >= 65
                  ? "bg-gradient-to-r from-rose-500 via-amber-500 to-amber-400 shadow-md shadow-amber-500/20"
                  : "bg-gradient-to-r from-rose-600 to-rose-400 shadow-md shadow-rose-500/20"
            }`}
            style={{ width: `${Math.max(4, Math.min(100, estimatedScore))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>Precisão em Questões: <strong className="text-white font-mono">{rawPrecision}%</strong></span>
          <span>Cobertura do Edital: <strong className="text-white font-mono">{coverage}%</strong></span>
        </div>
      </div>

      {/* DIAGNÓSTICO ESTRATÉGICO DE IMPACTO */}
      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            {isAboveCutoff ? (
              <p className="text-slate-200">
                🎉 <strong className="text-emerald-400">Excelente!</strong> Seu aproveitamento atual está{" "}
                <span className="font-mono text-emerald-300">+{distancePoints} pontos</span> acima da nota de corte estimada. Mantenha o ritmo de revisões para consolidar.
              </p>
            ) : (
              <p className="text-slate-300">
                Faltam apenas <strong className="text-amber-400 font-mono">+{distancePoints} pontos</strong> para você atingir a nota de corte média da banca {banca}.
                {weakestSubject && (
                  <span className="text-slate-400">
                    {" "}Focar em <strong>{weakestSubject.name}</strong> é o caminho mais rápido para subir sua pontuação geral.
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <Link
          href="/questions"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all shrink-0 cursor-pointer"
        >
          <span>Fazer Simulado</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
