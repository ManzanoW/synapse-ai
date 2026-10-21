"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, HelpCircle } from "lucide-react";

interface SubjectCardProps {
  subjectId?: string;
  title: string;
  progress: number;
  totalCards: number;
  timeSpent?: string;
  accuracy?: number;
  colorClass?: string;
}

const PRESET_HEX_MAP: Record<string, string> = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#8b5cf6",
};

export default function SubjectCard({
  subjectId,
  title,
  progress,
  totalCards,
  timeSpent = "0min",
  accuracy = 0,
  colorClass = "indigo",
}: SubjectCardProps) {
  const router = useRouter();
  // Trata e valida a cor hexadecimal
  const hexColor = PRESET_HEX_MAP[colorClass] || colorClass || "#6366f1";

  const accuracyColor =
    accuracy >= 80
      ? "text-emerald-500 dark:text-emerald-400"
      : accuracy >= 60
        ? "text-amber-500 dark:text-amber-400"
        : "text-slate-500 dark:text-slate-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{
        borderLeftColor: hexColor,
      }}
      className="bg-white dark:bg-[#070b12] border border-slate-200 dark:border-slate-900/80 border-l-4 rounded-xl p-4 
                 cursor-pointer group relative overflow-hidden transition-all duration-300
                 hover:border-slate-300 dark:hover:border-slate-800 shadow-xs flex flex-col justify-between h-full"
    >
      {/* Brilho suave no fundo ao passar o mouse */}
      <div
        className="absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-10 pointer-events-none"
        style={{ backgroundColor: hexColor }}
      />

      <div>
        {/* Cabeçalho */}
        <div className="flex items-center justify-between relative z-10 gap-2">
          <h3
            className="font-bold transition-colors duration-300 text-slate-800 dark:text-slate-100 truncate text-sm"
            style={{ color: hexColor }}
          >
            {title}
          </h3>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
            {totalCards} {totalCards === 1 ? "assunto" : "assuntos"}
          </span>
        </div>

        {/* Corpo / Métricas */}
        <div className="mt-3 space-y-2 relative z-10">
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 tracking-wide">
            <div className="flex gap-1">
              <span className="text-slate-500">Estudado:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                {progress}%
              </span>
            </div>
            <div className="flex gap-1">
              <span className="text-slate-500">Acertos:</span>
              <span className={`font-bold font-mono ${accuracyColor}`}>
                {accuracy}%
              </span>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min(Math.max(progress, 0), 100)}%`,
                backgroundColor: hexColor,
                boxShadow: `0 0 8px ${hexColor}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Botões Diretos de Estudo */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 relative z-10">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(subjectId ? `/trilhas?subjectId=${subjectId}` : "/trilhas");
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
          title={`Ler aulas de ${title}`}
        >
          <BookOpen size={12} />
          <span>Ler Aulas</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/questions?subject=${encodeURIComponent(title)}`);
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold transition-colors cursor-pointer"
          title={`Fazer questões de ${title}`}
        >
          <HelpCircle size={12} />
          <span>Questões</span>
        </button>
      </div>
    </motion.div>
  );
}
