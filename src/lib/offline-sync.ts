"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import type { ReviewFlashcardInput } from "@/actions/flashcard-actions";

const STORAGE_KEY = "synapse_offline_reviews_queue";
const DECK_CACHE_PREFIX = "synapse_offline_deck_";
const DB_NAME = "synapse_offline_db";
const DB_VERSION = 1;
const STORE_DECKS = "decks";
const STORE_REVIEWS = "reviews_queue";

export interface QueuedOfflineReview {
  id: string;
  cardId: string;
  rating?: number | string;
  grade?: number | string;
  responseTimeMs?: number;
  timestamp: number;
}

/**
 * Abre o banco IndexedDB de forma segura no navegador.
 */
function openOfflineDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_DECKS)) {
          db.createObjectStore(STORE_DECKS, { keyPath: "deckId" });
        }
        if (!db.objectStoreNames.contains(STORE_REVIEWS)) {
          db.createObjectStore(STORE_REVIEWS, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
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

export async function enqueueOfflineReviewAsync(input: ReviewFlashcardInput): Promise<void> {
  if (typeof window === "undefined") return;

  const item: QueuedOfflineReview = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    cardId: input.cardId,
    rating: input.rating,
    grade: input.grade,
    responseTimeMs: input.responseTimeMs,
    timestamp: Date.now(),
  };

  // 1. Persistência imediata no localStorage
  try {
    const queue = getPendingOfflineReviews();
    queue.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn("[offline-sync] Falha no localStorage ao enfileirar:", err);
  }

  // 2. Persistência assíncrona robusta no IndexedDB
  try {
    const db = await openOfflineDB();
    if (db) {
      const tx = db.transaction(STORE_REVIEWS, "readwrite");
      tx.objectStore(STORE_REVIEWS).put(item);
    }
  } catch (err) {
    console.warn("[offline-sync] Falha no IndexedDB ao enfileirar:", err);
  }
}

export function enqueueOfflineReview(input: ReviewFlashcardInput): void {
  // Fire-and-forget seguro
  enqueueOfflineReviewAsync(input).catch(() => {});
}

export async function cacheOfflineDeckAsync(deckId: string, cards: unknown): Promise<void> {
  if (typeof window === "undefined") return;

  const payload = {
    deckId,
    savedAt: Date.now(),
    cards,
  };

  // 1. Espelho síncrono imediato no localStorage (para leituras instantâneas)
  try {
    localStorage.setItem(
      `${DECK_CACHE_PREFIX}${deckId}`,
      JSON.stringify({
        savedAt: payload.savedAt,
        cards: payload.cards,
      })
    );
  } catch {
    // Quota do localStorage excedida; os dados permanecem protegidos no IndexedDB
  }

  // 2. Armazena no IndexedDB (sem limite de 5MB)
  try {
    const db = await openOfflineDB();
    if (db) {
      const tx = db.transaction(STORE_DECKS, "readwrite");
      tx.objectStore(STORE_DECKS).put(payload);
    }
  } catch (err) {
    console.warn("[offline-sync] Falha no IndexedDB ao cachear deck:", err);
  }
}

export function cacheOfflineDeck(deckId: string, cards: unknown): void {
  cacheOfflineDeckAsync(deckId, cards).catch(() => {});
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

export async function getCachedOfflineDeckAsync<T = unknown>(
  deckId: string
): Promise<{ cards: T; savedAt: number } | null> {
  if (typeof window === "undefined") return null;

  try {
    const db = await openOfflineDB();
    if (db) {
      const tx = db.transaction(STORE_DECKS, "readonly");
      const store = tx.objectStore(STORE_DECKS);
      const request = store.get(deckId);

      const result = await new Promise<{ cards: T; savedAt: number } | null>((resolve) => {
        request.onsuccess = () => {
          if (request.result) {
            resolve({ cards: request.result.cards, savedAt: request.result.savedAt });
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });

      if (result) return result;
    }
  } catch (err) {
    console.warn("[offline-sync] Falha no IndexedDB ao ler deck:", err);
  }

  return getCachedOfflineDeck<T>(deckId);
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

  const { reviewFlashcardAction } = await import("@/actions/flashcard-actions");

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
        // Remove do IndexedDB
        try {
          const db = await openOfflineDB();
          if (db) {
            const tx = db.transaction(STORE_REVIEWS, "readwrite");
            tx.objectStore(STORE_REVIEWS).delete(item.id);
          }
        } catch {}
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

  if (synced > 0) {
    window.dispatchEvent(
      new CustomEvent("offline-sync-complete", { detail: { syncedCount: synced } })
    );
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
