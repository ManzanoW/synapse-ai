"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Sparkles, ShieldCheck, X, Crown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAiQuotaStatusAction } from "@/actions/quota-actions";
import type { UserQuotaStatus } from "@/types/quota";

interface AiQuotaBadgeProps {
  onNavigate?: () => void;
}

export function AiQuotaBadge({ onNavigate }: AiQuotaBadgeProps) {
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

  // Estado para Usuário PRO / Ilimitado
  if (quota.isUnlimited) {
    return (
      <div className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-violet-950/40 via-indigo-950/40 to-slate-900/60 border border-violet-500/25 p-2.5 shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Crown size={13} className="fill-amber-400/30 text-amber-300" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-white block leading-tight">
                Synapse Pro
              </span>
              <span className="text-[9px] font-mono text-violet-300 block leading-tight">
                Acesso Ilimitado
              </span>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-200 font-mono text-[8.5px] font-black uppercase tracking-wider border border-violet-500/30">
            PRO
          </span>
        </div>
      </div>
    );
  }

  // Estado para Usuário Free / Básico com Cota Diária
  const percentUsed = Math.min(
    100,
    Math.round((quota.globalUsed / quota.globalLimit) * 100),
  );
  const remaining = Math.max(0, quota.globalLimit - quota.globalUsed);

  return (
    <div className="relative">
      <div className="group relative overflow-hidden rounded-xl bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-slate-950/80 border border-indigo-500/20 hover:border-indigo-500/40 p-2.5 transition-all duration-300 shadow-md hover:shadow-indigo-950/40">
        {/* Glow de fundo */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />

        {/* Linha Superior: Título Synapse Pro com link para pricing + Botão da cota */}
        <div className="flex items-center justify-between relative z-10">
          <Link
            href="/pricing"
            onClick={onNavigate}
            className="flex items-center gap-2 group/title"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover/title:scale-105 transition-transform">
              <Crown size={13} className="text-amber-400 fill-amber-400/20" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-white group-hover/title:text-amber-200 transition-colors tracking-wide">
                Synapse Pro
              </span>
              <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                UPGRADE
              </span>
            </div>
          </Link>

          {/* Botão de Cota Diária clicável com Popover */}
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            title="Ver limites detalhados da IA"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-[9.5px] font-mono font-bold cursor-pointer"
          >
            <Sparkles size={10} className="text-violet-400" />
            <span>
              {quota.globalUsed}/{quota.globalLimit}
            </span>
          </button>
        </div>

        {/* Barra de Progresso do Consumo Diário */}
        <div
          onClick={() => setIsOpen(true)}
          className="mt-2 space-y-1 cursor-pointer group/bar"
          title="Clique para ver o detalhamento do consumo"
        >
          <div className="h-1.5 w-full bg-slate-950 rounded-full border border-white/5 p-px overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed > 80
                  ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                  : percentUsed > 50
                    ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                    : "bg-gradient-to-r from-violet-500 to-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]"
              }`}
              style={{ width: `${Math.max(percentUsed, 5)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
            <span className="group-hover/bar:text-slate-300 transition-colors">
              {remaining} créditos restantes hoje
            </span>
            <Link
              href="/pricing"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.();
              }}
              className="text-amber-300 font-bold hover:text-amber-200 transition-colors flex items-center gap-0.5"
            >
              Ilimitado <ChevronRight size={10} />
            </Link>
          </div>
        </div>
      </div>

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
                      onClick={() => {
                        setIsOpen(false);
                        onNavigate?.();
                      }}
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
