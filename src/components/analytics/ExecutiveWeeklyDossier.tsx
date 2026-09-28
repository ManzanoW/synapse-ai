// src/components/analytics/ExecutiveWeeklyDossier.tsx
"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Printer,
  ShieldCheck,
  Target,
  Sparkles,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { MonteCarloSimulationResult } from "@/actions/monte-carlo-actions";

interface ExecutiveWeeklyDossierProps {
  isOpen: boolean;
  onClose: () => void;
  data: MonteCarloSimulationResult | null;
  targetRole?: string;
  userName?: string;
}

export function ExecutiveWeeklyDossier({
  isOpen,
  onClose,
  data,
  targetRole = "Cargo dos Sonhos",
  userName = "Concurseiro(a)",
}: ExecutiveWeeklyDossierProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !data) return null;

  const todayStr = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/70 dark:bg-black/85 backdrop-blur-xl print:hidden"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl max-h-[92vh] bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-10 overflow-y-auto z-10 space-y-6 print:p-0 print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Barra de Ações (Oculta na Impressão) */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} /> Dossiê Semanal de Performance • Synapse AI
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
              >
                <Printer size={15} />
                <span>Imprimir / Salvar PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* DOCUMENTO EXECUTIVO PARA IMPRESSÃO */}
          <div ref={printRef} className="space-y-6">
            {/* Cabeçalho do Dossiê */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Dossiê Semanal de Probabilidade & Risco
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Candidato(a): <strong className="text-slate-800">{userName}</strong> • Foco: <strong className="text-slate-800">{targetRole}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-400 block">
                  Data de Emissão
                </span>
                <span className="text-xs font-bold text-slate-800">{todayStr}</span>
              </div>
            </div>

            {/* Quadro de Probabilidade e Cenários */}
            <div className="grid grid-cols-4 gap-3 border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
              <div className="border-r border-slate-200 pr-3">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">
                  Probabilidade Real
                </span>
                <span className="text-2xl font-black font-mono text-indigo-600 mt-1 block">
                  {data.approvalProbability}%
                </span>
                <span className="text-[10px] text-slate-500">Corte: {data.cutoffScore} pts</span>
              </div>

              <div className="border-r border-slate-200 pr-3">
                <span className="text-[9px] font-extrabold uppercase text-rose-500 block">
                  P10 • Conservador
                </span>
                <span className="text-2xl font-black font-mono text-slate-800 mt-1 block">
                  {data.p10Score}
                </span>
                <span className="text-[10px] text-slate-400">Pior cenário provável</span>
              </div>

              <div className="border-r border-slate-200 pr-3">
                <span className="text-[9px] font-extrabold uppercase text-amber-600 block">
                  P50 • Mediana
                </span>
                <span className="text-2xl font-black font-mono text-slate-800 mt-1 block">
                  {data.p50Score}
                </span>
                <span className="text-[10px] text-slate-400">Nota esperada</span>
              </div>

              <div>
                <span className="text-[9px] font-extrabold uppercase text-emerald-600 block">
                  P90 • Otimista
                </span>
                <span className="text-2xl font-black font-mono text-slate-800 mt-1 block">
                  {data.p90Score}
                </span>
                <span className="text-[10px] text-slate-400">Teto de aproveitamento</span>
              </div>
            </div>

            {/* Síntese Executiva Prescritiva */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-950 text-xs leading-relaxed space-y-1">
              <span className="font-bold block uppercase tracking-wider text-[10px] text-indigo-700">
                Parecer do Algoritmo Preditivo
              </span>
              <p>{data.executiveSummary}</p>
            </div>

            {/* Matriz de Custo de Oportunidade */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                Matriz de Custo de Oportunidade por Disciplina
              </span>
              <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-[10px] font-extrabold uppercase text-slate-600">
                  <tr>
                    <th className="p-2.5">Disciplina</th>
                    <th className="p-2.5 text-center">Peso</th>
                    <th className="p-2.5 text-center">Acurácia Atual</th>
                    <th className="p-2.5 text-center">Ganho / +3h</th>
                    <th className="p-2.5">Diagnóstico Prescritivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {data.subjectsRisk.map((sub, idx) => (
                    <tr key={`dossier-sub-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                      <td className="p-2.5 font-bold text-slate-900">{sub.subjectName}</td>
                      <td className="p-2.5 text-center font-mono">{sub.weight}</td>
                      <td className="p-2.5 text-center font-mono font-bold">{sub.currentAccuracy}%</td>
                      <td className="p-2.5 text-center font-mono font-bold text-emerald-600">
                        +{sub.marginalGainPer3Hours} pts
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-500">{sub.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recomendações e Plano de Ação para a Próxima Semana */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50/30">
              <span className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                Diretrizes Estratégicas para os Próximos 7 Dias
              </span>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>
                  Concentrar <strong>40% do tempo de estudo</strong> na disciplina de maior alavancagem:{" "}
                  <strong className="text-slate-900">{data.highestLeverageSubject}</strong>.
                </li>
                <li>
                  Realizar ao menos <strong>1 Simulado Cronometrado</strong> para refinar o desvio padrão de prova.
                </li>
                <li>
                  Zerar os erros catalogados no <strong>Caderno de Erros Inteligente</strong> para elevar o piso P10.
                </li>
              </ul>
            </div>

            {/* Rodapé de Validação Técnica */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
              <span>Synapse AI Cognitive Intelligence • Modelagem Estocástica Monte Carlo (1.000x)</span>
              <span>Documento Oficial de Uso Pessoal</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
