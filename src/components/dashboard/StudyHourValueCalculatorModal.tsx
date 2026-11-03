"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  DollarSign,
  TrendingUp,
  Sparkles,
  Award,
  Clock,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Flame,
  ArrowRight,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface StudyHourValueCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: string | null;
}

export function StudyHourValueCalculatorModal({
  isOpen,
  onClose,
  targetRole = "Concurso Público",
}: StudyHourValueCalculatorModalProps) {
  // Salário inicial padrão calibrado
  const [salary, setSalary] = useState<number>(() => {
    const role = (targetRole || "").toLowerCase();
    if (role.includes("receita") || role.includes("auditor") || role.includes("fiscal") || role.includes("juiz") || role.includes("delegado")) {
      return 22000;
    }
    if (role.includes("polícia") || role.includes("prf") || role.includes("perito") || role.includes("analista")) {
      return 14000;
    }
    if (role.includes("técnico") || role.includes("inss") || role.includes("caixa") || role.includes("banco")) {
      return 7500;
    }
    return 12000;
  });

  const [studyHoursTarget, setStudyHoursTarget] = useState<number>(750);
  const [horizonYears, setHorizonYears] = useState<number>(5);

  if (!isOpen) return null;

  const calculations = useMemo(() => {
    const monthlyTotal = salary + 1500; // Salário + Benefícios médios (alimentação/saúde)
    const annualTotal = salary * 13.33 + 1500 * 12; // 13º e 1/3 de férias
    const cumulativeLifetime = annualTotal * horizonYears;

    const valuePerHour = Math.round(cumulativeLifetime / Math.max(100, studyHoursTarget));
    const valuePerPomodoro = Math.round(valuePerHour * (50 / 60));

    return {
      monthlyTotal,
      annualTotal,
      cumulativeLifetime,
      valuePerHour,
      valuePerPomodoro,
    };
  }, [salary, studyHoursTarget, horizonYears]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-emerald-500/30 bg-[#070d18] p-5 sm:p-7 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -left-24 w-52 h-52 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Quanto Vale Sua Hora de Estudo?
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  DOPAMINA
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulador de retorno financeiro vitalício da sua posse:
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Destaque Principal: Valor por Hora e por Pomodoro */}
        <div className="my-5 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-emerald-950/60 border border-emerald-500/40 text-center shadow-xl">
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block">
            Cada 1 hora de estudo focado hoje equivale a:
          </span>

          <div className="text-3xl sm:text-4xl font-black text-white mt-1 text-emerald-400 font-mono">
            R$ {calculations.valuePerHour.toLocaleString("pt-BR")},00
          </div>

          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-bold">
            <Sparkles size={13} className="text-amber-400" />
            <span>
              ~R$ {calculations.valuePerPomodoro.toLocaleString("pt-BR")},00 a cada Pomodoro de 50 minutos!
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mt-2.5 max-w-md mx-auto leading-relaxed">
            Quando a vontade de procrastinar bater, lembre-se: estudar hoje não é sacrifício sem retorno, é um depósito futuro de alto rendimento com estabilidade vitalícia.
          </p>
        </div>

        {/* Controles do Simulador */}
        <div className="space-y-4 py-2 text-xs">
          {/* Salário Mensal Inicial */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">
                Salário Inicial Estimado ({targetRole}):
              </span>
              <span className="font-mono font-bold text-white text-sm">
                R$ {salary.toLocaleString("pt-BR")},00 / mês
              </span>
            </div>
            <input
              type="range"
              min={4000}
              max={35000}
              step={500}
              value={salary}
              onChange={(e) => {
                setSalary(Number(e.target.value));
                triggerHaptic("light");
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Horas de Estudo até a Posse */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">
                Carga de Estudo Líquido até a Posse:
              </span>
              <span className="font-mono font-bold text-white text-sm">
                {studyHoursTarget} horas líquidas
              </span>
            </div>
            <input
              type="range"
              min={300}
              max={1500}
              step={50}
              value={studyHoursTarget}
              onChange={(e) => {
                setStudyHoursTarget(Number(e.target.value));
                triggerHaptic("light");
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-[10px] text-slate-500">
              Média de concurseiros aprovados: entre 600h e 900h de estudo focado.
            </span>
          </div>

          {/* Horizonte de Retorno */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-300 font-medium">
              Horizonte de Estabilidade:
            </span>
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
              {[
                { years: 1, label: "1º Ano" },
                { years: 3, label: "3 Anos" },
                { years: 5, label: "5 Anos" },
                { years: 10, label: "10 Anos" },
              ].map((opt) => (
                <button
                  key={opt.years}
                  type="button"
                  onClick={() => {
                    setHorizonYears(opt.years);
                    triggerHaptic("light");
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    horizonYears === opt.years
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-4 mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Total projetado em {horizonYears} anos: <strong>R$ {calculations.cumulativeLifetime.toLocaleString("pt-BR")},00</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer active:scale-95"
          >
            Bons Estudos!
          </button>
        </div>
      </div>
    </div>
  );
}
