'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  // Simulação rápida de dias do mês (Julho 2026)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors group">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar para a Dashboard</span>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarIcon size={24} className="text-indigo-400" />
              Calendário de Revisões
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Visualize seus blocos de repetição espaçada agendados.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-900 p-1.5 rounded-xl">
            <button className="p-1 hover:text-indigo-400 transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-xs font-semibold px-2">Julho 2026</span>
            <button className="p-1 hover:text-indigo-400 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Grid do Calendário */}
        <div className="bg-[#090d16] border border-slate-800/60 rounded-2xl p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
          </div>
          <div className="grid grid-cols-7 gap-2 h-72">
            {/* Espaçamento inicial simulado para o mês começar no dia certo */}
            <div className="bg-slate-950/20 border border-transparent rounded-lg" />
            <div className="bg-slate-950/20 border border-transparent rounded-lg" />
            
            {days.map(day => (
              <div key={day} className={`bg-slate-950 border rounded-xl p-2 flex flex-col justify-between items-start transition-colors ${day === 7 ? 'border-indigo-500/40 bg-indigo-500/2' : 'border-slate-900 hover:border-slate-800'}`}>
                <span className={`text-xs font-mono font-bold ${day === 7 ? 'text-indigo-400' : 'text-slate-500'}`}>{day}</span>
                {day % 4 === 0 && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}