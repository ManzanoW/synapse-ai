"use client";

import { useEffect } from "react";

export function DemoSessionSync() {
  useEffect(() => {
    try {
      const isDemoInUrl = window.location.search.includes("demo=true");
      const isDemoInStorage = localStorage.getItem("synapse_demo_active") === "true";

      if (isDemoInUrl || isDemoInStorage) {
        localStorage.setItem("synapse_demo_active", "true");
        document.cookie = "synapse_demo_active=true; path=/; max-age=2592000; SameSite=None; Secure";
        document.cookie = "synapse_demo_active=true; path=/; max-age=2592000; SameSite=Lax";
      }

      // Interceptor global de cliques para preservar ?demo=true em links internos
      const handleLinkClick = (e: MouseEvent) => {
        const isDemo =
          localStorage.getItem("synapse_demo_active") === "true" ||
          window.location.search.includes("demo=true");

        if (!isDemo) return;

        const target = (e.target as HTMLElement).closest("a");
        if (!target) return;

        const href = target.getAttribute("href");
        if (
          href &&
          href.startsWith("/") &&
          !href.startsWith("/api") &&
          !href.startsWith("/login") &&
          !href.includes("demo=true")
        ) {
          const sep = href.includes("?") ? "&" : "?";
          target.setAttribute("href", `${href}${sep}demo=true`);
        }
      };

      document.addEventListener("click", handleLinkClick, { capture: true });

      // Patch resiliente de window.fetch para que TODAS as chamadas /api recebam x-synapse-demo: true
      const originalFetch = window.fetch;
      window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
        const isDemo =
          localStorage.getItem("synapse_demo_active") === "true" ||
          window.location.search.includes("demo=true");

        if (isDemo) {
          let url =
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.toString()
                : (input as Request).url;

          if (url.startsWith("/api") || url.includes("/api/")) {
            const newInit: RequestInit = { ...(init || {}) };
            const headers = new Headers(
              newInit.headers ||
                (typeof input === "object" && "headers" in input
                  ? (input as Request).headers
                  : {})
            );

            headers.set("x-synapse-demo", "true");
            newInit.headers = headers;

            if (!url.includes("demo=true")) {
              const sep = url.includes("?") ? "&" : "?";
              url = `${url}${sep}demo=true`;
            }

            return originalFetch(url, newInit);
          }
        }

        return originalFetch(input, init);
      };

      return () => {
        document.removeEventListener("click", handleLinkClick, { capture: true });
        window.fetch = originalFetch;
      };
    } catch {}
  }, []);

  return null;
}

