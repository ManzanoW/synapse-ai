'use client';

import React from 'react';

// Tipagem das propriedades para garantir a segurança com TypeScript
interface SubjectCardProps {
  name: string;
  colorClass: string;
  timeSpent: string;
  accuracy: number;
}

export default function SubjectCard({ name, colorClass, timeSpent, accuracy }: SubjectCardProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-950/30 transition-colors border border-transparent hover:border-slate-800/40">
      {/* Nome da Matéria com a estilização dinâmica */}
      <span className={`text-xs px-2.5 py-1 rounded-md border font-medium ${colorClass}`}>
        {name}
      </span>
      
      {/* Métricas de tempo e desempenho */}
      <div className="flex items-center gap-8 text-xs text-slate-400 font-medium">
        <span>{timeSpent} total</span>
        <span className="text-slate-500">
          Acertos: <b className="text-slate-400">{accuracy}%</b>
        </span>
      </div>
    </div>
  );
}