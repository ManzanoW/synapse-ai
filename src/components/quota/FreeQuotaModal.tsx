"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  BatteryCharging,
  Crown,
  X,
  ShieldCheck,
} from "lucide-react";
import { RewardedAdModal } from "@/components/quota/RewardedAdModal";
import { triggerAiQuotaRefresh } from "@/lib/quota-events";
import { getAiQuotaStatusAction } from "@/actions/quota-actions";
import type { UserQuotaStatus, AiFeatureType } from "@/types/quota";

export interface FreeQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  quota?: UserQuotaStatus | null;
  onRewardClaimed?: () => void;
  feature?: AiFeatureType;
  contextMessage?: string;
}

export function FreeQuotaModal({
  isOpen,
  onClose,
  quota: initialQuota,
  onRewardClaimed,
  feature = "SIMULADO",
  contextMessage,
}: FreeQuotaModalProps) {
  const [mounted, setMounted] = useState(false);
  const [quota, setQuota] = useState<UserQuotaStatus | null>(initialQuota || null);
  const [isRewardedAdOpen, setIsRewardedAdOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialQuota) {
      setQuota(initialQuota);
    }
  }, [initialQuota]);

  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;
    getAiQuotaStatusAction()
      .then((res) => {
        if (!isCurrent) return;
        if (res.success && res.data) {
          setQuota(res.data);
        }
      })
      .catch((err) => {
        console.warn("[FreeQuotaModal] Erro ao sincronizar cota:", err);
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const maxEnergy = 10;
  const usedEnergy = quota?.globalUsed ?? 0;
  const remainingEnergy = Math.max(0, maxEnergy - usedEnergy);
  const percentEnergy = Math.min(
    100,
    Math.round((remainingEnergy / maxEnergy) * 100),
  );

  return createPortal(
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-28 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-[#060913]/95 border border-cyan-500/25 dark:border-white/10 rounded-3xl p-5 sm:p-6 max-w-md w-full relative overflow-hidden shadow-2xl shadow-indigo-950/60 backdrop-blur-2xl text-center space-y-4"
          >
            {/* Botão Fechar */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-20"
              title="Fechar"
            >
              <X size={16} />
            </button>

            {/* Cabeçalho */}
            <div className="flex flex-col items-center gap-2 pt-1 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-violet-500/10 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                  Plano Básico • Energia Sináptica
                </h2>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Renovação diária automática à meia-noite (Horário de Brasília).
                </p>
              </div>
            </div>

            {/* Mensagem Educativa */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900/40 border border-cyan-500/25 text-left relative z-10">
              <p className="text-xs text-cyan-200/90 leading-relaxed font-normal">
                O estudo de alto rendimento exige pausas estratégicas. Conclua seus blocos diários de foco ou recarregue energia assistindo a um vídeo curto de apoio.
              </p>
            </div>

            {/* Card de Energia */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border border-white/10 space-y-2.5 text-left relative z-10">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <BatteryCharging size={14} className="text-cyan-400" />
                  </div>
                  <span>Energia Restante:</span>
                </span>
                <span className="font-mono font-bold text-sm text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-200">
                  {remainingEnergy} / 10 Sinapses
                </span>
              </div>

              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(percentEnergy, 4)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Consumo Inteligente</span>
                <span className="text-cyan-400">{percentEnergy}% Carga Disponível</span>
              </div>
            </div>

            {/* Recursos Principais */}
            <div className="space-y-1.5 rounded-2xl bg-slate-900/60 p-3 border border-white/5 text-left relative z-10">
              {[
                {
                  title: "Simulados Inéditos com IA",
                  desc: "1 por dia (2 sinapses)",
                  status: `${quota?.features?.SIMULADO?.used ?? 0}/1`,
                  isFree: false,
                },
                {
                  title: "Remediações no Caderno de Erros",
                  desc: "Até 3 por dia (1 sinapse cada)",
                  status: `${quota?.features?.REMEDIATION?.used ?? 0}/3`,
                  isFree: false,
                },
                {
                  title: "Redação Discursiva",
                  desc: "1 correção semanal (Degustação oficial)",
                  status: `${quota?.features?.ESSAY?.used ?? 0}/1`,
                  isFree: false,
                },
                {
                  title: "Flashcards em Áudio Hands-Free",
                  desc: "15 minutos diários de áudio",
                  status: "15 min",
                  isFree: false,
                },
                {
                  title: "Revisão FSRS & Edital Verticalizado",
                  desc: "Livre (Sem consumo de energia)",
                  status: "Livre",
                  isFree: true,
                },
              ].map((resource, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[11px] py-1.5 border-b border-white/5 last:border-b-0"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-slate-200 font-semibold block truncate">
                      {resource.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      {resource.desc}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                      resource.isFree
                        ? "text-cyan-300 bg-cyan-500/10 border border-cyan-500/25"
                        : "text-slate-300 bg-slate-800/80 border border-white/10"
                    }`}
                  >
                    {resource.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Mensagem de Contexto Opcional (Ex: preservação de rascunho de redação) */}
            {contextMessage && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-left relative z-10">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                <p className="text-[11px] text-emerald-300 font-medium leading-tight">
                  {contextMessage}
                </p>
              </div>
            )}

            {/* Botões de Ação Positivos */}
            <div className="space-y-2 pt-1 relative z-10">
              {/* Botão Secundário Glow: ⚡ Recarregar +1 Sinapse (Vídeo Curto) */}
              <button
                type="button"
                onClick={() => setIsRewardedAdOpen(true)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 hover:from-amber-500/25 hover:to-amber-400/25 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-[0_0_20px_rgba(251,191,36,0.15)] hover:shadow-[0_0_25px_rgba(251,191,36,0.3)] active:scale-98"
              >
                <Zap size={14} className="text-amber-400 fill-amber-400/30 group-hover:scale-110 transition-transform" />
                <span>⚡ Recarregar +1 Sinapse (Vídeo Curto)</span>
              </button>

              {/* Botão Primário Pro: 👑 Acelerar com Synapse Pro (60 Sinapses/dia + Zero Espera) */}
              <Link
                href="/pricing"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/60 transition-all cursor-pointer group bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 border border-violet-400/30 hover:border-violet-300/50 active:scale-98"
              >
                <Crown
                  size={15}
                  className="text-amber-300 fill-amber-300/30 group-hover:scale-110 transition-transform"
                />
                <span>👑 Acelerar com Synapse Pro (60 Sinapses/dia + Zero Espera)</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      <RewardedAdModal
        isOpen={isRewardedAdOpen}
        onClose={() => setIsRewardedAdOpen(false)}
        onRewardClaimed={() => {
          triggerAiQuotaRefresh();
          setIsRewardedAdOpen(false);
          if (onRewardClaimed) {
            onRewardClaimed();
          }
          onClose();
        }}
        feature={feature}
      />
    </>,
    document.body,
  );
}
