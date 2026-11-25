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
import { getUserCareerFocusAction } from "@/actions/edital-templates-actions";
import { isLawFocused } from "@/lib/career-utils";
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
  Scale,
  Mic,
  ScrollText,
  Sun,
  Eye,
  Contrast,
  Moon,
  X,
  Cpu,
  Brain,
  UploadCloud,
  ChevronDown,
  Compass,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { clearSensitiveUserStorage } from "@/lib/privacy/clear-user-storage";

interface SidebarProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    careerFocus?: string | null;
    targetRole?: string | null;
    planTier?: string | null;
    role?: string | null;
    isPro?: boolean;
    isAdmin?: boolean;
  };
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: string;
  isSpecial?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "planejamento",
    label: "Estudo Diário",
    items: [
      { label: "Início (Meu Dia)", href: "/dashboard", icon: LayoutDashboard },
      { label: "Meu Edital", href: "/edital", icon: FileSpreadsheet },
      { label: "Trilhas & Aulas", href: "/trilhas", icon: Compass },
      { label: "Cronograma Semanal", href: "/week", icon: CalendarDays },
    ],
  },
  {
    id: "pratica",
    label: "Prática & Revisão",
    items: [
      { label: "Simulados & Questões", href: "/questions", icon: FileStack },
      { label: "Flashcards", href: "/flashcards", icon: Layers },
      {
        label: "Caderno de Erros",
        href: "/notebook",
        icon: BookOpenCheck,
      },
      {
        label: "Redação Oficial",
        href: "/redacao",
        icon: PenTool,
      },
    ],
  },
  {
    id: "evolucao",
    label: "Desempenho",
    items: [
      { label: "Meu Desempenho", href: "/performance", icon: TrendingUp },
      {
        label: "Ligas Semanais",
        href: "/leaderboard",
        icon: Trophy,
      },
    ],
  },
  {
    id: "ferramentas",
    label: "Ferramentas Extras",
    items: [
      {
        label: "Sala de Foco (Timer)",
        href: "/study-room",
        icon: Headphones,
      },
      {
        label: "Mapas Mentais",
        href: "/mapas-mentais",
        icon: Brain,
      },
      {
        label: "Lei Seca Interativa",
        href: "/lei-seca",
        icon: ScrollText,
      },
      {
        label: "Jurisprudência",
        href: "/jurisprudencia",
        icon: Scale,
      },
      {
        label: "Treino de Prova Oral",
        href: "/prova-oral",
        icon: Mic,
      },
    ],
  },
  {
    id: "conta",
    label: "Conta & Suporte",
    items: [
      {
        label: "Planos & Assinatura",
        href: "/pricing",
        icon: Crown,
        isSpecial: true,
        badge: "PRO",
      },
      { label: "Meu Perfil", href: "/profile", icon: UserCircle2 },
      { label: "Ajuda & Suporte", href: "/help", icon: Info },
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
  const { isLight, toggleTheme, isHighContrast, toggleHighContrast } = useTheme();

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

  const isInitialPro = Boolean(
    user?.isPro ||
    user?.planTier === "PREMIUM" ||
    user?.planTier === "ELITE" ||
    user?.role === "ADMIN" ||
    user?.isAdmin
  );

  const [userPlan, setUserPlan] = useState<string>(() =>
    user?.planTier === "ELITE"
      ? "ELITE MEMBER 👑"
      : isInitialPro
      ? "PRO MEMBER"
      : "PLANO BÁSICO"
  );
  const [hasLawFocus, setHasLawFocus] = useState<boolean>(() =>
    isLawFocused(user?.careerFocus, user?.targetRole)
  );

  useEffect(() => {
    if (user?.planTier === "ELITE") {
      setUserPlan("ELITE MEMBER 👑");
    } else if (user?.isPro || user?.planTier === "PREMIUM" || user?.role === "ADMIN") {
      setUserPlan("PRO MEMBER");
    }
  }, [user?.isPro, user?.planTier, user?.role]);

  useEffect(() => {
    setHasLawFocus(isLawFocused(user?.careerFocus, user?.targetRole));
  }, [user?.careerFocus, user?.targetRole]);

  useEffect(() => {
    // Se a prop não estiver populada, consulta a Server Action
    if (!user?.careerFocus) {
      getUserCareerFocusAction().then((res) => {
        if (res.success) {
          setHasLawFocus(isLawFocused(res.careerFocus, res.targetRole));
        }
      });
    }

    const handleCareerUpdate = () => {
      getUserCareerFocusAction().then((res) => {
        if (res.success) {
          setHasLawFocus(isLawFocused(res.careerFocus, res.targetRole));
        }
      });
    };

    window.addEventListener("career-updated", handleCareerUpdate);
    return () => window.removeEventListener("career-updated", handleCareerUpdate);
  }, [user?.careerFocus]);

  useEffect(() => {
    const checkQuota = () => {
      getAiQuotaStatusAction()
        .then((res) => {
          if (res.success && res.data) {
            if (res.data.planTier === "ELITE") {
              setUserPlan("ELITE MEMBER 👑");
            } else if (
              res.data.isUnlimited ||
              res.data.planTier === "PREMIUM" ||
              res.data.role === "ADMIN" ||
              user?.isPro
            ) {
              setUserPlan("PRO MEMBER");
            } else {
              setUserPlan("PLANO BÁSICO");
            }
          }
        })
        .catch(() => {});
    };

    checkQuota();

    window.addEventListener("plan-updated", checkQuota);
    window.addEventListener("subscription-updated", checkQuota);
    return () => {
      window.removeEventListener("plan-updated", checkQuota);
      window.removeEventListener("subscription-updated", checkQuota);
    };
  }, [user?.isPro]);

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
          clearSensitiveUserStorage();
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

  const isAdmin = Boolean(
    user?.isAdmin || user?.role === "ADMIN"
  );

  // Estado para seções colapsadas com persistência no localStorage (secundárias colapsadas por padrão)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    ferramentas: true,
    conta: true,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("synapse_sidebar_collapsed_groups");
      if (saved) {
        setCollapsedGroups(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Ao navegar para uma nova rota, expande automaticamente o grupo de destino caso estivesse colapsado
  useEffect(() => {
    const activeGroup = NAV_GROUPS.find((g) =>
      g.items.some((item) =>
        item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`)
      )
    );
    if (activeGroup) {
      setCollapsedGroups((prev) => {
        if (prev[activeGroup.id]) {
          const next = { ...prev, [activeGroup.id]: false };
          try {
            localStorage.setItem(
              "synapse_sidebar_collapsed_groups",
              JSON.stringify(next)
            );
          } catch {}
          return next;
        }
        return prev;
      });
    }
  }, [pathname]);

  const toggleGroupCollapse = (groupId: string) => {
    triggerHaptic("light");
    setCollapsedGroups((prev) => {
      const willCollapse = !prev[groupId];
      const next: Record<string, boolean> = { ...prev, [groupId]: willCollapse };
      // Modo Accordion nas seções secundárias para nunca estourar a altura da tela
      if (!willCollapse && (groupId === "ferramentas" || groupId === "conta")) {
        const otherId = groupId === "ferramentas" ? "conta" : "ferramentas";
        next[otherId] = true;
      }
      try {
        localStorage.setItem(
          "synapse_sidebar_collapsed_groups",
          JSON.stringify(next)
        );
      } catch {}
      return next;
    });
  };

  const getBadgeStyles = (badge: string) => {
    switch (badge) {
      case "IA":
        return "bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30";
      case "OCR":
        return "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30";
      case "ZEN":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30";
      case "D30":
        return "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30";
      case "PRO":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30";
      case "VOZ":
        return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:border-fuchsia-500/30";
      case "DEV":
        return "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30";
      case "BETA":
        return "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10";
    }
  };

  // Filtra módulos de Direito/Carreiras Jurídicas e adiciona link do Admin IA se for administrador
  const filteredNavGroups = NAV_GROUPS.map((group) => {
    if (group.id === "pratica" || group.id === "ferramentas") {
      return {
        ...group,
        items: group.items.filter((item) => {
          if (item.href === "/jurisprudencia" || item.href === "/prova-oral") {
            return hasLawFocus;
          }
          return true;
        }),
      };
    }
    if (group.id === "conta") {
      if (!isAdmin) return group;
      const hasAdmin = group.items.some((i) => i.href === "/admin/ai");
      if (hasAdmin) return group;
      return {
        ...group,
        items: [
          ...group.items,
          {
            label: "Cockpit Admin IA",
            href: "/admin/ai",
            icon: Cpu,
            badge: "DEV",
            isSpecial: true,
          },
        ],
      };
    }
    return group;
  });

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
          w-72 sm:w-64 max-w-[85vw] h-screen h-[100dvh] max-h-[100dvh] bg-white dark:bg-[#09090B] border-r border-slate-200 dark:border-zinc-800/80 
          text-slate-800 dark:text-zinc-200 flex flex-col p-3.5 font-sans antialiased shrink-0 select-none
          fixed md:sticky top-0 left-0 z-50 transition-transform duration-300 ease-in-out 
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Cabeçalho Fixo & Busca */}
        <div className="shrink-0 space-y-2.5 pb-1.5">
          {/* Brand Header Editorial Alinhado à Esquerda (Estilo Linear / Raycast) */}
          <div className="relative flex items-center justify-between pt-0.5 px-1.5 select-none">
            <div className="inline-flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-mono text-xs font-black tracking-tighter">
                S
              </div>
              <h1 className="font-bold text-slate-900 dark:text-zinc-100 text-base tracking-tight">
                Synapse
              </h1>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                Concursos
              </span>
            </div>

            {/* Botão de Fechar no Mobile */}
            <button
              type="button"
              onClick={closeSidebar}
              className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Fechar menu"
              aria-label="Fechar menu"
            >
              <X size={16} />
            </button>
          </div>

          {/* Barra de Busca Rápida (Full Width - Ampla, Acessível e Confortável) */}
          <div className="px-1">
            <button
              type="button"
              onClick={() => {
                closeSidebar();
                window.dispatchEvent(new CustomEvent("open-command-palette"));
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all text-xs cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Search
                  size={14}
                  className="text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors shrink-0"
                />
                <span className="font-medium text-xs">Buscar no Synapse...</span>
              </div>
              <kbd className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-1.5 py-0.5 rounded shadow-2xs shrink-0">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Barra de Ações Rápidas & Utilidades (Notificações, Som & Tema) */}
          <div className="px-1 flex items-center justify-between gap-1.5 pt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1 select-none">
              Acesso Rápido
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Central de Notificações Inteligentes */}
              <NotificationsPopover onNavigate={closeSidebar} />

              {/* Botão de Som */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("medium");
                  toggleMute();
                }}
                title={isMuted ? "Ativar som" : "Silenciar som"}
                aria-label={isMuted ? "Ativar som" : "Silenciar som"}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isMuted
                    ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/20"
                    : "bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-500 hover:text-indigo-600 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:text-indigo-300 dark:hover:bg-white/10"
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

              {/* Alternador de Alto Contraste (Acessibilidade & Leitura Nítida) */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("medium");
                  toggleHighContrast();
                }}
                title={isHighContrast ? "Alto Contraste: Ativado (Clique para desativar)" : "Alto Contraste: Desativado (Clique para ativar legibilidade nítida)"}
                aria-label={isHighContrast ? "Desativar Alto Contraste" : "Ativar Alto Contraste"}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isHighContrast
                    ? "bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-xs ring-2 ring-amber-400/40"
                    : isLight
                    ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Contrast size={15} className="transition-transform active:scale-95" />
              </button>

              {/* Alternador de Tema (Modo Claro Slate Ice / Modo Escuro) */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("medium");
                  toggleTheme();
                }}
                title={isLight ? "Ativar Modo Escuro" : "Ativar Modo Claro (Slate Ice)"}
                aria-label={isLight ? "Ativar Modo Escuro" : "Ativar Modo Claro"}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isLight
                    ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 shadow-2xs"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-indigo-300 hover:bg-white/10 hover:border-indigo-500/30"
                }`}
              >
                {isLight ? (
                  <Sun size={15} className="transition-transform active:scale-95 text-amber-500" />
                ) : (
                  <Moon size={15} className="transition-transform active:scale-95" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 2. Área de Navegação com Rolagem Fluida, Invisível e Sem Reduzir a Largura */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-0.5 no-scrollbar scrollbar-none overscroll-contain">
          <nav className="space-y-1.5 pb-2">
            {filteredNavGroups.map((group) => {
              const hasActiveItem = group.items.some((item) =>
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)
              );
              // Respeita a decisão de fechamento do usuário
              const isCollapsed = Boolean(collapsedGroups[group.id]);

              return (
                <div key={group.id} className="space-y-0.5">
                  {/* Cabeçalho do Grupo Interativo & Colapsável */}
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse(group.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 mt-2 mb-0.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-white/4 transition-colors group/header cursor-pointer select-none text-left"
                    aria-expanded={!isCollapsed}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 group-hover/header:text-slate-600 dark:text-slate-500 dark:group-hover/header:text-slate-300 transition-colors truncate">
                        {group.label}
                      </span>
                      {group.id === "ferramentas" && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 shrink-0">
                          {group.items.length}
                        </span>
                      )}
                      {/* Se o grupo estiver colapsado mas contiver a rota ativa, exibe indicador sutil de contexto */}
                      {isCollapsed && hasActiveItem && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 text-[8.5px] font-semibold tracking-normal lowercase shrink-0 animate-fade-in shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          ativo
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      size={12}
                      className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
                        isCollapsed ? "-rotate-90 opacity-60" : "rotate-0 opacity-100"
                      }`}
                    />
                  </button>

                  {/* Lista de Itens do Grupo com animação suave de colapso */}
                  <div
                    className={`transition-all duration-200 ease-in-out ${
                      isCollapsed
                        ? "max-h-0 opacity-0 overflow-hidden pointer-events-none"
                        : "max-h-[600px] opacity-100 overflow-visible space-y-0.5"
                    }`}
                  >
                    {/* Card Unificado: Synapse Pro + Cota Diária de IA na seção Conta */}
                    {group.id === "conta" && (
                      <div className="pb-1.5 px-0.5">
                        <AiQuotaBadge onNavigate={closeSidebar} />
                      </div>
                    )}

                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        item.href === "/"
                          ? pathname === "/"
                          : pathname === item.href ||
                            pathname.startsWith(`${item.href}/`);

                      const isSpecial = item.isSpecial;

                      return (
                        <Link
                          key={item.href}
                          href={getHref(item.href)}
                          onClick={(e) => {
                            triggerHaptic("light");
                            if (item.href === "#import-pdf") {
                              e.preventDefault();
                              closeSidebar();
                              window.dispatchEvent(
                                new CustomEvent("open-pdf-importer")
                              );
                              return;
                            }
                            closeSidebar();
                          }}
                          className={`relative group flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 ${
                            isActive
                              ? isSpecial
                                ? "text-amber-800 bg-amber-500/15 font-semibold border border-amber-500/30 dark:text-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20"
                                : "text-slate-900 bg-slate-100 font-semibold dark:text-white dark:bg-zinc-800/90"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900/60"
                          }`}
                        >
                          {isActive && (
                            <div
                              className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r ${
                                isSpecial
                                  ? "bg-amber-500"
                                  : "bg-slate-900 dark:bg-zinc-100"
                              }`}
                            />
                          )}

                          <Icon
                            size={15}
                            strokeWidth={isActive ? 2 : 1.5}
                            className={`transition-all duration-200 shrink-0 ${
                              isActive
                                ? isSpecial
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-slate-900 dark:text-zinc-100"
                                : "text-slate-400 group-hover:text-slate-700 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                            }`}
                          />

                          <span className="tracking-wide truncate">{item.label}</span>

                          {item.badge && (
                            <span
                              className={`ml-auto text-[8.5px] font-bold px-1.5 py-0.2 rounded border tracking-tight shrink-0 transition-colors ${getBadgeStyles(
                                item.badge
                              )}`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}

                    {/* Botão de Dar Feedback integrado na seção Conta */}
                    {group.id === "conta" && (
                      <button
                        type="button"
                        onClick={() => {
                          closeSidebar();
                          setIsFeedbackModalOpen(true);
                        }}
                        className="w-full relative group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/4 transition-all duration-150 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <MessageSquarePlus
                            size={15}
                            className="text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0"
                          />
                          <span className="tracking-wide">Dar Feedback</span>
                        </div>
                        <span className="text-[8.5px] font-mono font-bold text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-400/10 px-1.5 py-0.2 rounded-md border border-amber-200 dark:border-amber-400/20 shrink-0">
                          BETA
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* 3. Rodapé Fixo: Usuário & Telemetria Compacta (Estilo Linear / Raycast) */}
        <div className="shrink-0 pt-2 pb-[max(env(safe-area-inset-bottom),4px)] mt-auto border-t border-slate-100 dark:border-zinc-800/80">
            <div className={`group relative overflow-hidden rounded-lg ${
              isLight
                ? "bg-white border border-slate-200/90 shadow-xs"
                : "bg-zinc-900/50 border border-zinc-800/80"
            } transition-all duration-200`}>
              <div className="p-2.5 space-y-2 relative z-10">
                {isLoading ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 size={15} className="animate-spin text-zinc-400" />
                  </div>
                ) : (
                  <>
                    {/* Linha Superior Compacta: Nível + XP + Ofensiva */}
                    <div className="flex items-center justify-between gap-1.5 text-[11px]">
                      <Link
                        href={getHref("/achievements")}
                        onClick={closeSidebar}
                        title="Ver minhas conquistas"
                        className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer group/ach"
                      >
                        <Award size={13} className="text-zinc-400 shrink-0" />
                        <span className={`font-semibold ${isLight ? "text-slate-800" : "text-zinc-200"} group-hover/ach:text-white transition-colors truncate`}>
                          Nível {currentLevel}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          • {gamification?.totalXp || 0} XP
                        </span>
                      </Link>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {canAscendPrestige && (
                          <button
                            type="button"
                            onClick={() => setIsPrestigeModalOpen(true)}
                            title="Subir de Categoria de Estudos!"
                            className="cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-[9px] font-bold font-mono"
                          >
                            <Crown size={10} />
                            <span>EVOLUIR</span>
                          </button>
                        )}

                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/80 text-zinc-300 text-[10px] font-mono font-semibold">
                          <Flame size={11} className="text-amber-400" />
                          <span>{streak?.currentDays || 0}d</span>
                        </div>
                      </div>
                    </div>

                    {/* Barra Fina de Progresso */}
                    <div className={`h-1 w-full ${isLight ? "bg-slate-100" : "bg-zinc-950"} rounded-full overflow-hidden`}>
                      <div
                        className="h-full bg-zinc-300 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.max(
                            gamification?.progressPercentage ?? 0,
                            4,
                          )}%`,
                        }}
                      />
                    </div>

                    {/* Linha Divisória */}
                    <div className={`h-px w-full ${isLight ? "bg-slate-200/80" : "bg-zinc-800/80"}`} />

                    {/* Linha Inferior: Usuário, Avatar & Sair */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <Link
                        href={getHref("/profile")}
                        onClick={closeSidebar}
                        className="flex items-center gap-2 min-w-0 flex-1 group/user cursor-pointer"
                        title="Ver seu perfil"
                      >
                        {user?.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || "Avatar"}
                            width={30}
                            height={30}
                            className="w-7 h-7 rounded-md object-cover border border-zinc-700 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 text-xs font-bold shrink-0">
                            {getInitials(user?.name)}
                          </div>
                        )}

                        <div className="truncate min-w-0 flex-1">
                          <p className={`text-[11.5px] font-semibold ${isLight ? "text-slate-900" : "text-zinc-200"} group-hover/user:text-white transition-colors truncate leading-tight`}>
                            {user?.name || "Estudante"}
                          </p>
                          <span className="text-[9.5px] font-mono text-zinc-500 block leading-tight truncate">
                            {userPlan.replace(" 👑", "")}
                          </span>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          closeSidebar();
                          setIsLogoutModalOpen(true);
                        }}
                        aria-label="Sair da conta"
                        title="Sair da conta"
                        className={`w-7 h-7 rounded-md ${isLight ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"} transition-all shrink-0 cursor-pointer flex items-center justify-center`}
                      >
                        <LogOut size={14} />
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
