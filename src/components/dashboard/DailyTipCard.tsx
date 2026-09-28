"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface DailyStudyTip {
  technique: string;
  category: string;
  summary: string;
  howToApply: string[];
  evidenceBase: string;
  estimatedTime: string;
  source?: "gemini" | "curated_cache";
  date?: string;
}

interface DailyTipCardProps {
  className?: string;
}

const STORAGE_KEY_PREFIX = "synapse_daily_tip_";
const APPLIED_KEY_PREFIX = "synapse_daily_tip_applied_";

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyTipCard({ className = "" }: DailyTipCardProps) {
  const [tip, setTip] = useState<DailyStudyTip | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const todayKey = getTodayKey();
      const cachedJson = localStorage.getItem(`${STORAGE_KEY_PREFIX}${todayKey}`);
      return cachedJson ? JSON.parse(cachedJson) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(() => tip === null);
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const todayKey = getTodayKey();
      const savedSteps = localStorage.getItem(`synapse_steps_${todayKey}`);
      return savedSteps ? JSON.parse(savedSteps) : [];
    } catch {
      return [];
    }
  });
  const [isAppliedToday, setIsAppliedToday] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const todayKey = getTodayKey();
      return localStorage.getItem(`${APPLIED_KEY_PREFIX}${todayKey}`) === "true";
    } catch {
      return false;
    }
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (tip) return;

    let isSubscribed = true;
    async function loadDailyTip() {
      try {
        const todayKey = getTodayKey();
        const cachedKey = `${STORAGE_KEY_PREFIX}${todayKey}`;
        const res = await fetch("/api/ai/daily-tip");
        const data = await res.json();

        if (isSubscribed && data.success && data.data) {
          setTip(data.data);
          setLoading(false);
          try {
            localStorage.setItem(cachedKey, JSON.stringify(data.data));
          } catch {
            // Ignora
          }
        }
      } catch (err) {
        console.error("Erro ao carregar Dica Diária:", err);
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    void loadDailyTip();

    return () => {
      isSubscribed = false;
    };
  }, [tip]);

  const toggleStep = (index: number) => {
    const updated = completedSteps.includes(index)
      ? completedSteps.filter((i) => i !== index)
      : [...completedSteps, index];

    setCompletedSteps(updated);

    try {
      const todayKey = getTodayKey();
      localStorage.setItem(`synapse_steps_${todayKey}`, JSON.stringify(updated));

      // Se completou todos os passos, marca como praticado
      if (tip && updated.length === tip.howToApply.length) {
        setIsAppliedToday(true);
        localStorage.setItem(`${APPLIED_KEY_PREFIX}${todayKey}`, "true");
      }
    } catch {
      // Ignora
    }
  };

  const handleMarkApplied = () => {
    const nextState = !isAppliedToday;
    setIsAppliedToday(nextState);
    try {
      const todayKey = getTodayKey();
      localStorage.setItem(`${APPLIED_KEY_PREFIX}${todayKey}`, String(nextState));
      if (nextState && tip) {
        const allIndices = tip.howToApply.map((_, i) => i);
        setCompletedSteps(allIndices);
        localStorage.setItem(
          `synapse_steps_${todayKey}`,
          JSON.stringify(allIndices)
        );
      }
    } catch {
      // Ignora
    }
  };

  const handleCopy = () => {
    if (!tip) return;
    const text = `💡 Dica Diária: ${tip.technique}\nCategoria: ${tip.category}\n\n${tip.summary}\n\nComo aplicar hoje:\n${tip.howToApply.map((step, i) => `${i + 1}. ${step}`).join("\n")}\n\n📚 Base Científica: ${tip.evidenceBase}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-amber-500/25 ${className}`}
    >
      {/* Top accent light bar */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-400/50 to-transparent" />

      {/* HEADER DO CARD */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Lightbulb size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black tracking-wide text-white">
                Dica Diária
              </h3>
              <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-300">
                <Sparkles size={10} /> Evidência Científica
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Técnica de alta performance cognitiva validada por neurociência
            </p>
          </div>
        </div>

        {/* AÇÕES NO HEADER: Copiar, Expandir/Recolher */}
        <div className="flex items-center gap-1.5">
          {tip && (
            <button
              type="button"
              onClick={handleCopy}
              title="Copiar dica"
              aria-label="Copiar dica"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-400 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-95"
            >
              {copied ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Recolher card" : "Expandir card"}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* CONTEÚDO DO CARD */}
      {loading ? (
        <div className="py-6 space-y-3">
          <div className="h-5 w-48 rounded-lg bg-white/10 animate-pulse" />
          <div className="h-4 w-full rounded-lg bg-white/5 animate-pulse" />
          <div className="h-4 w-3/4 rounded-lg bg-white/5 animate-pulse" />
          <div className="pt-2 space-y-2">
            <div className="h-3 w-5/6 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-4/6 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      ) : tip ? (
        <div className="pt-4">
          {/* Título da Técnica e Tag de Categoria */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors">
              {tip.technique}
            </h4>
            <span className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
              {tip.category}
            </span>
          </div>

          {/* Resumo Científico */}
          <p className="text-xs sm:text-sm leading-relaxed text-slate-300 mb-4">
            {tip.summary}
          </p>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-4"
              >
                {/* Passo a Passo Interativo (Checklist) */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 sm:p-4 space-y-2.5">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Como Aplicar na Sessão de Hoje:
                  </span>
                  <div className="space-y-2">
                    {tip.howToApply.map((step, idx) => {
                      const isChecked = completedSteps.includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleStep(idx)}
                          className={`flex w-full cursor-pointer items-start gap-2.5 text-left text-xs transition-all ${
                            isChecked
                              ? "text-slate-500 line-through"
                              : "text-slate-200 hover:text-white"
                          }`}
                        >
                          <span className="mt-0.5 shrink-0 text-amber-400">
                            {isChecked ? (
                              <CheckCircle2
                                size={15}
                                className="text-emerald-400"
                              />
                            ) : (
                              <Circle size={15} className="text-slate-500" />
                            )}
                          </span>
                          <span className="leading-snug">{step}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* METADADOS CIENTÍFICOS & BOTÃO DE AÇÃO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-white/5">
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} className="text-amber-400" />
                      {tip.estimatedTime}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400">
                      <BookOpen size={12} className="text-indigo-400" />
                      {tip.evidenceBase}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleMarkApplied}
                    className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition-all active:scale-95 ${
                      isAppliedToday
                        ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                        : "border border-amber-500/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                    }`}
                  >
                    {isAppliedToday ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        <span>Praticado Hoje (+10 XP)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} className="text-amber-400" />
                        <span>Praticar Esta Técnica</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}
export default DailyTipCard;
