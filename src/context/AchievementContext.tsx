"use client";

import React, { createContext, useContext, useState } from "react";
import {
  AchievementToast,
  ToastAchievement,
} from "@/components/achievements/achievement-toast";

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
  const [activeAchievement, setActiveAchievement] =
    useState<ToastAchievement | null>(null);

  const notifyAchievement = (achievement: ToastAchievement) => {
    setActiveAchievement(achievement);
  };

  return (
    <AchievementContext.Provider value={{ notifyAchievement }}>
      {children}
      <AchievementToast
        achievement={activeAchievement}
        onClose={() => setActiveAchievement(null)}
      />
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
