"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/lib/sidebar-context";
import {
  Sparkles,
  Layers,
  LogOut,
  CalendarDays,
  LayoutDashboard,
  TrendingUp,
  FileStack,
  UserCircle2,
  Info,
  FileSpreadsheet,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Edital", href: "/planner", icon: FileSpreadsheet },
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
    w-64 h-screen bg-slate-950/80 backdrop-blur-2xl border-r border-white/5 
    text-slate-200 flex flex-col justify-between p-4 font-sans antialiased shrink-0 select-none
    fixed md:sticky top-0 left-0 z-50 transition-transform duration-300 ease-in-out 
    animate-slide-up
    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `}
      >
        <div className="space-y-6">
          {/* Cabeçalho da Sidebar */}
          <div className="flex flex-col items-center pt-6 px-4 text-center select-none">
            {/* Logotype principal */}
            <div className="inline-flex items-center justify-center gap-2">
              <h1 className="font-extrabold text-slate-50 text-[1.85rem] tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.12)]">
                Synapse
              </h1>

              <div className="inline-flex items-center gap-1">
                <span className="font-black text-[1.85rem] tracking-tight bg-linear-to-r from-indigo-300 via-indigo-100 to-white bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(129,140,248,0.5)]">
                  AI
                </span>

                {/* Partícula Vetorial 6px */}
                <div className="relative flex items-center justify-center w-2 h-2 mt-1.5">
                  <span className="absolute w-2 h-2 rounded-full bg-indigo-400/40 animate-ping" />
                  <svg
                    viewBox="0 0 8 8"
                    className="w-1.5 h-1.5 drop-shadow-[0_0_6px_#818cf8]"
                  >
                    <circle cx="4" cy="4" r="3.5" className="fill-indigo-200" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Linha laser com largura harmonizada */}
            <div className="w-32 h-px bg-linear-to-r from-transparent via-indigo-500/60 to-transparent mt-4 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          </div>

          {/* Navegação Principal */}
          <nav className="px-1 space-y-1">
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
                      ? "text-indigo-100 bg-linear-to-r from-indigo-500/10 via-indigo-500/3 to-transparent"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/3"
                  }`}
                >
                  {/* Efeito de luz e indicador lateral do item ativo */}
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-400 rounded-r-full shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
                  )}

                  {/* Ícone */}
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={`relative z-10 transition-all duration-300 group-hover:scale-105 ${
                      isActive
                        ? "text-indigo-400 drop-shadow-[0_0_6px_rgba(129,140,248,0.5)]"
                        : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />

                  {/* Label */}
                  <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5 tracking-wide">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé Consolidado */}
        <div className="pt-3 border-t border-white/6">
          <div className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/3 transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-3">
              {/* Avatar com aura de glow */}
              <div className="w-8 h-8 rounded-lg bg-indigo-950/80 flex items-center justify-center border border-indigo-500/30 text-indigo-300 text-[10px] font-bold shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                AS
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-200 group-hover:text-white transition-colors">
                  Estudante Synapse
                </p>
                <p className="text-[9px] font-bold text-indigo-400/90 uppercase tracking-widest">
                  Premium
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Sair"
              className="p-1 rounded-md hover:bg-rose-500/10 transition-colors"
            >
              <LogOut
                size={15}
                className="text-slate-500 group-hover:text-rose-400 transition-colors"
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
