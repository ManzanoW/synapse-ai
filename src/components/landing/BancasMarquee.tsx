"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Award, FileCheck2, Target } from "lucide-react";

const BANCAS_DATA = [
  { name: "CEBRASPE", specialty: "Fórmulas Oficiais & Macro/Microestrutura", icon: ShieldCheck, tag: "Espelhos Reais" },
  { name: "FGV CONCURSOS", specialty: "Gramática Pesada, Jurisprudência & Fisco", icon: Award, tag: "Padrão FGV" },
  { name: "FCC (CARLOS CHAGAS)", specialty: "Verticalização Exata de Editais & TRTs", icon: Target, tag: "Alta Incidência" },
  { name: "VUNESP", specialty: "Interpretação Literal, Doutrina & TJs", icon: FileCheck2, tag: "100% Mapeado" },
  { name: "CESGRANRIO", specialty: "CNU Nacional & Concursos Bancários", icon: ShieldCheck, tag: "Blocos 1 ao 8" },
  { name: "RECEITA FEDERAL & FISCO", specialty: "Legislação Tributária & Auditoria", icon: Award, tag: "Elite Fiscal" },
  { name: "POLÍCIA FEDERAL & PRF", specialty: "Discursivas Técnicas & Segurança", icon: Target, tag: "Padrão Ouro" },
  { name: "MAGISTRATURA & MP", specialty: "Jurisprudência STF/STJ & Peças", icon: FileCheck2, tag: "Nível Máximo" },
];

export function BancasMarquee() {
  return (
    <div className="relative w-full py-10 sm:py-14 bg-[#030712] border-y border-white/[0.06] overflow-hidden">
      {/* Background Volumetric Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10">
        <div className="w-[600px] h-[150px] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Calibrado para as Principais Bancas do Brasil</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto font-normal">
          Algoritmos e prompts afinados com base nos espelhos e critérios reais de pontuação de mais de 18.000 provas oficiais.
        </p>
      </div>

      {/* Marquee Track with Fade Mask */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 32, ease: "linear", repeat: Infinity }}
          className="flex gap-4 sm:gap-6 w-max py-2"
        >
          {[...BANCAS_DATA, ...BANCAS_DATA].map((banca, idx) => {
            const Icon = banca.icon;
            return (
              <div
                key={idx}
                className="group flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-white/[0.08] hover:border-indigo-500/40 backdrop-blur-xl transition-all duration-300 shrink-0 shadow-sm shadow-black/50"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:text-cyan-300 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 flex items-center justify-center transition-colors shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-white tracking-wide group-hover:text-cyan-200 transition-colors">
                      {banca.name}
                    </span>
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {banca.tag}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono block">
                    {banca.specialty}
                  </span>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
