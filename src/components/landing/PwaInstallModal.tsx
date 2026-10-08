"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  X,
  Share,
  PlusSquare,
  Zap,
  CheckCircle2,
  Download,
  Headphones,
  ShieldCheck,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { playUiSound } from "@/lib/sensory/audio-feedback";

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PwaInstallModal({ isOpen, onClose }: PwaInstallModalProps) {
  const [deviceTab, setDeviceTab] = useState<"ios" | "android">("ios");

  if (!isOpen) return null;

  const handleTabChange = (tab: "ios" | "android") => {
    setDeviceTab(tab);
    triggerHaptic("light");
    playUiSound("switch");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-3xl bg-[#070b14] border border-cyan-500/35 p-6 sm:p-8 shadow-2xl shadow-cyan-950/50 z-10 space-y-6 overflow-hidden"
        >
          {/* Top ambient glow */}
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 p-0.5 shadow-md">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Instalar Synapse no Celular</h3>
                <span className="text-[11px] font-mono text-cyan-300">Modo App Nativo • Zero Download</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08] transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Device Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/10">
            <button
              type="button"
              onClick={() => handleTabChange("ios")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                deviceTab === "ios"
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🍎 iPhone (iOS)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("android")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                deviceTab === "android"
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🤖 Android</span>
            </button>
          </div>

          {/* Instructions Step-by-Step */}
          <div className="space-y-4">
            {deviceTab === "ios" ? (
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono font-bold shrink-0">
                    1
                  </div>
                  <div className="text-slate-200">
                    Abra o <strong>Safari</strong> e toque no botão de <strong>Compartilhar</strong> (o ícone de quadrado com seta para cima no rodapé).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono font-bold shrink-0">
                    2
                  </div>
                  <div className="text-slate-200">
                    Role as opções para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono font-bold shrink-0">
                    3
                  </div>
                  <div className="text-slate-200">
                    Pronto! O ícone do <strong>Synapse AI</strong> aparecerá na tela inicial com suporte a <strong>áudio em segundo plano com a tela bloqueada</strong> no bolso.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono font-bold shrink-0">
                    1
                  </div>
                  <div className="text-slate-200">
                    No <strong>Google Chrome</strong>, toque nos <strong>3 pontinhos</strong> no canto superior direito.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono font-bold shrink-0">
                    2
                  </div>
                  <div className="text-slate-200">
                    Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono font-bold shrink-0">
                    3
                  </div>
                  <div className="text-slate-200">
                    O app será instalado instantaneamente consumindo menos de 4MB, com navegação em tela cheia e atalhos rápidos.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vantagens do App */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Funciona com tela bloqueada no bolso via Bluetooth</span>
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>

          {/* Botão de Fechar */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 transition-colors cursor-pointer"
          >
            Entendido, vou adicionar
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
