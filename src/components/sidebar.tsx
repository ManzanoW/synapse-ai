"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/lib/sidebar-context";
import {
  LayoutDashboard,
  CalendarRange,
  Sparkles,
  Brain,
  Layers,
  ClipboardList,
  Calendar,
  User,
  HelpCircle,
  GraduationCap,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Início", href: "/dashboard", icon: LayoutDashboard },
  { label: "Planner", href: "/planner", icon: CalendarRange },
  { label: "Semana", href: "/week", icon: Sparkles },
  { label: "Analytics", href: "/analytics", icon: Brain },
  { label: "Flashcards", href: "/flashcards", icon: Layers },
  { label: "Questões", href: "/questions", icon: ClipboardList },
  { label: "Calendário", href: "/calendar", icon: Calendar },
  { label: "Perfil", href: "/profile", icon: User },
  { label: "Ajuda", href: "/help", icon: HelpCircle },
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

      <aside
        className={`
    w-64 h-screen bg-slate-950/70 backdrop-blur-2xl border-r border-white/5 
    text-slate-200 flex flex-col justify-between p-4 font-sans antialiased shrink-0 select-none
    fixed md:sticky top-0 left-0 z-50 transition-transform duration-300 ease-in-out 
    lg:col-span-3 space-y-6 animate-slide-up opacity-0 delay-200
    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xl tracking-tight">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20">
                <Brain className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-white tracking-tighter">
                Synapse<span className="text-indigo-400">AI</span>
              </span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                      : "text-slate-400 hover:text-indigo-300"
                  }`}
                >
                  {/* Efeito de Luz do item ativo */}
                  {isActive && (
                    <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 to-transparent border-l-2 border-indigo-500 rounded-l-none" />
                  )}

                  <Icon
                    className={`relative z-10 w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:translate-x-1  ${isActive ? "text-indigo-400" : ""}`}
                  />
                  <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé Consolidado com painel de fundo */}
        <div className="mt-auto p-4 bg-slate-950/30 border-t border-white/5 space-y-4">
          {/* Card do Curso */}
          <div className="bg-slate-900/40 border border-white/5 p-3 rounded-xl hover:bg-slate-900/60 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/10">
                <GraduationCap size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">
                  Curso 1
                </p>
                <p className="text-[10px] text-indigo-400/60 uppercase tracking-wider font-semibold">
                  Ativo
                </p>
              </div>
              <span className="text-slate-600 group-hover:text-slate-400">
                ›
              </span>
            </div>
          </div>

          {/* Perfil do Usuário */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 font-bold text-[10px]">
                AS
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate">
                  Estudante Synapse
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  usuario@email.com
                </p>
              </div>
            </div>
            <button className="text-slate-500 hover:text-rose-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
