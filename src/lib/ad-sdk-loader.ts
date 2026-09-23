// src/lib/ad-sdk-loader.ts
"use client";

import { getAdConfiguration } from "@/config/ads";

declare global {
  interface Window {
    adsbygoogle?: any[];
    google?: {
      ima?: any;
    };
  }
}

let isAdSenseLoading = false;
let isAdSenseLoaded = false;
let isImaLoading = false;
let isImaLoaded = false;

/**
 * Carrega dinamicamente o script oficial do Google AdSense se configurado.
 */
export async function loadGoogleAdSenseSdk(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (isAdSenseLoaded) return true;

  const config = getAdConfiguration();
  if (!config.enabled || !config.adSenseClientId) return false;

  if (isAdSenseLoading) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (isAdSenseLoaded || !isAdSenseLoading) {
          clearInterval(checkInterval);
          resolve(isAdSenseLoaded);
        }
      }, 100);
    });
  }

  isAdSenseLoading = true;

  return new Promise((resolve) => {
    try {
      const script = document.createElement("script");
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adSenseClientId}`;
      script.async = true;
      script.crossOrigin = "anonymous";

      script.onload = () => {
        isAdSenseLoaded = true;
        isAdSenseLoading = false;
        resolve(true);
      };

      script.onerror = () => {
        console.warn("[AdSense] Falha ao carregar SDK do AdSense (provável AdBlocker ou rede).");
        isAdSenseLoaded = false;
        isAdSenseLoading = false;
        resolve(false);
      };

      document.head.appendChild(script);
    } catch {
      isAdSenseLoading = false;
      resolve(false);
    }
  });
}

/**
 * Carrega dinamicamente o SDK do Google Interactive Media Ads (IMA3).
 */
export async function loadGoogleImaSdk(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (isImaLoaded) return true;

  const config = getAdConfiguration();
  if (!config.enabled) return false;

  if (isImaLoading) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (isImaLoaded || !isImaLoading) {
          clearInterval(checkInterval);
          resolve(isImaLoaded);
        }
      }, 100);
    });
  }

  isImaLoading = true;

  return new Promise((resolve) => {
    try {
      if (window.google?.ima) {
        isImaLoaded = true;
        isImaLoading = false;
        return resolve(true);
      }

      const script = document.createElement("script");
      script.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";
      script.async = true;

      script.onload = () => {
        isImaLoaded = Boolean(window.google?.ima);
        isImaLoading = false;
        resolve(isImaLoaded);
      };

      script.onerror = () => {
        console.warn("[Google IMA] Falha ao carregar SDK do IMA (possível AdBlocker).");
        isImaLoaded = false;
        isImaLoading = false;
        resolve(false);
      };

      document.head.appendChild(script);
    } catch {
      isImaLoading = false;
      resolve(false);
    }
  });
}
