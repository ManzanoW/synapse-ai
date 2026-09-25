"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Play,
  Zap,
  Sparkles,
  BrainCircuit,
  Target,
  ArrowRight,
  Clock,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Award,
  Flame,
  Check,
  Loader2,
} from "lucide-react";
import type { DailyFlowData, DailyFlowStep } from "@/actions/daily-flow-actions";
import { claimDailyMissionBonusAction } from "@/actions/daily-flow-actions";

interface DailyFlowCardProps {
  flowData: DailyFlowData | null;
}

export function DailyFlowCard({ flowData }: DailyFlowCardProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState<boolean>(
    flowData?.isBonusClaimed ?? false
  );

  if (!flowData || !flowData.hasActivity) {
    return null;
  }

  const {
    totalMinutes,
    steps,
    greeting,
    completedStepsCount,
    allCompleted,
    bonusXp,
  } = flowData;

  const progressPercent = Math.round((completedStepsCount / steps.length) * 100);

  // Primeira etapa pendente (para o botão de play rápido)
  const nextPendingStep = steps.find((s) => !s.isCompleted) || steps[0];

  const handleClaimBonus = async () => {
    if (isClaiming || bonusClaimed) return;
    setIsClaiming(true);
    try {
      const res = await claimDailyMissionBonusAction();
      if (res.success && res.awardedXp) {
        setBonusClaimed(true);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#f59e0b", "#6366f1", "#10b981", "#ffffff"],
        });

        window.dispatchEvent(
          new CustomEvent("xp-updated", {
            detail: {
              earnedXp: res.awardedXp,
              totalXp: res.newTotalXp,
            },
          })
        );
      }
    } catch (err) {
      console.error("Erro ao resgatar bônus:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all ${
        allCompleted
          ? "border-amber-500/40 bg-gradient-to-r from-[#171205]/95 via-[#0e0c19]/95 to-[#060814]/95 shadow-xl shadow-amber-950/20"
          : "border-indigo-500/30 bg-gradient-to-r from-[#0c1024]/90 via-[#0a0e1c]/90 to-[#070a14]/90 shadow-xl shadow-indigo-950/20"
      } p-4 sm:p-6 backdrop-blur-md`}
    >
      {/* GLOW DECORATIVO DE FUNDO */}
      <div
        className={`pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full blur-3xl ${
          allCompleted ? "bg-amber-500/15" : "bg-indigo-600/10"
        }`}
      />
      <div
        className={`pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full blur-3xl ${
          allCompleted ? "bg-orange-500/15" : "bg-cyan-600/10"
        }`}
      />

      {/* CABEÇALHO DO CARD */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
              allCompleted
                ? "border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-500/20"
                : "border-indigo-500/40 bg-indigo-500/15 text-indigo-400 shadow-xs"
            }`}
          >
            {allCompleted ? (
              <Award size={22} className="text-amber-400" />
            ) : (
              <Zap size={22} className="animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Trilha do Aprovado: Missão de Hoje</span>
              </h2>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase font-mono ${
                  allCompleted
                    ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                    : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                }`}
              >
                {allCompleted ? "Meta Batida! 🏆" : `${completedStepsCount}/3 Concluídos`}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {greeting}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs font-mono text-slate-300">
            <Clock size={13} className="text-indigo-400" />
            <span>~{totalMinutes} min de foco</span>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isMinimized ? "Expandir Trilha" : "Minimizar Trilha"}
          >
            {isMinimized ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>

      {/* BARRA DE PROGRESSO LINEAR */}
      <div className="relative z-10 pt-3.5 pb-1">
        <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Flame
              size={13}
              className={allCompleted ? "text-orange-400 fill-orange-400" : "text-amber-400"}
            />
            <span>Progresso da Meta Diária</span>
          </span>
          <span className="font-bold text-slate-200">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`h-full rounded-full ${
              allCompleted
                ? "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                : "bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            }`}
          />
        </div>
      </div>

      {/* CONTEÚDO EXPANSÍVEL */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 pt-3"
          >
            {/* ETAPAS DA SESSÃO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {steps.map((step, idx) => {
                const stepIcons = [
                  <Layers
                    key="f"
                    size={16}
                    className={step.isCompleted ? "text-emerald-400" : "text-amber-400"}
                  />,
                  <Target
                    key="q"
                    size={16}
                    className={step.isCompleted ? "text-emerald-400" : "text-indigo-400"}
                  />,
                  <BrainCircuit
                    key="r"
                    size={16}
                    className={step.isCompleted ? "text-emerald-400" : "text-rose-400"}
                  />,
                ];
                const stepLabels = [
                  "1. Blindagem de Memória",
                  "2. Treino Focado",
                  "3. Cura de Pontos Cegos",
                ];

                return (
                  <Link
                    key={step.id}
                    href={step.actionUrl}
                    className={`group flex flex-col justify-between rounded-xl border p-3.5 transition-all active:scale-[0.99] ${
                      step.isCompleted
                        ? "border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/50 hover:bg-emerald-950/30"
                        : "border-slate-800/80 bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-900/60"
                    } hover:shadow-lg`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5">
                        <span
                          className={`font-semibold flex items-center gap-1 ${
                            step.isCompleted ? "text-emerald-400" : "text-slate-400"
                          }`}
                        >
                          {step.isCompleted && <Check size={12} strokeWidth={3} />}
                          <span>{stepLabels[idx]}</span>
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border ${
                            step.isCompleted
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold"
                              : "bg-white/5 border-white/5 text-slate-400"
                          }`}
                        >
                          {step.isCompleted ? "Feito" : `${step.durationMinutes} min`}
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div
                          className={`mt-0.5 p-1.5 rounded-lg border transition-colors ${
                            step.isCompleted
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                              : "bg-slate-900 border-slate-800 group-hover:border-indigo-500/30"
                          }`}
                        >
                          {stepIcons[idx]}
                        </div>
                        <div>
                          <h4
                            className={`text-xs sm:text-sm font-bold transition-colors line-clamp-1 ${
                              step.isCompleted
                                ? "text-emerald-200"
                                : "text-slate-200 group-hover:text-indigo-200"
                            }`}
                          >
                            {step.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                            {step.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px]">
                      <span
                        className={`font-mono font-medium ${
                          step.isCompleted ? "text-emerald-400" : "text-indigo-400/90"
                        }`}
                      >
                        {step.badge}
                      </span>
                      <span
                        className={`flex items-center gap-1 font-semibold transition-colors ${
                          step.isCompleted
                            ? "text-emerald-300"
                            : "text-slate-400 group-hover:text-indigo-300"
                        }`}
                      >
                        {step.isCompleted ? "Revisar" : "Iniciar"}{" "}
                        <ArrowRight
                          size={12}
                          className="group-hover:translate-x-0.5 transition-transform"
                        />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* BOTÃO PRINCIPAL DE AÇÃO OU RECOMPENSA DE META BATIDA */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles size={14} className="text-amber-400" />
                <span>
                  {allCompleted
                    ? "Meta do dia concluída com maestria! O algoritmo FSRS e o Caderno foram calibrados."
                    : "Complete as 3 etapas para blindar sua aprovação e resgatar +150 XP de bônus."}
                </span>
              </div>

              {allCompleted ? (
                <button
                  type="button"
                  onClick={handleClaimBonus}
                  disabled={isClaiming || bonusClaimed}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer ml-auto shadow-lg ${
                    bonusClaimed
                      ? "bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 cursor-default"
                      : "bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/25 animate-pulse"
                  }`}
                >
                  {isClaiming ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Resgatando...</span>
                    </>
                  ) : bonusClaimed ? (
                    <>
                      <CheckCircle2 size={15} className="text-emerald-400" />
                      <span>+150 XP Resgatado Hoje! 🔥</span>
                    </>
                  ) : (
                    <>
                      <Award size={15} className="fill-slate-950" />
                      <span>Resgatar Recompensa (+150 XP)</span>
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href={nextPendingStep.actionUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-950/50 transition-all active:scale-95 cursor-pointer ml-auto"
                >
                  <Play size={14} className="fill-white" />
                  <span>Continuar Trilha: {nextPendingStep.title.split(":")[0]}</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

