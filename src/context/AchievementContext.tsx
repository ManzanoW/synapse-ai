"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  AchievementToast,
  ToastAchievement,
} from "@/components/gamification/AchievementToast";
import { GamificationContext } from "@/context/GamificationContext";

interface AchievementContextType {
  notifyAchievement: (achievement: ToastAchievement) => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(
  undefined,
);

export function AchievementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const gamification = useContext(GamificationContext);
  const [fallbackAchievement, setFallbackAchievement] =
    useState<ToastAchievement | null>(null);

  const notifyAchievement = useCallback(
    (achievement: ToastAchievement) => {
      if (gamification?.triggerAchievementNotification) {
        gamification.triggerAchievementNotification(achievement);
      } else {
        setFallbackAchievement(achievement);
      }
    },
    [gamification],
  );

  return (
    <AchievementContext.Provider value={{ notifyAchievement }}>
      {children}
      {/* Se não estiver envolto por GamificationProvider, renderiza o toast localmente */}
      {!gamification && (
        <AchievementToast
          achievement={fallbackAchievement}
          onClose={() => setFallbackAchievement(null)}
        />
      )}
    </AchievementContext.Provider>
  );
}

export function useAchievement() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error(
      "useAchievement deve ser usado dentro de um AchievementProvider",
    );
  }
  return context;
}
