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
      a: "No Plano Gratuito, você tem até 7 requisições diárias de Inteligência Artificial para testar nossos recursos (como até 2 simulados diários e 1 correção de redação). O limite reinicia automaticamente todos os dias às 00:00 (horário de Brasília).",
    },
    {
      q: "O que são os Anúncios Recompensados no plano Gratuito?",
      a: "Para que você nunca fique completamente travado nos estudos, permitimos que usuários do plano gratuito assistam a um anúncio de curta duração para desbloquear créditos extras (como +1 simulado ou +1 remediação de erro). Já no Synapse Pro, sua experiência é 100% livre de qualquer anúncio.",
    },
    {
      q: "Como funciona o OCR de Redação Manuscrita?",
      a: "Você pode escrever sua redação à mão em qualquer folha de prova ou padrão de banca, tirar uma foto com seu celular ou webcam e enviar. O modelo multimodal Gemini Vision digitaliza seus parágrafos mantendo a fidelidade do seu texto e avalia os critérios de grafia, coesão, concordância e norma padrão da banca examinadora.",
    },
    {
      q: "O que é o Raio-X de Incidência da Banca no Edital Verticalizado?",
      a: "É uma ferramenta exclusiva do Pro que cruza o edital do seu concurso com o banco histórico de questões da banca organizadora (Cebraspe, FGV, FCC, etc.), destacando com selos visuais quais tópicos têm alta, média ou baixa recorrência histórica para você priorizar seu tempo.",
    },
    {
      q: "O que ganho ao assinar o Synapse Concurseiro Pro?",
      a: "Você tem acesso 100% ilimitado a todas as ferramentas com IA (sem fila nem bloqueio diário), OCR de redações manuscritas ilimitado, revisão de erros com macetes práticos, mapas mentais com aprofundamento neural e exportação HD/PDF A4, leitor de editais em PDF e exportação para o Anki (.apkg).",
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-purple-500/15 border border-amber-500/30 p-3.5 sm:p-4 text-center backdrop-blur-md shadow-lg shadow-amber-500/5">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold text-amber-200">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase text-[10px] tracking-wider font-black animate-pulse">
            <Flame size={12} className="text-amber-400 fill-amber-400" />
            Condição Especial de Lançamento
          </span>
          <span>
            Garanta o Synapse Pro no plano anual com <strong>50% de desconto</strong> por apenas <strong>R$ 29,90/mês</strong>. Vagas limitadas para este lote!
          </span>
        </div>
      </div>

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
                Recursos Inclusos no Grátis:
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {[
                  "7 requisições diárias de Inteligência Artificial",
                  "Até 2 simulados com IA por dia (+1 com anúncio opcional)",
                  "1 correção de redação digitada por dia",
                  "1 OCR de redação manuscrita (foto) por semana para testar",
                  "1 remediação cognitiva no Caderno de Erros por dia",
                  "1 Mapa Mental Neural por dia (exportação SVG)",
                  "Edital verticalizado com acompanhamento de progresso",
                  "Créditos extras assistindo a anúncios recompensados voluntários",
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
            <span>Mais Escolhido • Acesso Ilimitado & Zero Anúncios</span>
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
                Superpoderes Exclusivos do Pro:
              </div>
              <ul className="space-y-2.5 text-xs text-slate-200">
                {[
                  "IA 100% Ilimitada & Zero Anúncios (foco total sem interrupções)",
                  "OCR de Redação Manuscrita Ilimitado (foto da folha de prova real)",
                  "Revisão de Erros & Macetes de Memorização no Caderno de Erros ilimitados",
                  "Mapas Mentais Neurais: Aprofundamento de nós com IA e exportação em PDF A4 / PNG HD",
                  "Raio-X de Incidência da Banca no Edital Verticalizado (Cebraspe, FGV, FCC)",
                  "Importador de Edital em PDF (extração automática por IA)",
                  "Simulados Inéditos ilimitados com filtros de cargo e banca",
                  "Exportação de Flashcards para Anki (.apkg) e apostilas em PDF",
                  "Prioridade máxima nos servidores Gemini 2.5 Pro (zero tempo de fila)",
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
      {/* 🏆 PROVA SOCIAL & DEPOIMENTOS DE CONCURSEIROS APROVADOS    */}
      {/* ========================================================== */}
      <div className="max-w-5xl mx-auto space-y-6 pt-4">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1 text-amber-400 text-xs font-bold uppercase tracking-wider">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="fill-amber-400" />
            ))}
            <span className="ml-1.5 text-slate-300">4.9 / 5 estrelas por concurseiros reais</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Quem estuda com o Synapse AI passa na frente
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
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
              quote: "O Caderno de Erros inteligente com macetes de memorização tirou todas as minhas dúvidas que PDFs gigantes não explicavam com clareza. Economizou meses de preparação.",
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
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between space-y-4 backdrop-blur-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{item.quote}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xs font-black shadow-md`}
                  >
                    {item.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{item.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
            Veja em detalhes por que o Synapse Pro multiplica seu rendimento e economiza centenas de horas de preparação.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60">
                <th className="p-4 text-slate-400 font-bold">Recurso / Ferramenta</th>
                <th className="p-4 text-slate-400 font-bold text-center w-36 sm:w-48">
                  Básico (Grátis)
                </th>
                <th className="p-4 text-indigo-300 font-black text-center w-36 sm:w-48 bg-indigo-500/10 border-l border-r border-indigo-500/20">
                  Synapse Pro 💎
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {/* BLOCO IA & PERFORMANCE */}
              <tr className="bg-slate-950/40">
                <td colSpan={3} className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                  ⚡ Inteligência Artificial & Acesso
                </td>
              </tr>
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
                  Experiência sem Anúncios
                </td>
                <td className="p-4 text-center text-slate-400">
                  Com anúncios recompensados
                </td>
                <td className="p-4 text-center text-emerald-400 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  100% Zero Anúncios ✨
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Prioridade nos Servidores de IA
                </td>
                <td className="p-4 text-center text-slate-400">Fila Padrão</td>
                <td className="p-4 text-center text-indigo-300 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Alta Prioridade (Gemini 2.5 Pro)
                </td>
              </tr>

              {/* BLOCO REDAÇÃO & OCR */}
              <tr className="bg-slate-950/40">
                <td colSpan={3} className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                  📝 Redação Discursiva & OCR
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Correção de Redação Digitada (Padrão Banca)
                </td>
                <td className="p-4 text-center text-slate-400">1 por dia</td>
                <td className="p-4 text-center text-emerald-400 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Ilimitada + Reescrita Modelo
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  OCR de Folha Manuscrita (Foto da Redação)
                </td>
                <td className="p-4 text-center text-slate-400">1 por semana (teste)</td>
                <td className="p-4 text-center text-emerald-400 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Ilimitado (Gemini Vision) 📸
                </td>
              </tr>

              {/* BLOCO SIMULADOS & CADERNO DE ERROS */}
              <tr className="bg-slate-950/40">
                <td colSpan={3} className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                  🎯 Provas, Simulados & Erros
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Simulados Inéditos com IA
                </td>
                <td className="p-4 text-center text-slate-400">2 por dia (+1 via anúncio)</td>
                <td className="p-4 text-center text-emerald-400 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Ilimitados por Banca e Cargo
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Explicação e Macetes no Caderno de Erros
                </td>
                <td className="p-4 text-center text-slate-400">1 por dia (+1 via anúncio)</td>
                <td className="p-4 text-center text-indigo-300 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Ilimitada + Macetes de Memorização por IA 🧠
                </td>
              </tr>

              {/* BLOCO MAPAS MENTAIS & EDITAL */}
              <tr className="bg-slate-950/40">
                <td colSpan={3} className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                  🗺️ Mapas Mentais & Edital Verticalizado
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Geração de Mapas Mentais Neurais
                </td>
                <td className="p-4 text-center text-slate-400">1 por dia (+1 via anúncio)</td>
                <td className="p-4 text-center text-emerald-400 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Ilimitados
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Aprofundamento Neural de Nós com IA
                </td>
                <td className="p-4 text-center text-slate-500">🔒 Exclusivo Pro</td>
                <td className="p-4 text-center text-emerald-400 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Ilimitado (1 clique para expandir)
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Exportação de Mapas Mentais
                </td>
                <td className="p-4 text-center text-slate-400">SVG Básico</td>
                <td className="p-4 text-center text-emerald-400 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  PDF A4 Alta Resolução & PNG Retina 2x
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Raio-X de Incidência da Banca no Edital
                </td>
                <td className="p-4 text-center text-slate-500">🔒 Bloqueado</td>
                <td className="p-4 text-center text-indigo-300 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Destravado com Histórico da Banca 👑
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Importador de Edital em PDF
                </td>
                <td className="p-4 text-center text-slate-400">Apenas Manual / Texto</td>
                <td className="p-4 text-center text-emerald-400 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Leitor de PDF Bruto com IA
                </td>
              </tr>
              <tr>
                <td className="p-4 text-slate-200 font-medium">
                  Exportação para Anki (.apkg) & PDF
                </td>
                <td className="p-4 text-center text-slate-500">—</td>
                <td className="p-4 text-center text-emerald-400 font-bold bg-indigo-500/5 border-l border-r border-indigo-500/20">
                  Ilimitada
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 🛡️ BOX DE GARANTIA BLINDADA DE 7 DIAS                       */}
      {/* ========================================================== */}
      <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-indigo-500/10 border-2 border-amber-500/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shrink-0 shadow-lg shadow-amber-500/30">
            <ShieldCheck size={40} strokeWidth={2.2} />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider">
              <Award size={12} />
              Garantia Incondicional de Risco Zero
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Teste o Synapse Pro por 7 Dias sem nenhum compromisso
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
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
