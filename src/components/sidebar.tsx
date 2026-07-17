"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/lib/sidebar-context";
import {
  CalendarRange,
  Sparkles,
  Brain,
  Layers,
  ClipboardList,
  User,
  HelpCircle,
  LogOut,
  AppWindow,
  Activity,
  CalendarDays,
  FileText,
  LayoutDashboard,
  CalendarClock,
  TrendingUp,
  FileStack,
  UserCircle2,
  Info,
} from "lucide-react";
import Image from "next/image";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agenda", href: "/planner", icon: CalendarClock },
  { label: "Visão Geral", href: "/week", icon: Sparkles },
  { label: "Performance", href: "/analytics", icon: TrendingUp },
  { label: "Cards", href: "/flashcards", icon: Layers },
  { label: "Banco de Provas", href: "/questions", icon: FileStack },
  { label: "Cronograma", href: "/calendar", icon: CalendarDays },
  { label: "Perfil", href: "/profile", icon: UserCircle2 },
  { label: "Ajuda", href: "/help", icon: Info },
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
          <div className="flex flex-col items-center justify-center pt-10 pb-8 px-6">
            {/* Aumentamos para 64px ou 80px para dar presença */}
            <Image
              width={80}
              height={80}
              src="/Synapse-icon.png"
              alt="Synapse AI Logo"
              className="synapse-logo-glow mb-4"
            />

            {/* Texto centralizado abaixo */}
            <div className="flex items-baseline justify-center">
              <h1 className="mt-4 text-2xl font-semibold text-white">
                Synapse <span className="text-indigo-400 font-light">AI</span>
              </h1>

              {/* Linha separadora */}
            </div>
            <div className="w-16 h-[1px] bg-white/10 mt-6 mb-2"></div>
          </div>

          <nav className="px-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-300 overflow-hidden ${
                    isActive
                      ? "text-indigo-100 bg-white/[0.03]"
                      : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Efeito de luz do item ativo (Mais sutil e elegante) */}
                  {isActive && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                  )}

                  {/* Ícone com escala suave */}
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={`relative z-10 transition-all duration-300 group-hover:scale-105 group-hover:translate-x-0.5 ${
                      isActive
                        ? "text-indigo-400"
                        : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />

                  {/* Label com movimento contido */}
                  <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5 tracking-wide">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé Consolidado */}
        <div className="p-4 border-t border-white/[0.05]">
          <div className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.02] transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                AS
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-300">
                  Estudante Synapse
                </p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest">
                  Premium
                </p>
              </div>
            </div>
            <LogOut
              size={14}
              className="text-slate-600 group-hover:text-rose-400 transition-colors"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
