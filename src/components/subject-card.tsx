"use client";

import { motion } from "framer-motion";

interface SubjectCardProps {
  title: string;
  progress: number;
  totalCards: number;
  timeSpent?: string;
  accuracy?: number;
  colorClass?: string; // Aceita agora Hex (#3B82F6) ou nomes de tema ("indigo", "emerald", etc)
}

// Fallback de Hex para nomes de temas clássicos
const PRESET_HEX_MAP: Record<string, string> = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#8b5cf6",
};

export default function SubjectCard({
  title,
  progress,
  totalCards,
  timeSpent = "0min",
  accuracy = 0,
  colorClass = "indigo",
}: SubjectCardProps) {
  // Extrai o código Hex (se vier o código direto do banco ou se for um tema predefinido)
  const hexColor = PRESET_HEX_MAP[colorClass] || colorClass || "#6366f1";

  const accuracyColor =
    accuracy >= 80
      ? "text-emerald-400"
      : accuracy >= 60
        ? "text-amber-400"
        : "text-slate-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={
        {
          borderLeftColor: hexColor,
          "--hover-border-color": `${hexColor}40`, // 25% de opacidade no hover
          "--hover-glow-color": `${hexColor}0d`, // ~5% de brilho no hover
        } as React.CSSProperties
      }
      className="bg-[#070b12] border border-slate-900/80 border-l-4 rounded-xl p-4.5 
                 cursor-pointer group relative overflow-hidden transition-all duration-300
                 hover:border-[var(--hover-border-color)]"
    >
      {/* Brilho de fundo com a cor dinamicamente injetada no hover */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent transition-all duration-500 opacity-0 group-hover:opacity-100"
        style={{ backgroundColor: "var(--hover-glow-color)" }}
      />

      {/* Cabeçalho */}
      <div className="flex items-center justify-between relative z-10">
        <h3
          className="font-semibold transition-colors duration-300 text-slate-100 group-hover:text-white"
          style={{ color: hexColor }}
        >
          {title}
        </h3>
        <span
          className="text-slate-700 group-hover:translate-x-0.5 transition-all duration-300 text-base"
          style={{ color: hexColor }}
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

        {/* Barra de progresso com brilho proporcional à cor */}
        <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: hexColor,
              boxShadow: `0 0 10px ${hexColor}80`,
            }}
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
