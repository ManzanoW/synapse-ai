"use client";

import * as React from "react";
import { X } from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    triggerHaptic("light");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Painel inferior"}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs transition-opacity animate-fade-in"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Sheet / Drawer Container */}
      <div className="relative w-full sm:max-w-md bg-[#090d16] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl z-10 overflow-hidden transform transition-transform animate-in slide-in-from-bottom duration-300">
        {/* Handle visual para mobile */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-pointer" onClick={handleClose}>
          <div className="w-12 h-1.5 rounded-full bg-slate-700/80 active:bg-slate-500 transition-colors" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
          <h3 className="text-sm font-bold text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar painel"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content com Safe Area Inset para Mobile */}
        <div className="p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
