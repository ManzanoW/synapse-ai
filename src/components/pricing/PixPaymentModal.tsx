"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  QrCode,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { checkOrderStatusAction } from "@/actions/mercadopago-actions";

export interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string | null;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  amount?: number;
  planTitle?: string;
  expiresAt?: string | null;
  isSimulated?: boolean;
  onPaymentApproved?: () => void;
}

export function PixPaymentModal({
  isOpen,
  onClose,
  orderId,
  qrCode,
  qrCodeBase64,
  amount,
  planTitle = "Synapse Concurseiro Pro",
  expiresAt,
  isSimulated,
  onPaymentApproved,
}: PixPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(1800); // 30 min padrão

  // Temporizador de expiração regressiva
  useEffect(() => {
    if (!isOpen || isApproved) return;

    if (expiresAt) {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeftSeconds(remaining);
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, expiresAt, isApproved]);

  // Polling automático a cada 3 segundos para detectar a aprovação do Pix
  useEffect(() => {
    if (!isOpen || !orderId || isApproved) return;

    const interval = setInterval(async () => {
      try {
        const res = await checkOrderStatusAction(orderId);
        if (res.isApproved) {
          setIsApproved(true);
          triggerHaptic("heavy");
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#10b981", "#6366f1", "#a855f7", "#f59e0b"],
            });
          } catch {}
          if (onPaymentApproved) onPaymentApproved();
        }
      } catch (err) {
        // Polling silencioso
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, orderId, isApproved, onPaymentApproved]);

  const handleCopy = async () => {
    if (!qrCode) return;
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      triggerHaptic("success");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* Luz de fundo decorativa */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Botão de Fechar */}
          <button
            onClick={onClose}
            type="button"
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>

          {!isApproved ? (
            <div className="space-y-5 text-center">
              {/* Header */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={13} />
                <span>Pagamento Instantâneo via PIX</span>
              </div>

              <div>
                <h3 className="text-xl font-black text-white">{planTitle}</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Abra o app do seu banco e escaneie o código ou copie a chave abaixo:
                </p>
                {amount && (
                  <div className="mt-2 text-2xl font-black text-emerald-400">
                    R$ {amount.toFixed(2).replace(".", ",")}
                  </div>
                )}
              </div>

              {/* QR Code Container */}
              <div className="relative mx-auto w-48 h-48 bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center border border-slate-700">
                {qrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${qrCodeBase64}`}
                    alt="QR Code Pix Mercado Pago"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-800 gap-2">
                    <QrCode size={64} className="text-slate-700" />
                    <span className="text-[10px] font-bold text-slate-500">QR Code Pix</span>
                  </div>
                )}
              </div>

              {/* Cronômetro de expiração */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-xl mx-auto w-fit">
                <Clock size={13} />
                <span>Expira em: {formattedTime}</span>
              </div>

              {/* Campo Pix Copia e Cola */}
              {qrCode && (
                <div className="space-y-2 text-left">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Pix Copia e Cola:
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2 focus-within:border-indigo-500">
                    <input
                      type="text"
                      readOnly
                      value={qrCode}
                      className="flex-1 bg-transparent text-xs text-slate-300 font-mono outline-hidden select-all"
                    />
                    <button
                      onClick={handleCopy}
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        copied
                          ? "bg-emerald-500 text-slate-950 font-black"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      }`}
                    >
                      {copied ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                      <span>{copied ? "Copiado!" : "Copiar"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status indicador com Loader */}
              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                <Loader2 size={14} className="animate-spin text-indigo-400" />
                <span>Aguardando confirmação do banco...</span>
              </div>

              {isSimulated && (
                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[11px]">
                  💡 <strong>Modo Demonstração:</strong> Como a chave de produção do Mercado Pago ainda não foi inserida no ambiente, este pedido é gerado em modo seguro de teste.
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>Processado com segurança pelo Mercado Pago</span>
              </div>
            </div>
          ) : (
            /* Tela de Sucesso após aprovação */
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                <CheckCircle2 size={36} className="stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">Pagamento Confirmado! 🎉</h3>
                <p className="text-slate-300 text-sm mt-1.5">
                  Seu plano <strong>{planTitle}</strong> foi ativado com sucesso no seu perfil!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs text-left space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <Sparkles size={14} />
                  <span>Benefícios Liberados Imediatamente:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                  <li>Simulados de 60 questões e Dificuldade Extrema</li>
                  <li>Aulas com Áudio Neural sem limites</li>
                  <li>Caderno de Erros com Remediação IA</li>
                  <li>Repetição Espaçada FSRS Ativa</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  onClose();
                  if (typeof window !== "undefined") {
                    window.location.href = "/dashboard";
                  }
                }}
                type="button"
                className="w-full py-3.5 px-6 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                Ir para o Dashboard de Estudos ➔
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
