"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Clock, ArrowRight, Zap, Target, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function TimeRecoveryCalculator() {
  const [dailyMinutes, setDailyMinutes] = useState<number>(90); // 90 min (1h30) default
  const [daysPerWeek, setDaysPerWeek] = useState<number>(6); // 6 dias default

  // Calculations
  const hoursPerDay = dailyMinutes / 60;
  const monthlyHours = Math.round(hoursPerDay * daysPerWeek * 4.3);
  const yearlyHours = monthlyHours * 12;
  const fullWorkDays = Math.round(yearlyHours / 8); // 8-hour study days
  const flashcardsPerMonth = Math.round(monthlyHours * 22); // ~22 active recall audio cards per hour

  return (
    <section id="calculadora-tempo" className="relative py-20 sm:py-28 bg-[#030712] border-t border-white/[0.06] overflow-hidden">
      {/* Background Volumetric Glows */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-cyan-600/10 via-indigo-600/15 to-violet-600/10 rounded-full blur-[150px] -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Calculadora de Horas Líquidas Invisíveis</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Descubra o tempo que você perde{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-violet-300 bg-clip-text text-transparent">
              sem perceber
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Trânsito, esteira, caminhadas ou filas de espera. Veja quantas horas líquidas o Modo Áudio Hands-Free recupera para a sua aprovação.
          </p>
        </div>

        {/* Interactive Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl bg-slate-900/60 border border-white/[0.08] p-6 sm:p-8 backdrop-blur-2xl flex flex-col justify-between space-y-8 shadow-xl">
            <div className="space-y-6">
              {/* Control 1: Tempo Diário Desperdiçado */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 uppercase tracking-wider font-bold">
                    Tempo Diário em Deslocamento / Treino:
                  </span>
                  <span className="text-cyan-300 font-black text-sm bg-cyan-500/15 px-2.5 py-0.5 rounded-lg border border-cyan-500/25">
                    {dailyMinutes >= 60 ? `${Math.floor(dailyMinutes / 60)}h${dailyMinutes % 60 ? ` ${dailyMinutes % 60}m` : ""}` : `${dailyMinutes} min`}
                  </span>
                </div>

                <input
                  type="range"
                  min="30"
                  max="180"
                  step="15"
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>30 min (Curto)</span>
                  <span>1h30 (Médio)</span>
                  <span>3h (Intenso)</span>
                </div>
              </div>

              {/* Control 2: Dias por Semana */}
              <div className="space-y-3">
                <span className="text-xs font-mono text-slate-300 uppercase tracking-wider font-bold block">
                  Frequência Semanal:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 6, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDaysPerWeek(days)}
                      className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        daysPerWeek === days
                          ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20 border border-cyan-400/40"
                          : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                      }`}
                    >
                      {days} dias / sem
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Context Tip */}
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200/90 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-cyan-300">
                <Headphones className="w-3.5 h-3.5" />
                <span>Como funciona o Modo Hands-Free?</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                O Synapse fala a pergunta no fone Bluetooth com a tela no bolso, aguarda 3s para você pensar e profere a resolução oficial.
              </p>
            </div>
          </div>

          {/* Results Column (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-gradient-to-b from-indigo-950/60 via-slate-950/80 to-cyan-950/40 border-2 border-cyan-500/30 p-6 sm:p-8 backdrop-blur-2xl flex flex-col justify-between space-y-6 shadow-2xl shadow-cyan-950/50">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold block">
                Seu Retorno Cognitivo Estimado
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                Uma Vantagem Desleal Sobre a Concorrência
              </h3>
            </div>

            {/* Dynamic Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Horas por Mês */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-1">
                <span className="text-[11px] font-mono text-slate-400 block">
                  Horas Líquidas Recuperadas
                </span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={monthlyHours}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono tracking-tight"
                  >
                    +{monthlyHours}h <span className="text-xs font-normal text-slate-400 font-sans">/ mês</span>
                  </motion.div>
                </AnimatePresence>
                <p className="text-[11px] text-slate-300 font-mono pt-1">
                  Equivalente a +{yearlyHours} horas a mais por ano estudadas sem esforço.
                </p>
              </div>

              {/* Card 2: Flashcards Fixados */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-1">
                <span className="text-[11px] font-mono text-slate-400 block">
                  Conceitos & Questões Fixadas
                </span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={flashcardsPerMonth}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight"
                  >
                    ~{flashcardsPerMonth.toLocaleString("pt-BR")} <span className="text-xs font-normal text-slate-400 font-sans">cards</span>
                  </motion.div>
                </AnimatePresence>
                <p className="text-[11px] text-slate-300 font-mono pt-1">
                  Revisados com pausa reflexiva e recuperação ativa comprovada.
                </p>
              </div>
            </div>

            {/* Equivalency Highlight */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-emerald-500/10 border border-cyan-500/25 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Isso equivale a <strong className="text-cyan-300 font-mono">{fullWorkDays} dias inteiros</strong> (de 8h líquidas de estudo) de vantagem por ano.
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono pl-6">
                Enquanto os outros concurseiros perdem esse tempo reclamando do trânsito, você zera editais verticalizados direto no fone de ouvido.
              </p>
            </div>

            {/* Bottom CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 border border-cyan-400/30 shadow-lg shadow-cyan-950/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Recuperar Meu Tempo com o Synapse Pro</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <span className="text-[11px] font-mono text-slate-400 text-center sm:text-right">
                Incluso em todos os planos Pro • Sem custo adicional
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
