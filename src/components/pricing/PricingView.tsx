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
} from "lucide-react";
import { CheckoutLeadModal } from "./CheckoutLeadModal";
import { toggleDemoPlanTierAction } from "@/actions/subscription-actions";

interface PricingViewProps {
  currentPlanTier: "FREE" | "PREMIUM";
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
  const [currentTier, setCurrentTier] = useState<"FREE" | "PREMIUM">(initialPlanTier);
  const [isUnlimited, setIsUnlimited] = useState(initialIsUnlimited);
  const [isTogglingPlan, setIsTogglingPlan] = useState(false);
  const [toggleFeedback, setToggleFeedback] = useState<string | null>(null);

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleTogglePlan = async () => {
    setIsTogglingPlan(true);
    setToggleFeedback(null);
    try {
      const res = await toggleDemoPlanTierAction();
      if (res.success) {
        setCurrentTier(res.newPlanTier);
        setIsUnlimited(res.newPlanTier === "PREMIUM");
        setToggleFeedback(res.message);
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
      a: "No Plano Gratuito, você tem até 7 requisições diárias de Inteligência Artificial para testar nossos recursos (como até 2 simulados diários e 1 correção de redação). Esse limite reinicia automaticamente todos os dias às 00:00 (horário de Brasília).",
    },
    {
      q: "O que ganho ao assinar o Synapse Concurseiro Pro?",
      a: "Você tem acesso 100% ilimitado a todas as ferramentas com IA (sem fila nem bloqueio diário), correção aprofundada de redações com reescrita parágrafo a parágrafo, geração ilimitada de simulados com foco no seu edital, mapas mentais, flashcards e exportação em PDF e Anki.",
    },
    {
      q: "A IA é calibrada para as principais bancas do Brasil?",
      a: "Sim! Treinamos nossos prompts e lógica para os critérios de avaliação das bancas Cebraspe (certo/errado e apenação), FGV (interpretação crítica e casos práticos), FCC, Vunesp e bancas regionais.",
    },
    {
      q: "Posso cancelar minha assinatura quando quiser?",
      a: "Sim, sem nenhuma burocracia ou taxa de cancelamento. Você pode cancelar sua renovação a qualquer momento e continuar com acesso até o fim do período já pago.",
    },
    {
      q: "Existe garantia de reembolso?",
      a: "Com certeza. Oferecemos 7 dias de garantia incondicional. Se você sentir que a plataforma não acelerou seus estudos, basta solicitar o reembolso integral sem perguntas.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-4">
      {/* ========================================================== */}
      {/* 🚀 HERO HEADER                                             */}
      {/* ========================================================== */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-linear-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
          <Sparkles size={14} className="text-indigo-400" />
          <span>Acelere sua aprovação no concurso dos seus sonhos</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Estude com IA de ponta,{" "}
          <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            sem limites e sem distrações.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Economize centenas de horas de preparação com simulados adaptativos, correções discursivas no rigor da banca e diagnóstico de lacunas cognitivas.
        </p>

        {/* Seletor Mensal / Anual */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <span
            className={`text-xs font-bold transition-colors cursor-pointer ${
              billingCycle === "MONTHLY" ? "text-white" : "text-slate-400"
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
            className="relative w-14 h-7 rounded-full bg-slate-800 p-1 border border-slate-700 transition-colors focus:outline-none cursor-pointer"
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-5 h-5 rounded-full bg-indigo-500 shadow-md"
              style={{
                marginLeft: billingCycle === "ANNUAL" ? "1.75rem" : "0",
              }}
            />
          </button>

          <span
            className={`text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              billingCycle === "ANNUAL" ? "text-white" : "text-slate-400"
            }`}
            onClick={() => setBillingCycle("ANNUAL")}
          >
            <span>Faturamento Anual</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold uppercase">
              Economize 25%
            </span>
          </span>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 💳 PRICING CARDS                                           */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        {/* CARD PLANO GRATUITO */}
        <div
          className={`relative rounded-3xl bg-slate-900/60 border ${
            currentTier === "FREE" && !isUnlimited
              ? "border-slate-700 shadow-lg"
              : "border-slate-800"
          } p-7 flex flex-col justify-between backdrop-blur-xl transition-all`}
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Para quem está conhecendo
              </div>
              <h3 className="text-2xl font-black text-white">Plano Básico</h3>
              <p className="text-xs text-slate-400">
                Acesso inicial para conhecer a metodologia e resolver questões diárias.
              </p>
            </div>

            <div className="py-2">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">R$ 0</span>
                <span className="text-xs text-slate-400">/mês para sempre</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Sem necessidade de cartão de crédito.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Recursos Inclusos:
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {[
                  "7 requisições diárias de Inteligência Artificial",
                  "Até 2 simulados com IA por dia",
                  "1 correção de redação discursiva por dia",
                  "Até 2 decks de flashcards inteligentes por dia",
                  "Caderno de erros essencial com repetição espaçada",
                  "Cronograma de estudos e métricas básicas",
                  "Central de Feedback e suporte da comunidade",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8">
            {currentTier === "FREE" && !isUnlimited ? (
              <div className="w-full py-3 px-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-300 text-center text-xs font-bold">
                Seu Plano Atual
              </div>
            ) : (
              <button
                type="button"
                onClick={handleTogglePlan}
                disabled={isTogglingPlan}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-center text-xs font-bold transition-all cursor-pointer"
              >
                Voltar para o Básico
              </button>
            )}
          </div>
        </div>

        {/* CARD PLANO SYNAPSE PRO */}
        <div className="relative rounded-3xl bg-linear-to-b from-indigo-950/70 via-slate-900/90 to-purple-950/70 border-2 border-indigo-500/50 p-7 flex flex-col justify-between backdrop-blur-2xl shadow-2xl shadow-indigo-950/60 transition-all hover:border-indigo-400">
          {/* Badge de Destaque */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-indigo-500 to-purple-500 text-white text-[11px] font-black tracking-wide uppercase shadow-lg shadow-indigo-500/40 flex items-center gap-1.5">
            <Crown size={13} className="fill-white" />
            <span>Mais Escolhido • Acesso Completo</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 pt-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Para quem busca a aprovação definitiva
              </div>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <span>Synapse Pro</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  ILIMITADO
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Todo o arsenal tecnológico da IA trabalhando a favor do seu nome no Diário Oficial.
              </p>
            </div>

            <div className="py-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-white">
                  {billingCycle === "ANNUAL" ? "R$ 29,90" : "R$ 39,90"}
                </span>
                <span className="text-xs text-slate-300">/mês</span>
              </div>
              <p className="text-[11px] text-indigo-300/90 mt-1">
                {billingCycle === "ANNUAL"
                  ? "R$ 358,80 faturado anualmente (Economia de R$ 120/ano)"
                  : "Assinatura mensal recorrente, sem carência ou multas"}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                Tudo do Básico e mais:
              </div>
              <ul className="space-y-2.5 text-xs text-slate-200">
                {[
                  "IA 100% Ilimitada (sem travas diárias nem filas)",
                  "Simulados ilimitados por banca, disciplina e cargo",
                  "Correções completas de redação discursiva com nota e reescrita",
                  "Geração ilimitada de Flashcards e Mapas Mentais",
                  "Diagnóstico preditivo de aprovação e remediação cognitiva",
                  "Exportação em PDF e baralhos para Anki (.apkg)",
                  "Prioridade máxima com modelos Gemini 2.5 Pro",
                  "Selo VIP exclusivo e acesso antecipado a novidades",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 space-y-3">
            {isUnlimited || currentTier === "PREMIUM" ? (
              <div className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-center text-xs font-black flex items-center justify-center gap-2 shadow-lg">
                <Crown size={16} className="fill-emerald-400" />
                <span>Você é Membro Pro (Acesso Ilimitado Ativo)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3.5 px-4 bg-linear-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Sparkles size={16} className="fill-white" />
                <span>Quero Ser Synapse Pro 🚀</span>
                <ArrowRight size={16} />
              </button>
            )}

            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-400" />
                Garantia de 7 dias
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Zap size={13} className="text-amber-400" />
                Ativação Imediata
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 📊 TABELA COMPARATIVA DETALHADA                            */}
      {/* ========================================================== */}
      <div className="max-w-4xl mx-auto space-y-6 pt-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Comparativo Completo de Recursos
          </h2>
          <p className="text-xs text-slate-400">
            Veja em detalhes o que cada plano oferece para sua rotina de estudos.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60">
                <th className="p-4 text-slate-400 font-bold">Recurso / Ferramenta</th>
                <th className="p-4 text-slate-400 font-bold text-center w-36 sm:w-44">
                  Básico (Grátis)
                </th>
                <th className="p-4 text-indigo-300 font-black text-center w-36 sm:w-44 bg-indigo-500/10 border-l border-r border-indigo-500/20">
                  Synapse Pro 💎
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Cota Diária de Requisições com IA
                </td>
                <td className="p-4 text-center text-slate-400">7 requisições / dia</td>
                <td className="p-4 text-center text-indigo-300 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Ilimitada ⚡
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Simulados Inéditos com IA
                </td>
                <td className="p-4 text-center text-slate-400">Até 2 por dia</td>
                <td className="p-4 text-center text-emerald-400 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Ilimitados
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Correções de Redação Discursiva
                </td>
                <td className="p-4 text-center text-slate-400">1 por dia</td>
                <td className="p-4 text-center text-emerald-400 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Ilimitadas + Reescrita
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Flashcards & Mapas Mentais
                </td>
                <td className="p-4 text-center text-slate-400">2 decks / dia</td>
                <td className="p-4 text-center text-emerald-400 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Ilimitados
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Caderno de Erros Inteligente
                </td>
                <td className="p-4 text-center text-slate-300">Essencial</td>
                <td className="p-4 text-center text-indigo-300 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Remediação Cognitiva + Mnemônicos
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Exportação de Materiais
                </td>
                <td className="p-4 text-center text-slate-500">—</td>
                <td className="p-4 text-center text-emerald-400 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  PDF & Anki (.apkg)
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Prioridade nos Servidores da IA
                </td>
                <td className="p-4 text-center text-slate-400">Padrão</td>
                <td className="p-4 text-center text-indigo-300 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Alta Prioridade (Zero Fila)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================== */}
      {/* ❓ PERGUNTAS FREQUENTES (FAQ)                              */}
      {/* ========================================================== */}
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white">Dúvidas Frequentes</h2>
          <p className="text-xs text-slate-400">
            Tudo o que você precisa saber sobre o Synapse AI e os planos.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4.5 text-left flex items-center justify-between gap-4 text-xs sm:text-sm font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle size={16} className="text-indigo-400 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4.5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/40">
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
      <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
          <RefreshCw size={14} className={isTogglingPlan ? "animate-spin" : ""} />
          <span>Painel do Beta Tester / Simulação de Assinatura</span>
        </div>
        <p className="text-[11px] text-slate-400 max-w-md mx-auto">
          Alterne entre o Plano Básico (para testar os avisos de cotas e limites diários) e o Synapse Pro (para testar a IA ilimitada).
        </p>

        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleTogglePlan}
            disabled={isTogglingPlan}
            className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-200 transition-all cursor-pointer flex items-center gap-2"
          >
            <Crown size={14} className="text-amber-400" />
            <span>
              {currentTier === "PREMIUM"
                ? "Simular Volta para Plano Gratuito"
                : "Ativar Simulação Synapse Pro Ilimitado"}
            </span>
          </button>
        </div>

        {toggleFeedback && (
          <p className="text-xs font-medium text-emerald-400 animate-fadeIn">
            {toggleFeedback}
          </p>
        )}
      </div>

      {/* Modal de Checkout / Intenção */}
      <CheckoutLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultCycle={billingCycle}
        onSuccess={() => {
          setCurrentTier("PREMIUM");
          setIsUnlimited(true);
        }}
      />
    </div>
  );
}
