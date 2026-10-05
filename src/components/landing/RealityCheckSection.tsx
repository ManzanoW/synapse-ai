"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  FileSpreadsheet,
  FileX2,
  TrendingDown,
  FileCheck2,
  BrainCircuit,
  Headphones,
  Flame,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

export function RealityCheckSection() {
  const DUELS = [
    {
      id: "01",
      topic: "Gestão do Cronograma",
      iconArcaico: FileSpreadsheet,
      arcaicoTitle: "Planilhas de Excel que viram cemitério",
      arcaicoDesc:
        "Você gasta 3 dias montando um cronograma colorido. No primeiro imprevisto, o arquivo desorganiza e você abandona tudo com sensação de culpa.",
      arcaicoBadge: "Rígido & Frágil",
      iconSynapse: Zap,
      synapseTitle: "Ciclo Adaptativo Auto-Rebalanceável",
      synapseDesc:
        "O algoritmo reequilibra seu cronograma automaticamente quando você perde um dia. Sem culpa, sem empilhar matéria atrasada e sem refazer nada.",
      synapseBadge: "100% Automático",
    },
    {
      id: "02",
      topic: "Redação Discursiva",
      iconArcaico: FileX2,
      arcaicoTitle: "Correções caras e 15 dias de espera",
      arcaicoDesc:
        "Contratar professores particulares custa uma fortuna para receber um feedback genérico semanas depois, quando você já esqueceu o tema.",
      arcaicoBadge: "Lento & Dispendioso",
      iconSynapse: FileCheck2,
      synapseTitle: "Espelho Oficial Cebraspe em 8 Segundos",
      synapseDesc:
        "Fórmula exata de desconto da banca (NF = NC - 2×NE/TL), análise linha a linha de microestrutura e versão ouro sugerida na hora.",
      synapseBadge: "Critério Oficial",
    },
    {
      id: "03",
      topic: "Horas Mortas no Deslocamento",
      iconArcaico: Clock,
      arcaicoTitle: "2h diárias jogadas no lixo no trânsito",
      arcaicoDesc:
        "Preso no trânsito, no metrô ou lavando louça querendo estudar, mas é impossível ler apostilas ou manusear telas sem enjoar ou se distrair.",
      arcaicoBadge: "Tempo Perdido",
      iconSynapse: Headphones,
      synapseTitle: "Áudio Hands-Free com Voz Neural",
      synapseDesc:
        "Estude com o celular no bolso. A IA pergunta no fone Bluetooth, aguarda 3s para você pensar e solta a resolução oficial completa.",
      synapseBadge: "+2h Líquidas / dia",
    },
    {
      id: "04",
      topic: "Retenção de Longo Prazo",
      iconArcaico: TrendingDown,
      arcaicoTitle: "A bola de neve incontrolável do Anki antigo",
      arcaicoDesc:
        "Com o algoritmo SM-2 básico dos anos 80, 4 dias sem abrir o app resultam em 600 revisões acumuladas em um único dia desesperador.",
      arcaicoBadge: "Burnout Garantido",
      iconSynapse: Flame,
      synapseTitle: "Motor FSRS com Estabilidade Biológica",
      synapseDesc:
        "Calcula o limiar exato do esquecimento biológico, eliminando 65% das repetições inúteis do que você já domina, garantindo 92%+ na prova.",
      synapseBadge: "-65% Revisões Inúteis",
    },
  ];

  return (
    <section id="metodo" className="relative py-24 sm:py-32 overflow-hidden bg-[#030712] scroll-mt-24">
      {/* Glow Divisor Superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-5xl h-px bg-gradient-to-r from-transparent via-cyan-500/40 via-indigo-500/40 to-transparent" />

      {/* Volumetric Lights Cinematográficas (Duelo: Rose vs. Cyan) */}
      <div className="pointer-events-none absolute top-1/4 -left-48 w-[550px] h-[550px] bg-rose-600/[0.09] rounded-full blur-[170px]" />
      <div className="pointer-events-none absolute top-1/4 -right-48 w-[550px] h-[550px] bg-cyan-500/[0.11] rounded-full blur-[170px]" />

      {/* Grade Cósmica Estelar Sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>O Choque de Realidade</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            Por que 95% dos concurseiros{" "}
            <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-rose-300 bg-clip-text text-transparent">
              reprovam por cansaço
            </span>{" "}
            e não por falta de esforço?
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
            Estudar para concurso de ponta com métodos da década passada é disputar uma corrida de Fórmula 1 pedalando uma bicicleta enferrujada.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* GRID TÁTICO DE DUELOS (ANTES vs. DEPOIS LADO A LADO)                      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {DUELS.map((duel, idx) => {
            const IconArc = duel.iconArcaico;
            const IconSyn = duel.iconSynapse;

            return (
              <motion.div
                key={duel.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative rounded-2xl bg-slate-900/40 hover:bg-slate-900/70 border border-white/[0.08] hover:border-cyan-500/35 backdrop-blur-2xl p-4 sm:p-5 transition-all duration-300 shadow-xl space-y-3.5 group overflow-hidden hover:shadow-[0_0_30px_rgba(6,182,212,0.12)]"
              >
                {/* Topic Pill & Counter */}
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
                  <span className="text-[11px] font-mono text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[10px] text-cyan-300 font-mono">
                      {duel.id}
                    </span>
                    <span>{duel.topic}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Duelo Tático
                  </span>
                </div>

                {/* Sub-grid: Arcaico vs. Synapse */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Lado Esquerdo: O Método Arcaico */}
                  <div className="rounded-xl bg-rose-950/20 border border-rose-500/25 p-3 sm:p-3.5 space-y-1.5 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 font-bold uppercase">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Arcaico</span>
                      </span>
                      <span className="text-[9px] font-mono text-rose-300/80 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                        {duel.arcaicoBadge}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-200 leading-snug">
                      {duel.arcaicoTitle}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {duel.arcaicoDesc}
                    </p>
                  </div>

                  {/* Lado Direito: O Padrão Synapse AI */}
                  <div className="rounded-xl bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-cyan-950/20 border border-cyan-500/35 p-3 sm:p-3.5 space-y-1.5 relative overflow-hidden group-hover:border-cyan-400/60 transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 font-bold uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Synapse AI</span>
                      </span>
                      <span className="text-[9px] font-mono text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/35 font-bold shadow-xs">
                        {duel.synapseBadge}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {duel.synapseTitle}
                    </h4>
                    <p className="text-[11px] text-slate-300/90 leading-relaxed">
                      {duel.synapseDesc}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Epiphany Callout & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-10 sm:mt-12 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-cyan-950/40 border border-indigo-500/25 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl"
        >
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm sm:text-base font-bold text-white">
              A aprovação não premia quem sofre mais. Premia quem retém mais com método.
            </h4>
            <p className="text-xs text-slate-300 font-mono">
              Economize centenas de horas de estudo inútil e chegue à prova com memória blindada.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white text-xs sm:text-sm font-bold hover:opacity-95 transition-opacity shadow-lg shadow-indigo-950/50"
          >
            <span>Romper com o Método Arcaico</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
