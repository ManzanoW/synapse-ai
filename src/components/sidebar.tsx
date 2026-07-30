"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSidebar } from "@/lib/sidebar-context";
import LogoutModal from "@/components/logout/logout-modal";
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

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const NAV_GROUPS = [
  {
    label: "Estudos",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Edital", href: "/edital", icon: FileSpreadsheet },
      { label: "Cronograma", href: "/week", icon: Sparkles },
    ],
  },
  {
    label: "Prática & Performance",
    items: [
      { label: "Cards", href: "/flashcards", icon: Layers },
      { label: "Banco de Provas", href: "/questions", icon: FileStack },
      { label: "Performance", href: "/performance", icon: TrendingUp },
      { label: "Calendário", href: "/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Conta",
    items: [
      { label: "Perfil", href: "/profile", icon: UserCircle2 },
      { label: "Ajuda", href: "/help", icon: Info },
    ],
  },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getInitials = (name?: string | null) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error("Erro ao encerrar sessão:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <LogoutModal
        isOpen={isLogoutModalOpen}
        isLoading={isLoggingOut}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        />
      )}

      <aside
        className={`
          w-64 h-screen bg-[#07090e] border-r border-white/6 
          text-slate-200 flex flex-col justify-between p-4 font-sans antialiased shrink-0 select-none
          fixed md:sticky top-0 left-0 z-50 transition-transform duration-300 ease-in-out 
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="space-y-6">
          {/* Cabeçalho Original */}
          <div className="flex flex-col items-center pt-2 px-2 text-center select-none">
            <div className="inline-flex items-center justify-center gap-2">
              <h1 className="font-extrabold text-slate-50 text-[1.85rem] tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.12)]">
                Synapse
              </h1>

              <div className="inline-flex items-center gap-1">
                <span className="font-black text-[1.85rem] tracking-tight bg-linear-to-r from-indigo-300 via-indigo-100 to-white bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(129,140,248,0.5)]">
                  AI
                </span>

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

            {/* Linha Divisória de Gradiente */}
            <div className="w-28 h-px bg-linear-to-r from-transparent via-indigo-500/50 to-transparent mt-3 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          </div>

          {/* Navegação Agrupada sem a barra de busca */}
          <nav className="space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1">
                <span className="px-2.5 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500/80">
                  {group.label}
                </span>

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSidebar}
                        className={`relative group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium transition-all duration-200 ${
                          isActive
                            ? "text-indigo-200 bg-indigo-500/10 font-semibold"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/3"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-indigo-400 rounded-r-full shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                        )}

                        <Icon
                          size={16}
                          strokeWidth={isActive ? 2 : 1.5}
                          className={`transition-colors duration-200 ${
                            isActive
                              ? "text-indigo-400 drop-shadow-[0_0_6px_rgba(129,140,248,0.4)]"
                              : "text-slate-500 group-hover:text-slate-300"
                          }`}
                        />

                        <span className="tracking-wide">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Rodapé Consolidado */}
        <div className="pt-2 border-t border-white/6">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30 border border-white/4 hover:border-white/10 transition-all duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "Avatar"}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-md object-cover border border-indigo-500/30 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                />
              ) : (
                <div className="w-7 h-7 rounded-md bg-indigo-950/80 flex items-center justify-center border border-indigo-500/30 text-indigo-300 text-[10px] font-bold shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.2)]">
                  {getInitials(user?.name)}
                </div>
              )}

              <div className="truncate min-w-0">
                <p className="text-[11px] font-medium text-slate-200 truncate leading-snug">
                  {user?.name || "Estudante Synapse"}
                </p>
                <p className="text-[9px] font-mono font-semibold text-indigo-400/90 uppercase tracking-wider">
                  PREMIUM
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              aria-label="Sair"
              title="Sair da conta"
              className="p-1 rounded-md hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
