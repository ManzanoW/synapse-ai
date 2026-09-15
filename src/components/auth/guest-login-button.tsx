"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

export function GuestLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey) return;

    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    try {
      // 1. Armazena imediatamente localmente e em cookie no cliente
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("synapse_demo_active", "true");
        } catch {}

        document.cookie = "synapse_demo_active=true; path=/; max-age=2592000; SameSite=None; Secure";
        document.cookie = "synapse_demo_active=true; path=/; max-age=2592000; SameSite=Lax";
      }

      // 2. Chama a rota de autenticação de convidado
      await fetch("/api/guest-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch((err) => console.warn("Guest endpoint notice:", err));

      // 3. Redireciona diretamente para o dashboard com demo flag
      window.location.href = "/dashboard?demo=true";
    } catch (err) {
      console.error("Erro no login como convidado:", err);
      window.location.href = "/dashboard?demo=true";
    }
  };

  return (
    <a
      id="btn-guest-login"
      href="/api/guest-login"
      onClick={handleGuestLogin}
      className={`group relative w-full flex items-center justify-center gap-2.5 bg-linear-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-2xl transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-500/25 active:scale-[0.98] text-sm overflow-hidden ${
        isLoading ? "opacity-75 pointer-events-none" : ""
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 text-violet-200 animate-spin" />
          <span className="relative z-10 font-semibold">Iniciando sessão demo...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 text-violet-200 animate-pulse" />
          <span className="relative z-10">Entrar como Convidado (Modo Demo)</span>
        </>
      )}
    </a>
  );
}

