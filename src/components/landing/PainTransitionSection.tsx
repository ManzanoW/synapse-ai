"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { AlertCircle, BrainCircuit, Target, Flame } from "lucide-react";

export function PainTransitionSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Frase 1: "Sobrecarga mental de editais infinitos" (0.05 a 0.35) com platô de leitura
  const opacity1 = useTransform(scrollYProgress, [0.05, 0.15, 0.28, 0.35], [0, 1, 1, 0]);
  const y1 = useTransform(scrollYProgress, [0.05, 0.15, 0.28, 0.35], [30, 0, 0, -30]);
  const progress1 = useTransform(scrollYProgress, [0.05, 0.28], ["0%", "100%"]);

  // Frase 2: "Falta de consistência e horas perdidas no trânsito" (0.35 a 0.65) com platô de leitura
  const opacity2 = useTransform(scrollYProgress, [0.35, 0.45, 0.58, 0.65], [0, 1, 1, 0]);
  const y2 = useTransform(scrollYProgress, [0.35, 0.45, 0.58, 0.65], [30, 0, 0, -30]);
  const progress2 = useTransform(scrollYProgress, [0.35, 0.58], ["0%", "100%"]);

  // Frase 3: "Planilhas confusas e matérias esquecidas na véspera" (0.65 a 0.95) com platô de leitura
  const opacity3 = useTransform(scrollYProgress, [0.65, 0.75, 0.88, 0.95], [0, 1, 1, 0]);
  const y3 = useTransform(scrollYProgress, [0.65, 0.75, 0.88, 0.95], [30, 0, 0, -30]);
  const progress3 = useTransform(scrollYProgress, [0.65, 0.88], ["0%", "100%"]);

  return (
    <div
      id="pain-transition"
      ref={containerRef}
      className="relative h-[360vh] w-full bg-[#030712] select-none"
    >
      {/* Sticky Fullscreen Container */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden px-4">
        {/* Background Ambient Aura */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-[600px] sm:w-[800px] h-[600px] bg-rose-600/5 rounded-full blur-[160px]" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* ===================================================================== */}
        {/* FRASE 1: SOBRECARGA MENTAL                                            */}
        {/* ===================================================================== */}
        <motion.div
          style={{
            opacity: opacity1,
            y: y1,
          }}
          className="absolute text-center max-w-4xl px-4 pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-mono font-bold uppercase tracking-wider mb-6">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>01 • O Peso da Preparação Arcaica</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-[0_0_35px_rgba(244,63,94,0.25)]">
            &quot;Sobrecarga mental de{" "}
            <span className="text-rose-400 underline decoration-rose-500/50 decoration-wavy">
              editais infinitos
            </span>
            &quot;
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-slate-400 font-mono">
            Centenas de páginas jurídicas e a sensação constante de que nada fixa na memória.
          </p>
        </motion.div>

        {/* ===================================================================== */}
        {/* FRASE 2: FALTA DE CONSISTÊNCIA                                        */}
        {/* ===================================================================== */}
        <motion.div
          style={{
            opacity: opacity2,
            y: y2,
          }}
          className="absolute text-center max-w-4xl px-4 pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-6">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>02 • Horas Mortas no Desperdício</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-[0_0_35px_rgba(245,158,11,0.25)]">
            &quot;Falta de consistência e{" "}
            <span className="text-amber-400 underline decoration-amber-500/50 decoration-wavy">
              horas perdidas no trânsito
            </span>
            &quot;
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-slate-400 font-mono">
            Passar 2h por dia preso no volante querendo estudar sem poder manusear livros.
          </p>
        </motion.div>

        {/* ===================================================================== */}
        {/* FRASE 3: PLANILHAS CONFUSAS & ESQUECIMENTO                            */}
        {/* ===================================================================== */}
        <motion.div
          style={{
            opacity: opacity3,
            y: y3,
          }}
          className="absolute text-center max-w-4xl px-4 pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-mono font-bold uppercase tracking-wider mb-6">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>03 • A Bola de Neve do Esquecimento</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-[0_0_35px_rgba(244,63,94,0.25)]">
            &quot;Planilhas confusas e{" "}
            <span className="text-rose-400 underline decoration-rose-500/50 decoration-wavy">
              matérias esquecidas na véspera
            </span>
            &quot;
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-slate-400 font-mono">
            A dor de errar na prova exatamente aquilo que você estudou há dois meses.
          </p>
        </motion.div>

        {/* ===================================================================== */}
        {/* INDICADOR DE PROGRESSO DA LEITURA (ESTILO STORY)                      */}
        {/* ===================================================================== */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-xl z-20 shadow-xl">
          <div className="flex items-center gap-2">
            {/* Traço 1 */}
            <div className="h-1.5 w-12 sm:w-16 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-rose-400 rounded-full"
                style={{ width: progress1 }}
              />
            </div>
            {/* Traço 2 */}
            <div className="h-1.5 w-12 sm:w-16 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: progress2 }}
              />
            </div>
            {/* Traço 3 */}
            <div className="h-1.5 w-12 sm:w-16 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-rose-400 rounded-full"
                style={{ width: progress3 }}
              />
            </div>
          </div>

          <span className="text-[10px] font-mono text-slate-400 pl-1 uppercase tracking-wider">
            O Método Arcaico
          </span>
        </div>
      </div>
    </div>
  );
}
