"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Crown,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Flame,
  Star,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { BorderBeam } from "./BorderBeam";
import { triggerHaptic } from "@/lib/sensory/haptics";

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"ANNUAL" | "MONTHLY">("ANNUAL");

  return (
    <section id="planos" className="relative py-20 sm:py-28 overflow-hidden bg-[#030712] scroll-mt-24">
      {/* Glow Divisor Superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-5xl h-px bg-gradient-to-r from-transparent via-indigo-500/35 via-violet-500/35 to-transparent" />

      {/* Background Volumetric Glows */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent blur-[160px] -z-10" />

      {/* Grade Cósmica Estelar */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner de Lote Especial */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-500/30 p-3.5 sm:p-4 text-center backdrop-blur-md shadow-lg shadow-amber-500/5">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold text-amber-200">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase text-[10px] tracking-wider font-black animate-pulse">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Lote de Lançamento
              </span>
              <span>
                Garanta o Synapse Pro no plano anual por apenas{" "}
                <strong className="text-white font-black">R$ 29,90/mês</strong>{" "}
                <span className="text-amber-300 font-mono text-xs">(menos de R$ 1,00/dia)</span>.
              </span>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <span>Investimento na sua Posse</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Planos Transparentes para{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-200 to-cyan-300 bg-clip-text text-transparent">
              todos os estágios
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Comece gratuito para testar a retenção neural. Destrave o Pro quando quiser áudio hands-free no trânsito e discursivas ilimitadas.
          </p>

          {/* Toggle Mensal / Anual */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span
              onClick={() => {
                triggerHaptic("medium");
                setBillingCycle("MONTHLY");
              }}
              className={`text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                billingCycle === "MONTHLY" ? "text-white font-black" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Faturamento Mensal
            </span>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("medium");
                setBillingCycle(billingCycle === "MONTHLY" ? "ANNUAL" : "MONTHLY");
              }}
              className="relative w-14 h-7 rounded-full bg-slate-800 p-1 border border-slate-700 transition-colors focus:outline-hidden cursor-pointer"
              aria-label="Alternar ciclo de faturamento"
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-md"
                style={{
                  marginLeft: billingCycle === "ANNUAL" ? "1.75rem" : "0",
                }}
              />
            </button>

            <span
              onClick={() => {
                triggerHaptic("medium");
                setBillingCycle("ANNUAL");
              }}
              className={`text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                billingCycle === "ANNUAL" ? "text-white font-black" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Faturamento Anual</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase">
                Economize 25%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto items-stretch">
          {/* ================= CARD 1: PLANO GRATUITO ================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl bg-[#070b14]/70 border border-white/[0.08] p-6 sm:p-8 flex flex-col justify-between backdrop-blur-xl relative hover:border-white/20 transition-all shadow-xl"
          >
            <div className="space-y-6">
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Para Iniciar com Foco
                </span>
                <h3 className="text-2xl font-black text-white">Plano Básico</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Recursos essenciais para conhecer o algoritmo FSRS e manter seu ciclo diário de revisão.
                </p>
              </div>

              <div className="py-3 border-y border-white/[0.06]">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white">R$ 0</span>
                  <span className="text-xs text-slate-400 font-medium">/mês para sempre</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Sem necessidade de cartão de crédito.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold block">
                  Incluso no Grátis:
                </span>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {[
                    "7 requisições diárias de Inteligência Artificial",
                    "Motor FSRS com cálculo matemático da curva de retenção",
                    "Até 2 simulados gerados por IA ao dia",
                    "1 correção de redação discursiva por dia",
                    "Edital verticalizado com controle de progresso",
                    "Caderno de erros básico com diagnóstico de causa",
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/login"
                className="w-full block py-3.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white text-center text-xs sm:text-sm font-bold transition-all shadow-sm"
              >
                Começar Grátis Agora
              </Link>
            </div>
          </motion.div>

          {/* ================= CARD 2: PLANO SYNAPSE PRO ================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl p-[2px] relative overflow-hidden group shadow-2xl shadow-indigo-950/80 transition-all duration-300 hover:scale-[1.01]"
          >
            {/* Border Beam Neon Contínuo Giratório (Big Tech Finish) */}
            <BorderBeam duration={7} colorFrom="#6366f1" colorTo="#06b6d4" />

            {/* Volumetric Aura Glow behind Pro card */}
            <div className="pointer-events-none absolute -inset-2 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/15 rounded-3xl blur-2xl -z-10 group-hover:opacity-100 opacity-70 transition-opacity" />

            {/* Top Amber Ribbon */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-lg shadow-amber-500/30 flex items-center gap-1.5 whitespace-nowrap z-20">
              <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>Mais Escolhido • Acesso Ilimitado & Zero Anúncios</span>
            </div>

            {/* Inner Content Card com Vidro Temperado */}
            <div className="relative rounded-[inherit] bg-gradient-to-b from-indigo-950/85 via-[#070b14] to-purple-950/70 border border-indigo-500/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur-2xl h-full z-10">
              <div className="space-y-6 pt-2">
                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                    Para Aprovação Imediata
                  </span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-white">Synapse Pro</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-bold">
                      ILIMITADO
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Todo o arsenal da IA trabalhando pelo seu nome no Diário Oficial. Sem limites, sem anúncios e com áudio hands-free.
                  </p>
                </div>

                <div className="py-3 border-y border-indigo-500/20">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      {billingCycle === "ANNUAL" ? "R$ 29,90" : "R$ 39,90"}
                    </span>
                    <span className="text-xs text-slate-300 font-bold">/mês</span>
                    {billingCycle === "ANNUAL" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/35 text-cyan-300 font-mono text-[10px] font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                        ~R$ 0,99 / dia
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-indigo-300 mt-1 font-semibold font-mono">
                    {billingCycle === "ANNUAL"
                      ? "R$ 358,80 faturado anualmente (Economia de R$ 120/ano)"
                      : "Assinatura mensal sem fidelidade ou carência"}
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-200 font-black block">
                    Superpoderes Exclusivos do Pro:
                  </span>
                  <ul className="space-y-2.5 text-xs text-slate-200">
                    {[
                      "IA 100% Ilimitada & Zero Anúncios (sem filas ou travamentos)",
                      "Flashcards em Áudio Neural Humanizado Ilimitado (Modo Hands-Free no trânsito)",
                      "Correções Discursivas no rigor oficial (Cebraspe/FGV/FCC) com Versão Ouro",
                      "OCR de Redação Manuscrita Ilimitado (escaneamento direto da folha de prova)",
                      "Raio-X de Incidência da Banca no Edital Verticalizado",
                      "Importador de Edital em PDF com extração automática completa",
                      "Mapas Mentais Neurais com exportação para PDF A4 de alta resolução",
                    ].map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8 space-y-3">
                <Link
                  href="/login"
                  className="w-full group inline-flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 border border-cyan-400/30 hover:border-cyan-300 shadow-xl shadow-indigo-500/25 hover:shadow-cyan-500/35 transition-all duration-200 active:scale-[0.98]"
                >
                  <span>Quero Ser Synapse Pro</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Garantia incondicional de 7 dias • Cancele com 1 clique</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
