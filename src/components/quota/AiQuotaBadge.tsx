"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ShieldCheck, X, Crown, ChevronRight, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAiQuotaStatusAction } from "@/actions/quota-actions";
import { AI_QUOTA_UPDATED_EVENT } from "@/lib/quota-events";
import type { UserQuotaStatus } from "@/types/quota";
import { RewardedAdModal } from "@/components/quota/RewardedAdModal";

interface AiQuotaBadgeProps {
  onNavigate?: () => void;
}

export function AiQuotaBadge({ onNavigate }: AiQuotaBadgeProps) {
  const pathname = usePathname();
  const [quota, setQuota] = useState<UserQuotaStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRewardedModalOpen, setIsRewardedModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);


  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchQuota = useCallback(async () => {
    try {
      const res = await getAiQuotaStatusAction();
      if (res.success && res.data) {
        setQuota(res.data);
      }
    } catch (err) {
      console.error("Erro ao sincronizar cota de IA:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Carrega inicial
  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // 2. Recarrega ao navegar entre páginas (SPA)
  useEffect(() => {
    fetchQuota();
  }, [pathname, fetchQuota]);

  // 3. Recarrega instantaneamente ao abrir o modal / popover
  useEffect(() => {
    if (isOpen) {
      fetchQuota();
    }
  }, [isOpen, fetchQuota]);

  // 4. Escuta eventos de consumo de IA, foco na janela e visibilidade da aba
  useEffect(() => {
    const handleUpdate = () => fetchQuota();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchQuota();
      }
    };

    window.addEventListener(AI_QUOTA_UPDATED_EVENT, handleUpdate);
    window.addEventListener("focus", handleUpdate);
    document.addEventListener("visibilitychange", handleVisibility);

    // 5. Polling suave a cada 15 segundos para garantir sincronia
    const interval = setInterval(fetchQuota, 15000);

    return () => {
      window.removeEventListener(AI_QUOTA_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("focus", handleUpdate);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [fetchQuota]);

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

  // Estado para Usuário Free / Básico com Cota Diária
  const percentUsed = Math.min(
    100,
    Math.round((quota.globalUsed / quota.globalLimit) * 100),
  );
  const remaining = Math.max(0, quota.globalLimit - quota.globalUsed);

  return (
    <div className="relative">
      {quota.isUnlimited ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left relative group overflow-hidden rounded-xl bg-violet-50/90 dark:bg-slate-950 dark:bg-gradient-to-r dark:from-violet-950/40 dark:via-indigo-950/40 dark:to-slate-900/60 border border-violet-300/80 dark:border-violet-500/25 hover:border-violet-400 dark:hover:border-violet-500/50 p-2.5 shadow-xs transition-all cursor-pointer"
          title="Clique para ver os limites e benefícios do Synapse Pro"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300 group-hover:scale-105 transition-transform">
                <Crown size={13} className="fill-amber-500/30 text-amber-600 dark:text-amber-300" />
              </div>
              <div>
                <span className="text-[11.5px] font-extrabold text-slate-900 dark:text-white block leading-tight">
                  Synapse Pro
                </span>
                <span className="text-[9px] font-mono font-medium text-violet-800 dark:text-violet-300 block leading-tight">
                  Acesso Ilimitado • Ver Cotas
                </span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-200 font-mono text-[8.5px] font-black uppercase tracking-wider border border-violet-300 dark:border-violet-500/30">
              PRO
            </span>
          </div>
        </button>
      ) : (
        <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-950 dark:bg-gradient-to-b dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-slate-950/80 border border-slate-200 dark:border-indigo-500/20 p-2.5 transition-all duration-300 shadow-xs">
          {/* Glow de fundo */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />

          {/* Linha Superior: Plano Gratuito + Pílula de Cota */}
          <div className="flex items-center justify-between gap-2 relative z-10">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 group/title min-w-0 text-left cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover/title:scale-105 transition-transform shadow-xs">
                <Sparkles size={12} className="text-indigo-600 dark:text-indigo-400 fill-indigo-400/20" />
              </div>
              <span className="text-[12px] font-bold text-slate-900 dark:text-slate-200 group-hover/title:text-indigo-600 dark:group-hover/title:text-white transition-colors whitespace-nowrap tracking-tight">
                Plano Gratuito
              </span>
            </button>

            {/* Botão de Cota Diária clicável com Popover */}
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              title="Ver limites detalhados da IA"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/15 hover:bg-violet-200 dark:hover:bg-violet-500/25 border border-violet-300 dark:border-violet-500/30 text-violet-800 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-all text-[9.5px] font-mono font-bold cursor-pointer shrink-0"
            >
              <Sparkles size={9} className="text-violet-600 dark:text-violet-400" />
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
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-950 rounded-full border border-slate-300/60 dark:border-white/5 p-px overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percentUsed > 80
                    ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                    : percentUsed > 50
                      ? "bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                      : "bg-gradient-to-r from-violet-600 via-indigo-500 to-amber-500 shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                }`}
                style={{ width: `${Math.max(percentUsed, 5)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[9.5px] text-slate-600 dark:text-slate-400 pt-0.5 font-medium">
              <span className="truncate group-hover/bar:text-slate-900 dark:group-hover/bar:text-slate-300 transition-colors">
                {remaining} créditos restantes
              </span>
              <Link
                href="/pricing"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.();
                }}
                className="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 font-bold transition-colors flex items-center gap-1 shrink-0 group/cta"
              >
                <Crown size={11} className="fill-amber-600/20 text-amber-600 dark:fill-amber-400/20 dark:text-amber-400 group-hover/cta:scale-110 transition-transform" />
                <span>Virar Pro</span>
                <ChevronRight size={10} />
              </Link>
            </div>
          </div>
        </div>
      )}

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
                  className={`fixed z-50 bg-white dark:bg-[#060913]/95 border border-slate-200 dark:border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col ${
                    coords
                      ? "w-[340px]"
                      : "inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto"
                  }`}
                >
                  {/* Cabeçalho */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg border ${
                          quota.isUnlimited
                            ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-400/15 dark:text-amber-300 dark:border-amber-400/30"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
                        }`}
                      >
                        {quota.isUnlimited ? (
                          <Crown size={16} className="fill-amber-500/30 text-amber-600 dark:fill-amber-400/30 dark:text-amber-300" />
                        ) : (
                          <Sparkles size={16} />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5">
                          {quota.isUnlimited
                            ? "Synapse Pro • Acesso Ilimitado"
                            : "Plano Gratuito • Cotas de IA"}
                          {quota.isUnlimited && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono font-bold border border-amber-300 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/30">
                              ATIVO
                            </span>
                          )}
                        </h4>
                        <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400 block leading-none mt-0.5">
                          {quota.isUnlimited
                            ? "Sem restrições diárias nem anúncios"
                            : "Renovação diária às 00:00 (Brasília)"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Fechar"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4 space-y-3.5">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      {quota.isUnlimited
                        ? "Comparativo de cotas do plano Básico vs. seus benefícios ilimitados do Plano Pro:"
                        : "Cotas diárias renovadas à meia-noite. Assista a um vídeo patrocinado ou assine o Synapse Pro para acesso ilimitado."}
                    </p>

                    {/* Lista de Recursos e Usos */}
                    <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 border border-slate-200 dark:border-white/5">
                      {Object.entries(quota.features).map(([key, item]) => {
                        const featureUsedPercent = Math.min(
                          100,
                          Math.round((item.used / item.limit) * 100),
                        );
                        const isReached = !quota.isUnlimited && item.used >= item.limit;

                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-800 dark:text-slate-300 font-medium flex items-center gap-1.5">
                                {item.label}
                                {!quota.isUnlimited &&
                                  Boolean(item.bonusEarned && item.bonusEarned > 0) && (
                                    <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-1 rounded">
                                      +{item.bonusEarned} bônus
                                    </span>
                                  )}
                              </span>
                              {quota.isUnlimited ? (
                                <span className="font-mono text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 dark:text-amber-300 dark:bg-amber-400/10 dark:border-amber-400/20 flex items-center gap-1">
                                  <Crown size={10} className="fill-amber-600/30 text-amber-600 dark:fill-amber-400/30 dark:text-amber-300" />
                                  ILIMITADO
                                </span>
                              ) : (
                                <span
                                  className={`font-mono text-[10px] font-bold ${
                                    isReached ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"
                                  }`}
                                >
                                  {item.used}/{item.limit}
                                </span>
                              )}
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  quota.isUnlimited
                                    ? "bg-gradient-to-r from-violet-600 to-amber-500"
                                    : isReached
                                      ? "bg-rose-500"
                                      : featureUsedPercent > 50
                                        ? "bg-amber-500"
                                        : "bg-indigo-600"
                                }`}
                                style={{
                                  width: quota.isUnlimited
                                    ? "100%"
                                    : `${Math.max(featureUsedPercent, 3)}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Geral de Hoje */}
                    <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-[11px]">
                      <span className="text-indigo-900 dark:text-indigo-300 font-semibold">
                        {quota.isUnlimited ? "Status de requisições:" : "Total consumido hoje:"}
                      </span>
                      <span className="font-mono font-bold text-indigo-950 dark:text-white">
                        {quota.isUnlimited
                          ? "Ilimitado (Sem restrições)"
                          : `${quota.globalUsed} / ${quota.globalLimit} requisições`}
                      </span>
                    </div>

                    {/* Opção de Vídeo Patrocinado para Desbloquear Bônus */}
                    {!quota.isUnlimited && quota.canWatchRewardedAd && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          setIsRewardedModalOpen(true);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer group"
                      >
                        <Gift size={14} className="text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                        <span>Assistir Vídeo (+1 Simulado Bônus)</span>
                      </button>
                    )}

                    {/* Botão de Upgrade / Premium */}
                    <Link
                      href="/pricing"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigate?.();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer group bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800"
                    >
                      <Crown
                        size={14}
                        className="text-amber-300 fill-amber-300/30 group-hover:scale-110 transition-transform"
                      />
                      <span>
                        {quota.isUnlimited
                          ? "Gerenciar Assinatura Pro"
                          : "Desbloquear Synapse Pro (Ilimitado)"}
                      </span>
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}

      <RewardedAdModal
        isOpen={isRewardedModalOpen}
        onClose={() => setIsRewardedModalOpen(false)}
        onRewardClaimed={fetchQuota}
        feature="SIMULADO"
      />
    </div>
  );
}
