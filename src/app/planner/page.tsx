'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, CheckCircle2 } from 'lucide-react';

export default function PlannerPage() {
  const daysOfWeek = [
    { day: 'Segunda-feira', task: 'Português', duration: '1h 30m', completed: true },
    { day: 'Terça-feira', task: 'Raciocínio Lógico', duration: '1h 00m', completed: true },
    { day: 'Quarta-feira', task: 'Informática', duration: '2h 00m', completed: false },
    { day: 'Quinta-feira', task: 'Atualidades', duration: '45min', completed: false },
    { day: 'Sexta-feira', task: 'Revisão Geral', duration: '1h 15m', completed: false },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors group"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar para a Dashboard</span>
          </Link>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
            Cronograma Ativo
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar size={24} className="text-indigo-400" />
            Planner Semanal
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Organize suas metas semanais e acompanhe sua constância.</p>
        </div>

        {/* Schedule Cards */}
        <div className="grid grid-cols-1 gap-3">
          {daysOfWeek.map((item, index) => (
            <div 
              key={index} 
              className={`bg-[#090d16] border rounded-xl p-4 flex items-center justify-between transition-all duration-300 ${
                item.completed ? 'border-emerald-500/20 bg-emerald-500/1' : 'border-slate-800/60'
              }`}
            >
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-200">{item.day}</h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-medium ${item.completed ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {item.task}
                  </span>
                  <span className="text-slate-600 flex items-center gap-1">
                    <Clock size={12} /> {item.duration}
                  </span>
                </div>
              </div>

              <div>
                {item.completed ? (
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium">
                    <CheckCircle2 size={12} /> Concluído
                  </span>
                ) : (
                  <button className="text-xs bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg transition-colors font-medium">
                    Marcar Feito
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}