'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Brain, Sparkles, Save, Calendar, ShieldCheck, Zap } from 'lucide-react';

export default function AnalyticsPage() {
  const [reviewModel, setReviewModel] = useState('bimestral');

  // Cronogramas simulados com base no modelo
  const schedules: Record<string, { label: string; day: string }[]> = {
    bimestral: [
      { label: '1ª Revisão', day: 'Dia 1' },
      { label: '2ª Revisão', day: 'Dia 3' },
      { label: '3ª Revisão', day: 'Dia 7' },
      { label: '4ª Revisão', day: 'Dia 15' },
      { label: '5ª Revisão', day: 'Dia 40' },
      { label: '6ª Revisão', day: 'Dia 60' },
    ],
    semestral: [
      { label: '1ª Revisão', day: 'Dia 1' },
      { label: '2ª Revisão', day: 'Dia 7' },
      { label: '3ª Revisão', day: 'Dia 30' },
      { label: '4ª Revisão', day: 'Dia 90' },
      { label: '5ª Revisão', day: 'Dia 180' },
    ]
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors group"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar para a Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain size={24} className="text-indigo-400" />
            Analytics & Curva de Retenção
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Monitore sua capacidade de retenção no longo prazo e calibre o algoritmo de repetição espaçada.
          </p>
        </div>

        {/* Bloco Dobrável de Calibração */}
        <div className="bg-[#090d16] border border-slate-800/60 rounded-xl p-4 cursor-pointer hover:border-slate-700/60 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Objetivos e Perfil de Memorização</h3>
              <p className="text-xs text-slate-500 mt-0.5">Calibre as variáveis do cérebro artificial conforme sua rotina.</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Expandido</span>
          </div>
        </div>

        {/* Main Grid: Gráfico à esquerda, Configurações à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Box do Gráfico (Ocupa 2 colunas) */}
          <div className="lg:col-span-2 bg-[#090d16] border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between min-h-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-radial from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="flex justify-between items-center z-10">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Zap size={16} className="text-indigo-400" />
                Predição de Retenção da Memória
              </h3>
                <span className="text-xs text-slate-500 font-mono">Última atualização: 2h atrás</span> 
            </div>

            {/* Simulação do Gráfico de Linhas Interativo */}
            <div className="flex-1 flex items-center justify-center p-6 border-b border-slate-900 relative">
              {/* No futuro injetaremos o Recharts aqui. Por enquanto, criamos uma estética premium minimalista */}
              <div className="w-full h-full flex flex-col justify-between text-[10px] font-mono text-slate-600">
                <div className="flex justify-between w-full border-b border-slate-900/40 pb-1"><span>100%</span><span>Resgate Ideal</span></div>
                <div className="flex justify-between w-full border-b border-slate-900/40 pb-1"><span>75%</span><span>Atenção Mínima</span></div>
                <div className="flex justify-between w-full border-b border-slate-900/40 pb-1"><span>50%</span><span>Zona de Esquecimento</span></div>
                <div className="flex justify-between w-full pt-1"><span>0%</span><span>Tempo (Dias)</span></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-slate-500 bg-slate-950/80 px-3 py-1.5 border border-slate-900 rounded-lg">
                  [Gráfico de Curva de Aprendizado Dinâmico]
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono mt-2 text-center">
              * O gráfico demonstra visualmente o impacto dos resgates automáticos na quebra do decaimento natural da memória.
            </div>
          </div>

          {/* Box de Controle Lateral */}
          <div className="bg-[#090d16] border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Plano de Estudos</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ajuste e visualize a eficiência das revisões automáticas.</p>
              </div>

              {/* Seletor de Modelo */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Modelo de Revisão</label>
                <select 
                  value={reviewModel} 
                  onChange={(e) => setReviewModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                >
                  <option value="bimestral">Ciclo Inteligente (Bimestral)</option>
                  <option value="semestral">Ciclo Estendido (Semestral)</option>
                </select>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2 pt-2">
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/5">
                  <Save size={14} />
                  <span>Salvar Modelo Padrão</span>
                </button>
                <button className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 font-medium py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-400" />
                  <span>Modelo Sugerido por IA</span>
                </button>
              </div>
            </div>

            {/* Cronograma Gerado Dinâmico */}
            <div className="space-y-3 pt-4 border-t border-slate-900">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">Cronograma Gerado</span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {schedules[reviewModel]?.map((sched, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-slate-950/40 border border-slate-900 px-3 py-2 rounded-lg">
                    <span className="text-slate-400">{sched.label}</span>
                    <span className="font-mono text-indigo-400 font-semibold">{sched.day}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Indicadores de Eficácia Inferiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#090d16] border border-slate-800/60 rounded-2xl p-5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                Eficácia da Memorização
              </span>
              <span className="text-emerald-400 font-bold font-mono">8.5/10</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[85%]" />
            </div>
            <p className="text-[11px] text-slate-500">Capacidade real de retenção e proteção contra o esquecimento a longo prazo.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Calendar size={14} className="text-amber-400" />
                Nível de Dificuldade / Esforço
              </span>
              <span className="text-amber-400 font-bold font-mono">4.8/10</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-[48%]" />
            </div>
            <p className="text-[11px] text-slate-500">Esforço cognitivo exigido baseado na frequência das revisões configuradas.</p>
          </div>
        </div>

      </div>
    </div>
  );
}