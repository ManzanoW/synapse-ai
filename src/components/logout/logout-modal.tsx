"use client";

import React from "react";
import { LogOut, Loader2, AlertTriangle } from "lucide-react";

interface LogoutModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícone de Alerta com Glow */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
          <AlertTriangle size={22} />
        </div>

        {/* Título e Descrição */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Encerrar sessão?
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Você precisará fazer login novamente para acessar seus estudos e
            cronograma.
          </p>
        </div>

        {/* Ações */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 py-2.5 text-xs font-semibold text-white shadow-[0_0_12px_rgba(225,29,72,0.3)] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saindo...</span>
              </>
            ) : (
              <>
                <LogOut size={14} />
                <span>Sair da conta</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
