"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Crown,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  Layers,
  FileSpreadsheet,
  PenTool,
  Brain,
  FileCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Star,
  Flame,
  Award,
} from "lucide-react";
import { CheckoutLeadModal } from "./CheckoutLeadModal";
import { toggleDemoPlanTierAction } from "@/actions/subscription-actions";

interface PricingViewProps {
  currentPlanTier: "FREE" | "PREMIUM" | "ELITE";
  role: string;
  isUnlimited: boolean;
  userEmail?: string | null;
}

export function PricingView({
  currentPlanTier: initialPlanTier,
  role: _role,
  isUnlimited: initialIsUnlimited,
  userEmail: _userEmail,
}: PricingViewProps) {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTargetTier, setModalTargetTier] = useState<"PREMIUM" | "ELITE">("PREMIUM");
  const [currentTier, setCurrentTier] = useState<"FREE" | "PREMIUM" | "ELITE">(initialPlanTier);
  const [isUnlimited, setIsUnlimited] = useState(initialIsUnlimited);
  const [isTogglingPlan, setIsTogglingPlan] = useState(false);
  const [toggleFeedback, setToggleFeedback] = useState<string | null>(null);

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleTogglePlan = async (explicitTier?: "FREE" | "PREMIUM" | "ELITE") => {
    setIsTogglingPlan(true);
    setToggleFeedback(null);
    try {
      const res = await toggleDemoPlanTierAction(explicitTier);
      if (res.success) {
        setCurrentTier(res.newPlanTier);
        setIsUnlimited(res.newPlanTier === "PREMIUM" || res.newPlanTier === "ELITE");
        setToggleFeedback(res.message);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("plan-updated"));
        }
      }
    } catch {
      setToggleFeedback("Erro ao alternar plano.");
    } finally {
      setIsTogglingPlan(false);
    }
  };

  const FAQS = [
    {
      q: "Como funciona o limite do Plano Gratuito?",
      a: "No Plano Gratuito, você tem 10 ajudas com Inteligência Artificial por dia para testar nossos recursos (como 1 simulado diário, remediações de erro e 1 correção de redação semanal). O limite reinicia automaticamente todos os dias às 00:00 (horário de Brasília).",
    },
    {
      q: "O que são os Anúncios Recompensados no plano Gratuito?",
      a: "Para que você nunca fique completamente travado nos estudos, permitimos que usuários do plano gratuito assistam a um anúncio de curta duração para desbloquear créditos extras (como +1 simulado bônus). Já no Synapse Pro, sua experiência é 100% livre de qualquer anúncio com foco visual absoluto.",
    },
    {
      q: "Como funciona o OCR de Redação Manuscrita?",
      a: "Você pode escrever sua redação à mão em qualquer folha de prova ou padrão de banca, tirar uma foto com seu celular ou webcam e enviar. O modelo multimodal digitaliza seus parágrafos mantendo a fidelidade do seu texto e avalia os critérios de grafia, coesão, concordância e norma padrão da banca examinadora.",
    },
    {
      q: "O que é o Raio-X de Incidência da Banca no Edital Verticalizado?",
      a: "É uma ferramenta exclusiva do Pro que cruza o edital do seu concurso com o banco histórico de questões da banca organizadora (Cebraspe, FGV, FCC, etc.), destacando com selos visuais quais tópicos têm alta, média ou baixa recorrência histórica para você priorizar seu tempo.",
    },
    {
      q: "O que ganho ao assinar o Synapse Concurseiro Pro?",
      a: "Você tem alta capacidade diária de até 60 ajudas com IA por dia, até 3 correções discursivas diárias, até 2 correções de redação manuscrita por foto, cartões de memória com áudio, revisão de erros com macetes práticos, mapas mentais para imprimir em alta resolução e organizador de editais.",
    },
    {
      q: "A IA é calibrada para as principais bancas do Brasil?",
      a: "Sim! Treinamos nossos prompts e critérios para bancas como Cebraspe (certo/errado e apenação), FGV (interpretação crítica e casos práticos), FCC, Vunesp, Cesgranrio e bancas regionais.",
    },
    {
      q: "Posso cancelar minha assinatura quando quiser?",
      a: "Sim, sem nenhuma burocracia ou taxa de cancelamento. Você pode cancelar sua renovação a qualquer momento com apenas 1 clique e continuar com acesso até o fim do período já pago.",
    },
    {
      q: "Existe garantia de reembolso?",
      a: "Com certeza. Oferecemos 7 dias de garantia incondicional. Se você sentir que a plataforma não acelerou seus estudos, basta solicitar o reembolso integral sem perguntas.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-4">
      {/* ========================================================== */}
      {/* ⚡ BANNER DE ESCASSEZ & OFERTA LIMITADA                     */}
      {/* ========================================================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 dark:from-amber-500/15 dark:via-indigo-500/15 dark:to-purple-500/15 border border-amber-500/30 p-3.5 sm:p-4 text-center backdrop-blur-md shadow-md shadow-amber-500/5">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 uppercase text-[10px] tracking-wider font-black animate-pulse">
            <Flame size={12} className="text-amber-600 dark:text-amber-400 fill-amber-500" />
            Condição Especial de Lançamento
          </span>
          <span>
            Garanta o Synapse Pro no plano anual com <strong className="text-amber-950 dark:text-white font-black">50% de desconto</strong> por apenas <strong className="text-amber-950 dark:text-white font-black">R$ 29,90/mês</strong>. Vagas limitadas para este lote!
          </span>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 🚀 HERO HEADER                                             */}
      {/* ========================================================== */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-linear-to-r dark:from-indigo-500/15 dark:via-purple-500/15 dark:to-pink-500/15 dark:border-indigo-500/30 dark:text-indigo-300 text-xs font-semibold backdrop-blur-md shadow-xs">
          <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>Acelere sua aprovação no concurso dos seus sonhos</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Estude com IA de ponta,{" "}
          <span className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            sem limites e sem distrações.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          Economize centenas de horas de preparação com simulados adaptativos, correções discursivas no rigor da banca e diagnóstico de lacunas cognitivas.
        </p>

        {/* Seletor Mensal / Anual */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <span
            className={`text-xs font-bold transition-colors cursor-pointer select-none ${
              billingCycle === "MONTHLY"
                ? "text-slate-900 dark:text-white font-black"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
            onClick={() => setBillingCycle("MONTHLY")}
          >
            Faturamento Mensal
          </span>

          <button
            type="button"
            onClick={() =>
              setBillingCycle(billingCycle === "MONTHLY" ? "ANNUAL" : "MONTHLY")
            }
            className="relative w-14 h-7 rounded-full bg-slate-200 dark:bg-slate-800 p-1 border border-slate-300 dark:border-slate-700 transition-colors focus:outline-none cursor-pointer"
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500 shadow-md"
              style={{
                marginLeft: billingCycle === "ANNUAL" ? "1.75rem" : "0",
              }}
            />
          </button>

          <span
            className={`text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
              billingCycle === "ANNUAL"
                ? "text-slate-900 dark:text-white font-black"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
            onClick={() => setBillingCycle("ANNUAL")}
          >
            <span>Faturamento Anual</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-400/40 dark:text-emerald-300 text-[10px] font-extrabold uppercase shadow-2xs">
              Economize 25%
            </span>
          </span>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 💳 PRICING CARDS                                           */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
        {/* CARD PLANO GRATUITO */}
        <div
          className={`relative rounded-3xl bg-white dark:bg-slate-900/60 border ${
            currentTier === "FREE" && !isUnlimited
              ? "border-slate-300 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-lg"
              : "border-slate-200 dark:border-slate-800 shadow-md shadow-slate-100/80 dark:shadow-none"
          } p-6 flex flex-col justify-between backdrop-blur-xl transition-all hover:border-slate-300 dark:hover:border-slate-700`}
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Para quem está conhecendo
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Plano Básico</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Acesso inicial para conhecer a metodologia e resolver questões diárias.
              </p>
            </div>

            <div className="py-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">R$ 0</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/mês para sempre</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Sem necessidade de cartão de crédito.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                Recursos Inclusos no Grátis:
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                {[
                  "10 Ajudas com IA por dia (Renovação diária)",
                  "Degustação da Semana 1 na Trilha Guiada & Teoria",
                  "Até 2 Cursos Externos monitorados no Tracker",
                  "1 simulado com IA por dia (+1 bônus via anúncio)",
                  "1 correção de redação digitada por semana",
                  "Até 2 remediações no Caderno de Erros por dia",
                  "Edital verticalizado com inserção manual",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8">
            {currentTier === "FREE" && !isUnlimited ? (
              <div className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-center text-xs font-bold">
                Seu Plano Atual
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleTogglePlan("FREE")}
                disabled={isTogglingPlan}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-center text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Voltar para o Básico
              </button>
            )}
          </div>
        </div>

        {/* CARD PLANO SYNAPSE PRO */}
        <div className="relative rounded-3xl bg-linear-to-b from-indigo-50/90 via-white to-purple-50/70 border-2 border-indigo-600 dark:from-indigo-950/70 dark:via-slate-900/90 dark:to-purple-950/70 dark:border-indigo-500/50 p-6 flex flex-col justify-between backdrop-blur-2xl shadow-2xl shadow-indigo-200/50 dark:shadow-indigo-950/60 transition-all hover:border-indigo-500">
          {/* Badge de Destaque */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black tracking-wide uppercase shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 whitespace-nowrap">
            <Crown size={12} className="fill-white" />
            <span>Mais Escolhido • Copiloto Ativo</span>
          </div>

          <div className="space-y-5">
            <div className="space-y-2 pt-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Para quem já tem cursinho ou PDFs
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Synapse Pro</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-400/30 font-black">
                  COPILOTO
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Ideal para organizar seus estudos, resolver questões, treinar redações e memorizar tudo com cartões de memória inteligentes.
              </p>
            </div>

            <div className="py-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  {billingCycle === "ANNUAL" ? "R$ 29,90" : "R$ 39,90"}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">/mês</span>
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300/90 mt-1 font-semibold">
                {billingCycle === "ANNUAL"
                  ? "R$ 358,80/ano (Economia de R$ 120/ano)"
                  : "Assinatura mensal sem fidelidade"}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                Superpoderes do Synapse Pro:
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
                {[
                  "60 Ajudas com IA por dia (Alta Capacidade)",
                  "1 Trilha Guiada Ativa por vez + Cursos Externos Ilimitados",
                  "Até 3 correções de redação digitada/dia + 2 por foto do papel",
                  "Até 5 simulados inéditos por dia por Banca e Cargo",
                  "Caderno de Erros avançado com até 30 remediações diárias",
                  "Mapas Mentais em Alta Resolução (PDF / Imagem) + Cartões de Memória",
                  "Importador de Edital em PDF com IA e Raio-X da Banca",
                  "100% Zero Anúncios (Foco Total)",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 space-y-3">
            {currentTier === "PREMIUM" ? (
              <div className="w-full py-3.5 px-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 dark:bg-emerald-500/20 dark:border-emerald-400/40 dark:text-emerald-300 text-center text-xs font-black flex items-center justify-center gap-2 shadow-sm">
                <Crown size={16} className="fill-emerald-600 dark:fill-emerald-400 text-emerald-600 dark:text-emerald-400" />
                <span>Plano Pro Ativo na sua Conta</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setModalTargetTier("PREMIUM");
                  setIsModalOpen(true);
                }}
                className="w-full py-3.5 px-4 bg-linear-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Sparkles size={16} className="fill-white" />
                <span>Assinar Synapse Pro 🚀</span>
                <ArrowRight size={16} />
              </button>
            )}

            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                Garantia de 7 dias
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium">
                <Zap size={13} className="text-amber-500 dark:text-amber-400" />
                Ativação Imediata
              </span>
            </div>
          </div>
        </div>

        {/* CARD PLANO SYNAPSE ELITE 👑 (PILOTO AUTOMÁTICO & TRILHAS PROFUNDAS) */}
        <div className="relative rounded-3xl bg-linear-to-b from-amber-50/95 via-white to-orange-50/70 border-2 border-amber-500 dark:from-amber-950/50 dark:via-slate-900/95 dark:to-orange-950/40 dark:border-amber-500/60 p-6 flex flex-col justify-between backdrop-blur-2xl shadow-2xl shadow-amber-200/50 dark:shadow-amber-950/50 transition-all hover:border-amber-400">
          {/* Badge de Destaque Elite */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black tracking-wide uppercase shadow-lg shadow-amber-500/30 flex items-center gap-1.5 whitespace-nowrap">
            <Crown size={12} className="fill-slate-950" />
            <span>Substitui Cursinhos • Piloto Automático</span>
          </div>

          <div className="space-y-5">
            <div className="space-y-2 pt-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Mentoria & Teorias Profundas Sob Medida
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Synapse Elite</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/30 font-black">
                  MENTOR IA 👑
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Para quem quer o cronograma mastigado e aulas teóricas completas geradas sob medida para qualquer banca.
              </p>
            </div>

            <div className="py-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  {billingCycle === "ANNUAL" ? "R$ 49,90" : "R$ 64,90"}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">/mês</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/90 mt-1 font-semibold">
                {billingCycle === "ANNUAL"
                  ? "R$ 598,80/ano (Economia de R$ 180/ano)"
                  : "Assinatura mensal recorrente, cancele quando quiser"}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-xs font-extrabold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                Tudo do Pro + Exclusividades Elite:
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
                {[
                  "🔄 Teoria Viva: As aulas mudam e criam alertas baseados nos erros reais dos seus simulados",
                  "🕵️‍♂️ Detector de Pegadinhas + Treino de reforço contra as armadilhas mais comuns da banca",
                  "⚖️ Diferenciação de Conceitos: Quadros lado a lado desarmando termos fáceis de confundir",
                  "🧊 Lembrete de Conteúdo a Esquecer: revisão relâmpago de 60s antes de esquecer o assunto",
                  "📄 Resumo de Véspera Imprimível: Folha A4 com seus erros mais frequentes, macetes e tabelas",
                  "✍️ Reescrita Nota 10 nas Discursivas + Múltiplas Trilhas de Estudo Simultâneas",
                  "🎧 Áudio-Aulas + 120 Ajudas com IA por dia com Prioridade Máxima nos Servidores",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 font-medium">
                    <CheckCircle2 size={16} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 space-y-3">
            {currentTier === "ELITE" ? (
              <div className="w-full py-3.5 px-4 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-900 dark:text-amber-200 text-center text-xs font-black flex items-center justify-center gap-2 shadow-sm">
                <Crown size={16} className="fill-amber-500 text-amber-500" />
                <span>Plano Synapse Elite 👑 Ativo na sua Conta</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setModalTargetTier("ELITE");
                  setIsModalOpen(true);
                }}
                className="w-full py-3.5 px-4 bg-linear-to-r from-amber-500 via-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs sm:text-sm font-black rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Crown size={16} className="fill-slate-950" />
                <span>Quero Ser Synapse Elite 👑</span>
                <ArrowRight size={16} />
              </button>
            )}

            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                Garantia de 7 dias
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium">
                <Zap size={13} className="text-amber-500 dark:text-amber-400" />
                Acesso Total Imediato
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 🏆 PROVA SOCIAL & DEPOIMENTOS DE CONCURSEIROS APROVADOS    */}
      {/* ========================================================== */}
      <div className="max-w-5xl mx-auto space-y-6 pt-4">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1 text-amber-500 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-1.5 text-slate-600 dark:text-slate-300 font-semibold">4.9 / 5 estrelas por concurseiros reais</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Quem estuda com o Synapse AI passa na frente
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Histórias reais de quem transformou a rotina de estudos e alcançou a aprovação nos concursos mais concorridos do país.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: "Lucas Moreira",
              role: "Aprovado na PRF (Polícia Rodoviária Federal)",
              avatar: "LM",
              color: "from-blue-600 to-indigo-600",
              quote: "O OCR de redação manuscrita foi o grande divisor de águas. Treinei mais de 20 folhas de redação tirando foto pelo celular e o feedback da IA foi idêntico ao espelho da banca Cebraspe.",
              highlight: "Nota 19.4 na prova discursiva",
            },
            {
              name: "Camila Ribeiro",
              role: "1º Lugar Técnico Judiciário (TRT-15)",
              avatar: "CR",
              color: "from-purple-600 to-pink-600",
              quote: "As Trilhas Guiadas do Synapse Elite substituíram PDFs de 120 páginas por teorias diretas ao ponto, com lei seca grifada e tabelas das pegadinhas da banca. Economizou meses!",
              highlight: "89% de acertos na prova objetiva",
            },
            {
              name: "Matheus Fagundes",
              role: "Aprovado Auditor Fiscal (SEFAZ)",
              avatar: "MF",
              color: "from-emerald-600 to-teal-600",
              quote: "O Raio-X de incidência da banca e os mapas mentais com aprofundamento neural me permitiram focar 80% do meu tempo no que a banca examinadora realmente cobra. Vale cada centavo.",
              highlight: "Aprovado em 8 meses de estudo",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-md shadow-slate-100 dark:shadow-none flex flex-col justify-between space-y-4 backdrop-blur-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{item.quote}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xs font-black shadow-md`}
                  >
                    {item.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{item.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 📊 TABELA COMPARATIVA DETALHADA (3 PLANOS)                 */}
      {/* ========================================================== */}
      <div className="max-w-5xl mx-auto space-y-6 pt-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Comparativo Completo de Recursos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare o Plano Básico, o Synapse Pro (Copiloto) e o Synapse Elite (Mentor IA & Trilhas Profundas).
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                <th className="p-4 text-slate-700 dark:text-slate-400 font-bold">Recurso / Ferramenta</th>
                <th className="p-4 text-slate-600 dark:text-slate-400 font-bold text-center w-32 sm:w-40">
                  Básico (Grátis)
                </th>
                <th className="p-4 text-indigo-700 dark:text-indigo-300 font-black text-center w-36 sm:w-44 bg-indigo-50 dark:bg-indigo-500/10 border-l border-r border-indigo-200 dark:border-indigo-500/20">
                  Synapse Pro 💎
                </th>
                <th className="p-4 text-amber-700 dark:text-amber-300 font-black text-center w-36 sm:w-48 bg-amber-50 dark:bg-amber-500/10">
                  Synapse Elite 👑
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {/* BLOCO TRILHAS GUIADAS, TEORIAS & CURSOS EXTERNOS */}
              <tr className="bg-slate-50 dark:bg-slate-950/40">
                <td colSpan={4} className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  🧭 Trilhas Guiadas, Teorias Esquematizadas & Cursos Externos
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">
                  Trilhas de Estudo Guiadas Semana a Semana
                </td>
                <td className="p-4 text-center text-slate-500 dark:text-slate-400">Degustação (Semana 1)</td>
                <td className="p-4 text-center text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50/50 dark:bg-indigo-500/5 border-l border-r border-indigo-200 dark:border-indigo-500/20">
                  1 Trilha Ativa por vez
                </td>
                <td className="p-4 text-center text-amber-700 dark:text-amber-300 font-black bg-amber-50/40 dark:bg-amber-500/5">
                  Múltiplas Trilhas Simultâneas 👑
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">
                  Teoria Viva (Aulas que evoluem com seus erros reais de Simulados)
                </td>
                <td className="p-4 text-center text-slate-400 dark:text-slate-500">Teoria Estática</td>
                <td className="p-4 text-center text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50/50 dark:bg-indigo-500/5 border-l border-r border-indigo-200 dark:border-indigo-500/20">
                  Teoria Padrão 2.0
                </td>
                <td className="p-4 text-center text-amber-700 dark:text-amber-300 font-black bg-amber-50/40 dark:bg-amber-500/5">
                  Teoria Viva + Conceitos Gêmeos 🔄⚖️
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">
                  Detector de DNA de Pegadinha + Alarme de Memória Esfriando
                </td>
                <td className="p-4 text-center text-slate-400 dark:text-slate-500">🔒 Bloqueado</td>
                <td className="p-4 text-center text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50/50 dark:bg-indigo-500/5 border-l border-r border-indigo-200 dark:border-indigo-500/20">
                  Estatísticas Gerais
                </td>
                <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-black bg-amber-50/40 dark:bg-amber-500/5">
                  Vacina Anti-Pegadinha + Resgate 1min 💉🧊
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">
                  Folha de Véspera A4 100% Pessoal & Áudio-Aulas Narradas
                </td>
                <td className="p-4 text-center text-slate-400 dark:text-slate-500">🔒 Bloqueado</td>
                <td className="p-4 text-center text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50/50 dark:bg-indigo-500/5 border-l border-r border-indigo-200 dark:border-indigo-500/20">
                  Leitura na Tela
                </td>
                <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-black bg-amber-50/40 dark:bg-amber-500/5">
                  Caderno de Ouro A4 + Áudio Hands-Free 🎧🖨️
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">
                  Tracker de Cursos Externos (Udemy, Estratégia, Gran, PDFs)
                </td>
                <td className="p-4 text-center text-slate-500 dark:text-slate-400">Até 2 cursos</td>
                <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-bold bg-indigo-50/50 dark:bg-indigo-500/5 border-l border-r border-indigo-200 dark:border-indigo-500/20">
                  Ilimitado
                </td>
                <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-black bg-amber-50/40 dark:bg-amber-500/5">
                  Ilimitado + Conversão em Flashcards
                </td>
              </tr>

              {/* BLOCO IA & PERFORMANCE */}
              <tr className="bg-slate-50 dark:bg-slate-950/40">
                <td colSpan={4} className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  ⚡ Inteligência Artificial & Acesso
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">
                  Ajudas com IA por Dia
                </td>
                <td className="p-4 text-center text-slate-500 dark:text-slate-400">10 ajudas / dia</td>
                <td className="p-4 text-center text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50/50 dark:bg-indigo-500/5 border-l border-r border-indigo-200 dark:border-indigo-500/20">
                  60 ajudas / dia ⚡
                </td>
                <td className="p-4 text-center text-amber-700 dark:text-amber-300 font-black bg-amber-50/40 dark:bg-amber-500/5">
                  120 ajudas / dia (Prioridade Máxima) 🔥
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">
                  Experiência sem Anúncios
                </td>
                <td className="p-4 text-center text-slate-500 dark:text-slate-400">
                  Recargas via anúncios
                </td>
                <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-bold bg-indigo-50/50 dark:bg-indigo-500/5 border-l border-r border-indigo-200 dark:border-indigo-500/20">
                  100% Zero Anúncios ✨
                </td>
                <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-black bg-amber-50/40 dark:bg-amber-500/5">
                  100% Zero Anúncios ✨
                </td>
              </tr>

              {/* BLOCO REDAÇÃO & OCR */}
              <tr className="bg-slate-50 dark:bg-slate-950/40">
                <td colSpan={4} className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  📝 Redação Discursiva & OCR
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">
                  Correção de Redação Digitada & OCR Manuscrito
                </td>
                <td className="p-4 text-center text-slate-500 dark:text-slate-400">1/sem (Degustação)</td>
                <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-bold bg-indigo-50/50 dark:bg-indigo-500/5 border-l border-r border-indigo-200 dark:border-indigo-500/20">
                  Até 3 digitadas + 2 OCR/dia 📸
                </td>
                <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-black bg-amber-50/40 dark:bg-amber-500/5">
                  Até 5 digitadas + 4 OCR/dia 📸
                </td>
              </tr>

              {/* BLOCO SIMULADOS & CADERNO DE ERROS */}
              <tr className="bg-slate-50 dark:bg-slate-950/40">
                <td colSpan={4} className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  🎯 Provas, Simulados, Mapas & Edital Verticalizado
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">
                  Simulados Inéditos & Mnemônicos no Caderno de Erros
                </td>
                <td className="p-4 text-center text-slate-500 dark:text-slate-400">1 simulado / 2 erros dia</td>
                <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-bold bg-indigo-50/50 dark:bg-indigo-500/5 border-l border-r border-indigo-200 dark:border-indigo-500/20">
                  5 simulados / 30 remediações dia
                </td>
                <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-black bg-amber-50/40 dark:bg-amber-500/5">
                  10 simulados / Remediações Ilimitadas
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">
                  Mapas Mentais em Alta Resolução, Exportação de Cartões & Raio-X da Banca
                </td>
                <td className="p-4 text-center text-slate-400 dark:text-slate-500">Básico</td>
                <td className="p-4 text-center text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50/50 dark:bg-indigo-500/5 border-l border-r border-indigo-200 dark:border-indigo-500/20">
                  Completo (PDF A4 + Cartões + Raio-X)
                </td>
                <td className="p-4 text-center text-amber-700 dark:text-amber-300 font-black bg-amber-50/40 dark:bg-amber-500/5">
                  Completo + Recalibragem Automática 👑
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 🛡️ BOX DE GARANTIA BLINDADA DE 7 DIAS                       */}
      {/* ========================================================== */}
      <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 dark:from-amber-500/10 dark:via-slate-900/90 dark:to-indigo-500/10 border-2 border-amber-400/50 dark:border-amber-500/30 p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-amber-500/5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shrink-0 shadow-lg shadow-amber-500/30">
            <ShieldCheck size={40} strokeWidth={2.2} />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 text-[11px] font-bold uppercase tracking-wider">
              <Award size={12} />
              Garantia Incondicional de Risco Zero
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Teste o Synapse Pro por 7 Dias sem nenhum compromisso
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Use todas as ferramentas com IA ilimitada, envie suas redações, gere simulados inéditos e monte mapas mentais. Se por qualquer motivo você não se adaptar ou achar que não acelerou seus estudos, basta solicitar o reembolso com apenas 1 clique. Devolvemos 100% do seu dinheiro, sem letras miúdas.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* ❓ PERGUNTAS FREQUENTES (FAQ)                              */}
      {/* ========================================================== */}
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Dúvidas Frequentes</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tudo o que você precisa saber sobre o Synapse AI e os planos.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xs shadow-slate-100 dark:shadow-none overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4.5 text-left flex items-center justify-between gap-4 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4.5 pt-0 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 🛡️ PAINEL DE TESTES / DEMO SWITCHER (PARA O DESENVOLVEDOR)  */}
      {/* ========================================================== */}
      <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-md shadow-slate-100 dark:shadow-none text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <RefreshCw size={14} className={isTogglingPlan ? "animate-spin" : ""} />
          <span>Painel do Beta Tester / Simulação de Assinatura</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Alterne entre o Plano Básico (10/dia), Synapse Pro (60/dia) e Synapse Elite 👑 (120/dia) para testar todas as experiências.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleTogglePlan("FREE")}
            disabled={isTogglingPlan || currentTier === "FREE"}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
          >
            Simular Básico (10/dia)
          </button>

          <button
            type="button"
            onClick={() => handleTogglePlan("PREMIUM")}
            disabled={isTogglingPlan || currentTier === "PREMIUM"}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 dark:bg-indigo-600/30 dark:hover:bg-indigo-600/50 dark:border-indigo-500/40 dark:text-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
          >
            <Sparkles size={13} />
            <span>Simular Synapse Pro (60/dia)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTogglePlan("ELITE")}
            disabled={isTogglingPlan || currentTier === "ELITE"}
            className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
          >
            <Crown size={13} className="text-amber-500" />
            <span>Simular Synapse Elite 👑 (120/dia)</span>
          </button>
        </div>

        {toggleFeedback && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-fadeIn">
            {toggleFeedback}
          </p>
        )}
      </div>

      {/* Modal de Checkout / Intenção */}
      <CheckoutLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultCycle={billingCycle}
        targetTier={modalTargetTier}
        onSuccess={(activatedTier) => {
          setCurrentTier(activatedTier);
          setIsUnlimited(true);
        }}
      />
    </div>
  );
}
