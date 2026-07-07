'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/lib/sidebar-context';
import { 
  LayoutDashboard, CalendarRange, Sparkles, Brain, 
  Layers, ClipboardList, Calendar, User, HelpCircle, 
  Plus, GraduationCap, History, LogOut, X 
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Início', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Planner', href: '/planner', icon: CalendarRange },
  { label: 'Semana', href: '/week', icon: Sparkles },
  { label: 'Simulador', href: '/simulator', icon: Brain },
  { label: 'Flashcards', href: '/flashcards', icon: Layers },
  { label: 'Questões', href: '/questions', icon: ClipboardList },
  { label: 'Calendário', href: '/calendar', icon: Calendar },
  { label: 'Perfil', href: '/profile', icon: User },
  { label: 'Ajuda', href: '/help', icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();

  return (
    <>
      {/* Sombra de fundo (Overlay) que escurece a tela quando o menu abre no celular */}
      {isOpen && (
        <div 
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
        />
      )}

      <aside className={`
        w-64 h-screen bg-[#050911] border-r border-slate-900 text-slate-200 flex flex-col justify-between p-4 font-sans antialiased shrink-0 select-none
        fixed md:sticky top-0 left-0 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        <div className="space-y-6">
          {/* Logo e Botão de Fechar */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xl tracking-tight">
              <Brain className="w-6 h-6 fill-indigo-500/20" />
              <span>Synapse<span className="text-slate-100 font-medium">AI</span></span>
            </div>
            {/* Botão X - Só aparece no celular */}
            <button onClick={closeSidebar} className="text-slate-500 hover:text-slate-300 md:hidden p-1">
              <X size={20} />
            </button>
          </div>

          {/* Menu de Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar} // Fecha o menu ao clicar em um link
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium 
                        transition-all duration-200 ease-in-out group active:scale-[0.97] ${
                        isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.01]'
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
                    }`}
                    >
                    <Icon className={`w-5 h-5 transition-transform duration-300 ease-out 
                        group-hover:scale-110 group-hover:rotate-3 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                    }`} />
                    <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-900/80 my-2" />

          {/* Lembretes */}
          <div className="space-y-3 px-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Lembretes</span>
              <button className="hover:text-slate-300 p-0.5">
                <Plus size={14} />
              </button>
            </div>
            <p className="text-xs text-slate-600 italic">Nenhum lembrete</p>
          </div>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-950/40 border border-slate-900 p-2.5 rounded-xl hover:border-slate-800 transition-colors cursor-pointer group">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/10">
                <GraduationCap size={16} />
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-slate-200">Curso 1</span>
            </div>
            <span className="text-slate-600 group-hover:text-slate-400 text-xs font-bold font-mono">›</span>
          </div>

          <div className="border-t border-slate-900/80 pt-4 space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="truncate pr-2">
                <p className="text-xs font-bold text-slate-300 truncate">Estudante Synapse</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">usuario@email.com</p>
              </div>
              <button className="text-slate-500 hover:text-slate-300 p-1 bg-slate-950/20 hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-900 transition-all">
                <History size={15} />
              </button>
            </div>

            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-rose-400/80 hover:text-rose-400 transition-colors group">
              <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
              <span>Sair da conta</span>
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}