"use client";

import { useState, useEffect, useCallback } from "react";
import { reviewFlashcardAction, ReviewFlashcardInput } from "@/actions/flashcard-actions";

const STORAGE_KEY = "synapse_offline_reviews_queue";

export interface QueuedOfflineReview {
  id: string;
  cardId: string;
  rating?: number | string;
  grade?: number | string;
  responseTimeMs?: number;
  timestamp: number;
}

export function isOnlineStatus(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

export function getPendingOfflineReviews(): QueuedOfflineReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedOfflineReview[];
  } catch {
    return [];
  }
}

export function enqueueOfflineReview(input: ReviewFlashcardInput): void {
  if (typeof window === "undefined") return;
  try {
    const queue = getPendingOfflineReviews();
    const item: QueuedOfflineReview = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cardId: input.cardId,
      rating: input.rating,
      grade: input.grade,
      responseTimeMs: input.responseTimeMs,
      timestamp: Date.now(),
    };
    queue.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn("[offline-sync] Falha ao enfileirar revisão offline:", err);
  }
}

export async function flushOfflineReviews(): Promise<{
  syncedCount: number;
  remainingCount: number;
}> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { syncedCount: 0, remainingCount: getPendingOfflineReviews().length };
  }

  const queue = getPendingOfflineReviews();
  if (queue.length === 0) {
    return { syncedCount: 0, remainingCount: 0 };
  }

  const remaining: QueuedOfflineReview[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      const res = await reviewFlashcardAction({
        cardId: item.cardId,
        rating: item.rating,
        grade: item.grade,
        responseTimeMs: item.responseTimeMs,
      });

      if (res.success) {
        synced++;
      } else {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  try {
    if (remaining.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // fallback
  }

  return { syncedCount: synced, remainingCount: remaining.length };
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getPendingOfflineReviews().length);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await flushOfflineReviews();
      setPendingCount(result.remainingCount);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshPendingCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Tenta sincronizar na inicialização se estiver online
    if (navigator.onLine) {
      triggerSync();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerSync, refreshPendingCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    triggerSync,
    refreshPendingCount,
  };
}
