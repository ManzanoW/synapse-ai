"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function AuthThemeToggle() {
  const { isLight, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed top-5 right-5 z-50 w-10 h-10 rounded-2xl bg-white/5 border border-white/10" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isLight ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
      aria-label={isLight ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
      className="fixed top-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2 rounded-2xl backdrop-blur-xl transition-all duration-200 cursor-pointer shadow-sm border border-slate-200/80 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 dark:border-white/10 dark:bg-slate-950/70 dark:hover:bg-slate-900/90 dark:text-slate-300 dark:hover:text-white"
    >
      {isLight ? (
        <>
          <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
          <span className="text-xs font-medium font-mono hidden sm:inline text-slate-700">Modo Claro</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-medium font-mono hidden sm:inline text-slate-300">Modo Escuro</span>
        </>
      )}
    </button>
  );
}
