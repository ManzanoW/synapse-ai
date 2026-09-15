"use client";

import { useState, useSyncExternalStore } from "react";
import { signIn } from "next-auth/react";
import {
  ExternalLink,
  ShieldAlert,
  Copy,
  Check,
  Sparkles,
  X,
  Info,
  Loader2,
} from "lucide-react";

interface OAuthLoginButtonsProps {
  googleConfigured: boolean;
  githubConfigured: boolean;
  appUrl?: string;
}

const emptySubscribe = () => () => {};

export function OAuthLoginButtons({
  googleConfigured,
  githubConfigured,
  appUrl,
}: OAuthLoginButtonsProps) {
  const [modalProvider, setModalProvider] = useState<"google" | "github" | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<"google" | "github" | null>(null);

  const isInIframe = useSyncExternalStore(
    emptySubscribe,
    () => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    },
    () => false
  );

  const currentOrigin = useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => ""
  );

  const getCallbackUrl = (provider: "google" | "github") => {
    const base = currentOrigin || appUrl || "https://ais-dev-ylloiplobmjdcfik2kjtlj-848870398614.us-east1.run.app";
    return `${base}/api/auth/callback/${provider}`;
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    const isConfigured = provider === "google" ? googleConfigured : githubConfigured;

    // Se estiver em iframe OU não configurado, intercepta para evitar tela de erro 403 / conexão recusada
    if (isInIframe || !isConfigured) {
      setModalProvider(provider);
      return;
    }

    if (loadingProvider) return;

    try {
      setLoadingProvider(provider);
      const res = (await signIn(provider, {
        callbackUrl: "/dashboard",
      })) as { error?: string } | undefined;

      if (res?.error) {
        console.error(
          `Falha reportada pela biblioteca de autenticação ao conectar com ${provider}:`,
          res.error
        );
      }
    } catch (error) {
      console.error(`Erro ao disparar login social com ${provider}:`, error);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleCopyCallback = (provider: "google" | "github") => {
    const url = getCallbackUrl(provider);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenInNewTab = () => {
    if (typeof window !== "undefined") {
      window.open(window.location.href, "_blank", "noopener,noreferrer");
    }
  };

  const handleDirectGuestLogin = async () => {
    if (isGuestLoading) return;
    setIsGuestLoading(true);
    try {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("synapse_demo_active", "true");
        } catch {}
        document.cookie = "synapse_demo_active=true; path=/; max-age=2592000; SameSite=None; Secure";
        document.cookie = "synapse_demo_active=true; path=/; max-age=2592000; SameSite=Lax";
      }

      await fetch("/api/guest-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});

      window.location.href = "/dashboard?demo=true";
    } catch {
      window.location.href = "/dashboard?demo=true";
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Botão Google */}
      <button
        id="btn-oauth-google"
        type="button"
        onClick={() => handleOAuthSignIn("google")}
        disabled={loadingProvider !== null}
        className="group relative w-full flex items-center justify-center gap-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-100 border border-white/10 hover:border-violet-500/40 font-bold py-3.5 px-4 rounded-2xl transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98] text-sm overflow-hidden disabled:opacity-60"
      >
        <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        {loadingProvider === "google" ? (
          <Loader2 className="w-4 h-4 text-violet-200 animate-spin shrink-0" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
        )}
        <span className="relative z-10">
          {loadingProvider === "google"
            ? "Conectando ao Google..."
            : "Continuar com Google"}
        </span>
        {!googleConfigured && (
          <span className="ml-auto rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
            Configurar
          </span>
        )}
      </button>

      {/* Botão GitHub */}
      <button
        id="btn-oauth-github"
        type="button"
        onClick={() => handleOAuthSignIn("github")}
        disabled={loadingProvider !== null}
        className="group relative w-full flex items-center justify-center gap-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-100 border border-white/10 hover:border-violet-500/40 font-bold py-3.5 px-4 rounded-2xl transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98] text-sm overflow-hidden disabled:opacity-60"
      >
        <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        {loadingProvider === "github" ? (
          <Loader2 className="w-4 h-4 text-violet-200 animate-spin shrink-0" />
        ) : (
          <svg
            className="w-4 h-4 fill-current text-white shrink-0"
            viewBox="0 0 24 24"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        )}
        <span className="relative z-10">
          {loadingProvider === "github"
            ? "Conectando ao GitHub..."
            : "Continuar com GitHub"}
        </span>
        {!githubConfigured && (
          <span className="ml-auto rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
            Configurar
          </span>
        )}
      </button>

      {/* Aviso Sutil de Contexto Iframe */}
      {isInIframe && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-slate-300 text-[11px] leading-relaxed">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            No preview do AI Studio (iframe), o login Google/GitHub exige nova aba ou credenciais OAuth.{" "}
            <strong className="text-violet-300">Use o Modo Convidado acima para testar agora.</strong>
          </span>
        </div>
      )}

      {/* Modal Explicativo de Segurança e Configuração */}
      {modalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#080d16] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-violet-500/50 to-transparent" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Autenticação {modalProvider === "google" ? "Google" : "GitHub"}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {isInIframe ? "Restrição de Iframe & Segurança" : "Credenciais OAuth Necessárias"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalProvider(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 space-y-2">
                <p className="font-semibold text-slate-200">
                  Por que essa mensagem apareceu?
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs">
                  <li>
                    <strong className="text-slate-200">Proteção contra Iframe (Anti-Clickjacking):</strong>{" "}
                    O Google e o GitHub proíbem por segurança que suas telas de login sejam renderizadas dentro de iframes (como o preview do AI Studio), gerando o erro 403 ou conexão recusada.
                  </li>
                  <li>
                    <strong className="text-slate-200">Credenciais OAuth:</strong>{" "}
                    Para utilizar seu login pessoal, é necessário configurar as variáveis{" "}
                    <code className="px-1 py-0.5 rounded bg-white/10 text-violet-300 font-mono">
                      {modalProvider === "google" ? "AUTH_GOOGLE_ID" : "AUTH_GITHUB_ID"}
                    </code>{" "}
                    e{" "}
                    <code className="px-1 py-0.5 rounded bg-white/10 text-violet-300 font-mono">
                      {modalProvider === "google" ? "AUTH_GOOGLE_SECRET" : "AUTH_GITHUB_SECRET"}
                    </code>
                    .
                  </li>
                </ul>
              </div>

              {/* Informação do Callback URI */}
              <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    URL de Redirecionamento (Callback URI):
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCallback(modalProvider)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono text-slate-200 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <code className="block w-full overflow-x-auto rounded-xl bg-slate-950 p-2.5 font-mono text-[11px] text-violet-300 border border-white/5">
                  {getCallbackUrl(modalProvider)}
                </code>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleDirectGuestLogin}
                disabled={isGuestLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-3.5 px-4 font-bold text-white text-sm shadow-lg shadow-indigo-500/25 transition-all cursor-pointer active:scale-[0.98]"
              >
                {isGuestLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Iniciando sessão demo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-violet-200 animate-pulse" />
                    <span>Acessar Agora com Modo Convidado (Sem Login)</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-2.5 px-3 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Abrir em Nova Aba</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalProvider(null)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-800/80 py-2.5 px-3 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <span>Fechar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
