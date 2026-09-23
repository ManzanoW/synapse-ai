"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Sparkles, ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAiQuotaStatusAction } from "@/actions/quota-actions";
import type { UserQuotaStatus } from "@/types/quota";

export function AiQuotaBadge() {
  const [quota, setQuota] = useState<UserQuotaStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    getAiQuotaStatusAction().then((res) => {
      if (isMounted && res.success && res.data) {
        setQuota(res.data);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverHeight = 440;
      let top = rect.bottom - popoverHeight;
      if (top < 16) top = 16;
      if (top + popoverHeight > window.innerHeight - 16) {
        top = window.innerHeight - popoverHeight - 16;
      }
      setCoords({
        top,
        left: rect.right + 12,
      });
    } else {
      setCoords(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleResizeOrScroll = () => updatePosition();
      window.addEventListener("resize", handleResizeOrScroll);
      window.addEventListener("scroll", handleResizeOrScroll, true);
      return () => {
        window.removeEventListener("resize", handleResizeOrScroll);
        window.removeEventListener("scroll", handleResizeOrScroll, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (loading || !quota) return null;

  if (quota.isUnlimited) {
    return (
      <div className="px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5 text-violet-300 font-bold">
          <Sparkles size={11} className="text-violet-400" />
          <span>IA Synapse: Ilimitada</span>
        </div>
        <span className="px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-200 font-mono text-[9px] font-black uppercase">
          {quota.role === "ADMIN" ? "ADMIN" : "PRO"}
        </span>
      </div>
    );
  }

  const percentUsed = Math.min(
    100,
    Math.round((quota.globalUsed / quota.globalLimit) * 100),
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-violet-500/30 transition-all text-left group cursor-pointer"
        title="Clique para ver detalhes das cotas diárias de teste"
      >
        <div className="flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold group-hover:text-violet-300 transition-colors">
            <Sparkles size={11} className="text-violet-400" />
            <span>Cota Diária de IA</span>
          </span>
          <span className="font-mono text-slate-400 text-[10px] font-bold">
            {quota.globalUsed}/{quota.globalLimit}
          </span>
        </div>

        {/* Barra de progresso sutil */}
        <div className="h-1 w-full bg-slate-950 rounded-full mt-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentUsed > 80
                ? "bg-rose-500"
                : percentUsed > 50
                  ? "bg-amber-400"
                  : "bg-violet-500"
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </button>

      {/* Popover / Modal renderizado via Portal fora do container de scroll */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop escuro para fechar ao clicar fora */}
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in duration-150"
                  onClick={() => setIsOpen(false)}
                />

                {/* Card Flutuante Responsivo */}
                <motion.div
                  ref={popoverRef}
                  initial={{
                    opacity: 0,
                    scale: 0.96,
                    x: coords ? -8 : 0,
                    y: coords ? 0 : 8,
                  }}
                  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.96,
                    x: coords ? -8 : 0,
                    y: coords ? 0 : 8,
                  }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  style={
                    coords
                      ? { top: `${coords.top}px`, left: `${coords.left}px` }
                      : undefined
                  }
                  className={`fixed z-50 bg-[#060913]/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col ${
                    coords
                      ? "w-[340px]"
                      : "inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto"
                  }`}
                >
                  {/* Cabeçalho */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/50 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white tracking-wide">
                          Cotas de Teste da IA
                        </h4>
                        <span className="text-[9px] font-mono text-slate-400 block leading-none mt-0.5">
                          Renovação diária às 00:00 (Brasília)
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Fechar"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4 space-y-3.5">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Limites diários para o período de testes e garantia de estabilidade da plataforma.
                    </p>

                    {/* Lista de Recursos e Usos */}
                    <div className="space-y-2 rounded-xl bg-slate-950/60 p-2.5 border border-white/5">
                      {Object.entries(quota.features).map(([key, item]) => {
                        const featureUsedPercent = Math.min(
                          100,
                          Math.round((item.used / item.limit) * 100),
                        );
                        const isReached = item.used >= item.limit;

                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300 font-medium">
                                {item.label}
                              </span>
                              <span
                                className={`font-mono text-[10px] font-bold ${
                                  isReached ? "text-rose-400" : "text-slate-400"
                                }`}
                              >
                                {item.used}/{item.limit}
                              </span>
                            </div>
                            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isReached
                                    ? "bg-rose-500"
                                    : featureUsedPercent > 50
                                      ? "bg-amber-400"
                                      : "bg-indigo-500"
                                }`}
                                style={{
                                  width: `${Math.max(featureUsedPercent, 3)}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Geral de Hoje */}
                    <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px]">
                      <span className="text-indigo-300 font-medium">
                        Total consumido hoje:
                      </span>
                      <span className="font-mono font-bold text-white">
                        {quota.globalUsed} / {quota.globalLimit} requisições
                      </span>
                    </div>

                    {/* Botão de Upgrade / Premium */}
                    <Link
                      href="/pricing"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-950/60 transition-all cursor-pointer group"
                    >
                      <Sparkles
                        size={14}
                        className="text-amber-300 fill-amber-300 group-hover:scale-110 transition-transform"
                      />
                      <span>Ver Vantagens do Premium</span>
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
