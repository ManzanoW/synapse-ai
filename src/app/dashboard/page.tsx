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
  Menu, BookOpen, Clock, Flame, Award, Plus, ChevronRight, Sparkles, CheckCircle2, BarChart3, 
  Layers, ClipboardList
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
{/* 🧠 HEADER DA DASHBOARD ROBUSTO E INTEGRADO */}
<header className="w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 border-b border-slate-950 pb-8 mb-8 animate-in fade-in duration-500">
  
  {/* Lado Esquerdo: Bloco de Contagem Regressiva Expandido */}
  <div className="bg-[#090d16] border border-slate-800/60 px-5 py-4 rounded-2xl flex flex-col justify-center flex-1 max-w-md shadow-lg shadow-indigo-950/5">
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-slate-100 tracking-tight">268 dias até o grande objetivo</span>
      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider">
        Aprox.
      </span>
    </div>
    <span className="text-xs text-slate-400 mt-1 font-medium">
      Faltam aproximadamente 38 semanas e 2 dias
    </span>
  </div>

  {/* Lado Direito: Painel de Progresso da Jornada Encorpado */}
  <div className="bg-[#090d16] border border-slate-800/60 p-4 rounded-2xl flex-1 max-w-lg flex flex-col justify-center shadow-lg shadow-indigo-950/5">
    <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-2">
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        Início
      </span>
      <span className="text-indigo-400 font-bold font-mono bg-indigo-500/5 px-2 py-0.5 rounded-md border border-indigo-500/10">
        15% da jornada concluída
      </span>
      <span className="flex items-center gap-1.5 text-slate-500">
        Concurso / Meta
        <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
      </span>
    </div>
    <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900 p-0.5">
      <div className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full w-[15%] shadow-[0_0_8px_rgba(99,102,241,0.3)]" />
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

            {/* 🌟 MOTOR DE SUGESTÕES POR IA INTERATIVO */}
            <div className="bg-[#090d16] border border-slate-800/60 rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-slate-200">Sugestões de estudos por IA</h3>
                </div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-2 py-0.5 rounded font-mono font-bold uppercase">
                Synapse Core v1
                </span>
            </div>

            {/* CONTROLE DE ESTADOS DA IA */}
            <div className="space-y-3">
                {/* Card Recomendação 1 */}
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 flex items-start gap-3 hover:border-indigo-500/20 transition-colors group cursor-pointer">
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg mt-0.5 group-hover:scale-105 transition-transform">
                    <Layers size={14} />
                </div>
                <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">Rever Raciocínio Lógico</span>
                    <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded uppercase font-semibold">Crítico</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sua retenção em <span className="text-slate-200 font-medium">Tabelas Verdade</span> caiu para 68%. O algoritmo sugere revisar 8 flashcards hoje para mitigar a curva de esquecimento.
                    </p>
                </div>
                </div>

                {/* Card Recomendação 2 */}
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 flex items-start gap-3 hover:border-indigo-500/20 transition-colors group cursor-pointer">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg mt-0.5 group-hover:scale-105 transition-transform">
                    <ClipboardList size={14} />
                </div>
                <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">Fixação Teórica: Português</span>
                    <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-semibold">Sugerido</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                    Você atingiu 82% de precisão em Sintaxe! Desbloqueie o <span className="text-slate-200 font-medium">Caderno Avançado de Questões</span> para consolidar sua liderança na matéria.
                    </p>
                </div>
                </div>
            </div>

            {/* Botão de Forçar Recalibragem pela IA */}
            <button className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs py-2.5 rounded-xl transition-all font-medium flex items-center justify-center gap-1.5 active:scale-98">
                <Sparkles size={13} className="text-indigo-400" />
                <span>Otimizar Cronograma com IA</span>
            </button>
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
            
            {/* 📊 CARD DE CONSTÂNCIA (CONECTADO COM ANALYTICS) */}
            <Link 
            href="/analytics" 
            className="bg-[#090d16] border border-slate-800/60 hover:border-indigo-500/30 p-5 rounded-2xl transition-all duration-300 block group cursor-pointer shadow-lg relative overflow-hidden"
            >
            <div className="flex justify-between items-start mb-4">
                <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
                    Constância
                </h3>
                <p className="text-2xl font-black text-slate-100 mt-1">5 Dias</p>
                </div>
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-105 transition-transform">
                <Flame size={18} />
                </div>
            </div>
            
            {/* Mini indicador visual de dias */}
            <div className="flex gap-1.5 justify-between pt-2">
                {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    idx < 5 
                        ? 'bg-linear-to-br from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-orange-500/10' 
                        : 'bg-slate-950 border border-slate-900 text-slate-600'
                    }`}>
                    {day}
                    </div>
                </div>
                ))}
            </div>
            </Link>

            {/* 📈 CARD DE SEU PROGRESSO (CONECTADO COM ANALYTICS) */}
            <Link 
            href="/analytics" 
            className="bg-[#090d16] border border-slate-800/60 hover:border-indigo-500/30 p-5 rounded-2xl transition-all duration-300 block group cursor-pointer shadow-lg"
            >
            <div className="flex justify-between items-start mb-3">
                <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
                    Seu Progresso
                </h3>
                <p className="text-2xl font-black text-slate-100 mt-1">78.7%</p>
                </div>
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:scale-105 transition-transform">
                <BarChart3 size={18} />
                </div>
            </div>

            {/* Mini barra de progresso horizontal */}
            <div className="space-y-1.5 pt-2">
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                <div className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full w-[78.7%]" />
                </div>
                <span className="text-[10px] text-slate-500 block text-right font-medium">
                Meta semanal: 85%
                </span>
            </div>
            </Link>
            
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