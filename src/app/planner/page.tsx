'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, UploadCloud, Plus, ChevronDown, 
  History, Calendar, Menu
} from 'lucide-react';

export default function PlannerPage() {
  const [viewMode, setViewMode] = useState('topics'); // 'topics' ou 'subjects'
  const [searchQuery, setSearchQuery] = useState('');

  // 📝 Dados da aba: Tópicos (Com status dinâmicos para testar os recursos)
  const topics = [
    { id: 1, title: 'Teoria da Enfermagem', subject: 'Enfermagem', relevance: '5/10', firstStudy: 'Pendente', performance: 0, lastRev: '--', nextRev: '--', color: 'text-slate-500 bg-slate-950 border-slate-900' },
    { id: 2, title: 'Planejamento, execução e controle da assistência de enfermagem', subject: 'Enfermagem', relevance: '7/10', firstStudy: 'Concluído', performance: 85, lastRev: 'Ontem', nextRev: 'Em 4 dias', color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' },
    { id: 3, title: 'Noções básicas de enfermagem médico-cirúrgica', subject: 'Enfermagem', relevance: '9/10', firstStudy: 'Pendente', performance: 0, lastRev: '--', nextRev: '--', color: 'text-slate-500 bg-slate-950 border-slate-900' },
    { id: 4, title: 'Noções básicas de enfermagem materno-infantil', subject: 'Enfermagem', relevance: '6/10', firstStudy: 'Em Revisão', performance: 64, lastRev: 'Há 3 dias', nextRev: 'Hoje', color: 'text-amber-400 bg-amber-500/5 border-amber-500/10' }
  ];

  // 📊 Dados da aba: Matérias / Edital Verticalizado
  const subjects = [
    { id: 1, name: 'Enfermagem', importance: '5/10', progressText: '0/180', progressPercent: 0, priority: '6.3', badgeColor: 'border-sky-500/30 text-sky-400 bg-sky-500/5' },
    { id: 2, name: 'Língua Portuguesa', importance: '5/10', progressText: '0/60', progressPercent: 0, priority: '6.3', badgeColor: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5' },
    { id: 3, name: 'Política de Saúde', importance: '5/10', progressText: '0/80', progressPercent: 0, priority: '6.3', badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
    { id: 4, name: 'Noções de Informática', importance: '5/10', progressText: '0/75', progressPercent: 0, priority: '6.3', badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* Back Navigation */}
        <div>
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors group">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar para a Dashboard</span>
          </Link>
        </div>

        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-[#090d16] border border-slate-800/60 p-4 rounded-2xl shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-slate-200">
              {viewMode === 'topics' ? 'Planner de Estudos' : 'Edital Verticalizado'}
            </h1>
            <div className="flex bg-slate-950 border border-slate-900 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('topics')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${viewMode === 'topics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Tópicos
              </button>
              <button 
                onClick={() => setViewMode('subjects')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${viewMode === 'subjects' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Matérias
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:flex-1 lg:justify-end">
            <div className="relative lg:max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder={viewMode === 'topics' ? "Pesquisar tópico..." : "Pesquisar matéria..."}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 text-xs font-medium px-4 py-2 rounded-xl transition-colors shrink-0">
                <UploadCloud size={14} className="text-indigo-400" />
                <span>Importar Edital</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/5 shrink-0">
                <Plus size={14} />
                <span>{viewMode === 'topics' ? 'Novo conteúdo' : 'Nova Matéria'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* CONTENÇÃO RENDERIZADA DINAMICAMENTE */}
        {viewMode === 'topics' ? (
          /* ================= LAYOUT 1: TÓPICOS (image_aff903.png) ================= */
          <div className="space-y-3">
            <div className="hidden lg:grid grid-cols-12 gap-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-5">Conteúdo</div>
              <div className="col-span-2 text-center">1º Estudo</div>
              <div className="col-span-1 text-center">Desempenho</div>
              <div className="col-span-2 text-center">Última Rev.</div>
              <div className="col-span-1 text-center">Próx. Rev.</div>
              <div className="col-span-1"></div>
            </div>

            {topics.map((topic) => (
              <div key={topic.id} className="bg-[#090d16] border border-slate-800/60 rounded-xl p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center transition-all hover:border-slate-700/50 group shadow-md">
                
                <div className="col-span-1 lg:col-span-5 space-y-2">
                  <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors leading-snug">{topic.title}</h3>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-2 py-0.5 rounded-md font-medium">{topic.subject}</span>
                    <span className="text-slate-500 font-medium">Relevância: <span className="text-slate-400 font-mono font-bold">{topic.relevance}</span></span>
                  </div>
                </div>

                <div className="col-span-1 lg:col-span-2 flex flex-col items-start lg:items-center justify-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 lg:hidden">1º Estudo</span>
                  <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${topic.color}`}>{topic.firstStudy}</span>
                </div>

                <div className="col-span-1 lg:col-span-1 flex flex-col items-start lg:items-center justify-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 lg:hidden">Desempenho</span>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold ${topic.performance > 70 ? 'border-emerald-500 text-emerald-400 bg-emerald-500/2' : topic.performance > 0 ? 'border-amber-500 text-amber-400 bg-amber-500/2' : 'border-slate-800 text-slate-500'}`}>
                    {topic.performance}%
                  </div>
                </div>

                <div className="col-span-1 lg:col-span-2 flex flex-col items-start lg:items-center justify-center text-xs text-slate-400">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 lg:hidden">Última Rev.</span>
                  <div className="flex items-center gap-1.5 font-medium"><History size={13} className="text-slate-600" /><span>{topic.lastRev}</span></div>
                </div>

                {/* 🌟 RECURSO: Alerta Visual Semântico para "Hoje" */}
                <div className="col-span-1 lg:col-span-1 flex flex-col items-start lg:items-center justify-center text-xs text-slate-400">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 lg:hidden">Próx. Rev.</span>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar size={13} className={topic.nextRev === 'Hoje' ? 'text-amber-400' : 'text-slate-600'} />
                    <span className={topic.nextRev === 'Hoje' ? 'text-amber-400 font-black animate-pulse' : ''}>
                      {topic.nextRev}
                    </span>
                  </div>
                </div>

                {/* 🌟 RECURSO: Ação Inteligente Contextualizada (1º Estudo vs Revisar) */}
                <div className="col-span-1 lg:col-span-1 flex items-center justify-between lg:justify-end gap-2.5 pt-2 lg:pt-0 border-t border-slate-900 lg:border-none">
                  <button className="p-1.5 text-slate-600 hover:text-slate-400 transition-colors hidden lg:block">
                    <Menu size={16} />
                  </button>
                  <button 
                    className={`w-full lg:w-auto text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-97 whitespace-nowrap border ${
                      topic.firstStudy === 'Pendente' 
                        ? 'bg-slate-950 hover:bg-indigo-600 border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white' 
                        : 'bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-transparent text-white shadow-md shadow-indigo-600/10'
                    }`}
                  >
                    {topic.firstStudy === 'Pendente' ? '1º Estudo' : 'Revisar'}
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          /* ================= LAYOUT 2: MATÉRIAS (image_affdc2.png) ================= */
          <div className="space-y-3">
            <div className="hidden lg:grid grid-cols-12 gap-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Matéria</div>
              <div className="col-span-2">Progresso</div>
              <div className="col-span-1 text-center">Tempo</div>
              <div className="col-span-1 text-center">Questões</div>
              <div className="col-span-1 text-center">Desemp.</div>
              <div className="col-span-3 text-center">Estudo & Revisões</div>
              <div className="col-span-1 text-right">Prioridade</div>
            </div>

            {subjects.map((sub) => (
              <div key={sub.id} className="bg-[#090d16] border border-slate-800/60 rounded-xl p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center transition-all hover:border-slate-700/50 group shadow-md">
                
                <div className="col-span-1 lg:col-span-3 space-y-1.5">
                  <div className={`border px-3 py-1.5 rounded-xl text-xs font-bold inline-block ${sub.badgeColor}`}>{sub.name}</div>
                  <span className="text-[10px] text-slate-500 font-medium block uppercase tracking-wider">Importância: <span className="font-mono font-bold text-slate-400">{sub.importance}</span></span>
                </div>

                <div className="col-span-1 lg:col-span-2 space-y-1">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-slate-300">{sub.progressText}</span>
                    <span className="text-slate-500">{sub.progressPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${sub.progressPercent}%` }} />
                  </div>
                </div>

                <div className="col-span-1 lg:col-span-1 flex flex-col items-start lg:items-center justify-center">
                  <span className="text-[9px] font-bold uppercase text-slate-600 lg:block hidden mb-1">Tempo</span>
                  <span className="text-xs font-mono text-slate-400 font-medium">-</span>
                </div>

                <div className="col-span-1 lg:col-span-1 flex flex-col items-start lg:items-center justify-center">
                  <span className="text-[9px] font-bold uppercase text-slate-600 lg:block hidden mb-1">Questões</span>
                  <span className="text-xs font-mono text-slate-400 font-medium">-</span>
                </div>

                <div className="col-span-1 lg:col-span-1 flex flex-col items-start lg:items-center justify-center">
                  <span className="text-[9px] font-bold uppercase text-slate-600 lg:block hidden mb-1">Desemp.</span>
                  <span className="text-xs font-mono text-slate-400 font-medium">-</span>
                </div>

                <div className="col-span-1 lg:col-span-3 flex flex-col items-start lg:items-center justify-center">
                  <span className="text-[9px] font-bold uppercase text-slate-600 lg:block hidden mb-0.5">Estudo & Revisões</span>
                  <span className="text-xs text-slate-400 font-medium">Nenhum estudo ainda</span>
                </div>

                <div className="col-span-1 lg:col-span-1 flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t border-slate-900 lg:border-none">
                  <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl font-mono">Prioridade: {sub.priority}</span>
                  <button className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"><ChevronDown size={16} /></button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}