"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Star,
  CheckCircle2,
  Quote,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  Headphones,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { playUiSound } from "@/lib/sensory/audio-feedback";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  category: "fiscal" | "policial" | "tribunais";
  initials: string;
  gradient: string;
  metric: string;
  metricLabel: string;
  metricIcon: React.ElementType;
  quote: string;
  banca: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Mariana S.",
    role: "1º Lugar Auditora Fiscal (SEFAZ-SP)",
    category: "fiscal",
    initials: "MS",
    gradient: "from-cyan-500 to-blue-600",
    metric: "+52h Líquidas",
    metricLabel: "recuperadas no trânsito",
    metricIcon: Headphones,
    banca: "Banca FGV",
    quote:
      "Eu gastava 1h40 de ônibus todo dia sem conseguir ler. O áudio neural com tela bloqueada no bolso me rendeu mais de 50 horas líquidas no mês. O FSRS não me deixou esquecer a legislação tributária no dia da prova.",
  },
  {
    id: "2",
    name: "Lucas F.",
    role: "Aprovado Agente (Polícia Federal)",
    category: "policial",
    initials: "LF",
    gradient: "from-amber-500 to-rose-600",
    metric: "18.9 / 20.0",
    metricLabel: "na Discursiva Cebraspe",
    metricIcon: FileCheck2,
    banca: "Cebraspe",
    quote:
      "Subi minha nota na discursiva do Cebraspe de 11.4 para 18.9 usando a Versão Ouro sugerida pelo Synapse. O rigor na contagem de linhas e na microestrutura foi exatamente o que a banca aplicou no espelho oficial.",
  },
  {
    id: "3",
    name: "Guilherme A.",
    role: "Analista Judiciário (TRF-1)",
    category: "tribunais",
    initials: "GA",
    gradient: "from-indigo-500 to-purple-600",
    metric: "92.4% Retenção",
    metricLabel: "sem bola de neve de revisões",
    metricIcon: TrendingUp,
    banca: "Banca FGV",
    quote:
      "Eu tinha mais de 700 cards acumulados no Anki clássico e estava à beira de um burnout. O ciclo adaptativo do Synapse me salvou: redistribuiu minha semana e manteve meu aproveitamento em mais de 90%.",
  },
  {
    id: "4",
    name: "Thiago N.",
    role: "Auditor Federal de Controle Externo (TCU)",
    category: "fiscal",
    initials: "TN",
    gradient: "from-emerald-500 to-teal-600",
    metric: "88.0 / 100",
    metricLabel: "na Prova Prático-Profissional",
    metricIcon: FileCheck2,
    banca: "Cebraspe",
    quote:
      "A auditoria de redação no espelho oficial do Cebraspe é assustadoramente fiel. O sistema pegou três desvios de microestrutura temática que meus professores de cursinho particular deixaram passar batido.",
  },
  {
    id: "5",
    name: "Beatriz M.",
    role: "Aprovada Delegada de Polícia Civil",
    category: "policial",
    initials: "BM",
    gradient: "from-rose-500 to-purple-600",
    metric: "96% Acertos",
    metricLabel: "em Súmulas & Jurisprudência",
    metricIcon: TrendingUp,
    banca: "Vunesp",
    quote:
      "Os flashcards em áudio com casos práticos e súmulas do STF e STJ me colocaram anos-luz à frente de quem estudava por apostilas em PDF tradicionais. O áudio no trânsito foi o grande divisor de águas.",
  },
  {
    id: "6",
    name: "Rafael C.",
    role: "Técnico Judiciário (TRT-2)",
    category: "tribunais",
    initials: "RC",
    gradient: "from-blue-500 to-cyan-500",
    metric: "2h por dia",
    metricLabel: "conciliando trabalho e filhos",
    metricIcon: Headphones,
    banca: "Banca FCC",
    quote:
      "Trabalhando 8h por dia e com dois filhos pequenos, eu não tinha tempo para sentar na mesa por 5 horas seguidas. O Synapse condensou meu estudo nos deslocamentos e me fez passar dentro das vagas.",
  },
];

export function TestimonialsSection() {
  const [activeFilter, setActiveFilter] = useState<"all" | "fiscal" | "policial" | "tribunais">("all");

  const filtered =
    activeFilter === "all"
      ? TESTIMONIALS
      : TESTIMONIALS.filter((t) => t.category === activeFilter);

  const handleFilter = (filter: "all" | "fiscal" | "policial" | "tribunais") => {
    setActiveFilter(filter);
    triggerHaptic("light");
    playUiSound("switch");
  };

  return (
    <section id="depoimentos" className="relative py-24 sm:py-32 overflow-hidden bg-[#030712] border-t border-white/[0.06] scroll-mt-24">
      {/* Background Volumetric Lights */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-r from-cyan-600/[0.07] via-violet-600/[0.09] to-indigo-600/[0.07] rounded-full blur-[170px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>Muro de Prova Social • Resultados Reais</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Concurseiros comuns que agora têm o nome no{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-violet-300 bg-clip-text text-transparent">
              Diário Oficial
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Veja como o método FSRS e o áudio hands-free destravaram aprovações nas carreiras mais concorridas do país.
          </p>

          {/* Filtros por Área */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {[
              { id: "all", label: "Todos os Cargos" },
              { id: "fiscal", label: "🏛️ Área Fiscal & Controle" },
              { id: "policial", label: "👮 Carreiras Policiais" },
              { id: "tribunais", label: "⚖️ Tribunais Federais" },
            ].map((f) => {
              const isSelected = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFilter(f.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 scale-105"
                      : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08]"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de Depoimentos */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => {
              const MetricIcon = item.metricIcon;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-3xl bg-[#070b14]/80 border border-white/10 hover:border-cyan-500/40 p-6 sm:p-7 backdrop-blur-2xl flex flex-col justify-between space-y-5 transition-all shadow-xl group hover:shadow-[0_15px_35px_rgba(6,182,212,0.12)]"
                >
                  {/* Top Quote Icon & Stars */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      <span>{item.banca}</span>
                    </span>
                  </div>

                  {/* Depoimento Text */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                    "{item.quote}"
                  </p>

                  {/* Métrica de Destaque */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <MetricIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-black text-cyan-300">
                        {item.metric}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.metricLabel}
                      </div>
                    </div>
                  </div>

                  {/* Author Meta */}
                  <div className="flex items-center gap-3 pt-1">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-tr ${item.gradient} flex items-center justify-center text-xs font-black text-white shadow-md border-2 border-slate-900`}
                    >
                      {item.initials}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{item.name}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {item.role}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
