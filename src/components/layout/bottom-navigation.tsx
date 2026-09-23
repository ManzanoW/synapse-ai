"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, BookOpen, HelpCircle, FileX2, Menu } from "lucide-react";
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
    { href: "/edital", label: "Edital", icon: BookOpen },
    { href: "/questions", label: "Provas", icon: HelpCircle },
    { href: "/notebook", label: "Erros", icon: FileX2 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#060913]/95 border-t border-white/10 backdrop-blur-lg md:hidden pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around h-14 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={getHref(item.href)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
                isActive
                  ? "text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon size={18} className={isActive ? "scale-110" : ""} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Botão para abrir gaveta/sidebar móvel com todas as rotas */}
        <button
          type="button"
          onClick={toggleSidebar}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all cursor-pointer ${
            isOpen
              ? "text-indigo-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
          aria-label="Abrir menu de navegação"
        >
          <Menu size={18} className={isOpen ? "scale-110 text-indigo-400" : ""} />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </nav>
    </div>
  );
}

