"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Crown,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Flame,
  Star,
  Lock,
} from "lucide-react";
import Link from "next/link";

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"ANNUAL" | "MONTHLY">("ANNUAL");

  return (
    <section id="planos" className="relative py-24 sm:py-32 overflow-hidden bg-[#030712]">
      {/* Background Volumetric Glows */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent blur-[160px] -z-10" />

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
                Garanta o Synapse Pro no plano anual com{" "}
                <strong className="text-white font-black">50% de desconto</strong> por apenas{" "}
                <strong className="text-white font-black">R$ 29,90/mês</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Investimento na sua Posse</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Planos Transparentes para{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-200 to-cyan-300 bg-clip-text text-transparent">
              todos os estágios
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Comece 100% gratuito para conhecer o motor FSRS. Evolua para o Pro quando quiser acelerar suas discursivas e estudar no trânsito sem restrições.
          </p>

          {/* Toggle Mensal / Anual */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span
              onClick={() => setBillingCycle("MONTHLY")}
              className={`text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                billingCycle === "MONTHLY" ? "text-white font-black" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Faturamento Mensal
            </span>

            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === "MONTHLY" ? "ANNUAL" : "MONTHLY")}
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
              onClick={() => setBillingCycle("ANNUAL")}
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
        <div className="mt-14 sm:mt-18 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {/* ================= CARD 1: PLANO GRATUITO ================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl bg-slate-950/60 border border-white/[0.08] p-7 sm:p-9 flex flex-col justify-between backdrop-blur-xl relative overflow-hidden hover:border-white/20 transition-all"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Para Iniciar com Foco
                </span>
                <h3 className="text-2xl font-black text-white">Plano Básico</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Acesso aos recursos essenciais para testar a neurociência do Synapse e manter seu ciclo diário de questões.
                </p>
              </div>

              <div className="py-2 border-y border-white/[0.06]">
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
                <ul className="space-y-3 text-xs text-slate-300">
                  {[
                    "7 requisições diárias de Inteligência Artificial",
                    "Motor FSRS ativo com cálculo matemático de retenção",
                    "Até 2 simulados com IA por dia (+1 com anúncio opcional)",
                    "1 correção de redação discursiva por dia",
                    "1 OCR de folha de redação manuscrita por semana",
                    "Edital verticalizado com acompanhamento de progresso",
                    "Caderno de erros básico com diagnóstico de causa-raiz",
                    "Créditos extras assistindo a anúncios recompensados voluntários",
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
                className="w-full block py-3.5 px-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white text-center text-xs sm:text-sm font-bold transition-all shadow-sm"
              >
                Criar Conta Gratuita
              </Link>
            </div>
          </motion.div>

          {/* ================= CARD 2: PLANO SYNAPSE PRO ================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl bg-gradient-to-b from-indigo-950/70 via-slate-950/90 to-purple-950/70 border-2 border-indigo-500/60 p-7 sm:p-9 flex flex-col justify-between backdrop-blur-2xl relative overflow-hidden shadow-2xl shadow-indigo-950/80 hover:border-indigo-400 transition-all group"
          >
            {/* Top Amber Ribbon */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-lg shadow-amber-500/30 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>Mais Escolhido • Acesso Ilimitado & Zero Anúncios</span>
            </div>

            <div className="space-y-6 pt-2">
              <div className="space-y-2">
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
                  Todo o arsenal da IA trabalhando pelo seu nome no Diário Oficial. Sem limites, sem anúncios e com áudio neural hands-free.
                </p>
              </div>

              <div className="py-2 border-y border-indigo-500/20">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-white">
                    {billingCycle === "ANNUAL" ? "R$ 29,90" : "R$ 39,90"}
                  </span>
                  <span className="text-xs text-slate-300 font-bold">/mês</span>
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
                <ul className="space-y-3 text-xs text-slate-200">
                  {[
                    "IA 100% Ilimitada & Zero Anúncios (sem filas ou bloqueios diários)",
                    "Flashcards em Áudio Neural Humanizado Ilimitado (Modo Hands-Free no trânsito)",
                    "Correções Discursivas no rigor da banca com cálculo de fórmulas e Versão Ouro",
                    "OCR de Redação Manuscrita Ilimitado (foto da folha de prova real)",
                    "Raio-X de Incidência da Banca no Edital Verticalizado (Cebraspe, FGV, FCC)",
                    "Importador de Edital em PDF (extração automática completa)",
                    "Mapas Mentais Neurais: aprofundamento e exportação em PDF A4 / PNG HD",
                    "Exportação de Flashcards para Anki (.apkg) e apostilas",
                    "Prioridade máxima nos servidores Gemini 2.5 Pro",
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
                className="w-full relative group inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-sm text-white overflow-hidden shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 rounded-2xl" />
                <div className="relative flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Quero Ser Synapse Pro 🚀</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Garantia incondicional de 7 dias • Cancele quando quiser</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
