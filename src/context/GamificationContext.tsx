"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface LevelInfo {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercentage: number;
  title: string;
}

interface WeekDay {
  dayLabel: string;
  active: boolean;
}

interface StatsData {
  gamification: {
    totalXp: number;
    level: number;
    currentLevelXp: number;
    nextLevelXp: number;
    progressPercentage: number;
    title: string;
  };
  streak: {
    currentDays: number;
    weekDays: WeekDay[];
  };
}

interface GamificationContextType {
  stats: StatsData | null;
  isLoading: boolean;
  refreshStats: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(
  undefined,
);

export function GamificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/user/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas do usuário:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchStats]);

  return (
    <GamificationContext.Provider
      value={{
        stats,
        isLoading,
        refreshStats: fetchStats,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error(
      "useGamification deve ser usado dentro de GamificationProvider",
    );
  }
  return context;
}
