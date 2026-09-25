"use client";

import React, { useState, useTransition } from "react";
import {
  Cpu,
  Zap,
  Activity,
  ShieldCheck,
  RefreshCw,
  Clock,
  Key,
  Users,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Server,
  TrendingUp,
} from "lucide-react";
import {
  AdminAiMetrics,
  pingAdminAiKeysAction,
  getAdminAiMetricsAction,
} from "@/actions/admin-ai-actions";

interface AdminAiDashboardProps {
  initialMetrics: AdminAiMetrics;
}

const FEATURE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  SIMULADO: { label: "Simulados com IA", icon: "📝", color: "from-blue-500/20 to-indigo-500/20 text-indigo-400" },
  ESSAY: { label: "Correção de Redação", icon: "✍️", color: "from-purple-500/20 to-pink-500/20 text-purple-400" },
  OCR_ESSAY: { label: "OCR de Manuscrito", icon: "📸", color: "from-amber-500/20 to-orange-500/20 text-amber-400" },
  OCR_QUESTION: { label: "Scanner de Questões", icon: "🔍", color: "from-cyan-500/20 to-teal-500/20 text-cyan-400" },
  MINDMAP: { label: "Mapas Mentais", icon: "🧠", color: "from-emerald-500/20 to-green-500/20 text-emerald-400" },
  FLASHCARD: { label: "Flashcards FSRS", icon: "⚡", color: "from-rose-500/20 to-red-500/20 text-rose-400" },
  REMEDIATION: { label: "Caderno de Erros", icon: "🎯", color: "from-violet-500/20 to-purple-500/20 text-violet-400" },
  EDITAL: { label: "Edital Verticalizado", icon: "📋", color: "from-sky-500/20 to-blue-500/20 text-sky-400" },
};

export function AdminAiDashboard({ initialMetrics }: AdminAiDashboardProps) {
  const [metrics, setMetrics] = useState<AdminAiMetrics>(initialMetrics);
  const [pingResults, setPingResults] = useState<
    | Array<{
        index: number;
        maskedKey: string;
        success: boolean;
        model: string;
        latencyMs: number;
        error?: string;
      }>
    | null
  >(null);

  const [isPending, startTransition] = useTransition();
  const [isPinging, setIsPinging] = useState(false);

  const handleRefresh = () => {
    startTransition(async () => {
      const res = await getAdminAiMetricsAction();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    });
  };

  const handleRunPing = async () => {
    setIsPinging(true);
    try {
      const res = await pingAdminAiKeysAction();
      if (res.success && res.data) {
        setPingResults(res.data);
      }
    } finally {
      setIsPinging(false);
    }
  };

  const totalKeys = metrics.poolStatus.totalKeys;
  const activeKeys = metrics.poolStatus.activeKeys;
  const isAllKeysHealthy = activeKeys === totalKeys;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      {/* ======================================================== */}
      {/* 🚀 CABEÇALHO DO COCKPIT                                  */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold mb-2">
            <ShieldCheck size={14} />
            <span>Painel Administrativo Exclusivo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="text-indigo-400" size={28} />
            Cockpit de IA & Infraestrutura
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitoramento em tempo real do pool de chaves Gemini, consumo diário de cotas e auditoria de usuários.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-all hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            title="Atualizar dados agora"
          >
            <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={handleRunPing}
            disabled={isPinging}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap size={14} className={isPinging ? "animate-pulse" : ""} />
            <span>{isPinging ? "Testando Chaves..." : "Testar Conectividade (Ping)"}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 📊 4 CARDS DE MÉTRICAS EM DESTAQUE                       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: COTA DIÁRIA CONSUMIDA */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cota Diária Gratuita</span>
            <Activity size={18} className="text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {metrics.totalRequestsToday.toLocaleString("pt-BR")}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              / {metrics.totalPoolCapacity.toLocaleString("pt-BR")} req
            </span>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Capacidade utilizada</span>
              <span className="font-bold text-indigo-400">{metrics.percentUsed}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(metrics.percentUsed, 3)}%` }}
              />
            </div>
          </div>
        </div>

        {/* CARD 2: CHAVES NO POOL */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saúde do Pool de Chaves</span>
            <Key size={18} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {activeKeys}/{totalKeys}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">
              {isAllKeysHealthy ? "100% Operacional" : "Com rodízio ativo"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Rotação automática Round-Robin com cooldown de 60s.</span>
          </p>
        </div>

        {/* CARD 3: THROUGHPUT COMBINADO */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Vazão (Throughput)</span>
            <Zap size={18} className="text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {totalKeys * 15}
            </span>
            <span className="text-xs text-slate-400 font-mono">RPM combinados</span>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <Server size={13} className="text-amber-400" />
            <span>15 requisições/min por projeto no Google AI Studio.</span>
          </p>
        </div>

        {/* CARD 4: CUSTO DE INFRAESTRUTURA */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Custo de API no Mês</span>
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              R$ 0,00
            </span>
            <span className="text-xs text-slate-500 font-semibold">Tier Gratuito</span>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <Sparkles size={13} className="text-indigo-400" />
            <span>Cache híbrido economizando até 40% dos tokens de simulados.</span>
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🔑 SEÇÃO DE SLOTS DAS CHAVES DE API                      */}
      {/* ======================================================== */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 p-6 space-y-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key size={18} className="text-indigo-400" />
              Slots do Pool de Chaves do Google Gemini
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identificação das chaves ativas configuradas na Vercel / ambiente.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {metrics.poolStatus.totalKeys} Projetos Registrados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {metrics.poolStatus.slots.map((slot) => {
            const ping = pingResults?.find((p) => p.index === slot.index);

            return (
              <div
                key={slot.index}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Chave #{slot.index + 1}
                  </span>
                  {slot.inCooldown ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Clock size={11} /> Cooldown ({slot.cooldownRemainingSeconds}s)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Ativa
                    </span>
                  )}
                </div>

                <div className="font-mono text-sm text-indigo-300 bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-xl text-center font-bold tracking-wider">
                  {slot.maskedKey}
                </div>

                <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                  <span>Cota do projeto:</span>
                  <span className="font-semibold text-slate-300">1.500 req/dia</span>
                </div>

                {ping && (
                  <div className="text-[11px] bg-slate-900/60 border border-slate-800 px-2.5 py-1.5 rounded-xl flex items-center justify-between">
                    <span className="text-slate-400">Latência do ping:</span>
                    <span
                      className={`font-mono font-bold ${
                        ping.success ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {ping.success ? `${ping.latencyMs}ms` : "Erro"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 📊 SEÇÃO DE CONSUMO POR FERRAMENTA                       */}
      {/* ======================================================== */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 p-6 space-y-4 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers size={18} className="text-indigo-400" />
            Consumo de IA por Ferramenta Hoje ({metrics.todayDate})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Distribuição de chamadas executadas em cada módulo de estudo.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {Object.entries(metrics.byFeature).map(([feature, count]) => {
            const meta = FEATURE_LABELS[feature] || {
              label: feature,
              icon: "⚡",
              color: "from-slate-500/20 to-slate-600/20 text-slate-400",
            };

            return (
              <div
                key={feature}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3"
              >
                <span className="text-2xl">{meta.icon}</span>
                <div>
                  <div className="text-lg font-black text-white">{count}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                    {meta.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 👥 SEÇÃO DE TOP USUÁRIOS MAIS ATIVOS HOJE               */}
      {/* ======================================================== */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 p-6 space-y-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-indigo-400" />
              Usuários Mais Ativos no Dia
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditoria de alunos com maior volume de interações com IA para monitoramento de Fair Use.
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {metrics.topUsersToday.length} usuário(s) ativos hoje
          </span>
        </div>

        {metrics.topUsersToday.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Nenhuma requisição de IA registrada ainda hoje.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Estudante</th>
                  <th className="py-3 px-3">Plano</th>
                  <th className="py-3 px-3 text-right">Requisições Hoje</th>
                  <th className="py-3 px-3 text-right">Status de Conformidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {metrics.topUsersToday.map((u, idx) => {
                  const isPro = u.planTier === "PREMIUM";
                  const limit = isPro ? 100 : 7;
                  const isNearLimit = u.totalCount >= limit * 0.8;

                  return (
                    <tr key={u.userId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">
                          {u.name || "Estudante Concurseiro"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {u.email || u.userId}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {isPro ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            Synapse Pro
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                            Gratuito
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {u.totalCount} req
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isNearLimit ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                            <AlertTriangle size={12} /> Próximo do limite
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 size={12} /> Uso Seguro
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
