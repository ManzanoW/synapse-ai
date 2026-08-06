"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSidebar } from "@/lib/sidebar-context";
import { useGamification } from "@/context/GamificationContext";
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
  Award,
  Flame,
  Zap,
  Loader2,
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
      { label: "Banco de Provas", href: "/questions", icon: FileStack },
      { label: "Cards", href: "/flashcards", icon: Layers },
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
  const { stats, isLoading } = useGamification();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const gamification = stats?.gamification;
  const streak = stats?.streak;

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
          {/* Cabeçalho */}
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

            <div className="w-28 h-px bg-linear-to-r from-transparent via-indigo-500/50 to-transparent mt-3 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          </div>

          {/* Navegação */}
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

        {/* Rodapé Premium Ultra-Refinado */}
        <div className="pt-2">
          <div className="group relative overflow-hidden rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:border-indigo-500/40 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(99,102,241,0.2)]">
            {/* Spotlight de Luz Sutil no Canto do Card */}
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />

            {/* Highlight de Borda Superior */}
            <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-indigo-400/60 to-transparent shadow-[0_0_8px_#818cf8]" />

            <div className="p-3.5 space-y-3 relative z-10">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-indigo-400" />
                </div>
              ) : (
                <>
                  {/* Topo: Patente & Streak */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(99,102,241,0.25)] group-hover:scale-105 transition-transform duration-300">
                        <Award size={16} strokeWidth={2.2} />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-indigo-300/60 leading-none mb-0.5">
                          Sua Patente
                        </span>
                        <span className="text-xs font-black text-white tracking-tight leading-none">
                          Nível {gamification?.level || 1}
                        </span>
                      </div>
                    </div>

                    {/* Streak Pill */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold font-mono shadow-[0_0_12px_rgba(244,63,94,0.18)]">
                      <Flame
                        size={13}
                        className="fill-rose-500 text-rose-500 animate-pulse"
                      />
                      <span>{streak?.currentDays || 0}d</span>
                    </div>
                  </div>

                  {/* XP & Barra de Progresso */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="flex items-center gap-1.5 font-bold text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]">
                        <Zap
                          size={11}
                          className="fill-amber-400 text-amber-400"
                        />
                        {gamification?.totalXp || 0}{" "}
                        <span className="text-slate-500 font-normal">XP</span>
                      </span>
                      <span className="text-slate-400 font-bold">
                        {Math.round(
                          gamification?.progressPercentage ??
                            ((gamification?.currentLevelXp || 0) /
                              (gamification?.nextLevelXp || 500)) *
                              100,
                        )}
                        %
                      </span>
                    </div>

                    {/* Track Tridimensional da Barra */}
                    <div className="h-2 w-full bg-slate-950/90 rounded-full border border-white/10 p-px shadow-inner overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-amber-400 via-indigo-500 to-indigo-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(129,140,248,0.8)] relative"
                        style={{
                          width: `${Math.max(
                            gamification?.progressPercentage ??
                              ((gamification?.currentLevelXp || 0) /
                                (gamification?.nextLevelXp || 500)) *
                                100,
                            4,
                          )}%`,
                        }}
                      >
                        <div className="absolute inset-0 bg-white/25 animate-pulse rounded-full" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Divisor Neon Suave */}
              <div className="h-px w-full bg-linear-to-r from-transparent via-slate-800 to-transparent my-1" />

              {/* Perfil Integrado */}
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "Avatar"}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-xl object-cover border border-indigo-400/30 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-indigo-950/90 flex items-center justify-center border border-indigo-400/30 text-indigo-300 text-[10px] font-bold shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                      {getInitials(user?.name)}
                    </div>
                  )}

                  <div className="truncate min-w-0 pr-1">
                    <p className="text-[11px] font-bold text-slate-100 truncate leading-snug">
                      {user?.name || "Estudante Synapse"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400" />
                      </span>
                      <span className="text-[8.5px] font-mono font-bold text-indigo-300 uppercase tracking-wider leading-none">
                        PRO MEMBER
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  aria-label="Sair"
                  title="Sair da conta"
                  className="p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 transition-all shrink-0"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
