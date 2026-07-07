'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PomodoroTimer from '@/components/pomodoro-timer';
import SubjectCard from '@/components/subject-card';
import CreateSubjectModal from '@/components/create-subject-modal';
import SimulationPanel from '@/components/simulation-panel';
import SubjectCardSkeleton from '@/components/subject-card-skeleton';
import { useSidebar } from '@/lib/sidebar-context';
import { 
  Menu, BookOpen, Clock, Flame, Award, Plus, ChevronRight, Sparkles, CheckCircle2 
} from 'lucide-react';

interface Subject {
  name: string;
  color: "indigo" | "amber" | "emerald" | "rose" | "violet";
  progress: number;
  totalCards: number;
  timeSpent: string;
  accuracy: number;
}

export default function Dashboard() {
  const { openSidebar } = useSidebar();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Lista de matérias 
  const [subjects, setSubjects] = useState<Subject[]>([
    { name: "Português", color: "indigo", progress: 35, totalCards: 12, timeSpent: "1h 20m", accuracy: 82 },
    { name: "Raciocínio Lógico", color: "rose", progress: 10, totalCards: 4, timeSpent: "30min", accuracy: 65 },
    { name: "Informática", color: "amber", progress: 60, totalCards: 28, timeSpent: "3h 10m", accuracy: 78 },
    { name: "Atualidades", color: "violet", progress: 0, totalCards: 0, timeSpent: "0min", accuracy: 0 },
  ]);

  // Função disparada quando o modal envia uma nova disciplina
  const handleCreateSubject = (title: string, color: "indigo" | "amber" | "emerald" | "rose" | "violet") => {
    setSubjects((prev) => [...prev, { 
      name: title, 
      color,
      progress: 0,
      totalCards: 0,
      timeSpent: "0min",
      accuracy: 0
    }]);
  };

  const simulateStudy = (subjectName: string) => {
    setSubjects(prev => prev.map(sub => {
      if (sub.name === subjectName) {
        const nextProgress = Math.min(sub.progress + 15, 100);
        const nextCards = sub.totalCards + 5;
        const nextAccuracy = sub.accuracy === 0 ? 70 : Math.min(sub.accuracy + 2, 98);
        return {
          ...sub,
          progress: nextProgress,
          totalCards: nextCards,
          timeSpent: "45min", // Apenas para ilustrar a mudança
          accuracy: nextAccuracy
        };
      }
      return sub;
    }));
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ================= HEADER / BARRA DE JORNADA ================= */}
        <header className="bg-[#090d16] border border-slate-800/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20 text-indigo-400">
              <Award size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base">268 dias até o grande objetivo</h2>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-semibold tracking-wider">Aprox.</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Faltam aproximadamente 38 semanas e 2 dias</p>
            </div>
          </div>
          {/* Linha de Progresso Global */}
          <div className="flex-1 md:max-w-md space-y-1">
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full w-[15%] bg-linear-to-r from-indigo-500 to-violet-500 rounded-full" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-medium px-0.5">
              <span>Início</span>
              <span>15% da jornada</span>
              <span>Concurso / Meta</span>
            </div>
          </div>
        </header>

        {/* Linha de Boas-vindas atualizada com o Botão de Menu */}
        <div className="flex items-center gap-3">
          {/* Botão de Menu Hambúrguer (SÓ APARECE NO CELULAR) */}
          <button 
            onClick={openSidebar}
            className="p-2 bg-[#090d16] border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 md:hidden transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Bem-vindo de volta, parceiro!</p>
          </div>
        </div>

        {/* ================= GRADE PRINCIPAL (GRID) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SEÇÃO ESQUERDA + CENTRAL (Colunas 1 a 9) */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Bloco Superior: Revisões e Progresso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* CARD 1: Revisões do Dia */}
              <div className="bg-[#090d16] border border-slate-800/60 rounded-xl p-5 flex flex-col items-center justify-center min-h-55 text-center shadow-lg relative overflow-hidden group">
                <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-full border border-emerald-500/20 mb-3 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="font-semibold text-slate-200">Tudo em dia!</h3>
                <p className="text-xs text-slate-400 max-w-60 mt-1.5 leading-relaxed">
                  Nenhuma revisão programada para hoje. Continue assim!
                </p>
              </div>

              {/* CARD 2: Seu Progresso */}
              <div className="bg-[#090d16] border border-slate-800/60 rounded-xl p-5 flex flex-col justify-between min-h-55 shadow-lg">
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                  <span className="text-sm font-semibold text-slate-300">Seu Progresso</span>
                  <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800">Sempre</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 my-3">
                  <div className="bg-slate-950/50 border border-slate-800/40 p-3 rounded-lg">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Tempo de Estudo</span>
                    <span className="text-xl font-bold text-indigo-400 mt-1 block">0min</span>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800/40 p-3 rounded-lg flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Desempenho</span>
                    <div className="flex justify-between items-end mt-1">
                      <span className="text-xs text-emerald-400">A: 0</span>
                      <span className="text-xs text-rose-400">E: 0</span>
                      <span className="text-sm font-bold text-slate-400">0%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
                  <div className="bg-slate-950/30 py-1.5 rounded border border-slate-900"><b>0</b> Sessões</div>
                  <div className="bg-slate-950/30 py-1.5 rounded border border-slate-900"><b>0</b> Questões</div>
                  <div className="bg-slate-950/30 py-1.5 rounded border border-slate-900"><b>0min</b> Méd/Dia</div>
                </div>
              </div>

            </div>

            {/* CARD 3: Sugestões do Dia (Baseado em IA) */}
            <div className="bg-[#090d16] border border-slate-800/60 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                <Sparkles size={16} className="text-indigo-400" />
                <h3 className="font-semibold text-sm text-slate-200">Sugestões de estudos por IA</h3>
              </div>
              
              <div className="space-y-3">
                {[1, 2].map((item) => (
                  <div key={item} className="flex items-center justify-between bg-slate-950/40 border border-slate-800/40 p-3.5 rounded-xl hover:border-slate-700/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <h4 className="text-sm font-medium text-slate-200">Atividades pertinentes ao plano de estudo</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-1.5 py-0.5 rounded text-[10px]">Aula</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> 30m</span>
                      </div>
                    </div>
                    <Link href="/revisao" className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-indigo-600/5">
                        <span>Iniciar</span>
                        <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 4: Lista de Matérias com o gatilho do Modal inserido */}
            <div className="bg-[#090d16] border border-slate-800/60 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-slate-400" />
                  <h3 className="font-semibold text-sm text-slate-200">Minhas Matérias</h3>
                </div>
                {/* O clique agora ativa o estado abrindo o pop-up */}
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="p-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center active:scale-95"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Renderização dinâmica utilizando o componente isolado */}
              <div className="space-y-2">
                {isLoading ? (
                    // Renderiza 3 blocos fantasmas piscando na tela enquanto carrega
                    <>
                    <SubjectCardSkeleton />
                    <SubjectCardSkeleton />
                    <SubjectCardSkeleton />
                    </>
                ) : (
                    // Renderiza seus cards reais quando o carregamento termina
                    subjects.map((sub, idx) => (
                    <SubjectCard 
                        key={idx}
                        title={sub.name}
                        colorClass={sub.color}
                        timeSpent={sub.timeSpent}
                        accuracy={sub.accuracy}
                        progress={sub.progress}
                        totalCards={sub.totalCards}
                    />
                    ))
                )}
                </div>
            </div>
          </div>

          {/* ================= SEÇÃO DIREITA (BARRA LATERAL - Colunas 10 a 12) ================= */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* CARD 5: Calendário / Constância */}
            <div className="bg-[#090d16] border border-slate-800/60 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-sm">
                  <Flame size={16} className="fill-amber-500" />
                  <span>Constância</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Julho</span>
              </div>
              
              <div className="grid grid-cols-7 gap-2 text-center">
                {['D','S','T','Q','Q','S','S'].map((day, i) => (
                  <span key={i} className="text-[10px] text-slate-500 font-bold uppercase">{day}</span>
                ))}
                {Array.from({ length: 14 }).map((_, i) => {
                  const dayNum = i + 1;
                  const isActive = dayNum === 6 || dayNum === 12;
                  return (
                    <div 
                      key={i} 
                      className={`aspect-square flex items-center justify-center text-xs rounded-full font-semibold transition-all ${
                        isActive 
                          ? 'bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20 scale-105' 
                          : 'bg-slate-950 text-slate-600 border border-slate-900/60'
                      }`}
                    >
                      {dayNum < 10 ? `0${dayNum}` : dayNum}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* CARD 6: Simulador de Evolução (Dev) */}
            <SimulationPanel subjects={subjects} onSimulate={simulateStudy} />    

            {/* CARD 7: Timer Pomodoro Integrado */}
            <PomodoroTimer />
          </div>
        </div>

      </div>

      {/* Componente do Modal Ouvindo os Estados de Abertura */}
      <CreateSubjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreateSubject}
      />
      
    </div>
  );
}