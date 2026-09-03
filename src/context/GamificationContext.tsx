"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { getUserStatsAction } from "@/actions/gamification-actions";
import { Achievement } from "@/lib/achievements";
import {
  AchievementToast,
  ToastAchievement,
} from "@/components/gamification/AchievementToast";

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
    prestige?: number;
    prestigeTier?: {
      name: string;
      badgeColor: string;
      borderGlow: string;
      iconColor: string;
    };
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
  updateStats?: (partial: Partial<StatsData["gamification"]>) => void;
  triggerAchievementNotification: (badge: Achievement | ToastAchievement) => void;
}

export const GamificationContext = createContext<GamificationContextType | undefined>(
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
  const [activeAchievement, setActiveAchievement] =
    useState<ToastAchievement | null>(null);
  const achievementQueueRef = useRef<ToastAchievement[]>([]);

  const triggerAchievementNotification = useCallback(
    (badge: Achievement | ToastAchievement) => {
      const item: ToastAchievement = {
        id: badge.id,
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
        xpReward: badge.xpReward,
      };

      setActiveAchievement((current) => {
        if (!current) {
          return item;
        }
        // Enfileira se já houver uma notificação em andamento
        achievementQueueRef.current.push(item);
        return current;
      });
    },
    [],
  );

  const handleCloseToast = useCallback(() => {
    setActiveAchievement(null);
    if (achievementQueueRef.current.length > 0) {
      const next = achievementQueueRef.current.shift();
      if (next) {
        setTimeout(() => {
          setActiveAchievement(next);
        }, 200);
      }
    }
  }, []);

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

  const updateStats = useCallback(
    (partial: Partial<StatsData["gamification"]>) => {
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          gamification: {
            ...prev.gamification,
            ...partial,
          },
        };
      });
    },
    [],
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
        console.error("Erro ao carregar estatísticas:", error);
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
        updateStats,
        triggerAchievementNotification,
      }}
    >
      {children}
      <AchievementToast
        achievement={activeAchievement}
        onClose={handleCloseToast}
      />
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
