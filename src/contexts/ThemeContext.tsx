"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isLight: boolean;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  setIsHighContrast: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "synapse-theme";
const CONTRAST_STORAGE_KEY = "synapse-contrast";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [isHighContrast, setIsHighContrastState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Aplica a classe correspondente ao elemento HTML
  const applyThemeToDocument = useCallback((targetTheme: Theme) => {
    const root = document.documentElement;
    if (targetTheme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
    }
  }, []);

  const applyContrastToDocument = useCallback((high: boolean) => {
    const root = document.documentElement;
    if (high) {
      root.classList.add("high-contrast");
      root.setAttribute("data-contrast", "high");
    } else {
      root.classList.remove("high-contrast");
      root.removeAttribute("data-contrast");
    }
  }, []);

  // Inicialização síncrona/hidratada a partir do localStorage
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (storedTheme === "light" || storedTheme === "dark") {
        setThemeState(storedTheme);
        applyThemeToDocument(storedTheme);
      } else {
        applyThemeToDocument("dark");
      }

      const storedContrast = localStorage.getItem(CONTRAST_STORAGE_KEY);
      if (storedContrast === "true") {
        setIsHighContrastState(true);
        applyContrastToDocument(true);
      }
    } catch {
      applyThemeToDocument("dark");
    } finally {
      setMounted(true);
    }
  }, [applyThemeToDocument, applyContrastToDocument]);

  // Listener para sincronização entre múltiplas abas abertas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === "light" || e.newValue === "dark")) {
        setThemeState(e.newValue);
        applyThemeToDocument(e.newValue);
      }
      if (e.key === CONTRAST_STORAGE_KEY) {
        const isHigh = e.newValue === "true";
        setIsHighContrastState(isHigh);
        applyContrastToDocument(isHigh);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [applyThemeToDocument, applyContrastToDocument]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      applyThemeToDocument(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (err) {
        console.error("Erro ao salvar preferência de tema no localStorage:", err);
      }
    },
    [applyThemeToDocument]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const setIsHighContrast = useCallback(
    (value: boolean) => {
      setIsHighContrastState(value);
      applyContrastToDocument(value);
      try {
        localStorage.setItem(CONTRAST_STORAGE_KEY, String(value));
      } catch (err) {
        console.error("Erro ao salvar preferência de contraste no localStorage:", err);
      }
    },
    [applyContrastToDocument]
  );

  const toggleHighContrast = useCallback(() => {
    setIsHighContrastState((prev) => {
      const next = !prev;
      applyContrastToDocument(next);
      try {
        localStorage.setItem(CONTRAST_STORAGE_KEY, String(next));
      } catch (err) {
        console.error("Erro ao salvar preferência de contraste no localStorage:", err);
      }
      return next;
    });
  }, [applyContrastToDocument]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isLight: mounted ? theme === "light" : false,
        isHighContrast: mounted ? isHighContrast : false,
        toggleHighContrast,
        setIsHighContrast,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser utilizado dentro de um ThemeProvider");
  }
  return context;
}
