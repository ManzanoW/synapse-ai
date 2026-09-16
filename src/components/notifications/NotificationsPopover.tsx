"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Layers,
  Flame,
  BookOpenCheck,
  Target,
  X,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSmartNotificationsAction,
  SmartNotification,
} from "@/actions/notification-actions";

interface NotificationsPopoverProps {
  onNavigate?: () => void;
}

export function NotificationsPopover({ onNavigate }: NotificationsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Carrega notificações ao montar
  useEffect(() => {
    let mounted = true;
    async function loadNotifications() {
      try {
        const res = await getSmartNotificationsAction();
        if (mounted && res.success && res.data) {
          setNotifications(res.data);
        }
      } catch (err) {
        console.error("Erro ao buscar notificações:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  // Fecha popover ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeNotifications = notifications.filter(
    (n) => !dismissedIds.includes(n.id)
  );
  const unreadCount = activeNotifications.length;

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDismissedIds((prev) => [...prev, id]);
  };

  const handleClearAll = () => {
    setDismissedIds(notifications.map((n) => n.id));
  };

  const getNotificationIcon = (type: SmartNotification["type"]) => {
    switch (type) {
      case "flashcards_due":
        return <Layers className="text-amber-400" size={16} />;
      case "streak_risk":
        return <Flame className="text-rose-400 fill-rose-400/20" size={16} />;
      case "error_notebook":
        return <BookOpenCheck className="text-violet-400" size={16} />;
      case "weekly_goal":
        return <Target className="text-indigo-400" size={16} />;
      default:
        return <Sparkles className="text-slate-400" size={16} />;
    }
  };

  const getSeverityBadge = (severity: SmartNotification["severity"]) => {
    switch (severity) {
      case "urgent":
        return (
          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Urgente
          </span>
        );
      case "warning":
        return (
          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Atenção
          </span>
        );
      case "info":
        return (
          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Meta
          </span>
        );
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Botão de Notificações com Badge */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Central de Notificações Inteligentes"
        aria-label="Central de Notificações Inteligentes"
        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 relative ${
          isOpen
            ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-500/20"
            : unreadCount > 0
              ? "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-indigo-500/30"
              : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10"
        }`}
      >
        <Bell size={15} className="transition-transform active:scale-95" />

        {/* Badge com Contador Vibrante */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-rose-500 text-[10px] font-bold font-mono text-white shadow-sm">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 sm:left-auto right-0 sm:-right-12 top-full mt-2 w-[calc(100vw-32px)] sm:w-96 max-w-sm z-50 bg-[#060913]/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden"
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Sparkles size={14} />
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Alertas Inteligentes
                </span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer font-medium"
                >
                  Limpar todos
                </button>
              )}
            </div>

            {/* Lista de Alertas */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-800/50 p-2 space-y-1">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Carregando alertas preditivos...
                </div>
              ) : activeNotifications.length === 0 ? (
                <div className="py-8 px-4 text-center space-y-2">
                  <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 w-fit mx-auto border border-emerald-500/20">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-xs font-semibold text-slate-200">
                    Tudo em dia!
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                    Nenhuma pendência crítica detectada pelo motor preditivo da IA no momento.
                  </p>
                </div>
              ) : (
                activeNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-slate-950/40 hover:bg-slate-900/60 border border-slate-800/40 hover:border-slate-700/60 transition-all space-y-2 relative group"
                  >
                    {/* Linha 1: Ícone, Título, Badge de Severidade e Botão Descartar */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-slate-800/80 shrink-0">
                          {getNotificationIcon(n.type)}
                        </div>
                        <span className="text-xs font-semibold text-slate-100 truncate">
                          {n.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {getSeverityBadge(n.severity)}
                        <button
                          type="button"
                          onClick={(e) => handleDismiss(n.id, e)}
                          title="Dispensar alerta"
                          className="text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Linha 2: Mensagem Descritiva */}
                    <p className="text-[11px] text-slate-400 leading-relaxed pl-7">
                      {n.message}
                    </p>

                    {/* Linha 3: Ação Recomendada */}
                    <div className="pl-7 pt-1">
                      <Link
                        href={n.actionHref}
                        onClick={() => {
                          setIsOpen(false);
                          if (onNavigate) onNavigate();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 group-hover:underline cursor-pointer transition-colors"
                      >
                        <span>{n.actionLabel}</span>
                        <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé Informativo */}
            <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/60 flex items-center justify-between text-[10px] text-slate-500">
              <span>Atualizado em tempo real</span>
              <span className="font-mono">Motor Preditivo IA</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}