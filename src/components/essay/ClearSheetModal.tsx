"use client";

import React from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-rose-500/30 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="p-5 flex flex-col items-center text-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400">
            <Trash2 size={24} />
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Limpar Folha de Redação?
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Tem certeza de que deseja apagar todo o texto digitado? Esta ação não pode ser desfeita e seu rascunho salvo será descartado.
          </p>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
          >
            Sim, Limpar Folha
          </button>
        </div>
      </div>
    </div>
  );
}
