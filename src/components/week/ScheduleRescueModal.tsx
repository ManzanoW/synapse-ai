"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  LifeBuoy,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Flame,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  getScheduleRescueDiagnosticsAction,
  applyScheduleRescueAction,
  ScheduleRescueDiagnostics,
} from "@/actions/schedule-rescue-actions";
import { useSound } from "@/hooks/useSound";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface ScheduleRescueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRescueApplied?: () => void;
}

export function ScheduleRescueModal({
  isOpen,
  onClose,
  onRescueApplied,
}: ScheduleRescueModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [diagnostics, setDiagnostics] =
    useState<ScheduleRescueDiagnostics | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mapeamento de horas disponíveis por dia
  const [dailyHours, setDailyHours] = useState<Record<number, number>>({});

  const { playCorrect, playError, playLevelUp, playClick } = useSound();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      getScheduleRescueDiagnosticsAction()
        .then((res) => {
          if (res.success && res.data) {
            setDiagnostics(res.data);
            const initialMap: Record<number, number> = {};
            res.data.remainingDays.forEach((d) => {
              initialMap[d.dayIndex] = d.suggestedHours;
            });
            setDailyHours(initialMap);
          } else {
            setErrorMessage(
              res.error || "Não foi possível calcular o diagnóstico da semana."
            );
          }
        })
        .catch((err) => {
          console.error(err);
          setErrorMessage("Erro ao conectar com o serviço de cronograma.");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleHourChange = (dayIndex: number, hours: number) => {
    playClick();
    triggerHaptic("light");
    setDailyHours((prev) => ({
      ...prev,
      [dayIndex]: Math.max(0, Math.min(hours, 8)),
    }));
  };

  const totalCommittedHours = Object.values(dailyHours).reduce(
    (acc, val) => acc + val,
    0
  );

  const handleApplyRescue = async () => {
    if (totalCommittedHours <= 0) {
      setErrorMessage("Declare ao menos 1 hora em um dos dias restantes.");
      playError();
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await applyScheduleRescueAction({
        dailyAvailabilityHours: dailyHours,
      });

      if (res.success) {
        playLevelUp();
        triggerHaptic("heavy");
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}

        setSuccessMessage(
          res.message || "Sua semana foi rebalanceada com sucesso!"
        );

        setTimeout(() => {
          if (onRescueApplied) onRescueApplied();
          onClose();
        }, 1800);
      } else {
        playError();
        triggerHaptic("warning");
        setErrorMessage(res.error || "Falha ao aplicar o plano de resgate.");
      }
    } catch (err) {
      console.error(err);
      playError();
      setErrorMessage("Erro ao processar plano de resgate.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <LifeBuoy className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Modo Resgate de Semana
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                  Sem Culpa
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Imprevistos acontecem. Vamos salvar os dias restantes com equilíbrio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-amber-500" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Mapeando pendências e calculando otimização com IA...
              </p>
            </div>
          ) : (
            <>
              {/* Mensagem de Erro */}
              {errorMessage && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 text-sm text-rose-800 dark:text-rose-200">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Mensagem de Sucesso */}
              {successMessage && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-200 animate-bounce">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Card Acolhedor de Diagnóstico */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Diagnóstico Pedagógico da Semana</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Hoje é <b>{diagnostics?.todayName}</b>. Identificamos aproximadamente{" "}
                  <b className="text-amber-700 dark:text-amber-400">
                    {Math.round((diagnostics?.totalMissedMinutes || 0) / 60)}h de matérias prioritárias
                  </b>{" "}
                  que ficaram para trás. Em vez de se sobrecarregar, vamos redistribuir nos dias que você tem livres.
                </p>
              </div>

              {/* Matérias Salvas pelo Resgate */}
              {diagnostics && diagnostics.pendingSubjects.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Disciplinas Prioritárias para Redistribuição:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {diagnostics.pendingSubjects.map((s) => (
                      <span
                        key={s.id}
                        className="px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span>{s.name}</span>
                        <span className="text-[10px] text-slate-400">
                          (Peso {s.weight})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ajuste de Horas para os Dias Restantes */}
              {diagnostics && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Quantas horas você tem livres em cada dia restante?
                    </span>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-lg">
                      Total: {totalCommittedHours}h
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {diagnostics.remainingDays.map((d) => {
                      const currentHours = dailyHours[d.dayIndex] ?? d.suggestedHours;
                      return (
                        <div
                          key={d.dayIndex}
                          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {d.dayName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max="6"
                              step="0.5"
                              value={currentHours}
                              onChange={(e) =>
                                handleHourChange(
                                  d.dayIndex,
                                  parseFloat(e.target.value)
                                )
                              }
                              className="w-28 sm:w-40 accent-indigo-600 cursor-pointer"
                            />
                            <span className="w-12 text-right font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                              {currentHours}h
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {totalCommittedHours > 0
              ? `Plano ajustado para ${totalCommittedHours}h totais de foco.`
              : "Defina horas disponíveis para aplicar."}
          </span>

          <button
            disabled={loading || submitting || totalCommittedHours <= 0}
            onClick={handleApplyRescue}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer active:scale-95"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Rebalanceando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Salvar Minha Semana</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
