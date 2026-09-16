"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Flame,
  TrendingDown,
  ArrowRight,
  Loader2,
  Target,
} from "lucide-react";
import {
  emergencyRescheduleAction,
  EmergencyScenario,
} from "@/actions/adaptive-actions";

interface EmergencyRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export function EmergencyRescheduleModal({
  isOpen,
  onClose,
  onApplied,
}: EmergencyRescheduleModalProps) {
  const [selectedScenario, setSelectedScenario] =
    useState<EmergencyScenario>("MISSED_TODAY");
  const [microMinutes, setMicroMinutes] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [affectedList, setAffectedList] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleApply = async () => {
    setLoading(true);
    setResultMessage(null);
    try {
      const res = await emergencyRescheduleAction({
        scenario: selectedScenario,
        availableMinutesToday:
          selectedScenario === "SURVIVAL_MICRO" ? microMinutes : undefined,
      });

      if (res.success && res.message) {
        setResultMessage(res.message);
        setAffectedList(res.affectedSubjects || []);
        if (onApplied) {
          onApplied();
        }
      } else {
        setResultMessage(res.error || "Erro ao aplicar replanejamento.");
      }
    } catch (err) {
      console.error("Erro ao aplicar emergência:", err);
      setResultMessage("Ocorreu um erro ao processar o replanejamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setResultMessage(null);
    setAffectedList([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#101424] via-[#090d18] to-[#04060c] border border-rose-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Glow Superior Vermelho/Âmbar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* TOP BAR */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-md shadow-rose-500/10">
              <AlertTriangle size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider uppercase text-rose-400">
                  SOS Rotina • IA Adaptativa
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  EMERGÊNCIA
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Reorganize sua semana em segundos sem quebrar a consistência
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="relative z-10 p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {resultMessage ? (
            /* FEEDBACK DE SUCESSO */
            <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-xl font-black text-white tracking-tight">
                  Cronograma Reajustado com Sucesso!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {resultMessage}
                </p>
              </div>

              {affectedList.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 max-w-md mx-auto text-left space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Disciplinas Impactadas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {affectedList.map((name, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 cursor-pointer"
                >
                  <span>Continuar com o Novo Cronograma</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ) : (
            /* SELETOR DE CENÁRIOS */
            <>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-white">
                  O que aconteceu hoje?
                </h3>
                <p className="text-xs text-slate-400">
                  Escolha o cenário que melhor descreve seu imprevisto. A IA cuidará da redistribuição matemática.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Perdi o dia hoje */}
                <div
                  onClick={() => setSelectedScenario("MISSED_TODAY")}
                  className={
                    selectedScenario === "MISSED_TODAY"
                      ? "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative bg-rose-950/40 border-rose-500/80 ring-1 ring-rose-500/50 shadow-lg shadow-rose-950/20"
                      : "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                      <ShieldAlert size={18} />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300">
                      0 MIN HOJE
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Perdi o Dia Inteiro
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Imprevisto total. Transfere a carga de hoje para os próximos dias da semana suavemente.
                    </p>
                  </div>
                </div>

                {/* 2. Micro-Revisão de Sobrevivência */}
                <div
                  onClick={() => setSelectedScenario("SURVIVAL_MICRO")}
                  className={
                    selectedScenario === "SURVIVAL_MICRO"
                      ? "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/50 shadow-lg shadow-amber-950/20"
                      : "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Flame size={18} />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
                      SALVA OFENSIVA
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Micro-Revisão Rápida
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Tenho pouco tempo hoje. Condensa em 1 matéria prioritária e adia o restante.
                    </p>
                  </div>
                </div>

                {/* 3. Semana Caótica */}
                <div
                  onClick={() => setSelectedScenario("REDUCE_LOAD")}
                  className={
                    selectedScenario === "REDUCE_LOAD"
                      ? "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-950/20"
                      : "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                      <TrendingDown size={18} />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300">
                      -30% CARGA
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Semana Muito Corrida
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Reduz a meta semanal temporariamente para evitar estresse e manter consistência.
                    </p>
                  </div>
                </div>

                {/* 4. Blindagem de Edital */}
                <div
                  onClick={() => setSelectedScenario("CORE_FOCUS")}
                  className={
                    selectedScenario === "CORE_FOCUS"
                      ? "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-950/20"
                      : "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                      <Target size={18} />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                      PESO MÁXIMO
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Blindagem de Edital
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Foca 100% nas matérias mais cobradas da prova e pausa disciplinas secundárias.
                    </p>
                  </div>
                </div>
              </div>

              {/* OPÇÃO EXTRA: TEMPO PARA MICRO-REVISÃO */}
              {selectedScenario === "SURVIVAL_MICRO" && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                      <Clock size={14} className="text-amber-400" />
                      Quanto tempo você tem disponível hoje?
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {microMinutes} minutos
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[15, 30, 45].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setMicroMinutes(mins)}
                        className={
                          microMinutes === mins
                            ? "py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                            : "py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-900/80 text-slate-300 border border-slate-700/60 hover:bg-slate-800"
                        }
                      >
                        ⚡ {mins} min
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PREVIEW DO IMPACTO */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
                <Sparkles size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">
                    Como a IA atuará:
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    {selectedScenario === "MISSED_TODAY" &&
                      "As matérias previstas para hoje serão agendadas nos próximos dias úteis. Nenhuma matéria será excluída e o sábado/domingo não serão sobrecarregados."}
                    {selectedScenario === "SURVIVAL_MICRO" &&
                      "Apenas 1 bloco essencial de " + microMinutes + " minutos será mantido para hoje. O restante dos conteúdos será remanejado automaticamente."}
                    {selectedScenario === "REDUCE_LOAD" &&
                      "Sua meta semanal de horas será diminuída em 30% temporariamente nesta semana, rebalanceando a carga diária."}
                    {selectedScenario === "CORE_FOCUS" &&
                      "Todo o cronograma da semana será reorganizado para maximizar o tempo nas matérias núcleo e de maior dificuldade do edital."}
                  </p>
                </div>
              </div>

              {/* AÇÕES FINAIS */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-xl shadow-rose-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Reorganizando Cronograma...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Aplicar Replanejamento</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
