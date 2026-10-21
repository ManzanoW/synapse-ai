// src/components/share/PublicMindmapViewer.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Brain,
  Sparkles,
  Share2,
  Copy,
  Check,
  ArrowRight,
  Lightbulb,
  ExternalLink,
  Crown,
  Layers,
} from "lucide-react";
import { MindmapData } from "@/actions/mindmap-actions";
import { MindmapViewer } from "@/components/mindmap/MindmapViewer";

interface PublicMindmapViewerProps {
  mindmap: MindmapData;
  isLoggedIn: boolean;
}

export function PublicMindmapViewer({
  mindmap,
  isLoggedIn,
}: PublicMindmapViewerProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    if (typeof window !== "undefined") {
      const text = encodeURIComponent(
        `🧠 *Mapa Mental Esquematizado • Synapse AI*\n\n` +
          `📌 *Tema*: ${mindmap.title}\n` +
          `📖 *Disciplina*: ${mindmap.subject}\n` +
          `⚡ Esquematização visual com modo Active Recall para memorização rápida!\n\n` +
          `Veja o mapa mental interativo gratuitamente:\n${window.location.href}`
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. NAVBAR PÚBLICA */}
      <header className="border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Brain size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                Synapse <span className="text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider -mt-1">
                NEURAL MIND MAPS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/mapas-mentais"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/10"
              >
                Ver Meus Mapas Mentais
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-white text-xs font-bold transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href={`/login?callbackUrl=/share/mapa/${mindmap.id}`}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/50"
                >
                  Criar Conta Grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full space-y-6">
        {/* CABEÇALHO DO MAPA MENTAL */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                {mindmap.subject}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs">
                Mapa Mental Interativo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {mindmap.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {mindmap.summary}
            </p>
          </div>

          {/* BOTÕES DE COMPARTILHAMENTO */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copiar Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-bold text-emerald-400 transition-colors cursor-pointer"
            >
              <Share2 size={14} />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* VISUALIZADOR INTERATIVO DO MAPA */}
        <div className="space-y-2">
          <MindmapViewer data={mindmap} className="h-[680px]" />
        </div>

        {/* BANNER DE CONVERSÃO / CTA VIRAL */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-900/50 via-violet-900/40 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
              <Sparkles size={12} /> Inteligência Artificial para Concursos
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Gere Mapas Mentais Ilimitados para seu Edital
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              O Synapse AI esquematiza leis, artigos e jurisprudências de forma visual,
              com perguntas de fixação e conversão em 1 clique para seus cartões de memória.
            </p>
          </div>

          <Link
            href={isLoggedIn ? "/mapas-mentais" : `/login?callbackUrl=/share/mapa/${mindmap.id}`}
            className="shrink-0 px-6 py-3.5 rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs transition-all shadow-xl shadow-indigo-600/30 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Brain size={16} />
            <span>
              {isLoggedIn
                ? "Ir para Hub de Mapas Mentais"
                : "Criar Conta Grátis & Começar"}
            </span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <p>
          Synapse AI • A Plataforma Neural para Concursos Públicos e Alta
          Performance.
        </p>
      </footer>
    </div>
  );
}
