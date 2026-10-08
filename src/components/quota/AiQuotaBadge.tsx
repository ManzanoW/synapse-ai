"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, BatteryCharging, ShieldCheck, X, Crown, ChevronRight, Gift } from "lucide-react";
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

  // Estado para Usuário Free / Básico com Energia Sináptica (10 Sinapses Diárias)
  const maxEnergy = 10;
  const remainingEnergy = Math.max(0, maxEnergy - quota.globalUsed);
  const percentEnergy = Math.min(
    100,
    Math.round((remainingEnergy / maxEnergy) * 100),
  );

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
                  Alta Capacidade • Ver Cotas
                </span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono text-[8.5px] font-black uppercase tracking-wider border border-amber-300 dark:border-amber-500/30">
              PRO
            </span>
          </div>
        </button>
      ) : (
        <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-950 dark:bg-gradient-to-b dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-slate-950/80 border border-slate-200 dark:border-indigo-500/20 p-2.5 transition-all duration-300 shadow-xs">
          {/* Glow de fundo */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500" />

          {/* Linha Superior: Energia Sináptica + Pílula */}
          <div className="flex items-center justify-between gap-2 relative z-10">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 group/title min-w-0 text-left cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0 group-hover/title:scale-105 transition-transform shadow-xs">
                <Zap size={12} className="text-cyan-600 dark:text-cyan-400 fill-cyan-400/20" />
              </div>
              <span className="text-[12px] font-bold text-slate-900 dark:text-slate-200 group-hover/title:text-cyan-600 dark:group-hover/title:text-cyan-300 transition-colors whitespace-nowrap tracking-tight">
                Energia Sináptica
              </span>
            </button>

            {/* Botão de Energia Diária clicável com Popover */}
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              title="Ver detalhes da Energia Sináptica"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-white transition-all text-[9.5px] font-mono font-bold cursor-pointer shrink-0"
            >
              <Zap size={9} className="text-cyan-600 dark:text-cyan-400 fill-cyan-400/30" />
              <span>
                {remainingEnergy}/10
              </span>
            </button>
          </div>

          {/* Barra de Progresso da Energia Diária */}
          <div
            onClick={() => setIsOpen(true)}
            className="mt-2 space-y-1 cursor-pointer group/bar"
            title="Clique para ver o detalhamento de energia"
          >
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-950 rounded-full border border-slate-300/60 dark:border-white/5 p-px overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                style={{ width: `${Math.max(percentEnergy, 4)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[9.5px] text-slate-600 dark:text-slate-400 pt-0.5 font-medium">
              <span className="truncate group-hover/bar:text-slate-900 dark:group-hover/bar:text-slate-300 transition-colors">
                {remainingEnergy} Sinapses restantes hoje
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
                <span>Acelerar</span>
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
                            : "bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"
                        }`}
                      >
                        {quota.isUnlimited ? (
                          <Crown size={16} className="fill-amber-500/30 text-amber-600 dark:fill-amber-400/30 dark:text-amber-300" />
                        ) : (
                          <Zap size={16} className="text-cyan-500 dark:text-cyan-400 fill-cyan-400/30" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5">
                          {quota.isUnlimited
                            ? "Synapse Pro • Alta Capacidade"
                            : "Plano Básico • Energia Sináptica"}
                          {quota.isUnlimited && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono font-bold border border-amber-300 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/30">
                              ATIVO
                            </span>
                          )}
                        </h4>
                        <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400 block leading-none mt-0.5">
                          {quota.isUnlimited
                            ? "Alta franquia diária para estudos intensivos e zero anúncios"
                            : "Renovação diária automática à meia-noite (Horário de Brasília)."}
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
                    {/* Mensagem Educativa ou Intro Pro */}
                    {quota.isUnlimited ? (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                        Comparativo de cotas e franquia de alta capacidade do Synapse Pro:
                      </p>
                    ) : (
                      <p className="text-[11px] text-cyan-900/90 dark:text-cyan-200/90 leading-relaxed font-normal bg-cyan-500/10 dark:bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-500/20">
                        O estudo de alto rendimento exige pausas estratégicas. Conclua seus blocos diários de foco ou recarregue energia assistindo a um vídeo curto de apoio.
                      </p>
                    )}

                    {/* Card de Energia (Plano Básico: 10 Sinapses Diárias) */}
                    {!quota.isUnlimited && (
                      <div className="p-3 rounded-xl bg-slate-900/90 dark:bg-slate-950 border border-slate-700/60 dark:border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1.5 text-slate-200">
                            <BatteryCharging size={14} className="text-cyan-400" />
                            Energia Restante:
                          </span>
                          <span className="font-mono font-bold text-cyan-300 dark:text-cyan-400">
                            {remainingEnergy} / 10 Sinapses
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max((remainingEnergy / 10) * 100, 4)}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Recursos Principais */}
                    {quota.isUnlimited ? (
                      <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 border border-slate-200 dark:border-white/5">
                        {Object.entries(quota.features).map(([key, item]) => {
                          const getProLimitBadge = () => {
                            switch (key) {
                              case "SIMULADO":
                                return "Até 5 / dia";
                              case "ESSAY":
                                return "Até 3 / dia";
                              case "FLASHCARD":
                                return "Sem limite";
                              case "MINDMAP":
                                return "Até 5 / dia";
                              case "REMEDIATION":
                                return "Até 30 / dia";
                              case "EDITAL":
                                return "Sem limite";
                              case "OCR_ESSAY":
                                return "Até 2 / dia";
                              case "OCR_QUESTION":
                                return "Até 10 / dia";
                              default:
                                return item.limit > 1000 ? "Sem limite" : `Até ${item.limit} / dia`;
                            }
                          };

                          return (
                            <div key={key} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-800 dark:text-slate-300 font-medium flex items-center gap-1.5">
                                  {item.label}
                                </span>
                                <span className="font-mono text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 dark:text-amber-300 dark:bg-amber-400/10 dark:border-amber-400/20 flex items-center gap-1">
                                  <Crown size={10} className="fill-amber-600/30 text-amber-600 dark:fill-amber-400/30 dark:text-amber-300" />
                                  {getProLimitBadge()}
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-amber-500"
                                  style={{ width: "100%" }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 border border-slate-200 dark:border-white/5">
                        {[
                          {
                            title: "Simulados Inéditos com IA",
                            desc: "1 por dia (2 sinapses)",
                            status: `${quota.features.SIMULADO?.used ?? 0}/1`,
                            isFree: false,
                          },
                          {
                            title: "Remediações no Caderno de Erros",
                            desc: "Até 3 por dia (1 sinapse cada)",
                            status: `${quota.features.REMEDIATION?.used ?? 0}/3`,
                            isFree: false,
                          },
                          {
                            title: "Redação Discursiva",
                            desc: "1 correção semanal (Degustação oficial)",
                            status: `${quota.features.ESSAY?.used ?? 0}/1`,
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
                            className="flex items-center justify-between text-[11px] py-1.5 border-b border-slate-200/60 dark:border-white/5 last:border-b-0"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-slate-800 dark:text-slate-200 font-semibold block truncate">
                                {resource.title}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                                {resource.desc}
                              </span>
                            </div>
                            <span
                              className={`font-mono text-[9.5px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                resource.isFree
                                  ? "text-cyan-700 bg-cyan-50 border border-cyan-200 dark:text-cyan-300 dark:bg-cyan-500/10 dark:border-cyan-500/20"
                                  : "text-slate-700 bg-slate-100 border border-slate-200 dark:text-slate-300 dark:bg-slate-800/60 dark:border-white/10"
                              }`}
                            >
                              {resource.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Total Geral de Hoje (apenas Pro) */}
                    {quota.isUnlimited && (
                      <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 dark:bg-slate-950 border border-slate-700/60 dark:border-white/10 text-[11px] text-slate-200">
                        <span className="font-medium text-slate-300">
                          Status de requisições:
                        </span>
                        <span className="font-mono font-bold text-amber-300 dark:text-amber-400">
                          Franquia de Alto Rendimento (Até 60 req/dia)
                        </span>
                      </div>
                    )}

                    {/* Botão Secundário Glow: ⚡ Recarregar +1 Sinapse (Vídeo Curto) */}
                    {!quota.isUnlimited && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          setIsRewardedModalOpen(true);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 hover:from-amber-500/25 hover:to-amber-400/25 border border-amber-400/40 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-[0_0_15px_rgba(251,191,36,0.15)] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                      >
                        <Zap size={14} className="text-amber-500 dark:text-amber-400 fill-amber-400/30 group-hover:scale-110 transition-transform" />
                        <span>⚡ Recarregar +1 Sinapse (Vídeo Curto)</span>
                      </button>
                    )}

                    {/* Botão Primário Pro: 👑 Acelerar com Synapse Pro (60 Sinapses/dia + Zero Espera) */}
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
                          : "👑 Acelerar com Synapse Pro (60 Sinapses/dia + Zero Espera)"}
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
