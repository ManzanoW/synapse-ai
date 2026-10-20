"use client";

import React, { useEffect, useState, useRef } from "react";
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from "lucide-react";
import { useOfflineSync } from "@/lib/offline-sync";
import { triggerHaptic } from "@/lib/sensory/haptics";

export function OfflineSyncIndicator() {
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const wasOfflineRef = useRef(false);
  const prevSyncingRef = useRef(false);

  // Monitora transições de conectividade
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      triggerHaptic("warning");
    } else if (wasOfflineRef.current) {
      // Retornou a ficar online
      wasOfflineRef.current = false;
      triggerHaptic("success");
    }
  }, [isOnline]);

  // Monitora término de sincronização para exibir feedback positivo temporário
  useEffect(() => {
    if (prevSyncingRef.current && !isSyncing && isOnline && pendingCount === 0) {
      setShowSyncSuccess(true);
      triggerHaptic("light");
      const timer = setTimeout(() => {
        setShowSyncSuccess(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
    prevSyncingRef.current = isSyncing;
  }, [isSyncing, isOnline, pendingCount]);

  // Se estiver online, sem sincronizações ativas, sem pendências e sem aviso de sucesso: oculta
  if (isOnline && !isSyncing && pendingCount === 0 && !showSyncSuccess) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto"
    >
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full border shadow-xl backdrop-blur-xl text-xs font-medium transition-all ${
          !isOnline
            ? "bg-amber-950/90 border-amber-500/40 text-amber-200 shadow-amber-950/50"
            : isSyncing
              ? "bg-indigo-950/90 border-indigo-500/40 text-indigo-200 shadow-indigo-950/50"
              : "bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50"
        }`}
      >
        {!isOnline ? (
          <>
            <WifiOff size={15} className="text-amber-400 shrink-0 animate-pulse" />
            <span className="truncate">
              Modo Offline • Seus estudos continuam salvos no aparelho
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold font-mono text-amber-300 border border-amber-500/30 shrink-0">
                {pendingCount} {pendingCount === 1 ? "revisão" : "revisões"}
              </span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw size={14} className="text-indigo-400 animate-spin shrink-0" />
            <span className="truncate">
              Conexão restabelecida! Sincronizando{" "}
              {pendingCount > 0 ? `${pendingCount} ` : ""}com a nuvem...
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span className="truncate">Tudo sincronizado na nuvem com sucesso!</span>
          </>
        )}

        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              triggerSync();
            }}
            className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
          >
            <CloudUpload size={12} />
            <span>Sincronizar agora</span>
          </button>
        )}
      </div>
    </div>
  );
}
