"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Crown,
  CheckCircle2,
  X,
  ShieldCheck,
  Zap,
  ArrowRight,
  Loader2,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { submitSubscriptionLeadAction } from "@/actions/subscription-actions";

interface CheckoutLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCycle?: "MONTHLY" | "ANNUAL";
  onSuccess?: () => void;
}

export function CheckoutLeadModal({
  isOpen,
  onClose,
  defaultCycle = "ANNUAL",
  onSuccess,
}: CheckoutLeadModalProps) {
  const [cycle, setCycle] = useState<"MONTHLY" | "ANNUAL">(defaultCycle);
  const [phoneOrWhatsapp, setPhoneOrWhatsapp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const result = await submitSubscriptionLeadAction({
        plan: "Synapse Concurseiro Pro",
        billingCycle: cycle,
        phoneOrWhatsapp: phoneOrWhatsapp.trim(),
      });

      if (result.success) {
        setIsSuccess(true);
        setStatusMessage(result.message);

        // Confetes de celebração
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#6366f1", "#a855f7", "#ec4899", "#10b981"],
          });
        } catch {
          // Fallback silencioso
        }

        if (onSuccess) {
          onSuccess();
        }
      } else {
        setStatusMessage(result.message);
      }
    } catch {
      setStatusMessage("Erro ao ativar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 md:p-8 shadow-2xl shadow-indigo-950/50"
        >
          {/* Efeitos de Luz de Fundo */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Botão de Fechar */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>

          {!isSuccess ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
                  <Crown size={14} className="text-amber-400 fill-amber-400" />
                  <span>CONDIÇÃO ESPECIAL DE LANÇAMENTO</span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Desbloqueie o Synapse Pro
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Acesso imediato e ilimitado a todas as ferramentas com IA para acelerar sua aprovação.
                </p>
              </div>

              {/* Seletor de Ciclo de Cobrança */}
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCycle("ANNUAL")}
                  className={`relative p-3 rounded-xl text-left transition-all cursor-pointer ${
                    cycle === "ANNUAL"
                      ? "bg-indigo-600/30 border border-indigo-500/50 shadow-sm"
                      : "hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                    -30% OFF
                  </span>
                  <div className="text-xs font-bold text-white">Plano Anual</div>
                  <div className="text-lg font-black text-indigo-300">
                    R$ 29,90
                    <span className="text-[11px] font-normal text-slate-400">/mês</span>
                  </div>
                  <div className="text-[10px] text-slate-400">R$ 358,80 faturado anualmente</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCycle("MONTHLY")}
                  className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                    cycle === "MONTHLY"
                      ? "bg-indigo-600/30 border border-indigo-500/50 shadow-sm"
                      : "hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <div className="text-xs font-bold text-white">Plano Mensal</div>
                  <div className="text-lg font-black text-white">
                    R$ 39,90
                    <span className="text-[11px] font-normal text-slate-400">/mês</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Sem fidelidade, cancele quando quiser</div>
                </button>
              </div>

              {/* Lista de Vantagens */}
              <div className="space-y-2.5 py-1">
                {[
                  "IA Ilimitada sem restrições de cotas diárias",
                  "Correções de redação discursiva ilimitadas padrão banca",
                  "Simulados inéditos com foco nas suas fraquezas cognitivas",
                  "Prioridade máxima nos servidores do Gemini 2.5",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-200">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Formulário / Ação */}
              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    WhatsApp para suporte prioritário VIP (opcional):
                  </label>
                  <input
                    type="tel"
                    value={phoneOrWhatsapp}
                    onChange={(e) => setPhoneOrWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {statusMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {statusMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-linear-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Ativando Acesso VIP...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="fill-white" />
                      <span>Ativar Acesso VIP Grátis por 7 Dias</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    Garantia de 7 Dias
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock size={12} className="text-indigo-400" />
                    Sem cobrança imediata
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap size={12} className="text-amber-400" />
                    Ativação Instantânea
                  </span>
                </div>
              </form>
            </div>
          ) : (
            <div className="py-6 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto">
                <Crown size={32} className="fill-emerald-400/20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">
                  Acesso Pro Ativado! 💎
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {statusMessage ||
                    "Você agora tem acesso ilimitado a todas as ferramentas com inteligência artificial da Synapse AI."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left space-y-2 text-xs text-slate-300">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-400" />
                  <span>O que você já pode fazer agora:</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  • Gerar simulados ilimitados em Provas & Questões.<br />
                  • Enviar redações para correção aprofundada nota máxima.<br />
                  • Criar decks e mapas mentais para qualquer edital.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Começar a Estudar Sem Limites
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
