"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

type Listener = (toast: ToastItem) => void;
const listeners = new Set<Listener>();

function emitToast(message: string, variant: ToastVariant) {
  const item: ToastItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    variant,
  };
  listeners.forEach((fn) => fn(item));
}

export const toast = {
  success: (message: string) => emitToast(message, "success"),
  error: (message: string) => emitToast(message, "error"),
  info: (message: string) => emitToast(message, "info"),
  warning: (message: string) => emitToast(message, "warning"),
};

const VARIANT_STYLES: Record<
  ToastVariant,
  { border: string; iconColor: string; Icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  success: {
    border: "border-emerald-500/35",
    iconColor: "text-emerald-400",
    Icon: CheckCircle2,
  },
  error: {
    border: "border-rose-500/40",
    iconColor: "text-rose-400",
    Icon: AlertCircle,
  },
  warning: {
    border: "border-amber-500/40",
    iconColor: "text-amber-400",
    Icon: AlertTriangle,
  },
  info: {
    border: "border-indigo-500/40",
    iconColor: "text-indigo-400",
    Icon: Info,
  },
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler: Listener = (item) => {
      setItems((prev) => [...prev.slice(-3), item]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== item.id));
      }, 4500);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none print:hidden"
    >
      {items.map((item) => {
        const cfg = VARIANT_STYLES[item.variant];
        const Icon = cfg.Icon;
        return (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${cfg.border} bg-white dark:bg-[#090d16] p-3.5 shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-200`}
          >
            <Icon size={18} className={`${cfg.iconColor} shrink-0 mt-0.5`} />
            <p className="text-xs font-medium leading-relaxed flex-1">{item.message}</p>
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((t) => t.id !== item.id))}
              aria-label="Fechar notificação"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded-md cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
