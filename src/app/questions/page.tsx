'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, HelpCircle, ChevronRight } from 'lucide-react';

export default function QuestionsPage() {
  const qBanks = [
    { title: 'Simulado Geral OAB / Concursos', questionsCount: 80, answered: 0 },
    { title: 'Caderno Separado: Português Intermediário', questionsCount: 45, answered: 12 },
    { title: 'Foco Avançado: Raciocínio Lógico e Tabelas Verdade', questionsCount: 30, answered: 30 },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors group"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar para a Dashboard</span>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HelpCircle size={24} className="text-indigo-400" />
            Banco de Questões
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Resolva questões de provas anteriores e fixe a teoria na mente.</p>
        </div>

        {/* Notebooks Grid */}
        <div className="grid grid-cols-1 gap-4">
          {qBanks.map((bank, index) => {
            const progress = (bank.answered / bank.questionsCount) * 100;
            return (
              <div key={index} className="bg-[#090d16] border border-slate-800/60 rounded-xl p-5 hover:border-slate-700/60 transition-all duration-300 group cursor-pointer">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {bank.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {bank.answered} de {bank.questionsCount} questões resolvidas
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:translate-x-0.5 transition-transform mt-1" />
                </div>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}