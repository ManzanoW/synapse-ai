"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, MessageSquare } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Registra o erro no console de produção para telemetria
    console.error("[Synapse Global Error Boundary]:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Glow de Alerta */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[300px] bg-rose-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-xl shadow-rose-500/10">
          <AlertTriangle size={38} />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono font-bold uppercase tracking-wider">
            Instabilidade Temporária
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Algo inesperado aconteceu
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Nossos circuitos cognitivos encontraram um erro inesperado ao processar sua requisição. Nenhum dado de estudo foi perdido.
          </p>
        </div>

        {error?.digest && (
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-500 max-w-xs mx-auto truncate">
            Código do Erro: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/25 active:scale-95 cursor-pointer"
          >
            <RotateCcw size={18} />
            <span>Tentar Novamente</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all text-sm font-semibold active:scale-95"
          >
            <Home size={18} />
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>

        <p className="text-xs text-slate-500 pt-4">
          Se o erro persistir, nossa equipe de suporte está pronta para ajudar pela aba de suporte.
        </p>
      </div>
    </main>
  );
}
