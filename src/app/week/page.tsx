'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, RefreshCw, Sparkles, Plus, Info } from 'lucide-react';

export default function WeekPage() {
  // Simulação das matérias distribuídas por dias (baseado na imagem_af08c6.png)
  const scheduleDays = [
    {
      day: 'Segunda',
      blocks: [
        { subject: 'Língua Portuguesa', time: '1h 30m', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/5' },
        { subject: 'Noções de Informática', time: '30m', color: 'border-amber-500/40 text-amber-400 bg-amber-500/5' },
      ]
    },
    {
      day: 'Terça',
      blocks: [
        { subject: 'Enfermagem', time: '1h 30m', color: 'border-sky-500/40 text-sky-400 bg-sky-500/5' },
        { subject: 'Política de Saúde', time: '30m', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5' },
      ]
    },
    {
      day: 'Quarta',
      blocks: [
        { subject: 'Política de Saúde', time: '1h 30m', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5' },
        { subject: 'Noções de Informática', time: '30m', color: 'border-amber-500/40 text-amber-400 bg-amber-500/5' },
      ]
    },
    {
      day: 'Quinta',
      blocks: [
        { subject: 'Língua Portuguesa', time: '1h 30m', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/5' },
        { subject: 'Língua Portuguesa', time: '30m', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/5' },
      ]
    },
    {
      day: 'Sexta',
      blocks: [
        { subject: 'Enfermagem', time: '1h 30m', color: 'border-sky-500/40 text-sky-400 bg-sky-500/5' },
        { subject: 'Política de Saúde', time: '30m', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5' },
      ]
    }
  ];

  // Distribuição lateral
  const distribution = [
    { name: 'Língua Portuguesa', time: '4h 45m', dot: 'bg-indigo-500' },
    { name: 'Enfermagem', time: '4h 30m', dot: 'bg-sky-500' },
    { name: 'Política de Saúde', time: '3h 30m', dot: 'bg-emerald-500' },
    { name: 'Noções de Informática', time: '2h 15m', dot: 'bg-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-6xl mx-auto space-y-6">
        
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

        {/* Sub-Header Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#090d16] border border-slate-800/50 p-2 rounded-xl">
          <button className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 text-xs font-semibold px-4 py-2 rounded-lg text-indigo-400 shadow-sm">
            <CalendarDays size={14} />
            <span>Cronograma Semanal</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-1.5 py-0.5 rounded uppercase font-bold">Ativo</span>
          </button>
          
          <button className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg transition-colors">
            <RefreshCw size={13} />
            <span>Ciclo de Estudos</span>
            <Plus size={12} className="text-slate-500" />
          </button>
        </div>

        {/* Page Title Row */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-slate-200">Seu Planejamento</h1>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
            <Sparkles size={11} /> Sugestões Ativas
          </span>
        </div>

        {/* Main Workspace Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LADO ESQUERDO: Lista de Dias e Blocos (Ocupa 2 colunas) */}
          <div className="lg:col-span-2 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                {scheduleDays.map((sched, idx) => (
                <div 
                    key={idx} 
                    className="bg-[#090d16] border border-slate-800/60 rounded-xl p-4 space-y-3 transition-all hover:border-slate-700/50"
                >
                <h3 className="text-xs font-bold text-slate-400 tracking-wide">{sched.day}</h3>
                
                <div className="flex flex-wrap items-center gap-3">
                  {sched.blocks.map((block, bIdx) => (
                    <div 
                      key={bIdx} 
                      className={`border px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-medium min-w-45 transition-all hover:border-slate-700 cursor-pointer ${block.color}`}
                    >
                      <div className="w-3 h-3 rounded-full border border-current flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-current" />
                      </div>
                      <span className="truncate flex-1">{block.subject}</span>
                      <span className="text-slate-400 text-[10px] font-mono">{block.time}</span>
                    </div>
                  ))}

                  {/* Botão de Adicionar Bloco no Dia */}
                  <button className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-500 hover:text-slate-300 flex items-center justify-center transition-all active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}

            <button className="bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 text-xs font-medium px-4 py-2.5 rounded-xl transition-colors">
              Editar configurações
            </button>
          </div>

          {/* LADO DIREITO: Distribuição e Carga Horária (Sidebar) */}
          <div className="bg-[#090d16] border border-slate-800/60 rounded-2xl p-5 space-y-6 lg:sticky lg:top-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 ease-out fill-mode-both">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Distribuição</h3>
              <p className="text-xs text-slate-500 mt-0.5">Veja a eficácia da repetição espaçada.</p>
            </div>

            {/* Simulação do Gráfico de Rosquinha Centralizado */}
            <div className="flex justify-center py-4 relative">
              <div className="w-36 h-36 rounded-full border-12 border-indigo-500 flex flex-col items-center justify-center relative shadow-indigo-500/2">
                {/* Bordas falsas coloridas para simular os pedaços da rosquinha */}
                <div className="absolute inset-0 rounded-full border-12 border-sky-500 clip-path-falsa-1 pointer-events-none opacity-90" />
                <div className="absolute inset-0 rounded-full border-12 border-emerald-500 clip-path-falsa-2 pointer-events-none opacity-90" />
                
                <span className="text-lg font-black text-slate-100">10h 0m</span>
                <span className="text-[10px] text-slate-500 font-medium">na semana</span>
              </div>
            </div>

            {/* Legenda das Matérias */}
            <div className="space-y-2.5 pt-2 border-t border-slate-900">
              {distribution.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-medium">
                  <div className="flex items-center gap-2 text-slate-400 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                    <span className="truncate">{item.name}:</span>
                  </div>
                  <span className="font-mono text-slate-200 pl-2 shrink-0">{item.time}</span>
                </div>
              ))}
            </div>

            {/* Hint Informativo Inferior */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 flex gap-2 items-start">
              <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-normal">
                você pode reorganizar como quiser arrastando as matérias ou clicando no tempo de estudo
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}