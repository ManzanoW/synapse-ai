"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
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

const DECK_CACHE_PREFIX = "synapse_offline_deck_";

export function cacheOfflineDeck(deckId: string, cards: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${DECK_CACHE_PREFIX}${deckId}`,
      JSON.stringify({
        savedAt: Date.now(),
        cards,
      })
    );
  } catch (err) {
    console.warn("[offline-sync] Falha ao salvar deck offline:", err);
  }
}

export function getCachedOfflineDeck<T = unknown>(
  deckId: string
): { cards: T; savedAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${DECK_CACHE_PREFIX}${deckId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
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

function subscribeOnline(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getServerSnapshot() {
  return true;
}

export function useOfflineSync() {
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerSnapshot);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getPendingOfflineReviews().length);
  }, []);

  const triggerSync = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await flushOfflineReviews();
      setPendingCount(result.remainingCount);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    refreshPendingCount();

    if (isOnline) {
      triggerSync();
    }
  }, [isOnline, triggerSync, refreshPendingCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    triggerSync,
    refreshPendingCount,
  };
}
