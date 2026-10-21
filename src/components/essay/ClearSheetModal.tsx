"use client";

import React, { useEffect } from "react";
import { Trash2 } from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface ClearSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ClearSheetModal({
  isOpen,
  onClose,
  onConfirm,
}: ClearSheetModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    triggerHaptic("warning");
    triggerHaptic("warning");
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleClose = () => {
    triggerHaptic("light");
    onClose();
  };

  const handleConfirm = () => {
    triggerHaptic("heavy");
    onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="clear-sheet-title"
      aria-describedby="clear-sheet-description"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-rose-500/30 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="p-5 flex flex-col items-center text-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400">
            <Trash2 size={24} />
          </div>

          <h3 id="clear-sheet-title" className="text-base font-bold text-slate-900 dark:text-white">
            Limpar Folha de Redação?
          </h3>

          <p id="clear-sheet-description" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Tem certeza de que deseja apagar todo o texto digitado? Esta ação não pode ser desfeita e seu rascunho salvo será descartado.
          </p>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-slate-400"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          >
            Sim, Limpar Folha
          </button>
        </div>
      </div>
    </div>
  );
}
