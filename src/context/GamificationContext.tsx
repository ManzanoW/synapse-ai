"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getUserStatsAction } from "@/actions/gamification-actions";

export interface WeekDay {
  dayLabel: string;
  active: boolean;
}

export interface StatsData {
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

export interface GamificationContextType {
  stats: StatsData | null;
  isLoading: boolean;
  refreshStats: (targetUserId?: string) => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(
  undefined,
);

export function GamificationProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: string;
}) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStats = useCallback(
    async (targetUserId?: string) => {
      const activeUserId = targetUserId || userId;
      if (!activeUserId) return;

      try {
        const response = await getUserStatsAction(activeUserId);
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Erro ao recarregar estatísticas:", error);
      }
    },
    [userId],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadInitialStats() {
      if (!userId) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await getUserStatsAction(userId);
        if (isMounted && response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar estatísticas via Server Action:",
          error,
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialStats();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return (
    <GamificationContext.Provider
      value={{
        stats,
        isLoading,
        refreshStats,
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
