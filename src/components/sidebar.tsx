"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { logoutAction } from "@/actions/auth-actions";
import { useSidebar } from "@/lib/sidebar-context";
import { useGamification } from "@/context/GamificationContext";
import LogoutModal from "@/components/logout/logout-modal";
import { PrestigeModal } from "@/components/gamification/prestige-modal";
import { useAudioContext } from "@/contexts/AudioContext";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";
import { AiQuotaBadge } from "@/components/quota/AiQuotaBadge";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";
import { getAiQuotaStatusAction } from "@/actions/quota-actions";
import {
  Sparkles,
  Layers,
  LogOut,
  MessageSquarePlus,
  CalendarDays,
  LayoutDashboard,
  TrendingUp,
  FileStack,
  UserCircle2,
  Info,
  FileSpreadsheet,
  Award,
  Flame,
  Trophy,
  Zap,
  Loader2,
  Search,
  Volume2,
  VolumeX,
  Crown,
  BookOpenCheck,
  Shield,
  Headphones,
  PenTool,
} from "lucide-react";

interface SidebarProps {
  user?: {
    id?: string;
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
      {
        label: "Redação Oficial",
        href: "/redacao",
        icon: PenTool,
        badge: "IA",
      },
      {
        label: "Caderno de Erros",
        href: "/notebook",
        icon: BookOpenCheck,
        badge: "IA",
      },
      {
        label: "Sala de Foco",
        href: "/study-room",
        icon: Headphones,
        badge: "ZEN",
      },
      { label: "Cards", href: "/flashcards", icon: Layers },
      { label: "Performance", href: "/performance", icon: TrendingUp },
      {
        label: "Conquistas",
        href: "/achievements",
        icon: Trophy,
        isSpecial: true,
      },
      { label: "Calendário", href: "/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Conta",
    items: [
      {
        label: "Seja Premium",
        href: "/pricing",
        icon: Crown,
        badge: "PRO",
      },
      { label: "Perfil", href: "/profile", icon: UserCircle2 },
      { label: "Ajuda", href: "/help", icon: Info },
    ],
  },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isOpen, closeSidebar } = useSidebar();
  const { stats, isLoading, refreshStats } = useGamification();
  const { isMuted, toggleMute } = useAudioContext();

  const isDemo =
    searchParams?.get("demo") === "true" ||
    (typeof window !== "undefined" &&
      (window.location.search.includes("demo=true") ||
        localStorage.getItem("synapse_demo_active") === "true"));

  const getHref = (href: string) => {
    if (!isDemo) return href;
    const sep = href.includes("?") ? "&" : "?";
    return `${href}${sep}demo=true`;
  };

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPrestigeModalOpen, setIsPrestigeModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      refreshStats(user.id);
    }
  }, [user?.id, refreshStats]);

  useEffect(() => {
    const handleXpUpdate = () => {
      if (user?.id) {
        refreshStats(user.id);
      }
    };

    window.addEventListener("xp-updated", handleXpUpdate);
    return () => window.removeEventListener("xp-updated", handleXpUpdate);
  }, [user?.id, refreshStats]);

  const gamification = stats?.gamification;
  const streak = stats?.streak;

  const currentLevel = gamification?.level || 1;
  const currentPrestige = gamification?.prestige || 0;
  const canAscendPrestige = currentLevel >= 50;

  const [userPlan, setUserPlan] = useState<string>("PRO MEMBER");

  useEffect(() => {
    getAiQuotaStatusAction()
      .then((res) => {
        if (res.success && res.data) {
          if (
            res.data.isUnlimited ||
            res.data.planTier === "PREMIUM" ||
            res.data.role === "ADMIN"
          ) {
            setUserPlan("PRO MEMBER");
          } else {
            setUserPlan("PLANO BÁSICO");
          }
        }
      })
      .catch(() => {});
  }, []);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const trimmed = name.trim();
    return trimmed.length > 0 ? trimmed[0].toUpperCase() : "U";
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);

      // 1. Invoca a Server Action para limpar todos os cookies no servidor
      try {
        await logoutAction();
      } catch (err) {
        console.warn("Aviso ao executar logoutAction no servidor:", err);
      }

      // 2. Limpar localStorage e sessionStorage no cliente
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("synapse_demo_active");
          localStorage.removeItem("synapse-demo-session");
          localStorage.removeItem("auth_token");
          sessionStorage.removeItem("synapse_demo_active");
          sessionStorage.removeItem("synapse-demo-session");
          sessionStorage.removeItem("auth_token");

          // Remove explicitamente os cookies no cliente via document.cookie
          const cookiesToClear = [
            "synapse_demo_active",
            "synapse-demo-session",
            "auth_token",
            "authjs.session-token",
            "__Secure-authjs.session-token",
            "authjs.csrf-token",
            "__Host-authjs.csrf-token",
            "authjs.callback-url",
            "__Secure-authjs.callback-url",
            "next-auth.session-token",
            "__Secure-next-auth.session-token",
            "next-auth.csrf-token",
            "next-auth.callback-url",
          ];
          cookiesToClear.forEach((name) => {
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=None; Secure`;
          });
        } catch (storageErr) {
          console.error("Erro ao limpar dados locais de autenticação:", storageErr);
        }
      }

      // 3. Encerrar sessão no cliente via next-auth
      try {
        await signOut({ redirect: false });
      } catch (signOutErr) {
        console.warn("Aviso ao executar signOut no cliente:", signOutErr);
      }

      // 4. Fechar modal, atualizar árvore de rotas e navegar para /login
      setIsLogoutModalOpen(false);
      router.refresh();
      router.push("/login");
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

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />

      {user?.id && (
        <PrestigeModal
          isOpen={isPrestigeModalOpen}
          onClose={() => setIsPrestigeModalOpen(false)}
          userId={user.id}
          currentPrestige={currentPrestige}
        />
      )}

      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        />
      )}

      <aside
        className={`
          w-64 h-screen bg-[#07090e] border-r border-white/6 
          text-slate-200 flex flex-col p-3.5 font-sans antialiased shrink-0 select-none
          fixed md:sticky top-0 left-0 z-50 transition-transform duration-300 ease-in-out 
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Cabeçalho Fixo & Busca */}
        <div className="shrink-0 space-y-4 pb-2">
          {/* Logo */}
          <div className="flex flex-col items-center pt-1 px-2 text-center select-none">
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

            <div className="w-28 h-px bg-linear-to-r from-transparent via-indigo-500/50 to-transparent mt-2.5 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          </div>

          {/* Busca rápida, Notificações & Volume */}
          <div className="px-1 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                closeSidebar();
                window.dispatchEvent(new CustomEvent("open-command-palette"));
              }}
              className="flex-1 min-w-0 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-slate-200 transition-all text-xs cursor-pointer group"
            >
              <div className="flex items-center gap-2 truncate">
                <Search
                  size={14}
                  className="text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0"
                />
                <span className="font-medium truncate">Busca...</span>
              </div>
              <kbd className="font-mono text-[10px] text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shrink-0">
                ⌘K
              </kbd>
            </button>

            {/* Central de Notificações Inteligentes */}
            <NotificationsPopover onNavigate={closeSidebar} />

            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? "Ativar som" : "Silenciar som"}
              aria-label={isMuted ? "Ativar som" : "Silenciar som"}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isMuted
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-indigo-300 hover:bg-white/10 hover:border-indigo-500/30"
              }`}
            >
              {isMuted ? (
                <VolumeX
                  size={15}
                  className="transition-transform active:scale-95"
                />
              ) : (
                <Volume2
                  size={15}
                  className="transition-transform active:scale-95"
                />
              )}
            </button>
          </div>
        </div>

        {/* Navegação com Rolagem Independente */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 space-y-4 pr-1 -mr-1 custom-scrollbar">
          <nav className="space-y-4">
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

                    const isSpecial = item.isSpecial;

                    return (
                      <React.Fragment key={item.href}>
                        <Link
                          href={getHref(item.href)}
                          onClick={closeSidebar}
                          className={`relative group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium transition-all duration-200 ${
                            isActive
                              ? isSpecial
                                ? "text-amber-200 bg-amber-500/10 font-semibold border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                                : "text-indigo-200 bg-indigo-500/10 font-semibold"
                              : "text-slate-400 hover:text-slate-200 hover:bg-white/3"
                          }`}
                        >
                          {isActive && (
                            <div
                              className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full ${
                                isSpecial
                                  ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]"
                                  : "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                              }`}
                            />
                          )}

                          <Icon
                            size={16}
                            strokeWidth={isActive ? 2 : 1.5}
                            className={`transition-all duration-200 ${
                              isActive
                                ? isSpecial
                                  ? "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                                  : "text-indigo-400 drop-shadow-[0_0_6px_rgba(129,140,248,0.4)]"
                                : "text-slate-500 group-hover:text-slate-300"
                            }`}
                          />

                          <span className="tracking-wide">{item.label}</span>

                          {"badge" in item && Boolean((item as any).badge) && (
                            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 tracking-tight">
                              {(item as any).badge}
                            </span>
                          )}
                        </Link>

                        {/* Cota Diária de IA integrada na seção de Conta */}
                        {item.href === "/pricing" && (
                          <div className="pt-0.5 pb-1 px-1">
                            <AiQuotaBadge />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Botão de Dar Feedback integrado na seção Conta */}
                  {group.label.toLowerCase() === "conta" && (
                    <button
                      type="button"
                      onClick={() => {
                        closeSidebar();
                        setIsFeedbackModalOpen(true);
                      }}
                      className="w-full relative group flex items-center justify-between px-2.5 py-2 rounded-md text-[12px] font-medium text-slate-400 hover:text-white hover:bg-white/3 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageSquarePlus
                          size={16}
                          className="text-amber-400 group-hover:scale-110 transition-transform"
                        />
                        <span className="tracking-wide">Dar Feedback</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/20">
                        BETA
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Rodapé Fixo: Card de Gamificação & Usuário (Idêntico à Imagem de Referência) */}
        <div className="shrink-0 pt-2.5">
          <div className="group relative overflow-hidden rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:border-indigo-500/40 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(99,102,241,0.2)]">
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />
            <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-indigo-400/60 to-transparent shadow-[0_0_8px_#818cf8]" />

            <div className="p-3.5 space-y-3 relative z-10">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-indigo-400" />
                </div>
              ) : (
                <>
                  {/* Linha Superior: Ícone da Patente + Nível + Ofensiva */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                          gamification?.prestigeTier?.badgeColor ||
                          "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                        }`}
                      >
                        <Award
                          size={17}
                          strokeWidth={2.2}
                          className={
                            gamification?.prestigeTier?.iconColor ||
                            "text-indigo-400"
                          }
                        />
                      </div>
                      <div className="flex flex-col justify-center min-w-0 pr-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 leading-none truncate block max-w-[100px]">
                            {gamification?.title || "NEÓFITO DOS ESTUDOS"}
                          </span>
                          {currentPrestige > 0 && (
                            <span className="text-[7.5px] font-mono font-black px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                              P{currentPrestige}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-black text-white tracking-tight leading-none mt-1">
                          Nível {currentLevel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {canAscendPrestige && (
                        <button
                          type="button"
                          onClick={() => setIsPrestigeModalOpen(true)}
                          title="Ascender Prestígio!"
                          className="cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-black font-mono animate-bounce"
                        >
                          <Crown size={11} />
                          <span>ASCENDER</span>
                        </button>
                      )}

                      {Boolean(streak?.streakFreezes && streak.streakFreezes > 0) && (
                        <div
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold font-mono shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                          title={`${streak?.streakFreezes} Congelamento(s) de Ofensiva ativo(s) — seu streak está protegido contra faltas acidentais!`}
                        >
                          <Shield size={11} className="fill-cyan-400/30 text-cyan-400" />
                          <span>{streak?.streakFreezes}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold font-mono shadow-[0_0_12px_rgba(244,63,94,0.18)]">
                        <Flame
                          size={13}
                          className="fill-rose-500 text-rose-500 animate-pulse"
                        />
                        <span>{streak?.currentDays || 0}d</span>
                      </div>
                    </div>
                  </div>

                  {/* Linha Central: Barra de XP */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="flex items-center gap-1 font-bold text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]">
                        <Zap
                          size={12}
                          className="fill-amber-400 text-amber-400"
                        />
                        {gamification?.totalXp || 0}{" "}
                        <span className="text-slate-500 font-normal">XP</span>
                      </span>
                      <span className="text-slate-400 font-bold text-[10px]">
                        {gamification?.progressPercentage ?? 0}%
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-950/90 rounded-full border border-white/10 p-px shadow-inner overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 via-indigo-500 to-indigo-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(129,140,248,0.8)] relative"
                        style={{
                          width: `${Math.max(
                            gamification?.progressPercentage ?? 0,
                            4,
                          )}%`,
                        }}
                      >
                        <div className="absolute inset-0 bg-white/25 animate-pulse rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Linha Divisória */}
                  <div className="h-px w-full bg-linear-to-r from-transparent via-slate-800 to-transparent my-1" />

                  {/* Linha Inferior: Usuário, Avatar Teal, Plano & Sair (Idêntico à Imagem 3) */}
                  <div className="flex items-center justify-between pt-0.5">
                    <Link
                      href={getHref("/profile")}
                      onClick={closeSidebar}
                      className="flex items-center gap-2.5 min-w-0 group/user cursor-pointer"
                      title="Ver seu perfil"
                    >
                      {user?.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || "Avatar"}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-xl object-cover border border-teal-400/40 shrink-0 shadow-md shadow-teal-950/40"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-teal-500 hover:bg-teal-400 transition-colors flex items-center justify-center text-white text-sm font-black shrink-0 shadow-md shadow-teal-950/50">
                          {getInitials(user?.name)}
                        </div>
                      )}

                      <div className="truncate min-w-0 pr-1">
                        <p className="text-[12px] font-bold text-slate-100 group-hover/user:text-teal-300 transition-colors truncate leading-snug">
                          {user?.name || "Johnny Plays"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="relative flex h-1.5 w-1.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400" />
                          </span>
                          <span className="text-[9px] font-mono font-bold text-indigo-300 uppercase tracking-wider leading-none">
                            {userPlan}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        closeSidebar();
                        setIsLogoutModalOpen(true);
                      }}
                      aria-label="Sair"
                      title="Sair da conta"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all shrink-0 cursor-pointer"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
