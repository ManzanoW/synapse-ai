"use client";

import { motion } from "framer-motion";

export default function SubjectCard({
  title,
  progress,
  totalCards,
  timeSpent = "0min",
  accuracy = 0,
  colorClass = "indigo",
}: {
  title: string;
  progress: number;
  totalCards: number;
  timeSpent?: string;
  accuracy?: number;
  colorClass?: "indigo" | "emerald" | "amber" | "rose" | "violet";
}) {
  // Mapeamento estático ajustado com cores visíveis antes e intensificadas no hover
  const themeMap = {
    indigo: {
      textDefault: "text-indigo-400",
      textHover: "group-hover:text-indigo-300",
      borderLeft: "border-l-indigo-500",
      borderHover: "hover:border-indigo-500/30",
      bar: "bg-indigo-500",
      glow: "group-hover:from-indigo-500/[0.03]",
    },
    emerald: {
      textDefault: "text-emerald-400",
      textHover: "group-hover:text-emerald-300",
      borderLeft: "border-l-emerald-500",
      borderHover: "hover:border-emerald-500/30",
      bar: "bg-emerald-500",
      glow: "group-hover:from-emerald-500/[0.03]",
    },
    amber: {
      textDefault: "text-amber-400",
      textHover: "group-hover:text-amber-300",
      borderLeft: "border-l-amber-500",
      borderHover: "hover:border-amber-500/30",
      bar: "bg-amber-500",
      glow: "group-hover:from-amber-500/[0.03]",
    },
    rose: {
      textDefault: "text-rose-400",
      textHover: "group-hover:text-rose-300",
      borderLeft: "border-l-rose-500",
      borderHover: "hover:border-rose-500/30",
      bar: "bg-rose-500",
      glow: "group-hover:from-rose-500/[0.03]",
    },
    violet: {
      textDefault: "text-violet-400",
      textHover: "group-hover:text-violet-300",
      borderLeft: "border-l-violet-500",
      borderHover: "hover:border-violet-500/30",
      bar: "bg-violet-500",
      glow: "group-hover:from-violet-500/[0.03]",
    },
  };

  const currentTheme = themeMap[colorClass] || themeMap.indigo;

  const accuracyColor =
    accuracy >= 80
      ? "text-emerald-400"
      : accuracy >= 60
        ? "text-amber-400"
        : "text-slate-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }} // Começa invisível e levemente abaixo
      animate={{ opacity: 1, y: 0 }} // Desliza para a posição final
      whileHover={{ y: -4 }} // Elevação suave ao passar o mouse
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`bg-[#070b12] border border-slate-900/80 border-l-4 ${currentTheme.borderLeft} rounded-xl p-4.5 
                  cursor-pointer group relative overflow-hidden ${currentTheme.borderHover}`}
    >
      {/* Brilho de fundo que se intensifica no hover */}
      <div
        className={`absolute inset-0 bg-linear-to-br from-transparent via-transparent to-transparent transition-all duration-500 ${currentTheme.glow}`}
      />

      {/* Cabeçalho */}
      <div className="flex items-center justify-between relative z-10">
        <h3
          className={`font-semibold transition-colors duration-300 ${currentTheme.textDefault} ${currentTheme.textHover}`}
        >
          {title}
        </h3>
        <span
          className={`text-slate-700 group-hover:translate-x-0.5 transition-all duration-300 text-base ${currentTheme.textHover}`}
        >
          &rsaquo;
        </span>
      </div>

      {/* Corpo / Métricas */}
      <div className="mt-3.5 space-y-2 relative z-10">
        <div className="flex justify-between text-[11px] text-slate-400 tracking-wide">
          <div className="flex gap-1">
            <span className="text-slate-500">Progresso:</span>
            <span className="font-medium text-slate-300 font-mono">
              {progress}%
            </span>
          </div>
          <div className="flex gap-1">
            <span className="text-slate-500">Acertos:</span>
            <span className={`font-medium font-mono ${accuracyColor}`}>
              {accuracy}%
            </span>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${currentTheme.bar} shadow-[0_0_8px_rgba(var(--color-current),0.5)]`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Rodapé do Card */}
        <div className="flex justify-between items-center text-[11px] pt-1.5 text-slate-500">
          <p>{totalCards} cards agendados</p>
          <p className="font-mono text-slate-400 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-900/40">
            {timeSpent}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
