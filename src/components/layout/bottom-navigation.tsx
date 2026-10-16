"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, BookOpen, FileStack, Layers, Menu } from "lucide-react";
import { useSidebar } from "@/lib/sidebar-context";

export function BottomNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toggleSidebar, isOpen } = useSidebar();

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

  const navItems = [
    { href: "/dashboard", label: "Início", icon: LayoutDashboard },
    { href: "/questions", label: "Simulados", icon: FileStack },
    { href: "/flashcards", label: "Cards", icon: Layers },
    { href: "/edital", label: "Edital", icon: BookOpen },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#030712]/90 border-t border-slate-200 dark:border-indigo-500/20 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:hidden pb-[max(env(safe-area-inset-bottom),6px)]">
      <nav aria-label="Navegação móvel principal" className="flex items-center justify-around h-15 px-2 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={getHref(item.href)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all duration-200 active:scale-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-300 font-semibold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-0.75 bg-linear-to-r from-indigo-500 via-violet-400 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.9)]" />
              )}
              <div
                className={`transition-transform duration-200 ${
                  isActive
                    ? "scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)] dark:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] text-indigo-600 dark:text-indigo-400"
                    : ""
                }`}
              >
                <Icon size={19} />
              </div>
              <span
                className={`text-[10px] tracking-tight ${
                  isActive ? "font-bold text-indigo-700 dark:text-white" : ""
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Botão para abrir gaveta/sidebar móvel com todas as rotas */}
        <button
          type="button"
          onClick={toggleSidebar}
          className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all duration-200 active:scale-90 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl ${
            isOpen
              ? "text-indigo-600 dark:text-indigo-300 font-semibold"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
          aria-label="Abrir menu de navegação"
        >
          {isOpen && (
            <div className="absolute top-0 w-8 h-0.75 bg-linear-to-r from-indigo-500 via-violet-400 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.9)]" />
          )}
          <div
            className={`transition-transform duration-200 ${
              isOpen
                ? "scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)] dark:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] text-indigo-600 dark:text-indigo-400"
                : ""
            }`}
          >
            <Menu size={19} />
          </div>
          <span
            className={`text-[10px] tracking-tight ${
              isOpen ? "font-bold text-indigo-700 dark:text-white" : ""
            }`}
          >
            Menu
          </span>
        </button>
      </nav>
    </div>
  );
}

