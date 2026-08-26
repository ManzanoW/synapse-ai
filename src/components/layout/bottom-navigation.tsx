"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, HelpCircle, Layers } from "lucide-react";

export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Início", icon: LayoutDashboard },
    { href: "/edital", label: "Edital", icon: BookOpen },
    { href: "/questions", label: "Provas", icon: HelpCircle },
    { href: "/cards", label: "Cards", icon: Layers },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#060913]/95 border-t border-white/10 backdrop-blur-lg md:hidden pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
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
      </nav>
    </div>
  );
}
