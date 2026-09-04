"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
// Se estiver usando NextAuth, descomente a linha abaixo:
// import { useSession } from "next-auth/react";

interface RescheduleBannerProps {
  missedDayName: string; // Ex: "Domingo"
  userId?: string; // Pode passar via props se já tiver no contexto do Dashboard
  onActionCompleted: () => void; // Callback para re-fetch dinâmico dos dados
}

export function RescheduleBanner({
  missedDayName,
  userId: propUserId,
  onActionCompleted,
}: RescheduleBannerProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Se estiver usando NextAuth, desmarente aqui:
  // const { data: session } = useSession();
  // const currentUserId = propUserId || session?.user?.id;

  const currentUserId = propUserId; // Ou a variável que contém o userId logado

  const handleReschedule = async (
    actionType: "OFF_DAY" | "PUSH_TODAY" | "SKIP_CYCLE" | "MARK_REST",
  ) => {
    try {
      setLoadingAction(actionType);

      const response = await fetch("/api/week/reschedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUserId,
          action: actionType,
          missedDayName, // Enviamos o nome do dia perdido para o rebalanceamento dinâmico
        }),
      });

      if (response.ok) {
        // Dispara o callback para atualizar a UI via React State/SWR/React Query sem refresh
        onActionCompleted();
      } else {
        const errData = await response.json();
        console.error("Erro na API de rebalanceamento:", errData);
      }
    } catch (error) {
      console.error("Erro de rede ao rebalancear:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const isLoading = loadingAction !== null;

  return (
    <div className="bg-amber-950/30 border border-amber-500/40 rounded-3xl p-5 mb-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="font-extrabold text-amber-200 text-sm tracking-tight flex items-center gap-2">
              Perdeu a meta de {missedDayName}? Sem problemas!
            </h4>
            <p className="text-amber-400/80 text-xs mt-0.5 leading-relaxed">
              Como você gostaria de rebalancear o seu plano de estudos?
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Empurrar Matérias */}
          <button
            disabled={isLoading}
            onClick={() => handleReschedule("PUSH_TODAY")}
            className="px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            {loadingAction === "PUSH_TODAY" && (
              <Loader2 size={12} className="animate-spin" />
            )}
            Empurrar matérias para hoje
          </button>

          {/* Botão Pular Ciclo */}
          <button
            disabled={isLoading}
            onClick={() => handleReschedule("SKIP_CYCLE")}
            className="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {loadingAction === "SKIP_CYCLE" && (
              <Loader2 size={12} className="animate-spin" />
            )}
            Pular e ver no próximo ciclo
          </button>

          {/* Botão Marcar como Folga */}
          <button
            disabled={isLoading}
            onClick={() => handleReschedule("OFF_DAY")}
            className="px-3 py-2 text-xs font-semibold text-amber-400 hover:text-amber-200 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {loadingAction === "OFF_DAY" && (
              <Loader2 size={12} className="animate-spin" />
            )}
            Marcar como folga
          </button>
        </div>
      </div>
    </div>
  );
}
