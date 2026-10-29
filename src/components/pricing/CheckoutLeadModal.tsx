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
  QrCode,
  CreditCard,
} from "lucide-react";
import confetti from "canvas-confetti";
import { submitSubscriptionLeadAction } from "@/actions/subscription-actions";
import {
  createPixOrderAction,
  createPreferenceOrderAction,
} from "@/actions/mercadopago-actions";
import { PixPaymentModal } from "./PixPaymentModal";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface CheckoutLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCycle?: "MONTHLY" | "ANNUAL";
  targetTier?: "PREMIUM" | "ELITE";
  onSuccess?: (activatedTier: "PREMIUM" | "ELITE") => void;
}

export function CheckoutLeadModal({
  isOpen,
  onClose,
  defaultCycle = "ANNUAL",
  targetTier = "PREMIUM",
  onSuccess,
}: CheckoutLeadModalProps) {
  const [cycle, setCycle] = useState<"MONTHLY" | "ANNUAL">(defaultCycle);
  const [selectedTier, setSelectedTier] = useState<"PREMIUM" | "ELITE">(targetTier);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreditCardLoading, setIsCreditCardLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Estado do Modal PIX Mercado Pago
  const [pixData, setPixData] = useState<{
    isOpen: boolean;
    orderId?: string;
    qrCode?: string;
    qrCodeBase64?: string;
    amount?: number;
    expiresAt?: string;
    isSimulated?: boolean;
  }>({ isOpen: false });

  React.useEffect(() => {
    setSelectedTier(targetTier);
  }, [targetTier, isOpen]);

  const isElite = selectedTier === "ELITE";

  // Preço de exibição
  const priceDisplay = isElite
    ? cycle === "ANNUAL" ? "R$ 49,90" : "R$ 64,90"
    : cycle === "ANNUAL" ? "R$ 29,90" : "R$ 39,90";

  const totalAnnual = isElite ? "R$ 347,00/ano" : "R$ 197,00/ano";

  // ⚡ 1. Pagamento Instantâneo via PIX (Mercado Pago)
  const handlePixCheckout = async () => {
    setIsSubmitting(true);
    setStatusMessage("");
    triggerHaptic("medium");

    try {
      const res = await createPixOrderAction({
        planTier: selectedTier,
        billingCycle: cycle,
      });

      if (res.success && res.orderId) {
        setPixData({
          isOpen: true,
          orderId: res.orderId,
          qrCode: res.qrCode,
          qrCodeBase64: res.qrCodeBase64,
          amount: res.amount,
          expiresAt: res.expiresAt,
          isSimulated: res.isSimulated,
        });
      } else {
        setStatusMessage(res.error || "Não foi possível gerar o PIX no momento.");
        triggerHaptic("warning");
      }
    } catch (err) {
      console.error("Erro no checkout PIX:", err);
      setStatusMessage("Erro de conexão ao gerar PIX.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 💳 2. Pagamento via Cartão de Crédito em até 12x (Mercado Pago Checkout Pro)
  const handleCreditCardCheckout = async () => {
    setIsCreditCardLoading(true);
    setStatusMessage("");
    triggerHaptic("medium");

    try {
      const res = await createPreferenceOrderAction({
        planTier: selectedTier,
        billingCycle: cycle,
      });

      if (res.success && res.initPoint) {
        window.location.href = res.initPoint;
      } else {
        setStatusMessage(res.error || "Não foi possível abrir o checkout de cartão.");
        triggerHaptic("warning");
      }
    } catch (err) {
      console.error("Erro no checkout Cartão:", err);
      setStatusMessage("Erro ao conectar com o Mercado Pago.");
    } finally {
      setIsCreditCardLoading(false);
    }
  };

  // 🎁 3. Ativar Demonstração / 7 Dias Grátis
  const handleDemoActivation = async () => {
    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const result = await submitSubscriptionLeadAction({
        plan: isElite ? "Synapse Elite 👑" : "Synapse Concurseiro Pro",
        targetTier: selectedTier,
        billingCycle: cycle,
      });

      if (result.success) {
        triggerHaptic("heavy");
        setIsSuccess(true);
        setStatusMessage(result.message);

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: isElite
              ? ["#f59e0b", "#ea580c", "#fbbf24", "#10b981"]
              : ["#6366f1", "#a855f7", "#ec4899", "#10b981"],
          });
        } catch {}

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("plan-updated"));
        }

        if (onSuccess) {
          onSuccess(selectedTier);
        }
      }
    } catch {
      setStatusMessage("Erro ao ativar período.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden"
          >
            {/* Fechar */}
            <button
              onClick={onClose}
              type="button"
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {!isSuccess ? (
              <div className="space-y-5">
                {/* Cabeçalho */}
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles size={13} />
                    <span>Acesso Imediato ao Ecossistema Synapse</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Finalizar Assinatura</span>
                    {isElite ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
                        ELITE 👑
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-black">
                        PRO 💎
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Escolha seu plano e o método de pagamento de sua preferência:
                  </p>
                </div>

                {/* Seletor Pro vs Elite */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedTier("PREMIUM")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      !isElite
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    💎 Synapse Pro
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTier("ELITE")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isElite
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    👑 Synapse Elite
                  </button>
                </div>

                {/* Seletor de Ciclo de Cobrança */}
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCycle("ANNUAL")}
                    className={`relative p-3 rounded-xl text-left transition-all cursor-pointer ${
                      cycle === "ANNUAL"
                        ? "bg-white dark:bg-indigo-600/30 border border-indigo-500 shadow-sm"
                        : "hover:bg-slate-200/60 dark:hover:bg-slate-800/40 border border-transparent"
                    }`}
                  >
                    <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-400/40 dark:text-emerald-300 text-[10px] font-bold">
                      MELHOR VALOR 🚀
                    </span>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Plano Anual</div>
                    <div className="text-lg font-black text-indigo-600 dark:text-indigo-300">
                      {priceDisplay}
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">/mês</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {totalAnnual} (Economia máxima)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCycle("MONTHLY")}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                      cycle === "MONTHLY"
                        ? "bg-white dark:bg-indigo-600/30 border border-indigo-500 shadow-sm"
                        : "hover:bg-slate-200/60 dark:hover:bg-slate-800/40 border border-transparent"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Plano Mensal</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      {isElite ? "R$ 49,90" : "R$ 29,90"}
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">/mês</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Sem fidelidade, renove quando quiser</div>
                  </button>
                </div>

                {statusMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                    {statusMessage}
                  </div>
                )}

                {/* Opções de Pagamento Mercado Pago */}
                <div className="space-y-3 pt-1">
                  {/* Botão Principal: PIX Instantâneo */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handlePixCheckout}
                    className="w-full py-4 px-5 bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/25 flex items-center justify-between transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <QrCode size={18} className="text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-black flex items-center gap-1.5">
                          <span>Pagar com PIX</span>
                          <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-1.5 py-0.2 rounded-md">
                            IMEDIATO
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-100 font-medium">
                          Aprovação em 2 segundos • QR Code e Copia e Cola
                        </div>
                      </div>
                    </div>
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <ArrowRight size={18} />
                    )}
                  </button>

                  {/* Botão Secundário: Cartão de Crédito em até 12x */}
                  <button
                    type="button"
                    disabled={isCreditCardLoading}
                    onClick={handleCreditCardCheckout}
                    className="w-full py-3.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-700 flex items-center justify-between transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={18} className="text-indigo-600 dark:text-indigo-400" />
                      <div className="text-left">
                        <div className="font-bold">Cartão de Crédito (até 12x)</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Checkout seguro no Mercado Pago
                        </div>
                      </div>
                    </div>
                    {isCreditCardLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                  </button>
                </div>

                {/* Opção discreta de ativação demonstração/teste */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleDemoActivation}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline transition-colors cursor-pointer"
                  >
                    Ou ativar período de teste gratuito de 7 dias ➔
                  </button>
                </div>

                {/* Selos de Segurança */}
                <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 pt-2 font-medium">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                    Garantia de 7 Dias
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock size={12} className="text-indigo-600 dark:text-indigo-400" />
                    Mercado Pago Protegido
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap size={12} className="text-amber-500 dark:text-amber-400" />
                    Liberação Imediata
                  </span>
                </div>
              </div>
            ) : (
              /* Sucesso */
              <div className="py-6 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-400/40 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-300">
                  <Crown size={32} className="fill-emerald-600/20 dark:fill-emerald-400/20" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    {isElite ? "Synapse Elite Ativado! 👑" : "Acesso Pro Ativado! 💎"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                    {statusMessage ||
                      "Você agora tem acesso à alta franquia diária de IA e simulados completos."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  Continuar para Meus Estudos ➔
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Modal PIX com QR Code dinâmico do Mercado Pago */}
      <PixPaymentModal
        isOpen={pixData.isOpen}
        onClose={() => setPixData({ isOpen: false })}
        orderId={pixData.orderId}
        qrCode={pixData.qrCode}
        qrCodeBase64={pixData.qrCodeBase64}
        amount={pixData.amount}
        planTitle={isElite ? "Synapse Concurseiro Elite" : "Synapse Concurseiro Pro"}
        expiresAt={pixData.expiresAt}
        isSimulated={pixData.isSimulated}
        onPaymentApproved={() => {
          if (onSuccess) onSuccess(selectedTier);
        }}
      />
    </>
  );
}
